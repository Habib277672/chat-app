import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { supabase } from "../Supabase/SupabaseClient";

export const UpdatePassword = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ password: "" });
  const [showPassword, setShowPassword] = useState(false);

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    const { data, error } = await supabase.auth.updateUser({
      password: formData.password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
      },
    });

    if (error) {
      console.log(error);
    }
    if (data) {
      alert("Updated Successfully!");
      navigate("/");
    }

    setFormData({ password: "" });
  };

  return (
    <>
      {/* Ambient Decorative Blobs */}
      <div className="fixed top-0 right-0 w-1/3 h-1/3 bg-blue-600/5 blur-[120px] rounded-full -z-10 pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-1/4 h-1/4 bg-purple-500/5 blur-[100px] rounded-full -z-10 pointer-events-none" />

      <section
        className="h-screen w-full overflow-hidden flex items-center justify-center px-4 bg-linear-to-br from-slate-100 to-slate-50"
        style={{ fontFamily: "'Manrope', sans-serif" }}
      >
        <div className="w-full max-w-sm sm:max-w-md flex flex-col">

          {/* Branding Header */}
          <div className="flex flex-col items-center mb-5 sm:mb-6">
            <div className="w-11 h-11 sm:w-12 sm:h-12 bg-linear-to-br from-blue-700 to-blue-400 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 mb-3 sm:mb-4">
              <span
                className="material-symbols-outlined text-white text-2xl"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                shield_lock
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-800 mb-1 text-center">
              Update Password
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium text-center">
              Enter your new password below
            </p>
          </div>

          {/* Glass Card */}
          <div className="w-full bg-white/85 backdrop-blur-2xl rounded-2xl p-5 sm:p-7 shadow-[0_32px_64px_-16px_rgba(44,52,55,0.08)] border border-slate-200/40">
            <form onSubmit={handleFormSubmit} className="flex flex-col gap-4">

              {/* Password Field */}
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="password"
                  className="text-[10px] font-bold uppercase tracking-widest text-slate-500 pl-1"
                >
                  New Password
                </label>
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
                className="w-full cursor-pointer bg-linear-to-r from-blue-700 to-blue-400 text-white font-bold py-2.5 sm:py-3 rounded-full text-sm shadow-md shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 active:scale-[0.98] transition-all duration-200 tracking-tight mt-1"
              >
                Update Password
              </button>

            </form>
          </div>

          {/* Footer */}
          <p className="mt-4 sm:mt-5 text-center text-xs sm:text-sm text-slate-500 font-medium">
            Back to{" "}
            <NavLink
              to="/"
              className="text-blue-600 font-bold ml-1 hover:underline underline-offset-4 decoration-2 decoration-blue-300/50 transition-all"
            >
              Sign In
            </NavLink>
          </p>

        </div>
      </section>
    </>
  );
};