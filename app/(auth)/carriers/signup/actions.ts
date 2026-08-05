"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db/client";
import { createAdminClient } from "@/lib/supabase/admin";
import { createProfileForUser } from "@/lib/auth/create-profile";
import { writeAuditLog } from "@/lib/audit/log";
import { carrierSignupSchema } from "@/lib/validations/marketing";
import { checkRateLimit, clientIp, rateLimitErrorMessage } from "@/lib/rate-limit/check";

export type CarrierSignupState = { error?: string };

export async function signupCarrier(
  _prevState: CarrierSignupState,
  formData: FormData,
): Promise<CarrierSignupState> {
  const { allowed, retryAfterSeconds } = await checkRateLimit(`signup:${await clientIp()}`, { max: 5, windowSeconds: 600 });
  if (!allowed) return { error: rateLimitErrorMessage(retryAfterSeconds) };

  const parsed = carrierSignupSchema.safeParse({
    companyName: formData.get("companyName"),
    mcNumber: formData.get("mcNumber"),
    dotNumber: formData.get("dotNumber"),
    insuranceExpiryDate: formData.get("insuranceExpiryDate"),
    equipmentTypes: formData.getAll("equipmentTypes"),
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const {
    companyName,
    mcNumber,
    dotNumber,
    insuranceExpiryDate,
    equipmentTypes,
    fullName,
    email,
    phone,
    password,
  } = parsed.data;

  const role = await db.role.findUnique({ where: { name: "carrier_user" } });
  if (!role) {
    return { error: "Signup is temporarily unavailable. Please try again later." };
  }

  const existingCarrier = await db.carrierProfile.findFirst({
    where: { OR: [{ mcNumber }, { dotNumber }] },
  });
  if (existingCarrier) {
    return { error: "A carrier with this MC or DOT number is already registered." };
  }

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

  let company;
  try {
    company = await db.company.create({
      data: {
        type: "carrier",
        legalName: companyName,
        status: "pending",
        carrierProfile: {
          create: {
            mcNumber,
            dotNumber,
            authorityType: "common",
            insuranceExpiryDate: new Date(insuranceExpiryDate),
            equipmentTypes,
          },
        },
      },
    });
  } catch {
    // Most likely a race on the MC/DOT uniqueness check above. Don't leave
    // an orphaned auth user with no company/profile behind.
    await admin.auth.admin.deleteUser(authData.user.id);
    return { error: "A carrier with this MC or DOT number is already registered." };
  }

  const profile = await createProfileForUser({
    userId: authData.user.id,
    companyId: company.id,
    roleId: role.id,
    roleName: "carrier_user",
    fullName,
    phone: phone || undefined,
  });

  await writeAuditLog({
    actorUserId: profile.id,
    action: "carrier.signup",
    entityType: "companies",
    entityId: company.id,
    after: { legalName: companyName, mcNumber, dotNumber, status: "pending" },
  });

  redirect("/carriers/signup/thanks");
}
