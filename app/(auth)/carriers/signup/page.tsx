import { db } from "@/lib/db/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CarrierSignupForm } from "./signup-form";

export default async function CarrierSignupPage() {
  const equipmentTypes = await db.equipmentType.findMany({
    where: { active: true },
    orderBy: { label: "asc" },
  });

  return (
    <div className="mx-auto max-w-md px-6 py-16">
      <Card>
        <CardHeader>
          <CardTitle>Haul freight with BluePeakDispatch</CardTitle>
          <CardDescription>
            Tell us about your fleet. Our team verifies your authority and insurance before
            granting portal access.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CarrierSignupForm equipmentTypes={equipmentTypes} />
        </CardContent>
      </Card>
    </div>
  );
}
