/**
 * Hero Section Component
 *
 * Welcome banner with gradient background, personalized greeting,
 * and quick stats showing course progress summary.
 */

import { BookOpen, TrendingUp, Trophy, Clock } from 'lucide-react'

export function HeroSection({ user, courses = [] }) {
  // Calculate stats from courses data
  const total = courses.length
  const completed = courses.filter(c => c.roadmapSummary?.state === 'completed').length
  const inProgress = courses.filter(c => c.roadmapSummary?.state === 'in_progress').length
  const notStarted = total - completed - inProgress

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Buenos días'
    if (hour < 18) return 'Buenas tardes'
    return 'Buenas noches'
  }

  return (
    <section className="bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 border-b border-slate-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          {/* Greeting */}
          <div>
            <p className="text-slate-400 text-sm font-medium mb-1">{getGreeting()}</p>
            <h2 className="text-3xl font-bold text-white">
              {user.first_name} {user.last_name}
            </h2>
            <p className="text-slate-400 mt-1">
              Continúa tu aprendizaje donde lo dejaste
            </p>
          </div>

          {/* Quick stats */}
          {total > 0 && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2.5">
                <Trophy className="w-4 h-4 text-emerald-400" />
                <div>
                  <div className="text-white font-bold text-lg leading-none">{completed}</div>
                  <div className="text-slate-400 text-xs mt-0.5">Completados</div>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2.5">
                <TrendingUp className="w-4 h-4 text-blue-400" />
                <div>
                  <div className="text-white font-bold text-lg leading-none">{inProgress}</div>
                  <div className="text-slate-400 text-xs mt-0.5">En progreso</div>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2.5">
                <Clock className="w-4 h-4 text-gray-400" />
                <div>
                  <div className="text-white font-bold text-lg leading-none">{notStarted}</div>
                  <div className="text-slate-400 text-xs mt-0.5">Pendientes</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
