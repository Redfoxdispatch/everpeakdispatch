import { Mail, MapPin, Phone } from "lucide-react";
import { HeroReveal, Reveal } from "@/components/shared/motion";
import { SplitText } from "@/components/shared/split-text";
import { FaqAccordion } from "@/components/shared/faq-accordion";
import { ContactForm } from "./contact-form";

const CONTACT_DETAILS = [
  { icon: Mail, label: "hello@everpeakdispatch.com" },
  { icon: Phone, label: "+1 (555) 010-2020" },
  { icon: MapPin, label: "Chicago, IL" },
];

const CONTACT_FAQ = [
  {
    question: "How fast will I hear back?",
    answer: "Same business day for quote requests. General inquiries typically get a response within a few hours.",
  },
  {
    question: "Do I need an account to get a quote?",
    answer: "No — send us your lane and freight details and we'll quote it. An account is only needed once you're ready to book.",
  },
  {
    question: "How do I check on an existing shipment?",
    answer: "Sign in to your shipper or carrier portal for real-time status, or reach out to your dedicated broker directly.",
  },
  {
    question: "How do I apply as a carrier?",
    answer: "Use the carrier sign-up form — we'll verify your authority and insurance and get you moving loads once approved.",
  },
];

export default function ContactPage() {
  return (
    <div>
      <div className="grid min-h-svh grid-cols-1 lg:grid-cols-2">
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

      {/* FAQ — contact/support-specific questions. */}
      <section className="border-t border-brand-navy-100 bg-white">
        <div className="mx-auto max-w-3xl px-6 py-28">
          <Reveal className="text-center">
            <span className="text-xs font-medium tracking-[0.15em] text-brand-gold-600 uppercase">
              Before you reach out
            </span>
            <h2 className="mt-3 text-[clamp(2.25rem,3vw,3rem)] leading-[1.15] font-semibold text-brand-ink">
              Frequently asked.
            </h2>
          </Reveal>
          <Reveal delay={0.15} className="mt-12">
            <FaqAccordion items={CONTACT_FAQ} />
          </Reveal>
        </div>
      </section>
    </div>
  );
}
