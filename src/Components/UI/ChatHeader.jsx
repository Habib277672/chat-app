import { useEffect, useState, useRef } from "react";
import { supabase } from "../../Supabase/SupabaseClient";
import { useNavigate } from "react-router-dom";

export const ChatHeader = ({ setSession, session }) => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (!session?.user?.id) return;
    const fetchUsername = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", session.user.id)
        .single();
      if (!error && data?.username) setUsername(data.username);
    };
    fetchUsername();
  }, [session?.user?.id]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      setSession(null);
      navigate("/", { replace: true });
    }
  };

  const initial = (username || session?.user?.email || "?")[0].toUpperCase();
  const emailShort = session?.user?.email?.length > 20
    ? session.user.email.slice(0, 20) + "..."
    : session?.user?.email;

  return (
    <div className="relative z-50 flex h-16 items-center justify-between border-b border-gray-200 bg-white/70 px-6 backdrop-blur-md">

      {/* Left — app branding */}
      <div className="ml-10 lg:ml-0 flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-linear-to-br from-blue-600 to-indigo-500 flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z" />
          </svg>
        </div>
        <div className=" sm:block">
          <h1 className="text-sm font-bold text-gray-800 leading-tight">Panda Chat</h1>
          <p className="text-[11px] text-gray-400 leading-tight">Real-time messaging</p>
        </div>
      </div>

      {/* Right — profile pill */}
      {session && (
        <div className="relative" ref={dropdownRef}>

          {/* Trigger pill */}
          <button
            onClick={() => setDropdownOpen((prev) => !prev)}
            className="flex items-center gap-2.5 pl-1 pr-3 py-1 rounded-full bg-white border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 active:scale-[0.98]"
          >
            {/* Avatar */}
            <div className="w-8 h-8 rounded-full bg-linear-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
              {initial}
            </div>

            {/* Name + Email */}
            <div className="text-left hidden sm:block">
              <p className="text-xs font-semibold text-gray-800 leading-tight">
                {username || "User"}
              </p>
              <p className="text-[11px] text-gray-400 leading-tight">
                {emailShort}
              </p>
            </div>

            {/* Chevron */}
            <svg
              className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-300 ${dropdownOpen ? "rotate-180" : "rotate-0"}`}
              fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Dropdown */}
          <div className={`absolute right-0 top-12 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden
            transition-all duration-200 ease-out origin-top-right
            ${dropdownOpen ? "opacity-100 scale-100 translate-y-0 pointer-events-auto" : "opacity-0 scale-95 -translate-y-2 pointer-events-none"}`}
          >
            {/* User info inside dropdown */}
            <div className="px-4 py-3 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-linear-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                  {initial}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{username || "User"}</p>
                  <p className="text-xs text-gray-400 truncate">{session.user.email}</p>
                </div>
              </div>
            </div>

            {/* Sign out button */}
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-red-500 hover:bg-red-50 transition-colors duration-150"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign Out
            </button>
          </div>

        </div>
      )}
    </div>
  );
};