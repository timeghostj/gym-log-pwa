
"use client";

import { useRef, useState } from "react";
import { supabase } from "../supabase";
import { saveCompleteWorkout } from "../workout-cloud";
import type { CompletedWorkoutSet } from "../workout-cloud";

type RecoveryFile = {
  format: string;
  workoutType: string;
  workoutDate: string;
  sets: CompletedWorkoutSet[];
};

const EXPECTED_FORMAT =
  "gym-log-v3-completed-workout-import-v1";

const EXPECTED_EXERCISES = [
  "lat-pulldown",
  "chest-supported-row",
  "straight-arm",
  "seated-row",
  "db-curl",
  "hammer-curl",
  "preacher-curl",
];

export default function ImportWorkoutPage() {
  const [workout, setWorkout] = useState<RecoveryFile | null>(null);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);

  async function loadFile(file: File | undefined) {
    setWorkout(null);
    setMessage("");

    if (!file) return;

    try {
      const data: RecoveryFile = JSON.parse(await file.text());

      if (
        data.format !== EXPECTED_FORMAT ||
        data.workoutType !== "Pull Day" ||
        data.workoutDate !== "2026-11-17" ||
        !Array.isArray(data.sets) ||
        data.sets.length !== 25
      ) {
        throw new Error("This is not the expected recovery file.");
      }

      const ids = [...new Set(
        data.sets.map((set) => set.exercise_id)
      )];

      if (
        ids.length !== EXPECTED_EXERCISES.length ||
        ids.some((id, i) => id !== EXPECTED_EXERCISES[i])
      ) {
        throw new Error("Exercise order does not match.");
      }

      const keys = new Set<string>();

      for (const set of data.sets) {
        const expectedId =
          EXPECTED_EXERCISES[set.exercise_order - 1];

        const key = `${set.exercise_order}:${set.set_number}`;

        if (
          set.exercise_id !== expectedId ||
          !set.exercise_name ||
          !Number.isInteger(set.exercise_order) ||
          !Number.isInteger(set.set_number) ||
          set.set_number < 1 ||
          !Number.isFinite(set.weight) ||
          set.weight <= 0 ||
          !Number.isInteger(set.reps) ||
          set.reps <= 0 ||
          set.volume !== set.weight * set.reps ||
          keys.has(key)
        ) {
          throw new Error("Invalid or duplicate workout set.");
        }

        keys.add(key);
      }

      const reps = data.sets.reduce(
        (sum, set) => sum + set.reps, 0
      );

      const volume = data.sets.reduce(
        (sum, set) => sum + set.weight * set.reps, 0
      );

      if (reps !== 266 || volume !== 12248) {
        throw new Error("Workout totals do not match.");
      }

      setWorkout(data);
      setMessage("Recovery file validated. Nothing saved yet.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Invalid JSON file."
      );
    }
  }

  async function importWorkout() {
    if (!workout || savingRef.current) return;

    savingRef.current = true;
    setSaving(true);
    setMessage("Checking Supabase...");

    try {
      const { data: authData, error: authError } =
        await supabase.auth.getUser();

      if (authError || !authData.user) {
        throw new Error("Please sign in to V3 first.");
      }

      const { data: existing, error: checkError } =
        await supabase
          .from("workout_sessions")
          .select("id")
          .eq("user_id", authData.user.id)
          .eq("workout_type", workout.workoutType)
          .eq("workout_date", workout.workoutDate)
          .limit(1);

      if (checkError) throw checkError;

      if (existing && existing.length > 0) {
        throw new Error(
          "A Pull Day workout already exists for November 17. Import stopped."
        );
      }

      const storageKey =
        "gym-log-v3-recovery-2026-11-17-session-id";

      let sessionId = localStorage.getItem(storageKey);

      if (!sessionId) {
        sessionId = crypto.randomUUID();
        localStorage.setItem(storageKey, sessionId);
      }

      await saveCompleteWorkout(
        sessionId,
        workout.workoutType,
        workout.workoutDate,
        workout.sets
      );

      setMessage(
        "SUCCESS! November 17 Pull Day saved to Supabase."
      );
      setWorkout(null);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Import failed."
      );
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  const volume = workout?.sets.reduce(
    (sum, set) => sum + set.weight * set.reps, 0
  ) ?? 0;

  return (
    <main className="min-h-screen bg-gray-900 p-5 text-white">
      <div className="mx-auto max-w-xl space-y-5">
        <h1 className="text-2xl font-bold">
          Recover Pull Day
        </h1>

        <p className="text-gray-300">
          Import your November 17, 2026 workout into
          Gym Log V3.
        </p>

        <input
          type="file"
          accept=".json,application/json"
          onChange={(event) =>
            void loadFile(event.target.files?.[0])
          }
          className="w-full rounded-lg bg-gray-800 p-4"
        />

        {workout && (
          <div className="space-y-3 rounded-xl bg-gray-800 p-5">
            <h2 className="text-xl font-bold">
              {workout.workoutType}
            </h2>

            <p>Date: {workout.workoutDate}</p>
            <p>Exercises: 7</p>
            <p>Completed sets: {workout.sets.length}</p>
            <p>Total volume: {volume.toLocaleString()} lb</p>

            <button
              type="button"
              disabled={saving}
              onClick={() => void importWorkout()}
              className="w-full rounded-lg bg-green-500 p-4 font-bold text-black disabled:opacity-50"
            >
              {saving
                ? "Importing..."
                : "Confirm Import to Supabase"}
            </button>
          </div>
        )}

        {message && (
          <p className="rounded-lg bg-gray-800 p-4">
            {message}
          </p>
        )}
      </div>
    </main>
  );
}
