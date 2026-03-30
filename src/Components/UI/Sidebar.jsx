import { useState } from "react";

const chats = [
    {
        id: 1,
        name: "Eva Johnston",
        message: "is typing a message...",
        time: "5m ago",
        avatar: "https://i.pravatar.cc/150?img=47",
        isTyping: true,
        online: true,
    },
    {
        id: 2,
        name: "Lucinda McGuire",
        message: "Sounds Great! See you next time",
        time: "2h ago",
        avatar: "https://i.pravatar.cc/150?img=48",
        isTyping: false,
        online: false,
    },
    {
        id: 3,
        name: "Carl Willis",
        message: "Carl, could you please take me to the hosp...",
        time: "Fri",
        avatar: "https://i.pravatar.cc/150?img=12",
        isTyping: false,
        online: false,
    },
    {
        id: 4,
        name: "Earl Vargas",
        message: "Jonathan will be here",
        time: "Jun 13",
        avatar: "https://i.pravatar.cc/150?img=33",
        isTyping: false,
        online: true,
    },
    {
        id: 5,
        name: "Jimmy Brady",
        message: "Jim, anak-anak ngajakin bukber",
        time: "Jun 10",
        avatar: "https://i.pravatar.cc/150?img=15",
        isTyping: false,
        online: false,
    },
    {
        id: 6,
        name: "Maude Gill",
        message: "Thx ya, jangan bosen-bosen haha",
        time: "April 22",
        avatar: "https://i.pravatar.cc/150?img=25",
        isTyping: false,
        online: false,
    },
];

export const Sidebar = () => {
    const [selectedId, setSelectedId] = useState(2);
    const [searchQuery, setSearchQuery] = useState("");
    const [isOpen, setIsOpen] = useState(false);

    const filtered = chats.filter(
        (c) =>
            c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.message.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const SidebarContent = (
        <div className="w-80 h-full bg-white flex flex-col shadow-xl overflow-hidden font-sans">
            {/* Header */}
            <div className="px-5 pt-6 pb-3">
                <div className="flex items-center justify-between mb-4">
                    <h1 className="text-xl ml-10 sm:ml-0 font-bold text-gray-800">Chats</h1>
                </div>

                {/* Search */}
                <div className="relative">
                    <svg
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        viewBox="0 0 24 24"
                    >
                        <circle cx="11" cy="11" r="8" />
                        <path d="m21 21-4.35-4.35" />
                    </svg>
                    <input
                        type="text"
                        placeholder="Search"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 bg-gray-100 rounded-xl text-sm text-gray-700 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-400 transition-all"
                    />
                </div>
            </div>

            {/* Chat List */}
            <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-1">
                {filtered.map((chat) => {
                    const isSelected = chat.id === selectedId;
                    return (
                        <button
                            key={chat.id}
                            onClick={() => {
                                setSelectedId(chat.id);
                                setIsOpen(false);
                            }}
                            className={`w-full flex items-center gap-3 px-3 py-3 rounded-2xl transition-all duration-200 text-left
                ${isSelected ? "bg-blue-50 shadow-sm" : "hover:bg-gray-50"}`}
                        >
                            {/* Avatar */}
                            <div className="relative flex-shrink-0">
                                <img
                                    src={chat.avatar}
                                    alt={chat.name}
                                    className="w-12 h-12 rounded-full object-cover"
                                />
                                {chat.online && (
                                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-white rounded-full" />
                                )}
                            </div>

                            {/* Text */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-0.5">
                                    <span
                                        className={`text-sm font-semibold truncate ${isSelected ? "text-blue-600" : "text-gray-800"
                                            }`}
                                    >
                                        {chat.name}
                                    </span>
                                    <span
                                        className={`text-xs flex-shrink-0 ml-2 ${isSelected ? "text-blue-400" : "text-gray-400"
                                            }`}
                                    >
                                        {chat.time}
                                    </span>
                                </div>
                                <p
                                    className={`text-xs truncate ${chat.isTyping
                                        ? "text-blue-500 italic"
                                        : isSelected
                                            ? "text-blue-400"
                                            : "text-gray-500"
                                        }`}
                                >
                                    {chat.message}
                                </p>
                            </div>

                            {/* Selected indicator */}
                            {isSelected && (
                                <div className="w-1.5 h-8 bg-blue-500 rounded-full flex-shrink-0" />
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );

    return (
        <>
            {/* ── Mobile toggle button (hamburger / X) ── */}
            <button
                className="md:hidden fixed top-4 left-4 z-50 p-2 bg-blue-500 text-white rounded-xl shadow-lg"
                onClick={() => setIsOpen((prev) => !prev)}
            >
                {isOpen ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                )}
            </button>

            {/* ── Mobile: backdrop + slide-in drawer ── */}
            {isOpen && (
                <div className="md:hidden fixed inset-0 z-40 flex">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
                    <div className="relative z-50 h-full">
                        {SidebarContent}
                    </div>
                </div>
            )}

            {/* ── Desktop: always visible ── */}
            <div className="hidden md:flex h-screen">
                {SidebarContent}
            </div>
        </>
    );
}




