"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db/client";
import { createAdminClient } from "@/lib/supabase/admin";
import { createProfileForUser } from "@/lib/auth/create-profile";
import { writeAuditLog } from "@/lib/audit/log";
import { shipperSignupSchema } from "@/lib/validations/marketing";
import { checkRateLimit, clientIp, rateLimitErrorMessage } from "@/lib/rate-limit/check";

export type ShipperSignupState = { error?: string };

export async function signupShipper(
  _prevState: ShipperSignupState,
  formData: FormData,
): Promise<ShipperSignupState> {
  const { allowed, retryAfterSeconds } = await checkRateLimit(`signup:${await clientIp()}`, { max: 5, windowSeconds: 600 });
  if (!allowed) return { error: rateLimitErrorMessage(retryAfterSeconds) };

  const parsed = shipperSignupSchema.safeParse({
    companyName: formData.get("companyName"),
    industry: formData.get("industry"),
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { companyName, industry, fullName, email, phone, password } = parsed.data;

  const role = await db.role.findUnique({ where: { name: "shipper_user" } });
  if (!role) {
    return { error: "Signup is temporarily unavailable. Please try again later." };
  }

  // Create the auth user first so a duplicate email fails fast, before any
  // company/profile rows exist.
  const admin = createAdminClient();
  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authError || !authData.user) {
    if (authError?.code === "email_exists") {
      return { error: "An account with this email already exists." };
    }
    return { error: "Could not create your account. Please try again." };
  }

  const company = await db.company.create({
    data: {
      type: "shipper",
      legalName: companyName,
      status: "pending",
      shipperProfile: { create: { industry: industry || undefined } },
    },
  });

  const profile = await createProfileForUser({
    userId: authData.user.id,
    companyId: company.id,
    roleId: role.id,
    roleName: "shipper_user",
    fullName,
    phone: phone || undefined,
  });

  await writeAuditLog({
    actorUserId: profile.id,
    action: "shipper.signup",
    entityType: "companies",
    entityId: company.id,
    after: { legalName: companyName, status: "pending" },
  });

  redirect("/shippers/signup/thanks");
}
