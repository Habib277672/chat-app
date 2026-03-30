import React, { useEffect, useState } from "react";
import "./App.css";
import { IoSend } from "react-icons/io5";
import { supabase } from "./Supabase/SupabaseClient";
import { SignIn } from "./Pages/SignIn";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { SignUp } from "./Pages/SignUp";
import { ForgetPassword } from "./Pages/ForgetPassword";
import { UpdatePassword } from "./Pages/UpdatePassword";
import { AppLayout } from "./Components/Layout/AppLayout";
import { ProtectedRoute } from "./Components/Layout/ProtectedRoute";

const App = () => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getSession = async () => {
      const { data } = await supabase.auth.getSession();

      setSession(data.session);
      setLoading(false);
    };

    getSession();

    const { data: listener } = supabase.auth.onAuthStateChange((_, session) =>
      setSession(session),
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  const router = createBrowserRouter([
    {
      path: "/",
      element: <SignIn />,
    },
    {
      path: "/signup",
      element: <SignUp />,
    },
    {
      path: "/forgetpassword",
      element: <ForgetPassword />,
    },
    {
      path: "/updatepassword",
      element: <UpdatePassword />,
    },
    {
      path: "/chatpanel",
      element: (
        <ProtectedRoute session={session} loading={loading}>
          <AppLayout setSession={setSession} session={session} />
        </ProtectedRoute>
      ),
    },
  ]);
  return <RouterProvider router={router} />;
};

export default App;
