"use server";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { approveCompany, rejectCompany, type ApprovalResult } from "@/lib/companies/approval";

export async function approveShipperCompany(companyId: string): Promise<ApprovalResult> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return approveCompany(user, companyId, "shipper", "/ops/shippers");
}

export async function rejectShipperCompany(companyId: string, reason: string): Promise<ApprovalResult> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return rejectCompany(user, companyId, "shipper", reason, "/ops/shippers");
}
