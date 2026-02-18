import { useEffect, useState } from 'react'
import { Card, CardContent } from '../../../components/ui/card'
import { Loader2, Check } from 'lucide-react'
import { getRoadmap } from '../../../services/progress'

export default function CourseRoadmap({ userId, courseId, onNavigateUnit }) {
  const [roadmap, setRoadmap] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!userId) return
    let mounted = true
    const load = async () => {
      setLoading(true)
      try {
        const data = await getRoadmap(userId, courseId)
        if (mounted) setRoadmap(data.roadmap)
      } catch (err) {
        if (mounted) setError(err.message)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [userId, courseId])

  if (!userId) return null

  if (loading) return (
    <Card className="mb-4">
      <CardContent className="flex items-center gap-3">
        <Loader2 className="w-5 h-5 animate-spin text-gray-600" />
        <span className="text-sm text-gray-600">Cargando hoja de ruta...</span>
      </CardContent>
    </Card>
  )

  if (error) return (
    <Card className="mb-4">
      <CardContent className="text-sm text-red-600">{error}</CardContent>
    </Card>
  )

  if (!roadmap) return null

  const { title, percentage, state, modules } = roadmap

  const goToNextPending = () => {
    if (!modules) return
    for (const mod of modules) {
      for (const unit of mod.units || []) {
        if (unit.state !== 'completed') {
          if (onNavigateUnit) onNavigateUnit(unit.id)
          return
        }
      }
    }
  }

  return (
    <Card className="mb-4">
      <CardContent>
        <div className="flex items-center justify-between mb-2">
          <div>
            <h4 className="text-sm font-semibold">Hoja de ruta</h4>
            <div className="text-xs text-gray-600">{title}</div>
          </div>
          <div className="text-sm font-medium">
            {percentage}% • {state === 'completed' ? 'Completado' : state === 'in_progress' ? 'En progreso' : 'No iniciado'}
          </div>
        </div>

        <div className="space-y-2">
          {modules && modules.length > 0 ? modules.map(mod => (
            <div key={mod.id} className="flex items-start gap-3">
              <div className="pt-1">
                {mod.state === 'completed' ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <div className="w-4 h-4 border border-gray-300 rounded-full" />
                )}
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium">{mod.title}</div>
                <div className="text-xs text-gray-600">{mod.completed}/{mod.total} unidades • {mod.percentage}%</div>
                <div className="mt-1 text-xs space-x-2">
                  {mod.units && mod.units.slice(0,3).map(u => (
                    <span key={u.id} className={`px-2 py-0.5 rounded-full text-xs ${u.state === 'completed' ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-600'}`}>
                      {u.title}
                    </span>
                  ))}
                  {mod.units && mod.units.length > 3 && (
                    <span className="text-xs text-gray-500">+{mod.units.length - 3} más</span>
                  )}
                </div>
              </div>
            </div>
          )) : (
            <div className="text-sm text-gray-600">No hay módulos en esta hoja de ruta.</div>
          )}
        </div>

        <div className="mt-4">
          <button className="text-sm text-indigo-600" onClick={goToNextPending}>Ir a la siguiente unidad pendiente</button>
        </div>
      </CardContent>
    </Card>
  )
}
