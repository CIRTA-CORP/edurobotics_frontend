// Dashboard "Métricas Globales": platform-wide cumulative cards (registered
// students, published courses, completions, pass rate, avg difficulty).
import { useQuery } from '@tanstack/react-query'
import { getAdminMetrics } from '@/features/courses/services/courses'

function MetricCard({ label, value, sub }) {
    return (
        <div className="rounded-[14px] border border-[#e9e9ee] bg-white p-[18px_20px]">
            <div className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.14em] text-[#a9a8b4]">{label}</div>
            <div className="mt-3 flex items-baseline gap-1.5">
                <span className="font-mono text-[30px] font-bold leading-none tracking-[-0.025em] text-[#16151b]">{value}</span>
            </div>
            {sub && <div className="mt-2.5 text-[12px] text-[#a9a8b4]">{sub}</div>}
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
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                {[...Array(8)].map((_, i) => (
                    <div key={i} className="h-28 animate-pulse rounded-[14px] border border-[#e9e9ee] bg-white" />
                ))}
            </div>
        )
    }

    if (!metrics) return null

    const cards = [
        {
            label: 'Estudiantes registrados',
            value: metrics.students.total,
            sub: `${metrics.students.recent_7d} nuevos en los últimos 7 días`,
        },
        {
            label: 'Cursos publicados',
            value: metrics.courses.published,
            sub: `${metrics.courses.total} en total`,
        },
        {
            label: 'Contenidos completados',
            value: metrics.progress.total_completions,
            sub: 'suma de todas las unidades terminadas',
        },
        {
            label: 'Aprobación de evaluaciones',
            value: `${metrics.quizzes.pass_rate}%`,
            sub: `${metrics.quizzes.passed} de ${metrics.quizzes.total_attempts} intentos`,
        },
        {
            label: 'Feedback · utilidad',
            value: `${metrics.feedback.avg_usefulness}/5`,
            sub: `dificultad ${metrics.feedback.avg_difficulty}/5 · ${metrics.feedback.total} respuestas`,
        },
    ]

    return (
        <div className="space-y-3">
            <span className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.14em] text-[#a9a8b4]">
                Métricas globales
            </span>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                {cards.map((card, i) => (
                    <MetricCard key={i} {...card} />
                ))}
            </div>
        </div>
    )
}
