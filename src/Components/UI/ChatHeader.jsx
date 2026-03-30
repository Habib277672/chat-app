import { supabase } from "../../Supabase/SupabaseClient";
import { useNavigate } from "react-router-dom";

export const ChatHeader = ({ setSession, session }) => {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();

    if (!error) {
      setSession(null);
      navigate("/", { replace: true });
    }
  };

  return (
    <div className="flex h-16 items-center justify-between border-b border-gray-200 bg-white/70 px-6 backdrop-blur-md">
      {/* Left */}
      <div className="ml-10 lg:ml-0">
        {session && (
          <>
            <h2 className="text-sm font-medium text-neutral-700">User Email </h2 >
            <p className="text-sm font-medium text-neutral-700">
              {session.user.email}
            </p>

          </>
        )}
      </div>

      {/* Right */}
      <button
        onClick={handleSignOut}
        className="cursor-pointer rounded-full bg-linear-to-r from-blue-700 to-blue-400 px-4 py-2  text-white text-sm shadow-md shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 active:scale-[0.98] transition-all duration-200 tracking-tight"
      >
        Sign Out
      </button>
    </div>
  );
};
