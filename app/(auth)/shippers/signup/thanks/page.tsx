import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ShipperSignupThanksPage() {
  return (
    <div className="mx-auto max-w-md px-6 py-16">
      <Card>
        <CardHeader>
          <CardTitle>Application received</CardTitle>
          <CardDescription>
            Thanks for signing up. Our team reviews new shipper accounts before granting portal
            access — you&apos;ll be notified once yours is approved.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" className="w-full" render={<Link href="/login" />} nativeButton={false}>
            Sign in
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
