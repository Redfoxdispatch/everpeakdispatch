import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { logout } from "@/app/(auth)/login/actions";
import type { CurrentUser } from "@/lib/auth/session";

const STATUS_COPY: Record<CurrentUser["companyStatus"], { title: string; description: string }> = {
  pending: {
    title: "Your account is under review",
    description:
      "Thanks for signing up. Our team reviews every new company before granting portal access — you'll be notified by email once yours is approved.",
  },
  active: { title: "", description: "" }, // unreachable — caller only renders this for non-active
  suspended: {
    title: "This account has been suspended",
    description: "Contact BluePeakDispatch support for more information.",
  },
  archived: {
    title: "This account is no longer active",
    description: "Contact BluePeakDispatch support if you believe this is a mistake.",
  },
};

export function PendingCompanyNotice({ companyStatus }: { companyStatus: CurrentUser["companyStatus"] }) {
  const copy = STATUS_COPY[companyStatus];

  return (
    <div className="flex min-h-svh items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{copy.title}</CardTitle>
          <CardDescription>{copy.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={logout}>
            <Button type="submit" variant="outline" className="w-full">
              Sign out
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
