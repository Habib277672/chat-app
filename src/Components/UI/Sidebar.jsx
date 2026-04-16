import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "../../Supabase/SupabaseClient";

export const Sidebar = ({ session, selectedUser, setSelectedUser }) => {
    const [searchQuery, setSearchQuery] = useState("");
    const [chattedUsers, setChattedUsers] = useState([]);
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [lastMessages, setLastMessages] = useState({});
    const [openMenuId, setOpenMenuId] = useState(null);
    const [blockedUsers, setBlockedUsers] = useState(new Set());
    const [unreadCounts, setUnreadCounts] = useState({});
    const [onlineStatus, setOnlineStatus] = useState({});
    const menuRef = useRef(null);

    const currentUserId = session?.user?.id;

    const isOnline = (userId) => !!onlineStatus[userId];

    const fetchChattedUsers = useCallback(async () => {
        if (!currentUserId) return;

        const { data, error } = await supabase
            .from("messages")
            .select("sender_id, receiver_id, message, timestamp, is_read")
            .or(`sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`)
            .order("timestamp", { ascending: false });

        if (error) { console.log("Fetch chatted users error:", error); return; }

        const userIds = new Set();
        const lastMsgMap = {};
        const unreadMap = {};

        data.forEach((msg) => {
            const otherId = msg.sender_id === currentUserId ? msg.receiver_id : msg.sender_id;
            userIds.add(otherId);
            if (!lastMsgMap[otherId]) lastMsgMap[otherId] = msg.message;
            if (msg.receiver_id === currentUserId && !msg.is_read) {
                unreadMap[otherId] = (unreadMap[otherId] || 0) + 1;
            }
        });

        setLastMessages(lastMsgMap);
        setUnreadCounts(unreadMap);

        if (userIds.size === 0) return;

        const { data: profiles, error: profileError } = await supabase
            .from("profiles")
            .select("id, email, last_seen")
            .in("id", [...userIds]);

        if (profileError) { console.log("Fetch profiles error:", profileError); return; }

        setChattedUsers(profiles);
    }, [currentUserId]);

    useEffect(() => {
        fetchChattedUsers();
    }, [fetchChattedUsers]);

    // Fetch blocked users
    useEffect(() => {
        if (!currentUserId) return;
        const fetchBlocked = async () => {
            const { data, error } = await supabase
                .from("blocked_users")
                .select("blocked_id")
                .eq("blocker_id", currentUserId);
            if (error) { console.log("Fetch blocked error:", error); return; }
            setBlockedUsers(new Set(data.map((b) => b.blocked_id)));
        };
        fetchBlocked();
    }, [currentUserId]);

    // Realtime: new messages → update last message + unread count
    useEffect(() => {
        if (!currentUserId) return;

        const channel = supabase
            .channel("sidebar_realtime")
            .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
                const msg = payload.new;
                if (msg.sender_id !== currentUserId && msg.receiver_id !== currentUserId) return;

                const otherId = msg.sender_id === currentUserId ? msg.receiver_id : msg.sender_id;
                setLastMessages((prev) => ({ ...prev, [otherId]: msg.message }));

                if (msg.receiver_id === currentUserId && selectedUser?.id !== otherId) {
                    setUnreadCounts((prev) => ({ ...prev, [otherId]: (prev[otherId] || 0) + 1 }));
                }

                setChattedUsers((prev) => {
                    if (prev.find((u) => u.id === otherId)) return prev;
                    fetchChattedUsers();
                    return prev;
                });
            })
            .subscribe();

        return () => supabase.removeChannel(channel);
    }, [currentUserId, selectedUser]);

    // Realtime online status using Supabase Presence
    useEffect(() => {
        if (!currentUserId) return;

        const presenceChannel = supabase.channel("online_users", {
            config: { presence: { key: currentUserId } },
        });

        presenceChannel
            .on("presence", { event: "sync" }, () => {
                const state = presenceChannel.presenceState();
                const onlineMap = {};
                Object.keys(state).forEach((userId) => { onlineMap[userId] = true; });
                setOnlineStatus(onlineMap);
            })
            .on("presence", { event: "join" }, ({ key }) => {
                setOnlineStatus((prev) => ({ ...prev, [key]: true }));
            })
            .on("presence", { event: "leave" }, ({ key }) => {
                setOnlineStatus((prev) => ({ ...prev, [key]: false }));
            })
            .subscribe(async (status) => {
                if (status === "SUBSCRIBED") {
                    await presenceChannel.track({ user_id: currentUserId, online_at: new Date().toISOString() });
                }
            });

        return () => {
            presenceChannel.untrack();
            supabase.removeChannel(presenceChannel);
        };
    }, [currentUserId]);

    // Search profiles by email
    useEffect(() => {
        if (!searchQuery.trim()) {
            setSearchResults([]);
            setIsSearching(false);
            return;
        }

        setIsSearching(true);
        const timeout = setTimeout(async () => {
            const { data, error } = await supabase
                .from("profiles")
                .select("id, email, last_seen")
                .ilike("email", `%${searchQuery}%`)
                .neq("id", currentUserId)
                .limit(50);

            if (error) { console.log("Search error:", error); return; }
            setSearchResults(data);
            setIsSearching(false);
        }, 400);

        return () => clearTimeout(timeout);
    }, [searchQuery, currentUserId]);

    // Close menu on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setOpenMenuId(null);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelectUser = (user) => {
        setSelectedUser(user);
        setIsOpen(false);
        setSearchQuery("");
        setSearchResults([]);
        setOpenMenuId(null);

        setUnreadCounts((prev) => ({ ...prev, [user.id]: 0 }));

        supabase
            .from("messages")
            .update({ is_read: true })
            .eq("receiver_id", currentUserId)
            .eq("sender_id", user.id)
            .eq("is_read", false)
            .then(({ error }) => { if (error) console.log("Mark read error:", error); });

        setChattedUsers((prev) => {
            if (prev.find((u) => u.id === user.id)) return prev;
            return [user, ...prev];
        });
    };

    const handleDeleteChat = async (userId) => {
        setOpenMenuId(null);

        const { error: error1 } = await supabase
            .from("messages").delete()
            .eq("sender_id", currentUserId).eq("receiver_id", userId);
        if (error1) { console.log("Delete chat error1:", error1); return; }

        const { error: error2 } = await supabase
            .from("messages").delete()
            .eq("sender_id", userId).eq("receiver_id", currentUserId);
        if (error2) { console.log("Delete chat error2:", error2); return; }

        setChattedUsers((prev) => prev.filter((u) => u.id !== userId));
        setLastMessages((prev) => { const u = { ...prev }; delete u[userId]; return u; });
        setUnreadCounts((prev) => { const u = { ...prev }; delete u[userId]; return u; });
        if (selectedUser?.id === userId) setSelectedUser(null);
    };

    const handleBlockUser = async (userId) => {
        setOpenMenuId(null);
        const isBlocked = blockedUsers.has(userId);

        if (isBlocked) {
            const { error } = await supabase.from("blocked_users").delete()
                .eq("blocker_id", currentUserId).eq("blocked_id", userId);
            if (error) { console.log("Unblock error:", error); return; }
            setBlockedUsers((prev) => { const u = new Set(prev); u.delete(userId); return u; });
        } else {
            const { error } = await supabase.from("blocked_users")
                .insert([{ blocker_id: currentUserId, blocked_id: userId }]);
            if (error) { console.log("Block error:", error); return; }
            setBlockedUsers((prev) => new Set([...prev, userId]));
            if (selectedUser?.id === userId) setSelectedUser(null);
        }
    };

    const displayList = searchQuery.trim() ? searchResults : chattedUsers;

    const SidebarContent = (
        <div className="w-80 h-full bg-white flex flex-col shadow-xl font-sans">
            {/* Header */}
            <div className="px-5 pt-6 pb-3">
                <div className="flex items-center justify-between mb-4">
                    <h1 className="text-xl ml-10 lg:ml-0 font-bold text-gray-800">Chats</h1>
                </div>

                {/* Search */}
                <div className="relative">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                        fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <circle cx="11" cy="11" r="8" />
                        <path d="m21 21-4.35-4.35" />
                    </svg>
                    <input
                        type="text"
                        placeholder="Search by email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 bg-gray-100 rounded-xl text-sm text-gray-700 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-400 transition-all"
                    />
                </div>

                {searchQuery.trim() && (
                    <p className="text-xs text-gray-400 mt-2 px-1">
                        {isSearching ? "Searching..." : `${searchResults.length} user(s) found`}
                    </p>
                )}
            </div>

            {/* User List */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden px-3 pb-4 space-y-1">
                {!searchQuery.trim() && chattedUsers.length === 0 && (
                    <p className="text-xs text-gray-400 text-center mt-8 px-4">
                        No chats yet. Search for a user by email to start chatting.
                    </p>
                )}
                {searchQuery.trim() && !isSearching && searchResults.length === 0 && (
                    <p className="text-xs text-gray-400 text-center mt-8 px-4">
                        No user found with that email.
                    </p>
                )}

                {displayList.map((user) => {
                    const isSelected = selectedUser?.id === user.id;
                    const initial = user.email?.[0]?.toUpperCase() || "?";
                    const lastMsg = lastMessages[user.id];
                    const isBlocked = blockedUsers.has(user.id);
                    const isMenuOpen = openMenuId === user.id;
                    const unread = unreadCounts[user.id] || 0;
                    const online = isOnline(user.id);

                    return (
                        <div
                            key={user.id}
                            className={`relative flex items-center gap-3 px-3 py-3 rounded-2xl transition-all duration-200 cursor-pointer
                                ${isSelected ? "bg-blue-50 shadow-sm" : "hover:bg-gray-50"}`}
                            onClick={() => handleSelectUser(user)}
                        >
                            {/* Avatar with online dot */}
                            <div className="relative shrink-0">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-lg
                                    ${isBlocked ? "bg-gray-400" : "bg-linear-to-br from-blue-500 to-indigo-500"}`}>
                                    {initial}
                                </div>
                                <span className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white
                                    ${online ? "bg-green-400" : "bg-gray-300"}`} />
                            </div>

                            {/* Email + Last Message */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1">
                                    <span className={`text-sm font-semibold truncate ${isSelected ? "text-blue-600" : "text-gray-800"}`}>
                                        {user.email}
                                    </span>
                                    {isBlocked && (
                                        <span className="text-[10px] text-red-400 font-medium shrink-0">Blocked</span>
                                    )}
                                </div>
                                {lastMsg ? (
                                    <p className={`text-xs truncate mt-0.5 ${unread > 0 ? "text-gray-700 font-medium" : isSelected ? "text-blue-400" : "text-gray-400"}`}>
                                        {lastMsg}
                                    </p>
                                ) : searchQuery.trim() && !chattedUsers.find((u) => u.id === user.id) ? (
                                    <span className="text-xs text-blue-400">Click to start chat</span>
                                ) : (
                                    <p className="text-xs text-gray-400 mt-0.5">
                                        {online ? "Online" : "Offline"}
                                    </p>
                                )}
                            </div>

                            {/* Right side: unread badge + three dots */}
                            <div className="shrink-0 flex flex-col items-end gap-1">
                                {unread > 0 && !isSelected && (
                                    <span className="min-w-5 h-5 px-1.5 rounded-full bg-blue-500 text-white text-[11px] font-bold flex items-center justify-center">
                                        {unread > 99 ? "99+" : unread}
                                    </span>
                                )}

                                {!searchQuery.trim() && (
                                    <div
                                        className="relative"
                                        ref={isMenuOpen ? menuRef : null}
                                        onClick={(e) => { e.stopPropagation(); }}
                                    >
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setOpenMenuId(isMenuOpen ? null : user.id); }}
                                            className="p-1.5 rounded-full hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition"
                                        >
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                                <circle cx="5" cy="12" r="2" />
                                                <circle cx="12" cy="12" r="2" />
                                                <circle cx="19" cy="12" r="2" />
                                            </svg>
                                        </button>

                                        {isMenuOpen && (
                                            <div className="absolute right-0 top-9 z-100 w-44 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDeleteChat(user.id); }}
                                                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                    Delete Chat
                                                </button>
                                                <div className="h-px bg-gray-100" />
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleBlockUser(user.id); }}
                                                    className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm transition
                                                        ${isBlocked ? "text-green-600 hover:bg-green-50" : "text-orange-500 hover:bg-orange-50"}`}
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                                        {isBlocked ? (
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        ) : (
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                                        )}
                                                    </svg>
                                                    {isBlocked ? "Unblock User" : "Block User"}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );

    return (
        <>
            <button
                className="md:hidden fixed top-3.5 left-4 z-60 p-2 bg-linear-to-br from-blue-600 to-indigo-500 text-white rounded-xl shadow-lg transition-all duration-300 active:scale-90"
                onClick={() => setIsOpen((prev) => !prev)}
            >
                <div className="w-5 h-5 relative flex flex-col justify-center items-center">
                    <span className={`absolute block h-0.5 w-5 bg-white rounded-full transition-all duration-300 ease-in-out
                        ${isOpen ? "rotate-45 translate-y-0" : "-translate-y-1.5"}`} />
                    <span className={`absolute block h-0.5 bg-white rounded-full transition-all duration-300 ease-in-out
                        ${isOpen ? "w-0 opacity-0" : "w-5 opacity-100"}`} />
                    <span className={`absolute block h-0.5 w-5 bg-white rounded-full transition-all duration-300 ease-in-out
                        ${isOpen ? "-rotate-45 translate-y-0" : "translate-y-1.5"}`} />
                </div>
            </button>

            <div
                className={`md:hidden fixed inset-0 z-55 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ease-in-out
                    ${isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
                onClick={() => setIsOpen(false)}
            />

            <div className={`
                fixed top-0 left-0 h-full z-56
                transition-all duration-300 ease-in-out
                md:static md:translate-x-0 md:flex md:h-screen
                ${isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full shadow-none md:shadow-none"}
            `}>
                <div className={`absolute inset-y-0 right-0 w-3 bg-linear-to-r from-transparent to-black/5 pointer-events-none transition-opacity duration-300
                    ${isOpen ? "opacity-100" : "opacity-0"} md:hidden`} />
                {SidebarContent}
            </div>
        </>
    );
};