import { useState, useEffect } from 'react';
import { Button } from '../../../components/ui/button';
import {
    CheckCircle, XCircle, AlertCircle, Loader2,
    ChevronRight, RefreshCcw, Trophy, Check, ArrowLeft
} from 'lucide-react';
import quizService from '../../../services/quizzes';

/**
 * QuizView Component
 * Handles quiz rendering, submission and feedback for students
 */
export function QuizView({ quizId, userId, onComplete }) {
    const [quiz, setQuiz] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [answers, setAnswers] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState(null);

    useEffect(() => {
        const loadQuiz = async () => {
            try {
                setLoading(true);
                const data = await quizService.getQuiz(quizId);
                setQuiz(data);
            } catch (err) {
                setError('No se pudo cargar el cuestionario.');
            } finally {
                setLoading(false);
            }
        };
        if (quizId) loadQuiz();
    }, [quizId]);

    const handleSelectAnswer = (questionId, answerId) => {
        if (result) return;
        setAnswers(prev => ({
            ...prev,
            [questionId]: answerId
        }));
    };

    const handleSubmit = async () => {
        if (Object.keys(answers).length < quiz.questions.length) {
            alert('Por favor responde todas las preguntas.');
            return;
        }

        try {
            setSubmitting(true);
            const data = await quizService.submitQuiz(quizId, {
                user_id: userId,
                answers: answers
            });
            setResult(data);
            if (data.passed && onComplete) {
                onComplete();
            }
        } catch (err) {
            alert('Error al enviar el cuestionario.');
        } finally {
            setSubmitting(false);
        }
    };

    const resetQuiz = () => {
        setResult(null);
        setAnswers({});
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center p-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-2" />
            <p className="text-gray-500">Cargando evaluación...</p>
        </div>
    );

    if (error) return (
        <div className="p-8 text-center bg-red-50 rounded-xl border border-red-100">
            <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
            <p className="text-red-700 font-medium">{error}</p>
        </div>
    );

    if (!quiz) return null;

    // ── Pantalla de Resultados ──
    if (result) {
        return (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                <div className={`p-8 rounded-2xl text-center border-2 ${result.passed
                    ? 'bg-emerald-50 border-emerald-200'
                    : 'bg-rose-50 border-rose-200'
                    }`}>
                    <div className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center ${result.passed ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
                        }`}>
                        {result.passed ? <Trophy className="w-8 h-8" /> : <AlertCircle className="w-8 h-8" />}
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-1">
                        {result.passed ? '¡Excelente trabajo!' : 'Sigue intentándolo'}
                    </h2>
                    <p className="text-gray-600 mb-4">
                        Has obtenido un puntaje de <span className="font-bold">{result.score}%</span>
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-3">
                        {!result.passed && (
                            <Button onClick={resetQuiz} variant="outline" className="gap-2">
                                <RefreshCcw className="w-4 h-4" /> REINTENTAR
                            </Button>
                        )}
                        {result.passed && (
                            <Button
                                onClick={() => window.history.back()}
                                className="bg-blue-600 hover:bg-blue-700 gap-2"
                            >
                                <ArrowLeft className="w-4 h-4" /> VOLVER AL CURSO
                            </Button>
                        )}
                        <div className={`px-4 py-2 rounded-lg font-bold ${result.passed ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                            }`}>
                            {result.passed ? 'APROBADO' : 'NO APROBADO'}
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="font-semibold text-gray-700 px-1">Revisión de respuestas</h3>
                    {result.feedback.map((f, idx) => (
                        <div key={idx} className={`p-4 rounded-xl border ${f.is_correct ? 'bg-white border-emerald-100' : 'bg-white border-rose-100'
                            }`}>
                            <div className="flex items-start gap-3">
                                <div className="mt-1">
                                    {f.is_correct ? (
                                        <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                                            <Check className="w-3 h-3" />
                                        </div>
                                    ) : (
                                        <div className="w-5 h-5 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
                                            <XCircle className="w-3 h-3" />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-900 mb-2">{f.question_text}</p>
                                    <p className={`text-xs ${f.is_correct ? 'text-emerald-600' : 'text-rose-600'}`}>
                                        Tu respuesta: {
                                            quiz.questions.find(q => q.id === f.question_id)
                                                ?.answers.find(a => a.id === f.selected_answer_id)?.answer_text || 'Sin responder'
                                        }
                                    </p>
                                    {!f.is_correct && (
                                        <p className="text-xs text-gray-500 mt-1">
                                            Respuesta correcta: {
                                                quiz.questions.find(q => q.id === f.question_id)
                                                    ?.answers.find(a => a.id === f.correct_answer_id)?.answer_text
                                            }
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // ── Pantalla de Resolución ──
    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="border-b border-gray-100 pb-4">
                <h2 className="text-xl font-bold text-gray-900">{quiz.title}</h2>
                <p className="text-sm text-gray-500 mt-1">Responde todas las preguntas para completar la evaluación.</p>
            </div>

            <div className="space-y-10">
                {quiz.questions.map((q, idx) => (
                    <div key={q.id} className="space-y-4">
                        <div className="flex items-start gap-3">
                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">
                                {idx + 1}
                            </span>
                            <p className="text-base font-medium text-gray-800 pt-0.5">{q.question_text}</p>
                        </div>

                        <div className={
                            q.question_type === 'true_false'
                                ? 'grid grid-cols-2 gap-4 max-w-sm'
                                : 'grid grid-cols-1 gap-2'
                        }>
                            {q.answers.map(a => {
                                const isSelected = answers[q.id] === a.id;
                                return (
                                    <button
                                        key={a.id}
                                        onClick={() => handleSelectAnswer(q.id, a.id)}
                                        className={`px-4 py-3 rounded-xl border-2 text-left transition-all group ${isSelected
                                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                                            : 'border-gray-100 bg-gray-50 hover:border-gray-200 text-gray-600'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-blue-500' : 'border-gray-300'
                                                }`}>
                                                {isSelected && <div className="w-2 h-2 rounded-full bg-blue-500" />}
                                            </div>
                                            <span className="text-sm font-medium">{a.answer_text}</span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            <div className="pt-6 border-t border-gray-100">
                <Button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="w-full sm:w-auto px-8 bg-blue-600 hover:bg-blue-700 h-11 rounded-xl shadow-lg shadow-blue-200"
                >
                    {submitting ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Procesando...</>
                    ) : (
                        <>Finalizar evaluación <ChevronRight className="w-4 h-4 ml-2" /></>
                    )}
                </Button>
            </div>
        </div>
    );
}
