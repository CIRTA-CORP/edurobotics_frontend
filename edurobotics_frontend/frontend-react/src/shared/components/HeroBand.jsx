/**
 * HeroBand — the single dark "band" used for page headers across the app.
 *
 * Pure black & white: a near-black surface where the dot grid is dim at the
 * left/right edges and intensifies toward the center, peaking with a bright
 * WHITE neon glow at the center-bottom (like the opencode card). No color.
 */
export function HeroBand({ children, className = '' }) {
  // Where the energy concentrates (center, lower third).
  const focus = '62% 82% at 50% 84%'

  // `on-brand-band` turns the keyboard focus ring white inside the band (see
  // index.css): the accent ring is 2.96:1 on #0a0a0c, under the 3:1 that WCAG
  // asks of a focus indicator; white is 19.8:1. Always on, so no page can forget it.
  return (
    <div className={`on-brand-band relative overflow-hidden bg-[#0a0a0c] text-white ${className}`}>
      {/* dot grid, masked so the dots fade at the edges and intensify toward the center */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.55) 1px, transparent 1px)',
          backgroundSize: '22px 22px',
          maskImage: `radial-gradient(${focus}, #000 5%, transparent 68%)`,
          WebkitMaskImage: `radial-gradient(${focus}, #000 5%, transparent 68%)`,
        }}
      />
      {/* white glow — brightest at center-bottom, dimming to the sides and top */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: `radial-gradient(${focus}, rgba(255,255,255,0.18), rgba(10,10,12,0) 60%)` }}
      />
      {/* intense bright core rising from the bottom */}
      <div className="pointer-events-none absolute bottom-0 left-1/2 h-28 w-2/5 -translate-x-1/2 translate-y-1/2 rounded-full bg-white/45 blur-3xl" />
      <div className="relative">{children}</div>
    </div>
  )
}

export default HeroBand
