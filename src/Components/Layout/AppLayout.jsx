import React, { useState, useEffect } from "react";
import { ChatHeader } from "../UI/ChatHeader";
import { MainContainer } from "../UI/MainContainer";
import { Sidebar } from "../UI/Sidebar";
import { supabase } from "../../Supabase/SupabaseClient";

export const AppLayout = ({ setSession, session }) => {
  const [selectedUser, setSelectedUser] = useState(null);

  // Update last_seen every 30s so online status works app-wide
  useEffect(() => {
    const currentUserId = session?.user?.id;
    if (!currentUserId) return;

    const updateLastSeen = async () => {
      await supabase
        .from("profiles")
        .update({ last_seen: new Date().toISOString() })
        .eq("id", currentUserId);
    };

    updateLastSeen();
    const interval = setInterval(updateLastSeen, 30000);
    const handleFocus = () => updateLastSeen();
    window.addEventListener("focus", handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
    };
  }, [session?.user?.id]);

  return (
    <section className="flex h-screen bg-linear-to-br from-[#e6f0ff] via-[#f5f7ff] to-[#e0f7fa]">

      {/* Sidebar */}
      <Sidebar session={session} selectedUser={selectedUser} setSelectedUser={setSelectedUser} />

      {/* Right Content */}
      <div className="flex w-full lg:w-[80%] flex-col">

        {/* Header */}
        <ChatHeader setSession={setSession} session={session} selectedUser={selectedUser} />

        {/* Chat Area. */}
        <main className="flex flex-1 min-h-0">
          {selectedUser ? (
            <MainContainer session={session} selectedUser={selectedUser} />
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6">
              <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z" />
                </svg>
              </div>
              <div className="text-center">
                <h2 className="text-lg font-bold text-gray-700 mb-1">Your Messages</h2>
                <p className="text-sm text-gray-400 max-w-xs">Select a conversation from the sidebar or search for a user to start chatting</p>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 rounded-full bg-blue-300 animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 rounded-full bg-blue-200 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          )}
        </main>

      </div>
    </section>
  );
};