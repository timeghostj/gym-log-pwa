
"use client";

import { useState } from "react";
import { loadCloudWorkoutState } from "../workout-cloud";

export default function TestDatabasePage() {
  const [message, setMessage] = useState("Ready to test.");
  const [loading, setLoading] = useState(false);

  async function testCloudRead() {
    setLoading(true);
    setMessage("Reading Supabase cloud data...");

    try {
      const result = await loadCloudWorkoutState();

      if (!result) {
        setMessage("SUCCESS! Connected. No cloud workout state yet.");
      } else {
        setMessage(
          "SUCCESS! Cloud data retrieved:\n" +
          JSON.stringify(result.state, null, 2)
        );
      }
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unknown error"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-900 p-6 text-white">
      <div className="mx-auto max-w-md space-y-5">
        <h1 className="text-center text-3xl font-bold">
          Gym Log V3 - Cloud Read Test
        </h1>

        <button
          type="button"
          onClick={testCloudRead}
          disabled={loading}
          className="w-full rounded-lg bg-green-500 p-4 font-bold text-black"
        >
          {loading ? "Reading..." : "Read Cloud Data"}
        </button>

        <pre className="whitespace-pre-wrap break-words rounded-lg bg-gray-800 p-4 text-sm">
          {message}
        </pre>
      </div>
    </main>
  );
}
