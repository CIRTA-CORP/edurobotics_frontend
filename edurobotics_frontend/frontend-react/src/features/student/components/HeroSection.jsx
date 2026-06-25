/**
 * Hero Section Component
 *
 * Welcome banner with gradient background, personalized greeting,
 * and quick stats showing course progress summary.
 */

import { HeroBand } from '@/shared/components/HeroBand'

export function HeroSection({ user }) {
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Buenos días'
    if (hour < 18) return 'Buenas tardes'
    return 'Buenas noches'
  }

  return (
    <HeroBand>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <p className="text-slate-300 text-sm font-medium mb-1">{getGreeting()}</p>
        <h2 className="text-3xl font-bold text-white">
          {user.first_name} {user.last_name}
        </h2>
        <p className="text-slate-300 mt-1">
          Continúa tu aprendizaje donde lo dejaste
        </p>
      </div>
    </HeroBand>
  )
}
