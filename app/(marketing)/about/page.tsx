export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">About BluePeakDispatch</h1>
      <p className="mt-6 text-muted-foreground">
        BluePeakDispatch is a freight brokerage built to take the friction out of moving freight.
        We match shippers with a vetted network of carriers and manage every load from quote to
        delivery, so our customers can focus on their business instead of chasing trucks.
      </p>
      <p className="mt-4 text-muted-foreground">
        Our team of dispatchers and account managers works every lane personally — no automated
        load boards standing in for a relationship, no black-box pricing. When something goes
        wrong on the road, you have a person to call.
      </p>
      <h2 className="mt-10 text-xl font-semibold tracking-tight">Licensing</h2>
      <p className="mt-4 text-muted-foreground">
        BluePeakDispatch operates as a licensed property broker under its own FMCSA authority.
        MC/DOT numbers and bond information are available on request.
      </p>
    </div>
  );
}
