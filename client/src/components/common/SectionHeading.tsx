interface SectionHeadingProps {
  eyebrow: string;
  title: string;
  description?: string;
}

export const SectionHeading = ({
  eyebrow,
  title,
  description,
}: SectionHeadingProps) => (
  <div className="max-w-2xl space-y-3">
    <p className="font-serif text-sm uppercase tracking-[0.3em] text-text-secondary">
      {eyebrow}
    </p>
    <h2 className="font-heading text-3xl leading-tight text-text-primary md:text-4xl">
      {title}
    </h2>
    {description ? <p className="text-base text-text-secondary">{description}</p> : null}
  </div>
);
