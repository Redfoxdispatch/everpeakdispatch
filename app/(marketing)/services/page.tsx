import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const SERVICES = [
  {
    title: "Full Truckload (FTL)",
    description:
      "Dry van, refrigerated, flatbed, and specialized equipment for dedicated single-shipper loads coast to coast.",
  },
  {
    title: "Less Than Truckload (LTL)",
    description:
      "Cost-effective shared-trailer capacity for smaller shipments that don't need a full truck.",
  },
  {
    title: "Expedited",
    description: "Time-critical freight with guaranteed pickup windows and priority dispatch.",
  },
  {
    title: "Refrigerated (Reefer)",
    description: "Temperature-controlled capacity for perishable and cold-chain freight.",
  },
  {
    title: "Flatbed & Specialized",
    description: "Flatbed, step deck, and power-only for oversized or non-containerized freight.",
  },
  {
    title: "Multi-stop & Partial",
    description: "Multiple pickups or drop-offs on a single load, coordinated end to end.",
  },
];

export default function ServicesPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Services</h1>
      <p className="mt-4 max-w-2xl text-muted-foreground">
        Whatever your freight needs, we have carrier capacity to match.
      </p>
      <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {SERVICES.map((service) => (
          <Card key={service.title}>
            <CardHeader>
              <CardTitle>{service.title}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {service.description}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
