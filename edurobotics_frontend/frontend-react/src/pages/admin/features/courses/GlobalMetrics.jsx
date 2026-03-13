import { useQuery } from '@tanstack/react-query'
import { Users, BookOpen, CheckCircle, ClipboardCheck, Star, TrendingUp, UserPlus, BarChart3 } from 'lucide-react'
import { getAdminMetrics } from '../../../../services/courses'

function MetricCard({ icon: Icon, label, value, sub, color, bgColor }) {
    return (
        <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl ${bgColor} flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${color}`} />
                </div>
                {sub && (
                    <span className="text-[10px] font-medium text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">
                        {sub}
                    </span>
                )}
            </div>
            <div className="text-2xl font-bold text-gray-900">{value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{label}</div>
        </div>
    )
}

export function GlobalMetrics() {
    const { data, isLoading: loading } = useQuery({
        queryKey: ['admin-metrics'],
        queryFn: getAdminMetrics,
        staleTime: 30_000,
    })

    const metrics = data?.metrics || null

    if (loading) {
        return (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
                {[...Array(8)].map((_, i) => (
                    <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 h-28">
                        <div className="w-10 h-10 bg-gray-100 rounded-xl mb-3" />
                        <div className="w-16 h-6 bg-gray-100 rounded" />
                        <div className="w-24 h-3 bg-gray-50 rounded mt-1" />
                    </div>
                ))}
            </div>
        )
    }

    if (!metrics) return null

    const cards = [
        {
            icon: Users,
            label: 'Estudiantes Registrados',
            value: metrics.students.total,
            sub: `${metrics.students.active} activos`,
            color: 'text-blue-600',
            bgColor: 'bg-blue-50',
        },
        {
            icon: UserPlus,
            label: 'Nuevos (últimos 7 días)',
            value: metrics.students.recent_7d,
            color: 'text-emerald-600',
            bgColor: 'bg-emerald-50',
        },
        {
            icon: BookOpen,
            label: 'Cursos Publicados',
            value: metrics.courses.published,
            sub: `${metrics.courses.total} totales`,
            color: 'text-violet-600',
            bgColor: 'bg-violet-50',
        },
        {
            icon: CheckCircle,
            label: 'Contenidos Completados',
            value: metrics.progress.total_completions,
            color: 'text-teal-600',
            bgColor: 'bg-teal-50',
        },
        {
            icon: ClipboardCheck,
            label: 'Evaluaciones Aprobadas',
            value: metrics.quizzes.passed,
            sub: `${metrics.quizzes.pass_rate}% aprobación`,
            color: 'text-amber-600',
            bgColor: 'bg-amber-50',
        },
        {
            icon: BarChart3,
            label: 'Intentos de Evaluación',
            value: metrics.quizzes.total_attempts,
            color: 'text-orange-600',
            bgColor: 'bg-orange-50',
        },
        {
            icon: Star,
            label: 'Utilidad Promedio',
            value: `${metrics.feedback.avg_usefulness}/5`,
            sub: `${metrics.feedback.total} feedback`,
            color: 'text-yellow-600',
            bgColor: 'bg-yellow-50',
        },
        {
            icon: TrendingUp,
            label: 'Dificultad Promedio',
            value: `${metrics.feedback.avg_difficulty}/5`,
            color: 'text-rose-600',
            bgColor: 'bg-rose-50',
        },
    ]

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-gray-700" />
                <h3 className="text-lg font-semibold text-gray-900">Métricas Globales</h3>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {cards.map((card, i) => (
                    <MetricCard key={i} {...card} />
                ))}
            </div>
        </div>
    )
}
