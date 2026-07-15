// Consistent section heading with eyebrow + title + optional subtitle.
export default function SectionHeading({ eyebrow, title, subtitle, align = 'center' }) {
  const wrap =
    align === 'left' ? 'max-w-2xl text-left' : 'mx-auto max-w-2xl text-center'
  return (
    <div className={wrap}>
      {eyebrow && <span className="chip mb-3 bg-brand-100 text-brand-600">{eyebrow}</span>}
      <h2 className="font-display text-3xl font-extrabold sm:text-4xl">{title}</h2>
      {subtitle && <p className="mt-3 text-charcoal/55">{subtitle}</p>}
    </div>
  )
}
