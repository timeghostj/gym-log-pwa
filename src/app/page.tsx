"use client";

import { useEffect, useState } from "react";

const getToday = () => new Date().toLocaleDateString("en-US");

const workouts = {
  "Push Day": [
    "DB Bench Press",
    "DB Incline Press",
    "Seated Arnold Press",
    "DB Lateral Raise",
    "Calf Raise",
  ],
  "Pull Day": ["Lat Pull-Down", "Single Arm BO Row", "DB Curl", "DB Hammer Curl"],
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
  { id: "set-1", label: "Set 1", type: "normal" },
  { id: "set-2", label: "Set 2", type: "normal" },
  { id: "set-3", label: "Set 3", type: "normal" },
  { id: "set-4", label: "Set 4", type: "normal" },
  { id: "set-5", label: "Set 5", type: "normal" },
];

const starterLastWorkoutData: Record<string, SetData[]> = {};

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

  const [workoutDate, setWorkoutDate] = useState(getToday());
  const [entries, setEntries] = useState<Record<string, string>>({});
  const [suggestions, setSuggestions] = useState<Record<string, string>>({});
  const [timers, setTimers] = useState<Record<string, number>>({});
  const [extraRows, setExtraRows] = useState<Record<string, WorkoutRow[]>>({});
  const [lastWorkoutData, setLastWorkoutData] = useState<
    Record<string, SetData[]>
  >(starterLastWorkoutData);

  useEffect(() => {
    const today = getToday();

    const savedEntries = localStorage.getItem("gym-log-entries");
    const savedDate = localStorage.getItem("gym-log-date");
    const savedWorkout = localStorage.getItem("gym-log-selected-workout");
    const savedLastWorkoutData = localStorage.getItem("gym-log-last-data");
    const savedExtraRows = localStorage.getItem("gym-log-extra-rows");

    if (savedDate === today && savedEntries) {
      setEntries(JSON.parse(savedEntries));
      setWorkoutDate(savedDate);
    } else {
      setWorkoutDate(today);
      setEntries({});
      localStorage.setItem("gym-log-date", today);
      localStorage.setItem("gym-log-entries", JSON.stringify({}));
    }

    if (savedLastWorkoutData) {
      setLastWorkoutData(JSON.parse(savedLastWorkoutData));
    }

    if (savedExtraRows) {
      setExtraRows(JSON.parse(savedExtraRows));
    }

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

  function getExerciseTotals(exercise: string) {
  const rows = getRowsForExercise(exercise);

  return rows.reduce(
    (totals, row, index) => {
      const lastSet = lastWorkoutData[exercise]?.[index] ?? {
        weight: 0,
        reps: 0,
      };

      const weightKey = `${exercise}-${row.id}-weight`;
      const repsKey = `${exercise}-${row.id}-reps`;

      const todayWeight = Number(entries[weightKey]) || 0;
      const todayReps = Number(entries[repsKey]) || 0;

      totals.todayWeight += todayWeight * todayReps;
      totals.todayReps += todayReps;

      totals.lastWeight += (lastSet.weight || 0) * (lastSet.reps || 0);
      totals.lastReps += lastSet.reps || 0;

      return totals;
    },
    {
      todayWeight: 0,
      todayReps: 0,
      lastWeight: 0,
      lastReps: 0,
    }
  );
}

  function updateEntry(
    key: string,
    value: string,
    exercise: string,
    rowIndex: number,
    field: "weight" | "reps"
  ) {
    setEntries((previous) => ({
      ...previous,
      [key]: value,
    }));

    setSuggestions((previous) => {
      const updated = { ...previous };
      delete updated[key];

      const nextRow = getRowsForExercise(exercise)[rowIndex + 1];

      if (value.trim() !== "" && nextRow) {
        const nextKey = `${exercise}-${nextRow.id}-${field}`;
        updated[nextKey] = value;
      }

      return updated;
    });
  }

  function acceptSuggestion(
  key: string,
  exercise: string,
  rowIndex: number,
  field: "weight" | "reps"
) {
  const suggestedValue = suggestions[key];

  if (!suggestedValue) return;

  const nextRow = getRowsForExercise(exercise)[rowIndex + 1];

  setEntries((previous) => ({
    ...previous,
    [key]: suggestedValue,
  }));

  setSuggestions((previous) => {
    const updated = { ...previous };
    delete updated[key];

    if (nextRow) {
      const nextKey = `${exercise}-${nextRow.id}-${field}`;
      updated[nextKey] = suggestedValue;
    }

    return updated;
  });
}

  function clearSuggestion(key: string) {
    setSuggestions((previous) => {
      const updated = { ...previous };
      delete updated[key];
      return updated;
    });
  }

  function startTimer(timerKey: string, seconds: number) {
    setTimers((previous) => ({
      ...previous,
      [timerKey]: seconds,
    }));
  }

  function addAdditionalSet(exercise: string) {
    const currentRows = getRowsForExercise(exercise);
    const nextSetNumber =
      currentRows.filter((row) => row.type === "normal").length + 1;

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

        if (row.type === "burnout") {
          return {
            weight: 0,
            reps:
              enteredReps && Number(enteredReps) > 0
                ? Number(enteredReps)
                : previousSet.reps,
          };
        }

        return {
          weight:
            enteredWeight && Number(enteredWeight) > 0
              ? Number(enteredWeight)
              : previousSet.weight,
          reps:
            enteredReps && Number(enteredReps) > 0
              ? Number(enteredReps)
              : previousSet.reps,
        };
      });
    });

    setLastWorkoutData(updatedLastData);
    setEntries({});
    setSuggestions({});
    setExtraRows({});
    setWorkoutDate(getToday());
  }

  function renderInput(
    key: string,
    value: string,
    lastValue: number,
    exercise: string,
    rowIndex: number,
    field: "weight" | "reps"
  ) {
    return (
      <div className="relative">
        <input
          inputMode="numeric"
          placeholder={suggestions[key] ?? "0"}
          value={value}
          onFocus={() => clearSuggestion(key)}
          onChange={(e) =>
            updateEntry(key, e.target.value, exercise, rowIndex, field)
          }
          className={`w-full rounded-lg p-2 text-center ${getInputClass(
            value,
            lastValue
          )}`}
        />

        {suggestions[key] && value === "" && (
          <button
            onMouseDown={(e) => {
              e.preventDefault();
              acceptSuggestion(key, exercise, rowIndex, field);
            }}
            className="absolute -right-2 -top-2 h-6 w-6 rounded-full bg-green-400 text-sm font-bold text-black"
          >
            ✓
          </button>
        )}
      </div>
    );
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
        const totals = getExerciseTotals(exercise);

        return (
          <section key={exercise} className="bg-gray-800 rounded-xl p-4 mb-5">
            <h2 className="text-center text-2xl font-semibold mb-4">
              {exercise}
            </h2>

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
                      {renderInput(
                        weightKey,
                        entries[weightKey] ?? "",
                        lastSet.weight,
                        exercise,
                        index,
                        "weight"
                      )}

                      <div className="text-center text-gray-400">
                        {lastSet.weight}
                      </div>
                    </>
                  )}

                  {renderInput(
                    repsKey,
                    entries[repsKey] ?? "",
                    lastSet.reps,
                    exercise,
                    index,
                    "reps"
                  )}

                  <div className="text-center text-gray-400">{lastSet.reps}</div>
                </div>
              );
            })}

            <div className="mt-4 grid grid-cols-[1.2fr_1fr_1fr_1fr_1fr] gap-2 items-center">
              <div className="flex gap-2">
                <button
                  onClick={() => addAdditionalSet(exercise)}
                  className="h-10 w-10 rounded-full bg-purple-500 text-sm font-bold text-black shadow-lg"
                >
                  AS
                </button>

                <button
                  onClick={() => addBurnoutSet(exercise)}
                  className="h-10 w-10 rounded-full bg-orange-400 text-sm font-bold text-black shadow-lg"
                >
                  DS
                </button>
              </div>

              <div className="rounded-lg bg-gray-700 p-2 text-center font-bold">
                {totals.todayWeight}
              </div>

              <div className="rounded-lg bg-gray-700 p-2 text-center font-bold text-gray-300">
                {totals.lastWeight}
              </div>

              <div className="rounded-lg bg-gray-700 p-2 text-center font-bold">
                {totals.todayReps}
              </div>

              <div className="rounded-lg bg-gray-700 p-2 text-center font-bold text-gray-300">
                {totals.lastReps}
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                onClick={() => startTimer(`${exercise}-90`, 90)}
                className="rounded-lg bg-blue-500 p-3 text-3xl font-black text-black"
              >
                {timers[`${exercise}-90`] && timers[`${exercise}-90`] > 0
                  ? timers[`${exercise}-90`]
                  : "90"}
              </button>

              <button
                onClick={() => startTimer(`${exercise}-120`, 120)}
                className="rounded-lg bg-blue-500 p-3 text-3xl font-black text-black"
              >
                {timers[`${exercise}-120`] && timers[`${exercise}-120`] > 0
                  ? timers[`${exercise}-120`]
                  : "120"}
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