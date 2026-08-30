/**
 * AuthLayout — la pantalla partida de acceso: banda de marca a la izquierda,
 * formulario a la derecha.
 *
 * La banda es la misma del hero y del CTA de la landing, así que entrar a la
 * plataforma se siente continuo con la página pública. En pantallas angostas la
 * banda desaparece —no aporta y roba altura— y queda solo el formulario.
 */
import { Link } from 'react-router-dom'
import { Check } from 'lucide-react'
import { HeroBand } from '@/shared/components/HeroBand'

export function AuthLayout({ title, claims = [], children }) {
  return (
    <div className="flex min-h-screen bg-white">
      <HeroBand className="on-brand-band hidden w-[46%] max-w-[620px] flex-shrink-0 lg:block">
        <div className="flex h-full min-h-screen flex-col p-11 xl:p-14">
          <Link to="/" className="flex items-center gap-2.5">
            <img src="/cirtanitido.svg" alt="CIRTA" className="h-7" />
            <span className="text-[16px] font-bold tracking-[-0.015em] text-white">EduRobotics</span>
          </Link>

          <div className="my-auto py-10">
            <h2 className="max-w-[440px] text-[40px] font-bold leading-[1.1] tracking-[-0.018em] text-white">
              {title}
            </h2>
            <div className="mt-8 flex flex-col gap-4">
              {claims.map((claim) => (
                <div key={claim} className="flex items-center gap-3.5 text-[15px] text-white/70">
                  <Check className="h-[17px] w-[17px] flex-shrink-0 text-emerald-300" strokeWidth={2.4} />
                  {claim}
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-5 text-[12.5px] text-white/40">
            <span>© {new Date().getFullYear()} CIRTA CORP</span>
            <Link to="/legal" className="text-white/50 hover:text-white/80">Términos</Link>
            <Link to="/privacidad" className="text-white/50 hover:text-white/80">Privacidad</Link>
          </div>
        </div>
      </HeroBand>

      <div className="flex min-w-0 flex-1 items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-[400px]">
          {/* La marca solo aquí cuando la banda no se ve */}
          <Link to="/" className="mb-8 flex items-center gap-2.5 lg:hidden">
            <img src="/cirtanitido.svg" alt="CIRTA" className="h-7" />
            <span className="text-[16px] font-bold tracking-[-0.015em] text-[#16151b]">EduRobotics</span>
          </Link>
          {children}
        </div>
      </div>
    </div>
  )
}

/** Cabecera del formulario: título y una línea que dice qué esperar. */
export function AuthHeading({ title, children }) {
  return (
    <div className="mb-6">
      <h1 className="text-[26px] font-bold tracking-[-0.014em] text-[#16151b]">{title}</h1>
      {children && <p className="mt-2 text-[14px] leading-relaxed text-[#55545f]">{children}</p>}
    </div>
  )
}
