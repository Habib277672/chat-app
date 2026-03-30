import React, { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { supabase } from "../Supabase/SupabaseClient";
// import toast, { Toaster } from 'react-hot-toast';


export const SignIn = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    const { data, error } = await supabase.auth.signInWithPassword({
      email: formData.email,
      password: formData.password,
    });

    if (error) {
      setMessage("Please enter correct Email & Password!");
      console.log(error);
    }

    if (data.user.aud === "authenticated") {
      // toast.success("Successfully Logged In!");
      navigate("/chatpanel");
    }

    setFormData({ email: "", password: "" });
  };

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/chatpanel`,
      },
    });
    if (error) {
      console.log(error);
    }
  };

  return (
    <>

      {/* Ambient Decorative Blobs */}
      <div className="fixed top-0 right-0 w-1/3 h-1/3 bg-blue-600/5 blur-[120px] rounded-full -z-10 pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-1/4 h-1/4 bg-purple-500/5 blur-[100px] rounded-full -z-10 pointer-events-none" />
      {/* <Toaster position="top-right" /> */}
      <section
        className="h-screen w-full overflow-hidden flex items-center justify-center px-4 bg-linear-to-br from-slate-100 to-slate-50"
        style={{ fontFamily: "'Manrope', sans-serif" }}
      >
        <div className="w-full max-w-sm sm:max-w-md flex flex-col">

          {/* Branding Header */}
          <div className="flex flex-col items-center mb-5 sm:mb-6">
            <div className="w-11 h-11 sm:w-13 sm:h-13 bg-linear-to-br from-blue-700 to-blue-400 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 mb-3 sm:mb-4">
              <span
                className="material-symbols-outlined text-white text-2xl"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                chat_bubble
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-800 mb-1 text-center">
              Welcome Back
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium text-center">
              Sign in to continue to your chat
            </p>
          </div>

          {/* Glass Card */}
          <div className="w-full bg-white/85 backdrop-blur-2xl rounded-2xl p-5 sm:p-7 shadow-[0_32px_64px_-16px_rgba(44,52,55,0.08)] border border-slate-200/40">
            <form onSubmit={handleFormSubmit} className="flex flex-col gap-4">

              {/* Email Field */}
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="email"
                  className="text-[10px] font-bold uppercase tracking-widest text-slate-500 pl-1"
                >
                  Email Address
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors duration-200">
                    <span className="material-symbols-outlined text-lg">
                      alternate_email
                    </span>
                  </div>
                  <input
                    id="email"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, [e.target.name]: e.target.value })
                    }
                    placeholder="name@company.com"
                    required
                    className="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-slate-50 border border-slate-200/60 rounded-xl text-sm text-slate-800 placeholder:text-slate-300 focus:outline-none focus:border-blue-400/60 focus:bg-white transition-all duration-200"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center px-1">
                  <label
                    htmlFor="password"
                    className="text-[10px] font-bold uppercase tracking-widest text-slate-500"
                  >
                    Password
                  </label>
                  <NavLink
                    to="/forgetpassword"
                    className="text-[11px] font-bold text-blue-600 hover:opacity-70 transition-opacity duration-200"
                  >
                    Forgot Password?
                  </NavLink>
                </div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors duration-200">
                    <span className="material-symbols-outlined text-lg">
                      lock
                    </span>
                  </div>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, [e.target.name]: e.target.value })
                    }
                    placeholder="••••••••"
                    required
                    className="w-full pl-10 pr-11 py-2.5 sm:py-3 bg-slate-50 border border-slate-200/60 rounded-xl text-sm text-slate-800 placeholder:text-slate-300 focus:outline-none focus:border-blue-400/60 focus:bg-white transition-all duration-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute cursor-pointer inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-blue-600 transition-colors duration-200"
                  >
                    <span className="material-symbols-outlined text-lg">
                      {showPassword ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full cursor-pointer bg-linear-to-r from-blue-700 to-blue-400 text-white font-bold py-2.5 sm:py-3 rounded-full text-sm shadow-md shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 active:scale-[0.98] transition-all duration-200 tracking-tight"
              >
                Sign In
              </button>

              {/* Error Message */}
              {message && (
                <p className="text-center text-xs text-red-500 -mt-1">
                  {message}
                </p>
              )}

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 border-t border-slate-200/40" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-300 whitespace-nowrap">
                  Or continue with
                </span>
                <div className="flex-1 border-t border-slate-200/40" />
              </div>

              {/* Google Button */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full bg-white border border-slate-200/60 text-slate-700 font-semibold py-2.5 sm:py-3 rounded-full flex items-center justify-center gap-3 text-sm hover:bg-slate-50 active:scale-[0.98] transition-all duration-200"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Google
              </button>

            </form>
          </div>

          {/* Footer */}
          <p className="mt-4 sm:mt-5 text-center text-xs sm:text-sm text-slate-500 font-medium">
            Don't have an account?{" "}
            <NavLink
              to="/signup"
              className="text-blue-600 font-bold ml-1 hover:underline underline-offset-4 decoration-2 decoration-blue-300/50 transition-all"
            >
              Sign Up
            </NavLink>
          </p>

        </div>
      </section>
    </>
  );
};