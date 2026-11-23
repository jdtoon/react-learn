interface StubPageProps {
  eyebrow: string;
  title: string;
  description: string;
}

function StubPage({ eyebrow, title, description }: StubPageProps) {
  return (
    <section className="mx-auto grid max-w-[44rem] gap-4 px-4 py-14 sm:px-8 sm:py-20">
      <title>{`${title} | React Field Guide`}</title>
      <p className="eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      <p className="lede">{description}</p>
    </section>
  );
}

export function MeetingPage() {
  return (
    <StubPage
      eyebrow="Ten minutes before the meeting"
      title="Meeting mode"
      description="Every module's talk track, questions to ask and red flags on one scannable page. It fills in as modules are built."
    />
  );
}

export function GlossaryPage() {
  return (
    <StubPage
      eyebrow="Reference"
      title="Glossary"
      description="Every key term with a one-line definition, linked to the module that teaches it. It fills in as modules are built."
    />
  );
}

export function KitPage() {
  return (
    <StubPage
      eyebrow="Reference"
      title="Lab kit"
      description="The shared components every lab and module page is built from."
    />
  );
}
