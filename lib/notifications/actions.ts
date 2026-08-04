"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db/client";
import { getCurrentUser } from "@/lib/auth/session";

export async function markNotificationRead(notificationId: string): Promise<{ error?: string }> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const notification = await db.notification.findUnique({ where: { id: notificationId }, select: { userId: true } });
  if (!notification || notification.userId !== user.id) return { error: "Notification not found." };

  await db.notification.update({ where: { id: notificationId }, data: { readAt: new Date() } });
  return {};
}

export async function markAllNotificationsRead(): Promise<{ error?: string }> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  await db.notification.updateMany({ where: { userId: user.id, readAt: null }, data: { readAt: new Date() } });
  return {};
}
