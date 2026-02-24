import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { QuizView } from './course/components/QuizView'
import { getStoredUser } from '../services/auth'
import { getCourseDetail } from '../services/courses'
import { Button } from '../components/ui/button'
import { ArrowLeft, Loader2, BookOpen } from 'lucide-react'

export default function QuizPage() {
    const { courseId, quizId } = useParams()
    const navigate = useNavigate()
    const [user, setUser] = useState(null)
    const [course, setCourse] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const storedUser = getStoredUser()
        if (!storedUser) {
            navigate('/login')
            return
        }
        setUser(storedUser)

        const loadData = async () => {
            try {
                const courseData = await getCourseDetail(courseId)
                setCourse(courseData)
            } catch (err) {
                console.error('Error loading quiz page data:', err)
            } finally {
                setLoading(false)
            }
        }
        loadData()
    }, [courseId, navigate])

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Header minimalista para modo examen */}
            <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/courses/${courseId}/study`)}
                        className="text-gray-500 hover:text-gray-900"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Volver al curso
                    </Button>
                    <div className="h-6 w-px bg-gray-200" />
                    <div className="flex items-center gap-2 text-gray-900 font-semibold">
                        <BookOpen className="w-5 h-5 text-blue-500" />
                        <span>{course?.title || 'Cargando...'}</span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Modo Evaluación</span>
                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
                        {user?.first_name?.[0] || 'U'}
                    </div>
                </div>
            </header>

            <main className="flex-1 flex flex-col items-center py-12 px-4 overflow-y-auto">
                <div className="w-full max-w-3xl bg-white rounded-2xl shadow-sm border border-gray-200 p-8 md:p-12">
                    <QuizView
                        quizId={parseInt(quizId)}
                        userId={user?.id}
                        onComplete={() => {
                            // El feedback se maneja dentro de QuizView
                            console.log('Quiz completed')
                        }}
                    />
                </div>

                <p className="mt-8 text-sm text-gray-400 text-center max-w-md">
                    Tu progreso se guardará automáticamente al finalizar la evaluación.
                    No cierres esta pestaña hasta completar todas las preguntas.
                </p>
            </main>
        </div>
    )
}
