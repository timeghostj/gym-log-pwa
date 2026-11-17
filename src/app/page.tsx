"use client";

import { useEffect, useState } from "react";

type WorkoutDay = "Push Day" | "Pull Day" | "Leg Day";
type SetData = { weight: number; reps: number };
type Exercise = { id: string; name: string; group: string };
type WorkoutHistory = Record<WorkoutDay, string[]>;
type ExerciseHistory = Record<string, SetData[]>;
type EntryMap = Record<string, string>;

const DAYS: WorkoutDay[] = ["Push Day", "Pull Day", "Leg Day"];
const DEFAULT_EXERCISES: WorkoutHistory = {
  "Push Day": ["db-bench", "db-incline", "db-lateral"],
  "Pull Day": ["lat-pulldown", "one-arm-row", "db-curl", "hammer-curl"],
  "Leg Day": ["db-deadlift", "assisted-lunge", "kb-swing", "leg-extension", "leg-curl"],
};

const LIBRARY: Exercise[] = [
  { id: "bb-bench", name: "Barbell Bench Press", group: "Chest" },
  { id: "db-bench", name: "DB Bench Press", group: "Chest" },
  { id: "db-incline", name: "DB Incline Press", group: "Chest" },
  { id: "smith-bench", name: "Smith Machine Bench Press", group: "Chest" },
  { id: "chest-press", name: "Chest Press Machine", group: "Chest" },
  { id: "chest-press-incline", name: "Chest Press Machine - Incline", group: "Chest" },
  { id: "chest-press-decline", name: "Chest Press Machine - Decline", group: "Chest" },
  { id: "pec-deck", name: "Pec Deck Fly", group: "Chest" },
  { id: "cable-fly", name: "Cable Chest Fly", group: "Chest" },
  { id: "pushup", name: "Push-Up", group: "Chest" },
  { id: "db-shoulder", name: "DB Shoulder Press", group: "Shoulders" },
  { id: "bb-ohp", name: "Barbell Overhead Press", group: "Shoulders" },
  { id: "shoulder-machine", name: "Shoulder Press Machine", group: "Shoulders" },
  { id: "db-lateral", name: "DB Lateral Raise", group: "Shoulders" },
  { id: "cable-lateral", name: "Cable Lateral Raise", group: "Shoulders" },
  { id: "machine-lateral", name: "Machine Lateral Raise", group: "Shoulders" },
  { id: "rear-delt", name: "Reverse Pec Deck", group: "Shoulders" },
  { id: "face-pull", name: "Cable Face Pull", group: "Shoulders" },
  { id: "lat-pulldown", name: "Lat Pull-Down", group: "Back" },
  { id: "pullup", name: "Pull-Up / Assisted Pull-Up", group: "Back" },
  { id: "seated-row", name: "Seated Cable Row", group: "Back" },
  { id: "chest-supported-row", name: "Chest-Supported Row", group: "Back" },
  { id: "one-arm-row", name: "Single Arm BO Row", group: "Back" },
  { id: "bb-row", name: "Barbell Bent-Over Row", group: "Back" },
  { id: "straight-arm", name: "Straight-Arm Pulldown", group: "Back" },
  { id: "db-curl", name: "DB Curl", group: "Biceps" },
  { id: "hammer-curl", name: "DB Hammer Curl", group: "Biceps" },
  { id: "preacher-curl", name: "Preacher Curl", group: "Biceps" },
  { id: "triceps-pushdown", name: "Triceps Cable Pushdown", group: "Triceps" },
  { id: "overhead-triceps", name: "Overhead Cable Triceps Extension", group: "Triceps" },
  { id: "dips", name: "Dip / Assisted Dip", group: "Triceps" },
  { id: "db-deadlift", name: "DB Deadlift", group: "Legs" },
  { id: "rdl", name: "Romanian Deadlift", group: "Legs" },
  { id: "smith-squat", name: "Smith Machine Squat", group: "Legs" },
  { id: "leg-press", name: "Leg Press", group: "Legs" },
  { id: "hack-squat", name: "Hack Squat", group: "Legs" },
  { id: "assisted-lunge", name: "Assisted Lunge", group: "Legs" },
  { id: "walking-lunge", name: "Walking Lunge", group: "Legs" },
  { id: "bulgarian", name: "Bulgarian Split Squat", group: "Legs" },
  { id: "leg-extension", name: "Machine Leg Ext", group: "Legs" },
  { id: "leg-curl", name: "Machine Leg Curl", group: "Legs" },
  { id: "kb-swing", name: "Kettle Bell Swing", group: "Legs" },
  { id: "hip-thrust", name: "Hip Thrust", group: "Legs" },
  { id: "seated-calf", name: "Seated Calf Raise", group: "Calves" },
  { id: "standing-calf", name: "Standing Calf Raise Machine", group: "Calves" },
  { id: "ab-crunch", name: "Abdominal Crunch Machine", group: "Core" },
  { id: "cable-crunch", name: "Cable Crunch", group: "Core" },
  { id: "hanging-knee", name: "Hanging Knee Raise", group: "Core" },
  { id: "roman-chair", name: "Roman Chair Knee Raise", group: "Core" },
  { id: "roman-chair-side-bend", name: "Roman Chair Side Bend", group: "Core" },
];

// Retain names of retired exercises for existing saved workout summaries.
// Their history remains in storage even though they are no longer selectable.
const RETIRED_EXERCISE_NAMES: Record<string, string> = {
  "bb-incline": "Barbell Incline Press",
  "arnold": "Seated Arnold Press",
  "cable-curl": "Cable Biceps Curl",
  "ez-curl": "EZ-Bar Curl",
  "skullcrusher": "Skull Crusher",
  "bb-squat": "Barbell Squat",
  "seated-leg-curl": "Seated Leg Curl",
  "calf-raise": "Calf Raise",
};
const STORE = "gym-log-v2";
const today = () => new Date().toLocaleDateString("en-US");
const blankHistory = (): WorkoutHistory => ({
  "Push Day": [], "Pull Day": [], "Leg Day": [],
});
const exerciseName = (id: string) => LIBRARY.find((item) => item.id === id)?.name ?? RETIRED_EXERCISE_NAMES[id] ?? id;
const number = (value: string | undefined) => Math.max(0, Number(value) || 0);
const inputClass = (value: string, last: number) =>
  value !== "" && number(value) >= last
    ? "bg-green-400 text-black font-bold"
    : "bg-gray-700 text-white";

export default function Home() {
  const [ready, setReady] = useState(false);
  const [day, setDay] = useState<WorkoutDay>("Push Day");
  const [date, setDate] = useState(today());
  const [lastOrders, setLastOrders] = useState<WorkoutHistory>(blankHistory);
  const [history, setHistory] = useState<ExerciseHistory>({});
  const [orders, setOrders] = useState<WorkoutHistory>(blankHistory);
  const [modes, setModes] = useState<Record<WorkoutDay, "choose" | "same" | "freestyle">>({
    "Push Day": "choose", "Pull Day": "choose", "Leg Day": "choose",
  });
  const [entries, setEntries] = useState<EntryMap>({});
  const [suggestions, setSuggestions] = useState<EntryMap>({});
  const [timerEnds, setTimerEnds] = useState<Record<string, number>>({});
  const [clock, setClock] = useState(Date.now());

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORE);
      if (stored) {
        const data = JSON.parse(stored);
        const savedDay = DAYS.includes(data.day) ? data.day as WorkoutDay : "Push Day";
        setDay(savedDay);
        setLastOrders({ ...blankHistory(), ...(data.lastOrders ?? {}) });
        setHistory(data.history ?? {});
        if (data.date === today()) {
          setDate(data.date);
          setOrders({ ...blankHistory(), ...(data.orders ?? {}) });
          setModes({ "Push Day": "choose", "Pull Day": "choose", "Leg Day": "choose", ...(data.modes ?? {}) });
          setEntries(data.entries ?? {});
        }
      } else {
        // One-time import of the old fixed-exercise app's previous set data.
        const old = localStorage.getItem("gym-log-last-data");
        if (old) {
          const parsed = JSON.parse(old) as Record<string, SetData[]>;
          const migrated: ExerciseHistory = {};
          for (const exercise of LIBRARY) {
            if (Array.isArray(parsed[exercise.name])) migrated[exercise.id] = parsed[exercise.name].slice(0, 5);
          }
          setHistory(migrated);
          setLastOrders({ ...DEFAULT_EXERCISES });
        }
      }
    } catch (error) {
      console.error("Could not load saved workout data", error);
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(STORE, JSON.stringify({ day, date, lastOrders, history, orders, modes, entries }));
  }, [ready, day, date, lastOrders, history, orders, modes, entries]);

  useEffect(() => {
    const interval = window.setInterval(() => setClock(Date.now()), 250);
    return () => window.clearInterval(interval);
  }, []);

  function chooseMode(mode: "same" | "freestyle") {
    setModes((previous) => ({ ...previous, [day]: mode }));
    setOrders((previous) => ({
      ...previous,
      [day]: mode === "same" ? lastOrders[day].filter((id) => LIBRARY.some((exercise) => exercise.id === id)) : [],
    }));
    setSuggestions({});
  }

  function changeExercise(index: number, id: string) {
    setOrders((previous) => {
      const updated = [...previous[day]];
      if (index === updated.length) updated.push(id);
      else updated[index] = id;
      return { ...previous, [day]: updated };
    });
    setSuggestions({});
  }

  function removeExercise(index: number) {
    setOrders((previous) => ({
      ...previous,
      [day]: previous[day].filter((_, position) => position !== index),
    }));
    setSuggestions({});
  }

  function moveExercise(index: number, direction: -1 | 1) {
    setOrders((previous) => {
      const updated = [...previous[day]];
      const target = index + direction;
      if (target < 0 || target >= updated.length) return previous;
      [updated[index], updated[target]] = [updated[target], updated[index]];
      return { ...previous, [day]: updated };
    });
  }

  function updateEntry(key: string, value: string, exerciseId: string, index: number, field: "weight" | "reps") {
    setEntries((previous) => ({ ...previous, [key]: value }));
    setSuggestions((previous) => {
      const updated = { ...previous };
      delete updated[key];
      if (value.trim() !== "" && index < 4) updated[`${day}|${exerciseId}|${index + 1}|${field}`] = value;
      return updated;
    });
  }

  function acceptSuggestion(key: string, exerciseId: string, index: number, field: "weight" | "reps") {
    const value = suggestions[key];
    if (!value) return;
    setEntries((previous) => ({ ...previous, [key]: value }));
    setSuggestions((previous) => {
      const updated = { ...previous };
      delete updated[key];
      if (index < 4) updated[`${day}|${exerciseId}|${index + 1}|${field}`] = value;
      return updated;
    });
  }

  function renderInput(exerciseId: string, index: number, field: "weight" | "reps", last: number) {
    const key = `${day}|${exerciseId}|${index}|${field}`;
    const value = entries[key] ?? "";
    const suggestion = suggestions[key];
    return (
      <div className="relative min-w-0">
        <input
          type="text" inputMode="decimal" pattern="[0-9]*[.,]?[0-9]*"
          value={value} placeholder={suggestion ?? "0"}
          onChange={(event) => updateEntry(key, event.target.value, exerciseId, index, field)}
          className={`w-full min-w-0 rounded-lg p-2 text-center ${inputClass(value, last)}`}
        />
        {suggestion && value === "" && (
          <button type="button" aria-label={`Use suggested ${field}`}
            onClick={() => acceptSuggestion(key, exerciseId, index, field)}
            className="absolute -right-1 -top-2 z-10 h-6 w-6 rounded-full bg-green-400 text-sm font-bold text-black">✓</button>
        )}
      </div>
    );
  }

  function secondsRemaining(key: string) {
    return Math.max(0, Math.ceil(((timerEnds[key] ?? 0) - clock) / 1000));
  }

  function completeWorkout() {
    const selected = orders[day];
    if (selected.length === 0) return;
    const updated: ExerciseHistory = { ...history };
    for (const id of selected) {
      updated[id] = Array.from({ length: 5 }, (_, index) => {
        const prior = history[id]?.[index] ?? { weight: 0, reps: 0 };
        const weight = entries[`${day}|${id}|${index}|weight`];
        const reps = entries[`${day}|${id}|${index}|reps`];
        return {
          weight: weight !== undefined && weight !== "" ? number(weight) : prior.weight,
          reps: reps !== undefined && reps !== "" ? number(reps) : prior.reps,
        };
      });
    }
    setHistory(updated);
    setLastOrders((previous) => ({ ...previous, [day]: [...selected] }));
    setOrders((previous) => ({ ...previous, [day]: [] }));
    setModes((previous) => ({ ...previous, [day]: "choose" }));
    setEntries((previous) => Object.fromEntries(Object.entries(previous).filter(([key]) => !key.startsWith(`${day}|`))));
    setSuggestions({});
    setTimerEnds({});
    setDate(today());
    window.alert("Workout saved! Your exercise order and set results are ready for next time.");
  }

  if (!ready) return <main className="min-h-screen bg-gray-900 p-4 text-white">Loading workout...</main>;

  const currentOrder = orders[day];
  const currentMode = modes[day];
  const availableExercises = LIBRARY.filter((exercise) => !currentOrder.includes(exercise.id));
  const groups = [...new Set(LIBRARY.map((exercise) => exercise.group))];

  function exercisePicker(index: number, currentId = "") {
    return (
      <select
        value={currentId}
        onChange={(event) => changeExercise(index, event.target.value)}
        className="w-full min-w-0 rounded-lg bg-gray-700 p-3 text-base text-white"
      >
        <option value="" disabled>Choose an exercise...</option>
        {groups.map((group) => (
          <optgroup key={group} label={group}>
            {LIBRARY.filter((exercise) => exercise.group === group && (exercise.id === currentId || availableExercises.includes(exercise))).map((exercise) => (
              <option key={exercise.id} value={exercise.id}>{exercise.name}</option>
            ))}
          </optgroup>
        ))}
      </select>
    );
  }

  return (
    <main className="min-h-screen bg-gray-900 p-4 pb-12 text-white">
      <div className="mb-5 text-center">
        <select value={day} onChange={(event) => setDay(event.target.value as WorkoutDay)}
          className="mb-3 rounded-lg bg-gray-800 p-3 text-center text-2xl font-bold text-white">
          {DAYS.map((option) => <option key={option}>{option}</option>)}
        </select>
        <div>
          <input type="text" value={date} onChange={(event) => setDate(event.target.value)}
            className="rounded-lg bg-gray-800 p-3 text-center text-gray-200" />
        </div>
      </div>

      <section className="mb-5 rounded-xl bg-gray-800 p-4">
        <h2 className="mb-2 text-lg font-bold">Previous {day} Workout</h2>
        {lastOrders[day].length ? (
          <div className="mb-4 grid grid-cols-2 gap-x-4 text-sm text-gray-200">
            {[0, 1].map((column) => {
              const split = Math.ceil(lastOrders[day].length / 2);
              return (
                <div key={column} className="flex min-w-0 flex-col gap-3">
                  {lastOrders[day].slice(column * split, (column + 1) * split).map((id, index) => (
                    <div key={`${id}-${column * split + index}`} className="flex min-w-0 items-start gap-2">
                      <span className="shrink-0 text-xs text-gray-400">{column * split + index + 1}.</span>
                      <span className="min-w-0 break-words leading-snug">{exerciseName(id)}</span>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        ) : <p className="mb-4 text-sm text-gray-400">No saved exercise order yet.</p>}
        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={() => chooseMode("same")}
            disabled={lastOrders[day].length === 0}
            className={`rounded-lg p-3 font-bold disabled:opacity-40 ${currentMode === "same" ? "bg-green-500 text-black" : "bg-gray-700"}`}>
            Keep the Same
          </button>
          <button type="button" onClick={() => chooseMode("freestyle")}
            className={`rounded-lg p-3 font-bold ${currentMode === "freestyle" ? "bg-green-500 text-black" : "bg-gray-700"}`}>
            Freestyle
          </button>
        </div>
      </section>

      {currentMode === "choose" && <p className="text-center text-gray-400">Choose how you'd like to start today's workout.</p>}

      {currentMode !== "choose" && (
        <>
          {currentOrder.map((id, position) => {
            const lastSets = history[id] ?? [];
            const totals = Array.from({ length: 5 }, (_, index) => {
              const prior = lastSets[index] ?? { weight: 0, reps: 0 };
              const weight = number(entries[`${day}|${id}|${index}|weight`]);
              const reps = number(entries[`${day}|${id}|${index}|reps`]);
              return { prior, weight, reps };
            }).reduce((sum, row) => ({
              todayVolume: sum.todayVolume + row.weight * row.reps,
              lastVolume: sum.lastVolume + row.prior.weight * row.prior.reps,
              todayReps: sum.todayReps + row.reps,
              lastReps: sum.lastReps + row.prior.reps,
            }), { todayVolume: 0, lastVolume: 0, todayReps: 0, lastReps: 0 });

            return (
              <section key={`${day}-${id}`} className="mb-5 rounded-xl bg-gray-800 p-4">
                <h2 className="mb-3 text-center text-xl font-semibold">{exerciseName(id)}</h2>
                {currentMode === "freestyle" && (
                  <div className="mb-4 flex items-center gap-2">
                    <div className="min-w-0 flex-1">{exercisePicker(position, id)}</div>
                    <button type="button" aria-label="Move exercise up" disabled={position === 0}
                      onClick={() => moveExercise(position, -1)} className="rounded bg-gray-700 px-2 py-3 disabled:opacity-30">{"\u2191"}</button>
                    <button type="button" aria-label="Move exercise down" disabled={position === currentOrder.length - 1}
                      onClick={() => moveExercise(position, 1)} className="rounded bg-gray-700 px-2 py-3 disabled:opacity-30">{"\u2193"}</button>
                    <button type="button" aria-label="Remove exercise" onClick={() => removeExercise(position)}
                      className="rounded bg-red-800 px-2 py-3">{"\u00d7"}</button>
                  </div>
                )}
                <div className="mb-2 grid grid-cols-[1.1fr_1fr_1fr_1fr_1fr] gap-2 text-center text-xs font-bold text-gray-300">
                  <div /><div>Weight</div><div>Last</div><div>Reps</div><div>Last</div>
                </div>
                {Array.from({ length: 5 }, (_, index) => {
                  const prior = lastSets[index] ?? { weight: 0, reps: 0 };
                  return (
                    <div key={index} className="mb-2 grid grid-cols-[1.1fr_1fr_1fr_1fr_1fr] items-center gap-2">
                      <div className="text-sm text-gray-200">Set {index + 1}</div>
                      {renderInput(id, index, "weight", prior.weight)}
                      <div className="text-center text-gray-400">{prior.weight}</div>
                      {renderInput(id, index, "reps", prior.reps)}
                      <div className="text-center text-gray-400">{prior.reps}</div>
                    </div>
                  );
                })}
                <div className="mt-4 grid grid-cols-[1.1fr_1fr_1fr_1fr_1fr] items-center gap-2 text-center">
                  <div className="text-xs font-semibold text-gray-300">Totals</div>
                  <div className="rounded-lg bg-gray-700 px-1 py-3 font-bold">{totals.todayVolume}</div>
                  <div className="rounded-lg bg-gray-700 px-1 py-3 font-bold text-gray-300">{totals.lastVolume}</div>
                  <div className="rounded-lg bg-gray-700 px-1 py-3 font-bold">{totals.todayReps}</div>
                  <div className="rounded-lg bg-gray-700 px-1 py-3 font-bold text-gray-300">{totals.lastReps}</div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {[90, 120].map((seconds) => {
                    const key = `${day}|${id}|${seconds}`;
                    return (
                      <button type="button" key={seconds}
                        onClick={() => setTimerEnds((previous) => ({ ...previous, [key]: Date.now() + seconds * 1000 }))}
                        className="rounded-lg bg-blue-500 p-3 text-3xl font-black text-black">
                        {secondsRemaining(key) || seconds}
                      </button>
                    );
                  })}
                </div>
              </section>
            );
          })}

          {currentMode === "freestyle" && availableExercises.length > 0 && (
            <section className="mb-5 rounded-xl bg-gray-800 p-4">
              <h2 className="mb-3 text-center text-lg font-semibold">{currentOrder.length ? "Add Next Exercise" : "Choose First Exercise"}</h2>
              {exercisePicker(currentOrder.length)}
            </section>
          )}
          {currentOrder.length > 0 && (
            <button type="button" onClick={completeWorkout}
              className="w-full rounded-xl bg-green-500 p-4 text-xl font-bold text-black">Complete Workout</button>
          )}
        </>
      )}
    </main>
  );
}
