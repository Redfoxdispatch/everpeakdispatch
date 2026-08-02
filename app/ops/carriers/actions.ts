"use server";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { approveCompany, rejectCompany, type ApprovalResult } from "@/lib/companies/approval";

export async function approveCarrierCompany(companyId: string): Promise<ApprovalResult> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return approveCompany(user, companyId, "carrier", "/ops/carriers");
}

export async function rejectCarrierCompany(companyId: string, reason: string): Promise<ApprovalResult> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return rejectCompany(user, companyId, "carrier", reason, "/ops/carriers");
}
