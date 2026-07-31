import { Mail, MapPin, Phone } from "lucide-react";
import { HeroReveal, Reveal } from "@/components/shared/motion";
import { SplitText } from "@/components/shared/split-text";
import { ContactForm } from "./contact-form";

const CONTACT_DETAILS = [
  { icon: Mail, label: "hello@bluepeakdispatch.com" },
  { icon: Phone, label: "+1 (555) 010-2020" },
  { icon: MapPin, label: "Chicago, IL" },
];

export default function ContactPage() {
  return (
    <div className="grid min-h-[85vh] grid-cols-1 lg:grid-cols-2">
      <div className="flex flex-col justify-center bg-brand-navy-950 px-6 pt-32 pb-20 lg:px-16">
        <div className="max-w-md">
          <HeroReveal>
            <span className="text-xs font-medium tracking-[0.15em] text-brand-gold-400 uppercase">
              Get in touch
            </span>
          </HeroReveal>
          <h1 className="mt-4 text-4xl leading-tight font-bold text-white sm:text-5xl">
            <SplitText delay={0.1}>Let&apos;s talk freight.</SplitText>
          </h1>
          <HeroReveal delay={0.4}>
            <p className="mt-6 text-lg text-white/70">
              Whether you&apos;re shipping your first load or your ten-thousandth, our team
              responds fast.
            </p>
          </HeroReveal>
          <HeroReveal delay={0.55}>
            <div className="mt-10 space-y-4">
              {CONTACT_DETAILS.map((detail) => (
                <div key={detail.label} className="flex items-center gap-3 text-white/80">
                  <detail.icon className="size-4 text-brand-gold-400" strokeWidth={1.5} />
                  <span className="text-sm">{detail.label}</span>
                </div>
              ))}
            </div>
          </HeroReveal>
        </div>
      </div>

      <div className="flex items-center justify-center bg-white px-6 pt-32 pb-20 lg:px-16">
        <Reveal className="w-full max-w-md">
          <ContactForm />
        </Reveal>
      </div>
    </div>
  );
}
