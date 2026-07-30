import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShipperSignupForm } from "./signup-form";

export default function ShipperSignupPage() {
  return (
    <div className="mx-auto max-w-md px-6 py-16">
      <Card>
        <CardHeader>
          <CardTitle>Ship freight with BluePeakDispatch</CardTitle>
          <CardDescription>
            Tell us about your company. Our team reviews every new account before granting portal
            access.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ShipperSignupForm />
        </CardContent>
      </Card>
    </div>
  );
}
