import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { supabase } from "../Supabase/SupabaseClient";
import { toast } from "react-hot-toast";

export const SignIn = () => {
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
      return;
    }

    if (data?.session) {
      setMessage("");
      toast.success("Successfully Logged In!");
      setTimeout(() => window.location.assign("/chatpanel"), 1000);
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
      <div className="pointer-events-none fixed top-0 right-0 -z-10 h-1/3 w-1/3 rounded-full bg-blue-600/5 blur-[120px]" />
      <div className="pointer-events-none fixed bottom-0 left-0 -z-10 h-1/4 w-1/4 rounded-full bg-purple-500/5 blur-[100px]" />
      {/* <Toaster position="top-right" /> */}
      <section
        className="flex h-screen w-full items-center justify-center overflow-hidden bg-linear-to-br from-slate-100 to-slate-50 px-4"
        style={{ fontFamily: "'Manrope', sans-serif" }}
      >
        <div className="flex w-full max-w-sm flex-col sm:max-w-md">
          {/* Branding Header */}
          <div className="mb-5 flex flex-col items-center sm:mb-6">
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-linear-to-br from-blue-700 to-blue-400 shadow-lg shadow-blue-500/20 sm:mb-4 sm:h-13 sm:w-13">
              <span
                className="material-symbols-outlined text-2xl text-white"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                chat_bubble
              </span>
            </div>
            <h1 className="mb-1 text-center text-2xl font-extrabold tracking-tight text-slate-800 sm:text-3xl">
              Welcome Back
            </h1>
            <p className="text-center text-xs font-medium text-slate-500 sm:text-sm">
              Sign in to continue to your chat
            </p>
          </div>

          {/* Glass Card */}
          <div className="w-full rounded-2xl border border-slate-200/40 bg-white/85 p-5 shadow-[0_32px_64px_-16px_rgba(44,52,55,0.08)] backdrop-blur-2xl sm:p-7">
            <form onSubmit={handleFormSubmit} className="flex flex-col gap-4">
              {/* Email Field */}
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="email"
                  className="pl-1 text-[10px] font-bold tracking-widest text-slate-500 uppercase"
                >
                  Email Address
                </label>
                <div className="group relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 transition-colors duration-200 group-focus-within:text-blue-600">
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
                      setFormData({
                        ...formData,
                        [e.target.name]: e.target.value,
                      })
                    }
                    placeholder="name@company.com"
                    required
                    className="w-full rounded-xl border border-slate-200/60 bg-slate-50 py-2.5 pr-4 pl-10 text-sm text-slate-800 transition-all duration-200 placeholder:text-slate-300 focus:border-blue-400/60 focus:bg-white focus:outline-none sm:py-3"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between px-1">
                  <label
                    htmlFor="password"
                    className="text-[10px] font-bold tracking-widest text-slate-500 uppercase"
                  >
                    Password
                  </label>
                  <NavLink
                    to="/forgetpassword"
                    className="text-[11px] font-bold text-blue-600 transition-opacity duration-200 hover:opacity-70"
                  >
                    Forgot Password?
                  </NavLink>
                </div>
                <div className="group relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 transition-colors duration-200 group-focus-within:text-blue-600">
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
                      setFormData({
                        ...formData,
                        [e.target.name]: e.target.value,
                      })
                    }
                    placeholder="••••••••"
                    required
                    className="w-full rounded-xl border border-slate-200/60 bg-slate-50 py-2.5 pr-11 pl-10 text-sm text-slate-800 transition-all duration-200 placeholder:text-slate-300 focus:border-blue-400/60 focus:bg-white focus:outline-none sm:py-3"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex cursor-pointer items-center pr-3.5 text-slate-400 transition-colors duration-200 hover:text-blue-600"
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
                className="w-full cursor-pointer rounded-full bg-linear-to-r from-blue-700 to-blue-400 py-2.5 text-sm font-bold tracking-tight text-white shadow-md shadow-blue-500/20 transition-all duration-200 hover:shadow-xl hover:shadow-blue-500/30 active:scale-[0.98] sm:py-3"
              >
                Sign In
              </button>

              {/* Error Message */}
              {message && (
                <p className="-mt-1 text-center text-xs text-red-500">
                  {message}
                </p>
              )}

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 border-t border-slate-200/40" />
                <span className="text-[10px] font-bold tracking-widest whitespace-nowrap text-slate-300 uppercase">
                  Or continue with
                </span>
                <div className="flex-1 border-t border-slate-200/40" />
              </div>

              {/* Google Button */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="flex w-full items-center justify-center gap-3 rounded-full border border-slate-200/60 bg-white py-2.5 text-sm font-semibold text-slate-700 transition-all duration-200 hover:bg-slate-50 active:scale-[0.98] sm:py-3"
              >
                <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Google
              </button>
            </form>
          </div>

          {/* Footer */}
          <p className="mt-4 text-center text-xs font-medium text-slate-500 sm:mt-5 sm:text-sm">
            Don't have an account?{" "}
            <NavLink
              to="/signup"
              className="ml-1 font-bold text-blue-600 decoration-blue-300/50 decoration-2 underline-offset-4 transition-all hover:underline"
            >
              Sign Up
            </NavLink>
          </p>
        </div>
      </section>
    </>
  );
};
