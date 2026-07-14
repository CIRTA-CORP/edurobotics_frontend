/**
 * SpecializationDetailPage — public learning-path view (issue #24).
 *
 * Shows a specialization as an ordered set of courses, reusing the student
 * CourseGrid so progress/roadmap state is consistent with the dashboard.
 */
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Layers, Loader2 } from 'lucide-react'
import { clearStoredUser, getStoredUser } from '@/features/auth/services/auth'
import { getSpecialization } from '@/features/specializations/services/specializations'
import { getRoadmap } from '@/features/progress/services/progress'
import { StudentHeader } from '@/features/student/components/StudentHeader'
import { CourseGrid } from '@/features/student/components/CourseGrid'
import { LogoutModal } from '@/shared/components/LogoutModal'
import { HeroBand } from '@/shared/components/HeroBand'

function SpecializationDetailPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const specId = Number(id)
  const [user] = useState(() => getStoredUser())
  const [showLogout, setShowLogout] = useState(false)

  useEffect(() => {
    if (!user) navigate('/login')
  }, [navigate, user])

  const { data: spec, isLoading, error } = useQuery({
    queryKey: ['specialization-detail', specId],
    queryFn: () => getSpecialization(specId),
    enabled: !!user && Number.isFinite(specId),
    staleTime: 60_000,
  })

  const { data: roadmapResp } = useQuery({
    queryKey: ['roadmap-full', user?.id],
    queryFn: () => getRoadmap(user.id),
    enabled: !!user && Number.isInteger(user.id),
    staleTime: 20_000,
  })

  const roadmapMap = {}
  if (Array.isArray(roadmapResp?.roadmap)) {
    roadmapResp.roadmap.forEach((c) => { roadmapMap[c.id] = c })
  }
  const courses = (spec?.courses || []).map((c) => ({ ...c, roadmapSummary: roadmapMap[c.id] }))
  // Position in the recommended route (1, 2, 3…) instead of the internal course id.
  const orderMap = {}
  courses.forEach((c, i) => { orderMap[c.id] = i + 1 })
  const totalCourses = courses.length
  const completedCourses = courses.filter((c) => c.roadmapSummary?.state === 'completed').length
  const pct = totalCourses > 0 ? Math.round((completedCourses / totalCourses) * 100) : 0

  if (!user) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <LogoutModal
        isOpen={showLogout}
        onConfirm={() => { clearStoredUser(); navigate('/') }}
        onCancel={() => setShowLogout(false)}
      />
      <StudentHeader user={user} onLogout={() => setShowLogout(true)} />

      {/* Hero band */}
      <HeroBand>
        {spec?.image_url && (
          <img
            src={spec.image_url}
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-20"
          />
        )}
        <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <button
            onClick={() => navigate('/student')}
            className="mb-4 inline-flex items-center gap-1.5 text-sm text-white/80 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a cursos
          </button>
          <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-0.5 text-[11px] font-semibold backdrop-blur-sm">
            <Layers className="h-3 w-3" />
            Especialización
          </span>
          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            {spec?.title || 'Especialización'}
          </h1>
          {spec?.description && (
            <p className="mt-2 max-w-2xl text-white/85">{spec.description}</p>
          )}

          {/* Progress across the path */}
          {totalCourses > 0 && (
            <div className="mt-5 max-w-md">
              <div className="mb-1.5 flex items-center justify-between text-sm text-white/90">
                <span className="font-medium">{completedCourses} de {totalCourses} cursos completados</span>
                <span className="font-semibold">{pct}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-white/20">
                <div
                  className="h-full rounded-full bg-white transition-all duration-700"
                  style={{ width: `${Math.max(pct, 2)}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </HeroBand>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-5">
          <h2 className="text-xl font-bold text-gray-900">Cursos de la ruta</h2>
          <p className="text-sm text-gray-500">Te recomendamos seguirlos en orden</p>
        </div>

        {isLoading && (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        )}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
            No se pudo cargar la especialización.
          </div>
        )}
        {!isLoading && !error && (
          <CourseGrid courses={courses} onCourseClick={(cid) => navigate(`/courses/${cid}`)} orderMap={orderMap} />
        )}
      </main>
    </div>
  )
}

export default SpecializationDetailPage
