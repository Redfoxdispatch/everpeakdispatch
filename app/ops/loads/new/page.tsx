import { redirect } from "next/navigation";
import { db } from "@/lib/db/client";
import { getCurrentUser } from "@/lib/auth/session";
import { can } from "@/lib/permissions/can";
import { NewLoadForm } from "./load-form";

export default async function NewLoadPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!(await can(user, "loads:create"))) redirect("/ops/dashboard");

  const [shippers, equipmentTypes] = await Promise.all([
    db.company.findMany({
      where: { type: "shipper", status: "active" },
      select: { id: true, legalName: true, dbaName: true },
      orderBy: { legalName: "asc" },
    }),
    db.equipmentType.findMany({ where: { active: true }, orderBy: { label: "asc" } }),
  ]);

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-semibold">New load</h1>
      <p className="mt-1 text-sm text-muted-foreground">Create a load manually on behalf of a shipper.</p>
      <div className="mt-6">
        <NewLoadForm shippers={shippers} equipmentTypes={equipmentTypes} />
      </div>
    </div>
  );
}
