import { Truck, Package, Zap, Snowflake, Layers, MapPinned } from "lucide-react";
import { PageHero } from "@/components/shared/page-hero";
import { RevealGroup, RevealItem } from "@/components/shared/motion";
import { InteractiveCard } from "@/components/shared/interactive-card";
import { MARKETING_IMAGES } from "@/lib/marketing/images";

const SERVICES = [
  {
    icon: Truck,
    title: "Full Truckload (FTL)",
    description:
      "Dry van, refrigerated, flatbed, and specialized equipment for dedicated single-shipper loads coast to coast.",
  },
  {
    icon: Package,
    title: "Less Than Truckload (LTL)",
    description: "Cost-effective shared-trailer capacity for smaller shipments that don't need a full truck.",
  },
  {
    icon: Zap,
    title: "Expedited",
    description: "Time-critical freight with guaranteed pickup windows and priority dispatch.",
  },
  {
    icon: Snowflake,
    title: "Refrigerated (Reefer)",
    description: "Temperature-controlled capacity for perishable and cold-chain freight.",
  },
  {
    icon: Layers,
    title: "Flatbed & Specialized",
    description: "Flatbed, step deck, and power-only for oversized or non-containerized freight.",
  },
  {
    icon: MapPinned,
    title: "Multi-stop & Partial",
    description: "Multiple pickups or drop-offs on a single load, coordinated end to end.",
  },
];

export default function ServicesPage() {
  return (
    <div>
      <PageHero
        eyebrow="What we move"
        title="Whatever your freight needs, we have capacity to match."
        image={MARKETING_IMAGES.containerWall.src}
        alt={MARKETING_IMAGES.containerWall.alt}
      />

      <section className="bg-white">
        <RevealGroup className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-6 py-28 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((service, i) => (
            <RevealItem key={service.title}>
              <InteractiveCard
                icon={<service.icon className="size-6 text-brand-gold-600" strokeWidth={1.5} />}
                index={i}
                title={service.title}
                description={service.description}
              />
            </RevealItem>
          ))}
        </RevealGroup>
      </section>
    </div>
  );
}
