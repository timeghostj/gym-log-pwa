"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  loadExerciseProgress,
  type ExerciseProgressSet,
} from "../../workout-cloud";
import ProgressChart from "./ProgressChart";

export default function ExerciseProgressPage() {
  const params = useParams<{ exerciseId: string }>();

  const [sets, setSets] = useState<ExerciseProgressSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const exerciseName = params.exerciseId
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const result = await loadExerciseProgress(params.exerciseId);

        if (active) setSets(result);
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error ? err.message : "Unable to load history."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [params.exerciseId]);

  const personalBest = [...sets].sort(
    (a, b) => b.weight - a.weight || b.reps - a.reps
  )[0];

  const formattedDate = personalBest
    ? new Date(`${personalBest.workoutDate}T12:00:00`).toLocaleDateString(
        "en-US",
        { month: "long", day: "numeric", year: "numeric" }
      )
    : "";

  return (
    <main className="mx-auto min-h-screen max-w-xl bg-gray-950 p-4 text-white">
      <Link
        href="/"
        className="mb-6 inline-block text-sm font-semibold text-green-400"
      >
        ← Back to Workout
      </Link>

      <h1 className="mb-5 text-center text-2xl font-bold">
        {exerciseName}
      </h1>

      <section className="border-y border-gray-700 py-8 text-center">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
          All-Time Heaviest Set
        </p>

        {loading ? (
          <p className="text-gray-400">Loading your records...</p>
        ) : error ? (
          <p className="text-red-400">{error}</p>
        ) : personalBest ? (
          <>
            <p className="text-3xl font-bold">
              {personalBest.weight} lb{" "}
              <span className="text-gray-500">×</span>{" "}
              {personalBest.reps} reps
            </p>

            <p className="mt-3 text-sm text-gray-400">
              {formattedDate}
            </p>
          </>
        ) : (
          <p className="text-gray-400">
            No completed workouts recorded yet.
          </p>
        )}
      </section>

      <section className="mt-7">
  <h2 className="mb-2 text-lg font-bold">Weight Progression</h2>

  {loading ? (
    <p className="text-sm text-gray-400">
      Loading progression...
    </p>
  ) : error ? (
    <p className="text-sm text-red-400">{error}</p>
  ) : (
    <ProgressChart sets={sets} />
  )}
</section>
    </main>
  );
}