import { HeroReveal } from "@/components/shared/motion";
import { SplitText } from "@/components/shared/split-text";
import { ParallaxImage } from "@/components/shared/parallax-image";

/** Full-bleed interior-page hero — smaller than the homepage hero, same brand language. */
export function PageHero({
  eyebrow,
  title,
  description,
  image,
  alt,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  image: string;
  alt: string;
}) {
  return (
    <section className="relative flex h-[56vh] min-h-[420px] items-end overflow-hidden bg-brand-navy-950">
      <ParallaxImage src={image} alt={alt} fill strength={40} priority />
      <div className="absolute inset-0 bg-linear-to-t from-brand-navy-950 via-brand-navy-950/60 to-brand-navy-950/30" />
      <div className="relative mx-auto w-full max-w-6xl px-6 pb-16">
        <HeroReveal>
          <span className="text-xs font-medium tracking-[0.15em] text-brand-gold-400 uppercase">
            {eyebrow}
          </span>
        </HeroReveal>
        <h1 className="mt-3 max-w-2xl text-[clamp(2.25rem,4.5vw,3.5rem)] leading-[1.08] font-bold text-white">
          <SplitText delay={0.1}>{title}</SplitText>
        </h1>
        {description ? (
          <HeroReveal delay={0.4}>
            <p className="mt-5 max-w-xl text-lg text-white/70">{description}</p>
          </HeroReveal>
        ) : null}
      </div>
    </section>
  );
}
