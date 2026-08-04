import { NextResponse, type NextRequest } from "next/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db/client";
import { getCurrentUser, type CurrentUser } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { DOCUMENTS_BUCKET } from "@/lib/storage/documents";

const SIGNED_URL_TTL_SECONDS = 300; // minutes, not hours — reissued fresh on every click

/**
 * Every download goes through here rather than a public/static URL — see
 * context/04-application-architecture.md §5. Authorization mirrors exactly
 * what each portal's document-list query already filters by, so "can I see
 * it in the list" and "can I open it" never drift apart.
 */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const document = await db.document.findUnique({
    where: { id },
    include: { load: { select: { shipperCompanyId: true } } },
  });
  if (!document) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const authorized = await isAuthorizedToDownload(user, document);
  if (!authorized) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const admin = createAdminClient();
  const { data, error } = await admin.storage.from(DOCUMENTS_BUCKET).createSignedUrl(document.filePath, SIGNED_URL_TTL_SECONDS, {
    download: true,
  });
  if (error || !data) return NextResponse.json({ error: "Could not generate download link" }, { status: 500 });

  return NextResponse.redirect(data.signedUrl);
}

async function isAuthorizedToDownload(
  user: CurrentUser,
  document: { loadId: string | null; ownerCompanyId: string | null; visibility: string; load: { shipperCompanyId: string } | null },
): Promise<boolean> {
  if (user.companyType === "internal") return true;

  if (document.ownerCompanyId === user.companyId) return true;

  if (user.companyType === "shipper") {
    return (
      (document.visibility === "shipper" || document.visibility === "public") &&
      document.load?.shipperCompanyId === user.companyId
    );
  }

  if (user.companyType === "carrier") {
    if (document.visibility !== "carrier" && document.visibility !== "public") return false;
    if (!document.loadId) return false;
    const assignment = await db.carrierAssignment.findFirst({
      where: { loadId: document.loadId, carrierCompanyId: user.companyId, status: "accepted" },
      select: { id: true },
    });
    return assignment !== null;
  }

  return false;
}
