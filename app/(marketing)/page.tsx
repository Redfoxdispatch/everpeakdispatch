import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const VALUE_PROPS = [
  {
    title: "Vetted carrier network",
    description:
      "Every carrier we dispatch is checked for active FMCSA authority and current insurance before they touch your freight.",
  },
  {
    title: "One point of contact",
    description:
      "A dedicated broker manages your lane from quote to delivery — no call centers, no hand-offs.",
  },
  {
    title: "Real-time visibility",
    description: "Track pickup, transit, and delivery status without picking up the phone.",
  },
];

const TRUST_SIGNALS = [
  { value: "10,000+", label: "loads dispatched" },
  { value: "98%", label: "on-time delivery" },
  { value: "500+", label: "active carriers" },
];

export default function HomePage() {
  return (
    <div>
      <section className="mx-auto max-w-6xl px-6 py-24 text-center">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          Freight moved right, every time.
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
          BluePeakDispatch is a full-service freight brokerage connecting shippers with vetted
          carriers across full truckload, LTL, and specialized equipment.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button size="lg" render={<Link href="/shippers/signup" />} nativeButton={false}>
            Ship freight
          </Button>
          <Button
            size="lg"
            variant="outline"
            render={<Link href="/carriers/signup" />}
            nativeButton={false}
          >
            Haul freight
          </Button>
        </div>
      </section>

      <section className="border-y bg-muted/20">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-6 py-12 sm:grid-cols-3">
          {TRUST_SIGNALS.map((signal) => (
            <div key={signal.label} className="text-center">
              <div className="text-3xl font-semibold">{signal.value}</div>
              <div className="mt-1 text-sm text-muted-foreground">{signal.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-24">
        <h2 className="text-center text-2xl font-semibold tracking-tight">
          Why shippers work with us
        </h2>
        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {VALUE_PROPS.map((prop) => (
            <Card key={prop.title}>
              <CardHeader>
                <CardTitle>{prop.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {prop.description}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="border-t bg-muted/20">
        <div className="mx-auto max-w-6xl px-6 py-16 text-center">
          <h2 className="text-2xl font-semibold tracking-tight">Ready to move freight?</h2>
          <p className="mt-2 text-muted-foreground">
            Get a quote in minutes, or join our carrier network to see available loads.
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button render={<Link href="/shippers/signup" />} nativeButton={false}>
              Get a quote
            </Button>
            <Button
              variant="outline"
              render={<Link href="/carriers/signup" />}
              nativeButton={false}
            >
              Join our carrier network
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
