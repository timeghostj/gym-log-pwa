"use client";

import { useEffect, useState } from "react";

const today = new Date().toLocaleDateString("en-US");

const workouts = {
  "Push Day": [
    "DB Bench Press",
    "DB Incline Press",
    "Seated Arnold Press",
    "DB Lateral Raise",
    "Calf Raise",
  ],

  "Pull Day": [
    "Lat Pull-Down",
    "Single Arm BO Row",
    "DB Curl",
    "DB Hammer Curl",
  ],

  "Leg Day": [
    "DB Deadlift",
    "Assisted Lunge",
    "Kettle Bell Swing",
    "Machine Leg Ext",
    "Machine Leg Curl",
  ],
};

type WorkoutName = keyof typeof workouts;
type RowType = "normal" | "burnout";
type WorkoutRow = { id: string; label: string; type: RowType };
type SetData = { weight: number; reps: number };

const baseRows: WorkoutRow[] = [
  { id: "warmup-1", label: "Warm up", type: "normal" },
  { id: "warmup-2", label: "Warm up", type: "normal" },
  { id: "set-1", label: "Set 1", type: "normal" },
  { id: "set-2", label: "Set 2", type: "normal" },
  { id: "set-3", label: "Set 3", type: "normal" },
];

const starterLastWorkoutData: Record<string, SetData[]> = {
  "Dumbbell Bench Press": [
    { weight: 20, reps: 10 },
    { weight: 30, reps: 10 },
    { weight: 45, reps: 10 },
    { weight: 45, reps: 10 },
    { weight: 45, reps: 8 },
  ],
  "Arnold Press": [
    { weight: 10, reps: 10 },
    { weight: 15, reps: 10 },
    { weight: 25, reps: 10 },
    { weight: 25, reps: 9 },
    { weight: 25, reps: 8 },
  ],
};

function getInputClass(value: string, lastValue: number) {
  const numberValue = Number(value);

  if (value !== "" && numberValue >= lastValue) {
    return "bg-green-400 text-black font-bold";
  }

  return "bg-gray-700 text-white";
}

export default function Home() {
  const [selectedWorkout, setSelectedWorkout] =
    useState<WorkoutName>("Push Day");

  const [workoutDate, setWorkoutDate] = useState(today);
  const [entries, setEntries] = useState<Record<string, string>>({});
  const [timers, setTimers] = useState<Record<string, number>>({});
  const [extraRows, setExtraRows] = useState<Record<string, WorkoutRow[]>>({});
  const [lastWorkoutData, setLastWorkoutData] = useState<
    Record<string, SetData[]>
  >(starterLastWorkoutData);

  useEffect(() => {
    const savedEntries = localStorage.getItem("gym-log-entries");
    const savedDate = localStorage.getItem("gym-log-date");
    const savedWorkout = localStorage.getItem("gym-log-selected-workout");
    const savedLastWorkoutData = localStorage.getItem("gym-log-last-data");
    const savedExtraRows = localStorage.getItem("gym-log-extra-rows");

    if (savedEntries) setEntries(JSON.parse(savedEntries));
    if (savedDate) setWorkoutDate(savedDate);
    if (savedLastWorkoutData) setLastWorkoutData(JSON.parse(savedLastWorkoutData));
    if (savedExtraRows) setExtraRows(JSON.parse(savedExtraRows));

    if (
      savedWorkout === "Push Day" ||
      savedWorkout === "Pull Day" ||
      savedWorkout === "Leg Day"
    ) {
      setSelectedWorkout(savedWorkout);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("gym-log-entries", JSON.stringify(entries));
  }, [entries]);

  useEffect(() => {
    localStorage.setItem("gym-log-date", workoutDate);
  }, [workoutDate]);

  useEffect(() => {
    localStorage.setItem("gym-log-selected-workout", selectedWorkout);
  }, [selectedWorkout]);

  useEffect(() => {
    localStorage.setItem("gym-log-last-data", JSON.stringify(lastWorkoutData));
  }, [lastWorkoutData]);

  useEffect(() => {
    localStorage.setItem("gym-log-extra-rows", JSON.stringify(extraRows));
  }, [extraRows]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimers((previous) => {
        const updatedTimers = { ...previous };

        Object.keys(updatedTimers).forEach((timerKey) => {
          if (updatedTimers[timerKey] > 0) {
            updatedTimers[timerKey] -= 1;
          }
        });

        return updatedTimers;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  function getRowsForExercise(exercise: string) {
    return [...baseRows, ...(extraRows[exercise] ?? [])];
  }

  function updateEntry(key: string, value: string) {
    setEntries((previous) => ({
      ...previous,
      [key]: value,
    }));
  }

  function startTimer(timerKey: string, seconds: number) {
    setTimers((previous) => ({
      ...previous,
      [timerKey]: seconds,
    }));
  }

  function addAdditionalSet(exercise: string) {
    const currentExtraRows = extraRows[exercise] ?? [];
    const additionalSetCount = currentExtraRows.filter(
      (row) => row.type === "normal"
    ).length;

    const nextSetNumber = 4 + additionalSetCount;

    const newRow: WorkoutRow = {
      id: `set-${nextSetNumber}-${Date.now()}`,
      label: `Set ${nextSetNumber}`,
      type: "normal",
    };

    setExtraRows((previous) => ({
      ...previous,
      [exercise]: [...(previous[exercise] ?? []), newRow],
    }));
  }

  function addBurnoutSet(exercise: string) {
    const currentBurnoutCount = (extraRows[exercise] ?? []).filter(
      (row) => row.type === "burnout"
    ).length;

    const newRow: WorkoutRow = {
      id: `burnout-${currentBurnoutCount + 1}-${Date.now()}`,
      label:
        currentBurnoutCount === 0
          ? "Drop-set Burnout"
          : `Drop-set Burnout ${currentBurnoutCount + 1}`,
      type: "burnout",
    };

    setExtraRows((previous) => ({
      ...previous,
      [exercise]: [...(previous[exercise] ?? []), newRow],
    }));
  }

  function completeWorkout() {
    const updatedLastData = { ...lastWorkoutData };

    workouts[selectedWorkout].forEach((exercise) => {
      const allRows = getRowsForExercise(exercise);

      updatedLastData[exercise] = allRows.map((row, index) => {
        const weightKey = `${exercise}-${row.id}-weight`;
        const repsKey = `${exercise}-${row.id}-reps`;

        const previousSet = lastWorkoutData[exercise]?.[index] ?? {
          weight: 0,
          reps: 0,
        };

        const enteredWeight = entries[weightKey];
        const enteredReps = entries[repsKey];

        const enteredWeightNumber = Number(enteredWeight);
        const enteredRepsNumber = Number(enteredReps);

        if (row.type === "burnout") {
          return {
            weight: 0,
            reps:
              enteredReps &&
              enteredReps.trim() !== "" &&
              enteredRepsNumber > 0
                ? enteredRepsNumber
                : previousSet.reps,
          };
        }

        return {
          weight:
            enteredWeight &&
            enteredWeight.trim() !== "" &&
            enteredWeightNumber > 0
              ? enteredWeightNumber
              : previousSet.weight,
          reps:
            enteredReps && enteredReps.trim() !== "" && enteredRepsNumber > 0
              ? enteredRepsNumber
              : previousSet.reps,
        };
      });
    });

    setLastWorkoutData(updatedLastData);
    setEntries({});
    setExtraRows({});
    setWorkoutDate(new Date().toLocaleDateString("en-US"));
  }

  return (
    <main className="min-h-screen bg-gray-900 text-white p-4">
      <div className="text-center mb-6">
        <select
          value={selectedWorkout}
          onChange={(e) => setSelectedWorkout(e.target.value as WorkoutName)}
          className="mb-3 rounded-lg bg-gray-800 p-3 text-2xl font-bold text-white text-center"
        >
          <option>Push Day</option>
          <option>Pull Day</option>
          <option>Leg Day</option>
        </select>

        <div>
          <input
            type="text"
            value={workoutDate}
            onChange={(e) => setWorkoutDate(e.target.value)}
            className="rounded-lg bg-gray-800 p-3 text-center text-gray-200"
          />
        </div>
      </div>

      {workouts[selectedWorkout].map((exercise) => {
        const exerciseRows = getRowsForExercise(exercise);

        return (
          <section key={exercise} className="bg-gray-800 rounded-xl p-4 mb-5">
            <h2 className="text-2xl font-semibold mb-4">{exercise}</h2>

            <div className="grid grid-cols-[1.2fr_1fr_1fr_1fr_1fr] gap-2 text-sm font-bold text-gray-300 mb-2">
              <div></div>
              <div>Weight</div>
              <div>Last</div>
              <div>Reps</div>
              <div>Last</div>
            </div>

            {exerciseRows.map((row, index) => {
              const lastSet = lastWorkoutData[exercise]?.[index] ?? {
                weight: 0,
                reps: 0,
              };

              const weightKey = `${exercise}-${row.id}-weight`;
              const repsKey = `${exercise}-${row.id}-reps`;

              return (
                <div
                  key={`${exercise}-${row.id}`}
                  className="grid grid-cols-[1.2fr_1fr_1fr_1fr_1fr] gap-2 mb-2 items-center"
                >
                  <div className="text-sm text-gray-200">{row.label}</div>

                  {row.type === "burnout" ? (
                    <>
                      <div className="text-center text-gray-500">—</div>
                      <div className="text-center text-gray-500">—</div>
                    </>
                  ) : (
                    <>
                      <input
                        inputMode="numeric"
                        placeholder="0"
                        value={entries[weightKey] ?? ""}
                        onChange={(e) => updateEntry(weightKey, e.target.value)}
                        className={`w-full rounded-lg p-2 text-center ${getInputClass(
                          entries[weightKey] ?? "",
                          lastSet.weight
                        )}`}
                      />

                      <div className="text-center text-gray-400">
                        {lastSet.weight}
                      </div>
                    </>
                  )}

                  <input
                    inputMode="numeric"
                    placeholder="0"
                    value={entries[repsKey] ?? ""}
                    onChange={(e) => updateEntry(repsKey, e.target.value)}
                    className={`w-full rounded-lg p-2 text-center ${getInputClass(
                      entries[repsKey] ?? "",
                      lastSet.reps
                    )}`}
                  />

                  <div className="text-center text-gray-400">
                    {lastSet.reps}
                  </div>
                </div>
              );
            })}

            <div className="mt-3 flex gap-3 justify-center">
  <button
    onClick={() => addAdditionalSet(exercise)}
    className="h-12 w-12 rounded-full bg-purple-500 font-bold text-black shadow-lg"
  >
    AS
  </button>

  <button
    onClick={() => addBurnoutSet(exercise)}
    className="h-12 w-12 rounded-full bg-orange-400 font-bold text-black shadow-lg"
  >
    DS
  </button>
</div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                onClick={() => startTimer(`${exercise}-90`, 90)}
                className="rounded-lg bg-blue-500 p-3 font-bold text-black"
              >
                {timers[`${exercise}-90`] && timers[`${exercise}-90`] > 0
                  ? `${timers[`${exercise}-90`]}s`
                  : "90 sec"}
              </button>

              <button
                onClick={() => startTimer(`${exercise}-120`, 120)}
                className="rounded-lg bg-blue-500 p-3 font-bold text-black"
              >
                {timers[`${exercise}-120`] && timers[`${exercise}-120`] > 0
                  ? `${timers[`${exercise}-120`]}s`
                  : "120 sec"}
              </button>
            </div>
          </section>
        );
      })}

      <button
        onClick={completeWorkout}
        className="w-full rounded-xl bg-green-500 p-4 text-xl font-bold text-black"
      >
        Complete Workout
      </button>
    </main>
  );
}