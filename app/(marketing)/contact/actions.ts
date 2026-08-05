"use server";

import { db } from "@/lib/db/client";
import { writeAuditLog } from "@/lib/audit/log";
import { contactSchema } from "@/lib/validations/marketing";
import { checkRateLimit, clientIp, rateLimitErrorMessage } from "@/lib/rate-limit/check";

export type ContactState = { error?: string; success?: boolean };

/**
 * No transactional email provider is wired up yet (that's Phase 7 —
 * Notifications). For now, a contact submission creates an in-app
 * notification for every internal admin, visible next time they log in.
 */
export async function submitContact(
  _prevState: ContactState,
  formData: FormData,
): Promise<ContactState> {
  const { allowed, retryAfterSeconds } = await checkRateLimit(`contact:${await clientIp()}`, { max: 5, windowSeconds: 600 });
  if (!allowed) return { error: rateLimitErrorMessage(retryAfterSeconds) };

  const parsed = contactSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    company: formData.get("company"),
    message: formData.get("message"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { fullName, email, phone, company, message } = parsed.data;

  const admins = await db.profile.findMany({
    where: { role: { name: { in: ["super_admin", "brokerage_admin"] } }, status: "active" },
    select: { id: true },
  });

  if (admins.length === 0) {
    return { error: "Unable to submit right now. Please try again later." };
  }

  const title = `New contact inquiry from ${fullName}`;
  const body = [
    `Email: ${email}`,
    phone ? `Phone: ${phone}` : null,
    company ? `Company: ${company}` : null,
    "",
    message,
  ]
    .filter(Boolean)
    .join("\n");

  const created = await db.notification.createManyAndReturn({
    data: admins.map((admin) => ({
      userId: admin.id,
      type: "contact_inquiry",
      title,
      body,
      channel: "in_app" as const,
    })),
  });

  await writeAuditLog({
    actorUserId: null,
    action: "contact.submitted",
    entityType: "notifications",
    entityId: created[0].id,
    after: { fullName, email, company: company || null },
  });

  return { success: true };
}
