
"use client";

import { useState } from "react";
import { supabase } from "../supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleAuth(signUp: boolean) {
    setLoading(true);
    setMessage("");

    const result = signUp
      ? await supabase.auth.signUp({
          email,
          password,
        })
      : await supabase.auth.signInWithPassword({
          email,
          password,
        });

    if (result.error) {
      setMessage(result.error.message);
    } else if (signUp) {
      setMessage("Check your email to confirm your account.");
    } else {
      setMessage("Signed in successfully!");
    }

    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-gray-900 text-white p-6">
      <div className="mx-auto max-w-md space-y-5">
        <h1 className="text-center text-3xl font-bold">
          Gym Log V3
        </h1>

        <p className="text-center text-gray-400">
          Sign in to synchronize your workouts.
        </p>

        <input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg bg-gray-800 p-4"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg bg-gray-800 p-4"
        />

        <button
          onClick={() => handleAuth(false)}
          disabled={loading}
          className="w-full rounded-lg bg-green-500 p-4 font-bold text-black"
        >
          Sign In
        </button>

        <button
          onClick={() => handleAuth(true)}
          disabled={loading}
          className="w-full rounded-lg bg-gray-700 p-4 font-bold"
        >
          Create Account
        </button>

        {message && (
          <p className="text-center text-sm text-gray-300">
            {message}
          </p>
        )}
      </div>
    </main>
  );
}
