
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
