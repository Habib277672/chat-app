import React from "react";
import { ChatHeader } from "../UI/ChatHeader";
import { MainContainer } from "../UI/MainContainer";
import { Sidebar } from "../UI/Sidebar";

export const AppLayout = ({ setSession, session }) => {
  return (
    <section className="flex h-screen bg-linear-to-br from-[#e6f0ff] via-[#f5f7ff] to-[#e0f7fa]">

      {/* Sidebar */}
      <Sidebar />

      {/* Right Content */}
      <div className="flex w-full lg:w-[80%] flex-col">

        {/* Header */}
        <ChatHeader setSession={setSession} session={session} />

        {/* Chat Area */}
        <main className="flex flex-1 min-h-0">
          <MainContainer setSession={setSession} session={session} />
        </main>

      </div>
    </section>
  );
};