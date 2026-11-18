
import { supabase } from "./supabase";

export type CloudWorkoutState = {
  day: string;
  date: string;
  lastOrders: Record<string, string[]>;
  history: Record<string, { weight: number; reps: number }[]>;
  orders: Record<string, string[]>;
  modes: Record<string, string>;
  entries: Record<string, string>;
};

export async function loadCloudWorkoutState() {
  const { data: userData, error: userError } =
    await supabase.auth.getUser();

  if (userError || !userData.user) {
    throw new Error("Please sign in to Gym Log first.");
  }

  const { data, error } = await supabase
    .from("user_workout_state")
    .select("state, updated_at")
    .eq("user_id", userData.user.id)
    .maybeSingle();

  if (error) throw error;

   return data;
}

export type CompletedWorkoutHistory = {
  workoutType: string;
  workoutDate: string;
  sets: CompletedWorkoutSet[];
};

export async function loadLatestCompletedWorkouts():
  Promise<CompletedWorkoutHistory[]> {
  const { data: userData, error: userError } =
    await supabase.auth.getUser();

  if (userError || !userData.user) {
    throw new Error("Please sign in to Gym Log first.");
  }

  const { data: sessions, error: sessionsError } =
    await supabase
      .from("workout_sessions")
      .select("id, workout_type, workout_date, completed_at")
      .eq("user_id", userData.user.id)
      .order("completed_at", { ascending: false });

  if (sessionsError) throw sessionsError;

  const latest = new Map<string, typeof sessions[number]>();

  for (const session of sessions ?? []) {
    if (!latest.has(session.workout_type)) {
      latest.set(session.workout_type, session);
    }
  }

  const results: CompletedWorkoutHistory[] = [];

  for (const session of latest.values()) {
    const { data: sets, error: setsError } = await supabase
      .from("workout_sets")
      .select(
        "exercise_id, exercise_name, exercise_order, set_number, weight, reps, volume"
      )
      .eq("session_id", session.id)
      .order("exercise_order", { ascending: true })
      .order("set_number", { ascending: true });

    if (setsError) throw setsError;

    results.push({
      workoutType: session.workout_type,
      workoutDate: session.workout_date,
      sets: (sets ?? []).map((set) => ({
        exercise_id: set.exercise_id,
        exercise_name: set.exercise_name,
        exercise_order: set.exercise_order,
        set_number: set.set_number,
        weight: Number(set.weight),
        reps: Number(set.reps),
        volume: Number(set.volume),
      })),
    });
  }

  return results;
}


export async function saveCloudWorkoutState(
  state: CloudWorkoutState
) {
  const { data: userData, error: userError } =
    await supabase.auth.getUser();

  if (userError || !userData.user) {
    throw new Error("Please sign in to Gym Log first.");
  }

  const { error } = await supabase
    .from("user_workout_state")
    .upsert({
      user_id: userData.user.id,
      state,
      updated_at: new Date().toISOString(),
    });

  if (error) throw error;
}


export async function createWorkoutSession(
  workoutType: string,
  workoutDate: string
): Promise<string> {
  const { data: userData, error: userError } =
    await supabase.auth.getUser();

  if (userError || !userData.user) {
    throw new Error("Please sign in to save your workout.");
  }

  const { data, error } = await supabase
    .from("workout_sessions")
    .insert({
      user_id: userData.user.id,
      workout_type: workoutType,
      workout_date: workoutDate,
      completed_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error) throw error;

  return data.id;
}

export type CompletedWorkoutSet = {
  exercise_id: string;
  exercise_name: string;
  exercise_order: number;
  set_number: number;
  weight: number;
  reps: number;
  volume: number;
};

export async function saveCompletedWorkoutSets(
  sessionId: string,
  sets: CompletedWorkoutSet[]
): Promise<void> {
  const { data: userData, error: userError } =
    await supabase.auth.getUser();

  if (userError || !userData.user) {
    throw new Error("Please sign in to save your workout.");
  }

  if (sets.length === 0) {
    throw new Error("No completed sets to save.");
  }

  const rows = sets.map(
  ({ volume: _volume, ...set }) => ({
    user_id: userData.user.id,
    session_id: sessionId,
    ...set,
  })
);

  const { error } = await supabase
    .from("workout_sets")
    .insert(rows);

  if (error) throw error;
}

export async function deleteIncompleteWorkoutSession(
  sessionId: string
): Promise<void> {
  const { data: userData, error: userError } =
    await supabase.auth.getUser();

  if (userError || !userData.user) {
    throw new Error("Please sign in to Gym Log first.");
  }

  const { error } = await supabase
    .from("workout_sessions")
    .delete()
    .eq("id", sessionId)
    .eq("user_id", userData.user.id);

  if (error) throw error;
}

export async function saveCompleteWorkout(
  sessionId: string,
  workoutType: string,
  workoutDate: string,
  sets: CompletedWorkoutSet[]
): Promise<string> {
  const { data: userData, error: userError } =
    await supabase.auth.getUser();

  if (userError || !userData.user) {
    throw new Error("Please sign in to save your workout.");
  }

  if (sets.length === 0) {
    throw new Error("No completed sets to save.");
  }

  const { data, error } = await supabase.rpc(
    "save_completed_workout",
    {
      p_session_id: sessionId,
      p_workout_type: workoutType,
      p_workout_date: workoutDate,
      p_sets: sets.map(
        ({ volume: _volume, ...set }) => set
      ),
    }
  );

  if (error) throw error;

  return data as string;
}