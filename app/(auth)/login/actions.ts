"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db/client";
import { loginSchema } from "@/lib/validations/auth";
import { homePathForRole, type RoleName } from "@/lib/auth/roles";

export type LoginState = { error?: string };

export async function login(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error || !data.user) {
    return { error: "Invalid email or password" };
  }

  const profile = await db.profile.findUnique({
    where: { id: data.user.id },
    include: { role: true },
  });

  if (!profile) {
    await supabase.auth.signOut();
    return { error: "This account has no portal access yet. Contact an administrator." };
  }

  if (profile.status === "suspended") {
    await supabase.auth.signOut();
    return { error: "This account has been suspended. Contact an administrator." };
  }

  await db.profile.update({
    where: { id: profile.id },
    data: { lastLoginAt: new Date(), status: profile.status === "invited" ? "active" : profile.status },
  });

  redirect(homePathForRole(profile.role.name as RoleName));
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
