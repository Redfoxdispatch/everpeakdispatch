import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/shared/logo";
import { HeroReveal } from "@/components/shared/motion";
import { SplitText } from "@/components/shared/split-text";
import { ParallaxImage } from "@/components/shared/parallax-image";

export function AuthSplitLayout({
  image,
  alt,
  eyebrow,
  title,
  description,
  children,
}: {
  image: string;
  alt: string;
  eyebrow: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-svh grid-cols-1 md:grid-cols-[1.1fr_1fr]">
      <div className="relative hidden overflow-hidden bg-brand-navy-950 md:sticky md:top-0 md:block md:h-svh md:self-start">
        <ParallaxImage src={image} alt={alt} fill strength={30} priority />
        <div className="absolute inset-0 bg-linear-to-t from-brand-navy-950 via-brand-navy-950/55 to-brand-navy-950/25" />
        <div className="relative flex h-full flex-col justify-between p-12">
          <div className="flex flex-col gap-6">
            <Link
              href="/"
              className="inline-flex w-fit items-center gap-2 text-sm text-white/70 transition-colors hover:text-white"
            >
              <ArrowLeft className="size-4" strokeWidth={1.5} />
              Go back
            </Link>
            <Link href="/">
              <Logo variant="light" />
            </Link>
          </div>
          <div className="max-w-md">
            <span className="text-xs font-medium tracking-[0.15em] text-brand-gold-400 uppercase">
              {eyebrow}
            </span>
            <h2 className="mt-3 text-[clamp(2.25rem,4vw,3.25rem)] leading-[1.05] font-bold text-white">
              <SplitText trigger="load">{title}</SplitText>
            </h2>
            {description ? (
              <HeroReveal delay={0.4}>
                <p className="mt-3 text-white/70">{description}</p>
              </HeroReveal>
            ) : null}
          </div>
        </div>
      </div>

      <div className="flex flex-col justify-center bg-white px-6 py-16 sm:px-12">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-10 flex flex-col gap-4 md:hidden">
            <Link
              href="/"
              className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-brand-ink"
            >
              <ArrowLeft className="size-4" strokeWidth={1.5} />
              Go back
            </Link>
            <Link href="/">
              <Logo variant="dark" />
            </Link>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
