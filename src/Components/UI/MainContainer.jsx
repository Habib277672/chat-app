import React, { useEffect, useRef, useState } from "react";
import { IoSend } from "react-icons/io5";
import { MdEdit, MdDelete, MdCheck, MdClose } from "react-icons/md";
import { FaRegFaceSmile } from "react-icons/fa6";
import { supabase } from "../../Supabase/SupabaseClient";

export const MainContainer = ({ session, selectedUser }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [editingId, setEditingId] = useState(null);
    const [editText, setEditText] = useState("");
    const [activeMenuId, setActiveMenuId] = useState(null);
    const [blockStatus, setBlockStatus] = useState(null);

    const channelRef = useRef(null);
    const bottomRef = useRef(null);
    const emojiPickerRef = useRef(null);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);

    const currentUserId = session?.user?.id;
    const selectedUserId = selectedUser?.id;

    // Check block status
    useEffect(() => {
        if (!currentUserId || !selectedUserId) return;

        const checkBlockStatus = async () => {
            const { data, error } = await supabase
                .from("blocked_users")
                .select("blocker_id, blocked_id")
                .or(`and(blocker_id.eq.${currentUserId},blocked_id.eq.${selectedUserId}),and(blocker_id.eq.${selectedUserId},blocked_id.eq.${currentUserId})`);

            if (error) { console.log("Block check error:", error); return; }

            const youBlocked = data.find(b => b.blocker_id === currentUserId && b.blocked_id === selectedUserId);
            const theyBlocked = data.find(b => b.blocker_id === selectedUserId && b.blocked_id === currentUserId);

            if (youBlocked) setBlockStatus("you_blocked");
            else if (theyBlocked) setBlockStatus("they_blocked");
            else setBlockStatus(null);
        };

        checkBlockStatus();

        const channel = supabase
            .channel(`block_status_${currentUserId}_${selectedUserId}`)
            .on("postgres_changes", { event: "*", schema: "public", table: "blocked_users" }, () => checkBlockStatus())
            .subscribe();

        return () => supabase.removeChannel(channel);
    }, [currentUserId, selectedUserId]);

    // Mark messages as read
    useEffect(() => {
        if (!currentUserId || !selectedUserId) return;
        supabase
            .from("messages")
            .update({ is_read: true })
            .eq("receiver_id", currentUserId)
            .eq("sender_id", selectedUserId)
            .eq("is_read", false)
            .then(({ error }) => { if (error) console.log("Mark read error:", error); });
    }, [currentUserId, selectedUserId, messages]);

    // Helper: check if message belongs to this conversation
    const isInConversation = (msg) => (
        (msg.sender_id === currentUserId && msg.receiver_id === selectedUserId) ||
        (msg.sender_id === selectedUserId && msg.receiver_id === currentUserId)
    );

    // Fetch messages
    useEffect(() => {
        if (!currentUserId || !selectedUserId) return;
        setMessages([]);

        const fetchMessages = async () => {
            const { data, error } = await supabase
                .from("messages")
                .select("*")
                .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${selectedUserId}),and(sender_id.eq.${selectedUserId},receiver_id.eq.${currentUserId})`)
                .order("timestamp", { ascending: true });

            if (error) console.log("Fetch error:", error);
            else setMessages(data);
        };

        fetchMessages();
    }, [currentUserId, selectedUserId]);

    // Realtime messages listener
    useEffect(() => {
        if (!currentUserId || !selectedUserId) return;

        if (channelRef.current) supabase.removeChannel(channelRef.current);

        const channel = supabase
            .channel(`conversation_${[currentUserId, selectedUserId].sort().join("_")}`)
            .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
                if (isInConversation(payload.new)) {
                    setMessages((prev) => {
                        if (prev.find(m => m.id === payload.new.id)) return prev;
                        return [...prev, payload.new];
                    });
                }
            })
            .on("postgres_changes", { event: "UPDATE", schema: "public", table: "messages" }, (payload) => {
                if (isInConversation(payload.new)) {
                    setMessages((prev) => prev.map(msg => msg.id === payload.new.id ? payload.new : msg));
                }
            })
            .on("postgres_changes", { event: "DELETE", schema: "public", table: "messages" }, (payload) => {
                setMessages((prev) => prev.filter(msg => msg.id !== payload.old.id));
            })
            .subscribe();

        channelRef.current = channel;
        return () => supabase.removeChannel(channel);
    }, [currentUserId, selectedUserId]);

    // Scroll to bottom
    useEffect(() => {
        const timer = setTimeout(() => {
            bottomRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
        return () => clearTimeout(timer);
    }, [messages]);

    // Close action menu and emoji picker on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            setActiveMenuId(null);
            if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target)) {
                setShowEmojiPicker(false);
            }
        };
        document.addEventListener("click", handleClickOutside);
        return () => document.removeEventListener("click", handleClickOutside);
    }, []);

    const EMOJIS = [
        "😀", "😂", "😍", "🥰", "😎", "😭", "😅", "🤣", "😊", "😇",
        "🥺", "😢", "😤", "😠", "🤯", "🥳", "😴", "🤔", "🙄", "😏",
        "👍", "👎", "❤️", "🔥", "✨", "🎉", "💯", "🙏", "👏", "💪",
        "😋", "🤤", "😘", "😜", "🤪", "😝", "🤑", "🤗", "🫡", "🫠",
        "👀", "💀", "🫶", "🤝", "✌️", "🤞", "🫰", "👋", "🤙", "☝️",
        "🌹", "🌸", "🌈", "⭐", "🌙", "☀️", "❄️", "🎵", "🎶", "💫",
        "🍕", "🍔", "🍟", "🌮", "🍜", "🍣", "🍩", "🎂", "☕", "🧋",
        "🐶", "🐱", "🐼", "🐨", "🦊", "🐸", "🦋", "🌺", "🍀", "🌻",
    ];

    const handleEmojiClick = (emoji) => {
        setNewMessage((prev) => prev + emoji);
    };

    // Send message
    const handleSend = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        const messageData = {
            message: newMessage,
            user_name: session?.user?.email || "Anonymous",
            sender_id: currentUserId,
            receiver_id: selectedUserId,
            timestamp: new Date().toISOString(),
        };

        const { error } = await supabase.from("messages").insert([messageData]).select().single();
        if (error) { console.log("Insert error:", error); return; }

        setNewMessage("");
    };

    // Edit message
    const handleEdit = async (id) => {
        if (!editText.trim()) return;
        const { error } = await supabase.from("messages").update({ message: editText, is_edited: true }).eq("id", id);
        if (error) { console.log("Update error:", error); return; }
        setEditingId(null);
        setEditText("");
    };

    // Delete message
    const handleDelete = async (id) => {
        const { error } = await supabase.from("messages").delete().eq("id", id);
        if (error) console.log("Delete error:", error);
    };

    // Tick component for read receipts
    const MessageTicks = ({ isRead }) => (
        <span className="inline-flex items-center ml-1.5 shrink-0">
            {isRead ? (
                <svg className="w-4 h-3.5" viewBox="0 0 16 11" fill="none">
                    <path d="M1 5.5L4.5 9L10 3" stroke="rgba(255,255,255,0.6)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M5 5.5L8.5 9L14 3" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            ) : (
                <svg className="w-3 h-3" viewBox="0 0 12 10" fill="none">
                    <path d="M1 5L4.5 8.5L11 2" stroke="rgba(255,255,255,0.6)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            )}
        </span>
    );

    // Format timestamp to time string like "7:35 PM"
    const formatTime = (timestamp) => {
        if (!timestamp) return "";
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true });
    };

    // Check if two messages are within 1 minute of each other
    const isSameMinute = (ts1, ts2) => {
        if (!ts1 || !ts2) return false;
        const d1 = new Date(ts1);
        const d2 = new Date(ts2);
        return Math.abs(d1 - d2) < 60000 && d1.getHours() === d2.getHours() && d1.getMinutes() === d2.getMinutes();
    };

    return (
        <div className="flex flex-1 justify-center px-2 py-2 sm:px-4 sm:py-4 min-h-0">
            <div className="flex h-full w-full max-w-4xl flex-col rounded-2xl bg-white/60 shadow-lg backdrop-blur-md overflow-hidden">

                {/* Conversation header */}
                <div className="px-4 py-3 border-b border-neutral-200 bg-white/80">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-linear-to-br from-blue-600 to-indigo-500 flex items-center justify-center text-white font-semibold text-sm">
                            {selectedUser?.email?.[0]?.toUpperCase()}
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-gray-800">{selectedUser?.email}</p>
                        </div>
                    </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 flex flex-col gap-2 sm:gap-3 overflow-y-auto p-3 sm:p-4 min-h-0 no-scrollbar">
                    {messages.length === 0 && (
                        <p className="text-center text-xs text-gray-400 mt-8">No messages yet. Say hello! 👋</p>
                    )}
                    {messages.map((msg, index) => {
                        const isOwn = msg.sender_id === currentUserId;
                        const isEditing = editingId === msg.id;
                        const isMenuOpen = activeMenuId === msg.id;
                        const prevMsg = messages[index - 1];
                        // Show time if first message or different minute from previous
                        const showTime = !prevMsg || !isSameMinute(prevMsg.timestamp, msg.timestamp);

                        return (
                            <div key={msg.id} className="flex flex-col">
                                {/* Timestamp above message */}
                                {showTime && (
                                    <p className={`text-[11px] text-gray-400 mb-1 mt-1 ${isOwn ? "text-right pr-1" : "text-left pl-1"}`}>
                                        {formatTime(msg.timestamp)}
                                    </p>
                                )}

                                <div className={`flex flex-col max-w-[85%] sm:max-w-[70%] group ${isOwn ? "ml-auto items-end" : "mr-auto items-start"}`}>
                                    {isEditing ? (
                                        <div className="flex items-center gap-2 w-full">
                                            <input
                                                type="text"
                                                value={editText}
                                                onChange={(e) => setEditText(e.target.value)}
                                                onKeyDown={(e) => e.key === "Enter" && handleEdit(msg.id)}
                                                className="flex-1 px-3 py-2 rounded-2xl border border-blue-400 text-sm outline-none bg-white min-w-0"
                                                autoFocus
                                            />
                                            <button onClick={() => handleEdit(msg.id)} className="shrink-0 p-1.5 rounded-full bg-green-500 text-white hover:bg-green-600 transition">
                                                <MdCheck className="text-base" />
                                            </button>
                                            <button onClick={() => { setEditingId(null); setEditText(""); }} className="shrink-0 p-1.5 rounded-full bg-gray-400 text-white hover:bg-gray-500 transition">
                                                <MdClose className="text-base" />
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <div
                                                onClick={(e) => {
                                                    if (!isOwn) return;
                                                    e.stopPropagation();
                                                    setActiveMenuId(isMenuOpen ? null : msg.id);
                                                }}
                                                className={`px-3 py-2 sm:px-4 sm:py-2 rounded-2xl text-sm sm:text-base wrap-break-word ${isOwn
                                                    ? "cursor-pointer bg-linear-to-br from-blue-600 to-indigo-500 text-white rounded-tr-sm select-none"
                                                    : "bg-neutral-500 text-white rounded-tl-sm"
                                                    }`}
                                            >
                                                <span>{msg.message}</span>
                                                {msg.is_edited && <span className="text-[10px] ml-2 opacity-70 italic">edited</span>}
                                                {isOwn && <MessageTicks isRead={msg.is_read} />}
                                            </div>

                                            {isOwn && (
                                                <div className={`flex gap-1 mt-1 transition-opacity duration-200 ${isMenuOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setEditingId(msg.id); setEditText(msg.message); setActiveMenuId(null); }}
                                                        className="p-1.5 rounded-full bg-white/80 hover:bg-blue-100 text-blue-500 shadow-sm transition"
                                                        title="Edit"
                                                    >
                                                        <MdEdit className="text-sm" />
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleDelete(msg.id); setActiveMenuId(null); }}
                                                        className="p-1.5 rounded-full bg-white/80 hover:bg-red-100 text-red-500 shadow-sm transition"
                                                        title="Delete"
                                                    >
                                                        <MdDelete className="text-sm" />
                                                    </button>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                    <div ref={bottomRef} />
                </div>

                {/* Input Area */}
                <div className="border-t border-gray-200 p-2 sm:p-3">
                    {blockStatus === "you_blocked" ? (
                        <div className="flex items-center justify-center gap-2 rounded-full bg-gray-100 px-4 py-3 text-sm text-gray-500">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                            </svg>
                            You blocked this user. Unblock to send messages.
                        </div>
                    ) : blockStatus === "they_blocked" ? (
                        <div className="flex items-center justify-center gap-2 rounded-full bg-gray-100 px-4 py-3 text-sm text-gray-500">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                            </svg>
                            You can't send messages to this user.
                        </div>
                    ) : (
                        <div className="relative" ref={emojiPickerRef}>
                            {/* Emoji Picker */}
                            {showEmojiPicker && (
                                <div
                                    className="absolute bottom-12 left-0 z-50 bg-white rounded-2xl shadow-xl border border-gray-100 p-3 w-72 sm:w-80"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <div className="grid grid-cols-8 gap-1 max-h-48 overflow-y-auto no-scrollbar">
                                        {EMOJIS.map((emoji, i) => (
                                            <button
                                                key={i}
                                                type="button"
                                                onClick={() => handleEmojiClick(emoji)}
                                                className="text-xl hover:bg-gray-100 rounded-lg p-1 transition-all duration-150 active:scale-90"
                                            >
                                                {emoji}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <form
                                onSubmit={handleSend}
                                className="flex items-center gap-2 rounded-full border border-neutral-100 bg-white px-3 sm:px-4 py-2 shadow"
                            >
                                {/* Emoji toggle button */}
                                <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); setShowEmojiPicker((prev) => !prev); }}
                                    className="shrink-0 text-xl leading-none hover:scale-110 transition-transform duration-150 active:scale-90"
                                >
                                    <FaRegFaceSmile className="text-neutral-600" />

                                </button>

                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder={`Message ${selectedUser?.email}...`}
                                    className="flex-1 bg-transparent text-sm outline-none min-w-0"
                                />
                                <button
                                    type="submit"
                                    className="cursor-pointer shrink-0 rounded-full bg-linear-to-r from-blue-500 to-indigo-500 p-2 text-white transition duration-300 hover:opacity-90 active:scale-95"
                                >
                                    <IoSend className="text-base sm:text-lg" />
                                </button>
                            </form>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};