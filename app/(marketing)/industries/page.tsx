import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const INDUSTRIES = [
  {
    title: "Food & Beverage",
    description: "Temperature-controlled and dry freight moved on tight delivery windows.",
  },
  {
    title: "Retail & Consumer Goods",
    description: "Reliable capacity for replenishment and seasonal volume swings.",
  },
  {
    title: "Manufacturing",
    description: "Inbound raw materials and outbound finished goods, scheduled around production.",
  },
  {
    title: "Industrial & Building Materials",
    description: "Flatbed and heavy-haul capacity for construction and industrial supply chains.",
  },
];

export default function IndustriesPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Industries we serve</h1>
      <p className="mt-4 max-w-2xl text-muted-foreground">
        We work across a range of verticals, each with its own service and compliance
        requirements.
      </p>
      <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2">
        {INDUSTRIES.map((industry) => (
          <Card key={industry.title}>
            <CardHeader>
              <CardTitle>{industry.title}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {industry.description}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
