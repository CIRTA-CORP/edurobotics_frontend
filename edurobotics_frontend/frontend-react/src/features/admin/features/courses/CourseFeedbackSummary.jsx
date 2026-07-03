import { useQuery } from '@tanstack/react-query'
import { Star, Users, TrendingUp, BarChart3 } from 'lucide-react'
import { getCourseFeedbackSummary } from '@/features/courses/services/courses'

function RatingBar({ label, value, max = 5 }) {
    const pct = max > 0 ? (value / max) * 100 : 0
    return (
        <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500 w-24 shrink-0">{label}</span>
            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                    className="h-full bg-amber-400 rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                />
            </div>
            <span className="text-sm font-bold text-gray-700 w-8 text-right">{value}</span>
        </div>
    )
}

export function CourseFeedbackSummary({ courseId }) {
    const { data, isLoading: loading } = useQuery({
        queryKey: ['course-feedback-summary', courseId],
        queryFn: () => getCourseFeedbackSummary(courseId),
        enabled: !!courseId,
        staleTime: 30_000,
    })

    if (loading) return null
    if (!data || data.total === 0) {
        return (
            <div className="rounded-xl border border-gray-200 bg-white p-5">
                <div className="flex items-center gap-2 mb-3">
                    <BarChart3 className="w-4 h-4 text-gray-400" />
                    <h4 className="text-sm font-semibold text-gray-700">Feedback de Estudiantes</h4>
                </div>
                <p className="text-xs text-gray-400">Aún no se ha recibido feedback para este curso.</p>
            </div>
        )
    }

    return (
        <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-blue-500" />
                    <h4 className="text-sm font-semibold text-gray-700">Feedback de Estudiantes</h4>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                    <Users className="w-3.5 h-3.5" />
                    {data.total} respuesta{data.total !== 1 ? 's' : ''}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                        <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
                        <span className="text-[10px] text-blue-600 font-semibold uppercase tracking-wider">Utilidad</span>
                    </div>
                    <div className="text-2xl font-bold text-blue-700">{data.avg_usefulness}<span className="text-sm text-blue-400">/5</span></div>
                </div>
                <div className="bg-amber-50 rounded-lg p-3 text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                        <Star className="w-3.5 h-3.5 text-amber-600" />
                        <span className="text-[10px] text-amber-600 font-semibold uppercase tracking-wider">Dificultad</span>
                    </div>
                    <div className="text-2xl font-bold text-amber-700">{data.avg_difficulty}<span className="text-sm text-amber-400">/5</span></div>
                </div>
            </div>

            <div className="space-y-2">
                <RatingBar label="Utilidad" value={data.avg_usefulness} />
                <RatingBar label="Dificultad" value={data.avg_difficulty} />
            </div>
        </div>
    )
}
