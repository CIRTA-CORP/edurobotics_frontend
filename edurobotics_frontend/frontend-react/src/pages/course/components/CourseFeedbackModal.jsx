import { useState } from 'react'
import { MessageSquare, Send, Loader2 } from 'lucide-react'
import { Button } from '../../../components/ui/button'
import { submitCourseFeedback } from '../../../services/courses'

const USEFULNESS_LABELS = ['', 'Nada útil', 'Poco útil', 'Regular', 'Útil', 'Muy útil']
const DIFFICULTY_LABELS = ['', 'Muy fácil', 'Fácil', 'Intermedio', 'Difícil', 'Muy difícil']

function StarGroup({ value, onChange, labels }) {
    return (
        <div className="flex items-center gap-3">
            <div className="flex gap-0.5 star-group">
                {[1, 2, 3, 4, 5].map(star => (
                    <button
                        key={star}
                        type="button"
                        onClick={() => onChange(star)}
                        className={`w-9 h-9 rounded-lg transition-colors duration-150 text-lg
                            ${star <= value
                                ? 'bg-amber-100 text-amber-500'
                                : 'bg-gray-100 text-gray-300 hover:bg-amber-50 hover:text-amber-400'
                            }`}
                    >
                        ★
                    </button>
                ))}
            </div>
            {value > 0 && (
                <span className="text-xs text-gray-500 font-medium">{labels[value]}</span>
            )}
        </div>
    )
}

export function CourseFeedbackModal({ courseId, userId, onComplete, onSkip }) {
    const [usefulness, setUsefulness] = useState(0)
    const [difficulty, setDifficulty] = useState(0)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState(null)

    const handleSubmit = async () => {
        if (usefulness === 0 || difficulty === 0) return
        setSubmitting(true)
        setError(null)
        try {
            await submitCourseFeedback(courseId, userId, {
                usefulness_rating: usefulness,
                difficulty_rating: difficulty,
                comment: null
            })
            onComplete?.()
        } catch (err) {
            console.error('Feedback error:', err)
            setError(err.message || 'Error al enviar feedback')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-8">
                <div className="text-center mb-8">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
                        <MessageSquare className="w-6 h-6" />
                    </div>
                    <h2 className="text-lg font-bold text-gray-900">¡Curso finalizado!</h2>
                    <p className="text-xs text-gray-500 mt-1">Tu opinión nos ayuda a mejorar</p>
                </div>

                <div className="space-y-5 mb-8">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            ¿Qué tan útil fue?
                        </label>
                        <StarGroup value={usefulness} onChange={setUsefulness} labels={USEFULNESS_LABELS} />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            ¿Qué tan difícil fue?
                        </label>
                        <StarGroup value={difficulty} onChange={setDifficulty} labels={DIFFICULTY_LABELS} />
                    </div>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
                        {error}
                    </div>
                )}

                <div className="flex gap-3">
                    <button
                        onClick={onSkip}
                        className="flex-1 text-sm text-gray-500 hover:text-gray-700 py-2.5 transition-colors"
                    >
                        Omitir
                    </button>
                    <Button
                        onClick={handleSubmit}
                        disabled={submitting || usefulness === 0 || difficulty === 0}
                        className="flex-1 gap-2 bg-blue-600 hover:bg-blue-700"
                    >
                        {submitting ? (
                            <><Loader2 className="w-4 h-4 animate-spin" /> Enviando...</>
                        ) : (
                            <><Send className="w-4 h-4" /> Enviar</>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    )
}
