import React, { useEffect, useRef, useState } from "react";
import { IoSend } from "react-icons/io5";
import { MdEdit, MdDelete, MdCheck, MdClose } from "react-icons/md";
import { IoAttach } from "react-icons/io5";
import { FaRegFaceSmile } from "react-icons/fa6";
import { supabase } from "../../Supabase/SupabaseClient";
import toast from "react-hot-toast";

export const MainContainer = ({ session, selectedUser }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [editingId, setEditingId] = useState(null);
    const [editText, setEditText] = useState("");
    const [activeMenuId, setActiveMenuId] = useState(null);
    const [blockStatus, setBlockStatus] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null); // preview before send
    const [lightboxImg, setLightboxImg] = useState(null); // { url, name }

    const channelRef = useRef(null);
    const bottomRef = useRef(null);
    const emojiPickerRef = useRef(null);
    const fileInputRef = useRef(null);
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

    // Handle file selection — just preview, don't upload yet
    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Max 20MB
        if (file.size > 20 * 1024 * 1024) {
            toast.error("File size must be under 20MB.");
            return;
        }

        setSelectedFile(file);
        // Reset input so same file can be selected again
        e.target.value = "";
    };

    // Upload file to Supabase Storage and send message
    const handleFileSend = async () => {
        if (!selectedFile) return;
        setUploading(true);

        const fileExt = selectedFile.name.split(".").pop();
        const filePath = `${currentUserId}/${Date.now()}_${selectedFile.name}`;

        const { error: uploadError } = await supabase.storage
            .from("chat-files")
            .upload(filePath, selectedFile, { contentType: selectedFile.type });

        if (uploadError) {
            console.log("Upload error:", uploadError);
            setUploading(false);
            return;
        }

        // Get public URL
        const { data: urlData } = supabase.storage
            .from("chat-files")
            .getPublicUrl(filePath);

        const fileUrl = urlData.publicUrl;

        // Insert message with file info
        const messageData = {
            message: newMessage.trim() || "",
            user_name: session?.user?.email || "Anonymous",
            sender_id: currentUserId,
            receiver_id: selectedUserId,
            timestamp: new Date().toISOString(),
            file_url: fileUrl,
            file_name: selectedFile.name,
            file_type: selectedFile.type,
        };

        const { error } = await supabase.from("messages").insert([messageData]).select().single();
        if (error) { console.log("Insert error:", error); }

        setNewMessage("");
        setSelectedFile(null);
        setUploading(false);
    };

    // Send text message
    const handleSend = async (e) => {
        e.preventDefault();

        // If file is selected, send file
        if (selectedFile) {
            await handleFileSend();
            return;
        }

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

    // Delete message + file from storage if exists
    const handleDelete = async (id) => {
        // Find the message to check if it has a file
        const msg = messages.find(m => m.id === id);

        // If message has a file, delete it from storage first
        if (msg?.file_url) {
            // Extract file path from public URL
            // URL format: .../storage/v1/object/public/chat-files/userId/filename
            const urlParts = msg.file_url.split("/chat-files/");
            if (urlParts.length > 1) {
                const filePath = urlParts[1];
                const { error: storageError } = await supabase.storage
                    .from("chat-files")
                    .remove([filePath]);
                if (storageError) console.log("Storage delete error:", storageError);
            }
        }

        const { error } = await supabase.from("messages").delete().eq("id", id);
        if (error) console.log("Delete error:", error);
    };

    // Format timestamp
    const formatTime = (timestamp) => {
        if (!timestamp) return "";
        return new Date(timestamp).toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true });
    };

    const isSameMinute = (ts1, ts2) => {
        if (!ts1 || !ts2) return false;
        const d1 = new Date(ts1);
        const d2 = new Date(ts2);
        return Math.abs(d1 - d2) < 60000 && d1.getHours() === d2.getHours() && d1.getMinutes() === d2.getMinutes();
    };

    // Tick component
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

    // File message bubble
    const FileMessage = ({ msg, isOwn }) => {
        const isImage = msg.file_type?.startsWith("image/");
        const isVideo = msg.file_type?.startsWith("video/");
        const isPdf = msg.file_type === "application/pdf";

        if (isImage) {
            const handleDownload = async (e) => {
                e.stopPropagation();
                try {
                    const response = await fetch(msg.file_url);
                    const blob = await response.blob();
                    const blobUrl = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = blobUrl;
                    a.download = msg.file_name || "image";
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(blobUrl);
                } catch (err) {
                    window.open(msg.file_url, "_blank");
                    console.log(err)
                }
            };

            return (
                <div className="flex flex-col gap-1">
                    {/* Image with dropdown menu in top-right corner */}
                    <div className="relative group/img">
                        <img
                            src={msg.file_url}
                            alt={msg.file_name}
                            onClick={(e) => { e.stopPropagation(); setLightboxImg({ url: msg.file_url, name: msg.file_name }); }}
                            className="max-w-60 rounded-xl object-cover cursor-pointer"
                        />
                        {/* Dropdown trigger — top right corner, like WhatsApp */}
                        <div
                            className="absolute top-1.5 right-1.5 opacity-0 group-hover/img:opacity-100 focus-within:opacity-100 transition-opacity"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="relative">
                                <button
                                    className="peer w-7 h-7 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center transition"
                                    title="More options"
                                >
                                    <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 24 24">
                                        <circle cx="5" cy="12" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="19" cy="12" r="2" />
                                    </svg>
                                </button>
                                {/* Dropdown — appears below the button */}
                                <div className="peer-focus:block hidden hover:block absolute right-0 top-8 z-50 w-40 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden">
                                    <button
                                        onClick={handleDownload}
                                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition"
                                    >
                                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                        </svg>
                                        Download
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    {msg.message && <p className="text-sm mt-1">{msg.message}</p>}
                    {isOwn && <MessageTicks isRead={msg.is_read} />}
                </div>
            );
        }

        if (isVideo) {
            return (
                <div className="flex flex-col gap-1">
                    <video
                        src={msg.file_url}
                        controls
                        className="max-w-60 rounded-xl"
                    />
                    {msg.message && <p className="text-sm mt-1">{msg.message}</p>}
                    {isOwn && <MessageTicks isRead={msg.is_read} />}
                </div>
            );
        }

        // Generic file (PDF, docs, zip etc)
        return (
            <div className="flex flex-col gap-1">
                <a
                    href={msg.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center gap-3 px-4 py-3 rounded-2xl min-w-45 max-w-60
                        ${isOwn ? "bg-linear-to-br from-blue-500 to-indigo-500 text-white" : "bg-neutral-600 text-white"} hover:opacity-90 transition`}
                >
                    {/* File icon */}
                    <div className="shrink-0 w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center">
                        {isPdf ? (
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM8 13h8v1H8v-1zm0 3h5v1H8v-1zm0-6h3v1H8v-1z" />
                            </svg>
                        ) : (
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 1.5L18.5 9H13V3.5z" />
                            </svg>
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold truncate">{msg.file_name}</p>
                        <p className="text-[10px] opacity-70 mt-0.5">Tap to download</p>
                    </div>
                </a>
                {msg.message && <p className="text-sm mt-1">{msg.message}</p>}
                {isOwn && <MessageTicks isRead={msg.is_read} />}
            </div>
        );
    };

    return (
        <div className="flex flex-1 justify-center px-2 py-2 sm:px-4 sm:py-4 min-h-0">

            {/* Lightbox modal */}
            {lightboxImg && (
                <div
                    className="fixed inset-0 z-200 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
                    onClick={() => setLightboxImg(null)}
                >
                    <div
                        className="relative max-w-[90vw] max-h-[90vh] flex flex-col items-center gap-3"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Close button */}
                        <button
                            onClick={() => setLightboxImg(null)}
                            className="absolute -top-3 -right-3 z-10 w-8 h-8 rounded-full bg-white/30 hover:bg-white/20 flex items-center justify-center text-white transition"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>

                        {/* Image */}
                        <img
                            src={lightboxImg.url}
                            alt={lightboxImg.name}
                            className="max-w-[90vw] max-h-[80vh] rounded-xl object-contain shadow-2xl"
                        />

                        {/* File name + download button */}
                        <div className="flex items-center gap-3 bg-white/10 rounded-full px-4 py-2">
                            <p className="text-white text-xs font-medium truncate max-w-50">{lightboxImg.name}</p>
                            <button
                                onClick={async () => {
                                    try {
                                        const response = await fetch(lightboxImg.url);
                                        const blob = await response.blob();
                                        const blobUrl = URL.createObjectURL(blob);
                                        const a = document.createElement("a");
                                        a.href = blobUrl;
                                        a.download = lightboxImg.name || "image";
                                        document.body.appendChild(a);
                                        a.click();
                                        document.body.removeChild(a);
                                        URL.revokeObjectURL(blobUrl);
                                    } catch {
                                        window.open(lightboxImg.url, "_blank");
                                    }
                                }}
                                className="shrink-0 flex items-center gap-1.5 text-xs text-white/80 hover:text-white transition"
                            >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                Download
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <div className="flex h-full w-full max-w-4xl flex-col rounded-2xl bg-white/60 shadow-lg backdrop-blur-md overflow-hidden">

                {/* Conversation header */}
                <div className="px-4 py-3 border-b border-gray-100 bg-white/80">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-linear-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-semibold text-sm">
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
                        const showTime = !prevMsg || !isSameMinute(prevMsg.timestamp, msg.timestamp);
                        const hasFile = !!msg.file_url;

                        return (
                            <div key={msg.id} className="flex flex-col">
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
                                            {/* File bubble OR text bubble */}
                                            {hasFile ? (
                                                <div
                                                    onClick={(e) => { if (!isOwn) return; e.stopPropagation(); setActiveMenuId(isMenuOpen ? null : msg.id); }}
                                                    className={`rounded-2xl overflow-hidden ${isOwn ? "cursor-pointer rounded-tr-sm" : "rounded-tl-sm"}`}
                                                >
                                                    <FileMessage msg={msg} isOwn={isOwn} />
                                                </div>
                                            ) : (
                                                <div
                                                    onClick={(e) => { if (!isOwn) return; e.stopPropagation(); setActiveMenuId(isMenuOpen ? null : msg.id); }}
                                                    className={`px-3 py-2 sm:px-4 sm:py-2 rounded-2xl text-sm sm:text-base wrap-break-word ${isOwn
                                                        ? "cursor-pointer bg-linear-to-br from-blue-500 to-indigo-500 text-white rounded-tr-sm select-none"
                                                        : "bg-neutral-500 text-white rounded-tl-sm"}`}
                                                >
                                                    <div className="flex items-end">
                                                        <span>{msg.message}</span>
                                                        {msg.is_edited && <span className="text-[10px] ml-2 opacity-70 italic">edited</span>}
                                                        {isOwn && <MessageTicks isRead={msg.is_read} />}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Edit / Delete buttons */}
                                            {isOwn && (
                                                <div className={`flex gap-1 mt-1 transition-opacity duration-200 ${isMenuOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
                                                    {!hasFile && (
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); setEditingId(msg.id); setEditText(msg.message); setActiveMenuId(null); }}
                                                            className="p-1.5 rounded-full bg-white/80 hover:bg-blue-100 text-blue-500 shadow-sm transition"
                                                            title="Edit"
                                                        >
                                                            <MdEdit className="text-sm" />
                                                        </button>
                                                    )}
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

                {/* File preview bar — shows above input when file is selected */}
                {selectedFile && (
                    <div className="mx-3 mb-2 flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-2xl px-4 py-2.5">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                            {selectedFile.type.startsWith("image/") ? (
                                <img
                                    src={URL.createObjectURL(selectedFile)}
                                    className="w-8 h-8 rounded-lg object-cover"
                                    alt="preview"
                                />
                            ) : (
                                <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 1.5L18.5 9H13V3.5z" />
                                </svg>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-blue-700 truncate">{selectedFile.name}</p>
                            <p className="text-[10px] text-blue-400">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                        </div>
                        <button
                            onClick={() => setSelectedFile(null)}
                            className="shrink-0 p-1 rounded-full hover:bg-blue-100 text-blue-400 transition"
                        >
                            <MdClose className="text-base" />
                        </button>
                    </div>
                )}

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

                            {/* Hidden file input */}
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileSelect}
                                className="hidden"
                                accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar,.txt"
                            />

                            <form
                                onSubmit={handleSend}
                                className="flex items-center gap-1.5 rounded-full border border-neutral-100 bg-white px-3 sm:px-4 py-2 shadow"
                            >
                                {/* Emoji toggle */}
                                <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); setShowEmojiPicker((prev) => !prev); }}
                                    className="shrink-0 text-xl leading-none text-neutral-600 hover:text-neutral-500 hover:scale-[1.03] cursor-pointer transition-transform duration-150 active:scale-90"
                                >
                                    <FaRegFaceSmile />
                                </button>

                                {/* Attach file button */}
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className={`shrink-0 p-1 rounded-full hover:scale-[1.03] transition-all duration-150 active:scale-90
                                        ${selectedFile ? "text-blue-500" : "text-neutral-600 hover:text-neutral-500"}`}
                                    title="Attach file"
                                >
                                    <IoAttach className="text-2xl" />
                                </button>

                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder={selectedFile ? "Add a caption..." : `Message ${selectedUser?.email}...`}
                                    className="flex-1 bg-transparent text-sm outline-none min-w-0"
                                />

                                <button
                                    type="submit"
                                    disabled={uploading}
                                    className="cursor-pointer shrink-0 rounded-full bg-linear-to-r from-blue-500 to-indigo-500 p-2 text-white transition duration-300 hover:opacity-90 active:scale-95 disabled:opacity-60"
                                >
                                    {uploading ? (
                                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                        </svg>
                                    ) : (
                                        <IoSend className="text-base sm:text-lg" />
                                    )}
                                </button>
                            </form>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};