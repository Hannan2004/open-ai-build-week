import { currentUser } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

const DEMO_HOUSEHOLD_ID = "10000000-0000-0000-0000-000000000001";

export async function getCurrentHouseholdContext() {
  const user = await currentUser();

  if (!user) {
    throw new Error("You must be signed in to access household data.");
  }

  const email = user.primaryEmailAddress?.emailAddress;
  const fullName =
    [user.firstName, user.lastName].filter(Boolean).join(" ") ||
    email ||
    "Household member";

  if (!email) {
    throw new Error("Your Clerk account does not have a primary email address.");
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .upsert(
      {
        clerk_user_id: user.id,
        email,
        full_name: fullName,
      },
      { onConflict: "clerk_user_id" },
    )
    .select("id, clerk_user_id, email, full_name")
    .single();

  if (profileError || !profile) {
    throw new Error(profileError?.message || "Unable to load your profile.");
  }

  const membershipResult = await supabaseAdmin
    .from("household_members")
    .select("id, household_id, profile_id, name, role, color, preferences")
    .eq("profile_id", profile.id)
    .limit(1)
    .maybeSingle();

  let membership = membershipResult.data;
  const membershipError = membershipResult.error;

  if (membershipError) {
    throw new Error(membershipError.message);
  }

  if (!membership) {
    const { data: newMembership, error: createMembershipError } =
      await supabaseAdmin
        .from("household_members")
        .insert({
          household_id: DEMO_HOUSEHOLD_ID,
          profile_id: profile.id,
          name: fullName,
          role: "Household member",
          color: "#0f766e",
          preferences: {},
        })
        .select(
          "id, household_id, profile_id, name, role, color, preferences",
        )
        .single();

    if (createMembershipError || !newMembership) {
      throw new Error(
        createMembershipError?.message ||
          "Unable to create your household membership.",
      );
    }

    membership = newMembership;
  }

  const { data: household, error: householdError } = await supabaseAdmin
    .from("households")
    .select("id, name, created_at")
    .eq("id", membership.household_id)
    .single();

  if (householdError || !household) {
    throw new Error(
      householdError?.message || "Unable to load your household.",
    );
  }

  return {
    user,
    profile,
    membership,
    household,
    householdId: household.id,
  };
}
