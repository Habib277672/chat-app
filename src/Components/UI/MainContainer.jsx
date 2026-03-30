import React, { useEffect, useRef, useState } from "react";
import { IoSend } from "react-icons/io5";
import { MdEdit, MdDelete, MdCheck, MdClose } from "react-icons/md";
import { supabase } from "../../Supabase/SupabaseClient";

export const MainContainer = ({ session }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [editingId, setEditingId] = useState(null);
    const [editText, setEditText] = useState("");
    const [activeMenuId, setActiveMenuId] = useState(null);

    const channelRef = useRef(null);
    const bottomRef = useRef(null);

    // Fetch previous messages
    useEffect(() => {
        const fetchMessages = async () => {
            if (!session?.user) return;
            const { data, error } = await supabase
                .from("messages")
                .select("*")
                .order("timestamp", { ascending: true });
            if (error) console.log("Fetch error:", error);
            else setMessages(data);
        };
        fetchMessages();
    }, [session]);

    // Realtime listener
    useEffect(() => {
        if (!session?.user) return;

        const channel = supabase
            .channel("messages_db_changes")
            .on(
                "postgres_changes",
                { event: "INSERT", schema: "public", table: "messages" },
                (payload) => {
                    setMessages((prev) => [...prev, payload.new]);
                }
            )
            .on(
                "postgres_changes",
                { event: "UPDATE", schema: "public", table: "messages" },
                (payload) => {
                    setMessages((prev) =>
                        prev.map((msg) =>
                            msg.id === payload.new.id ? payload.new : msg
                        )
                    );
                }
            )
            .on(
                "postgres_changes",
                { event: "DELETE", schema: "public", table: "messages" },
                (payload) => {
                    setMessages((prev) =>
                        prev.filter((msg) => msg.id !== payload.old.id)
                    );
                }
            )
            .subscribe();

        channelRef.current = channel;

        return () => {
            supabase.removeChannel(channel);
        };
    }, [session]);

    // Scroll to bottom on new message
    useEffect(() => {
        const timer = setTimeout(() => {
            bottomRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
        return () => clearTimeout(timer);
    }, [messages]);

    // Close action menu on outside click
    useEffect(() => {
        const handleClickOutside = () => setActiveMenuId(null);
        document.addEventListener("click", handleClickOutside);
        return () => document.removeEventListener("click", handleClickOutside);
    }, []);

    // Send message
    const handleSend = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        const messageData = {
            message: newMessage,
            user_name: session?.user?.email || "Anonymous",
            timestamp: new Date().toISOString(),
        };

        const { error } = await supabase
            .from("messages")
            .insert([messageData])
            .select()
            .single();

        if (error) {
            console.log("Insert error:", error);
            return;
        }

        setNewMessage("");
    };

    // Edit message
    const handleEdit = async (id) => {
        if (!editText.trim()) return;

        const { error } = await supabase
            .from("messages")
            .update({ message: editText, is_edited: true })
            .eq("id", id);

        if (error) {
            console.log("Update error:", error);
            return;
        }

        setEditingId(null);
        setEditText("");
    };

    // Delete message
    const handleDelete = async (id) => {
        const { error } = await supabase
            .from("messages")
            .delete()
            .eq("id", id);

        if (error) console.log("Delete error:", error);
    };

    return (
        <div className="flex flex-1 justify-center px-2 py-2 sm:px-4 sm:py-4 min-h-0">
            <div className="flex h-full w-full max-w-4xl flex-col rounded-2xl bg-white/60 shadow-lg backdrop-blur-md overflow-hidden">

                {/* Messages Area */}
                <div className="flex-1 flex flex-col gap-2 sm:gap-3 overflow-y-auto p-3 sm:p-4 min-h-0 no-scrollbar">
                    {messages.map((msg) => {
                        const isOwn = msg?.user_name === session?.user?.email;
                        const isEditing = editingId === msg.id;
                        const isMenuOpen = activeMenuId === msg.id;

                        return (
                            <div
                                key={msg.id}
                                className={`flex flex-col max-w-[85%] sm:max-w-[70%] group ${isOwn ? "ml-auto items-end" : "mr-auto items-start"
                                    }`}
                            >
                                {/* Username */}
                                <span className="text-[10px] sm:text-xs text-gray-500 mb-1 px-1 truncate max-w-full">
                                    {msg.user_name}
                                </span>

                                {/* Edit Mode */}
                                {isEditing ? (
                                    <div className="flex items-center gap-2 w-full">
                                        <input
                                            type="text"
                                            value={editText}
                                            onChange={(e) => setEditText(e.target.value)}
                                            onKeyDown={(e) =>
                                                e.key === "Enter" && handleEdit(msg.id)
                                            }
                                            className="flex-1 px-3 py-2 rounded-2xl border border-blue-400 text-sm outline-none bg-white min-w-0"
                                            autoFocus
                                        />
                                        <button
                                            onClick={() => handleEdit(msg.id)}
                                            className="shrink-0 p-1.5 rounded-full bg-green-500 text-white hover:bg-green-600 transition"
                                        >
                                            <MdCheck className="text-base" />
                                        </button>
                                        <button
                                            onClick={() => {
                                                setEditingId(null);
                                                setEditText("");
                                            }}
                                            className="shrink-0 p-1.5 rounded-full bg-gray-400 text-white hover:bg-gray-500 transition"
                                        >
                                            <MdClose className="text-base" />
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        {/* Message Bubble */}
                                        <div
                                            onClick={(e) => {
                                                if (!isOwn) return;
                                                e.stopPropagation(); // prevent outside click from firing
                                                setActiveMenuId(isMenuOpen ? null : msg.id);
                                            }}
                                            className={`px-3 py-2 sm:px-4 sm:py-2 rounded-2xl text-sm sm:text-base wrap-break-word ${isOwn
                                                ? "cursor-pointer bg-blue-500 text-white rounded-tr-sm select-none"
                                                : "bg-neutral-500 text-white rounded-tl-sm"
                                                }`}
                                        >
                                            {msg.message}
                                            {msg.is_edited && (
                                                <span className="text-[10px] ml-2 opacity-70 italic">
                                                    edited
                                                </span>
                                            )}
                                        </div>

                                        {/* Action Buttons — hover on desktop, tap on mobile */}
                                        {isOwn && (
                                            <div
                                                className={`flex gap-1 mt-1 transition-opacity duration-200 ${isMenuOpen
                                                    ? "opacity-100"
                                                    : "opacity-0 group-hover:opacity-100"
                                                    }`}
                                            >
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setEditingId(msg.id);
                                                        setEditText(msg.message);
                                                        setActiveMenuId(null);
                                                    }}
                                                    className="p-1.5 rounded-full bg-white/80 hover:bg-blue-100 text-blue-500 shadow-sm transition"
                                                    title="Edit"
                                                >
                                                    <MdEdit className="text-sm" />
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDelete(msg.id);
                                                        setActiveMenuId(null);
                                                    }}
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
                        );
                    })}
                    <div ref={bottomRef} />
                </div>

                {/* Input Area */}
                <div className="border-t border-gray-200 p-2 sm:p-3">
                    <form
                        onSubmit={handleSend}
                        className="flex items-center gap-2 rounded-full border border-neutral-100 bg-white px-3 sm:px-4 py-2 shadow"
                    >
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Type a message..."
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

            </div>
        </div>
    );
};