import { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Button } from '@/shared/components/button';
import {
    CheckCircle, XCircle, AlertCircle, Loader2,
    ChevronRight, ChevronLeft, RefreshCcw,
    Check, ArrowLeft, MessageSquare
} from 'lucide-react';
import quizService from '@/features/quizzes/services/quizzes';
import { useParams, useNavigate } from 'react-router-dom';

/**
 * QuizView — Student quiz experience
 * One question at a time with progress indicator and elegant results
 */
export function QuizView({ quizId, userId, onComplete }) {
    const [answers, setAnswers] = useState({});
    const [currentIndex, setCurrentIndex] = useState(0);
    const [result, setResult] = useState(null);
    const { courseId } = useParams();
    const navigate = useNavigate();

    const {
        data: quiz,
        isLoading: loading,
        error,
    } = useQuery({
        queryKey: ['quiz-detail', quizId],
        queryFn: () => quizService.getQuiz(quizId),
        enabled: !!quizId,
        staleTime: 30_000,
    });

    const submitQuizMutation = useMutation({
        mutationFn: (payload) => quizService.submitQuiz(quizId, payload),
        onSuccess: (data) => {
            setResult(data);
            if (data.passed && onComplete) {
                onComplete();
            }
        },
    });

    const handleSelectAnswer = (questionId, answerId) => {
        if (result) return;
        setAnswers(prev => ({ ...prev, [questionId]: answerId }));
    };

    const handleSubmit = async () => {
        if (Object.keys(answers).length < quiz.questions.length) {
            alert('Por favor responde todas las preguntas antes de enviar.');
            return;
        }
        try {
            await submitQuizMutation.mutateAsync({
                user_id: userId,
                answers: answers
            });
        } catch (err) {
            alert('Error al enviar la evaluación.');
        }
    };

    const resetQuiz = () => {
        setResult(null);
        setAnswers({});
        setCurrentIndex(0);
    };

    // ── LOADING ──
    if (loading) return (
        <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-3" />
            <p className="text-sm text-gray-500">Cargando evaluación...</p>
        </div>
    );

    if (error) return (
        <div className="p-8 text-center bg-red-50 rounded-2xl border border-red-100">
            <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
            <p className="text-red-700 font-medium">No se pudo cargar la evaluación.</p>
        </div>
    );

    if (!quiz) return null;

    // Quiz sin preguntas — caso borde
    if (quiz.questions.length === 0) {
        return (
            <div className="text-center py-16">
                <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Evaluación sin preguntas</h3>
                <p className="text-sm text-gray-500 mb-6">Esta evaluación aún no tiene preguntas configuradas.</p>
                <Button onClick={() => navigate(`/courses/${courseId}/study`)} variant="outline" className="gap-2">
                    <ArrowLeft className="w-4 h-4" /> Volver al curso
                </Button>
            </div>
        );
    }

    const totalQuestions = quiz.questions.length;
    const answeredCount = Object.keys(answers).length;

    // ══════════════════════════════════════
    // PANTALLA DE RESULTADOS
    // ══════════════════════════════════════
    if (result) {
        return (
            <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-500">
                {/* Score Card */}
                <div className={`p-8 rounded-2xl border-2 ${result.passed
                    ? 'bg-emerald-50 border-emerald-200'
                    : 'bg-rose-50 border-rose-200'
                    }`}>
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">
                                {result.passed ? 'Evaluación aprobada' : 'No aprobaste esta vez'}
                            </h2>
                            <p className="text-sm text-gray-500 mt-1">
                                Obtuviste <span className="font-bold text-gray-900">{result.score}%</span> de aciertos
                            </p>
                        </div>
                        <div className={`px-4 py-2 rounded-lg font-bold text-xs tracking-wider ${result.passed
                            ? 'bg-emerald-500 text-white'
                            : 'bg-rose-500 text-white'
                            }`}>
                            {result.passed ? 'APROBADO' : 'NO APROBADO'}
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {!result.passed && (
                            <Button onClick={resetQuiz} variant="outline" className="gap-2 bg-white">
                                <RefreshCcw className="w-4 h-4" /> Reintentar
                            </Button>
                        )}
                        {result.passed && (
                            <Button onClick={() => navigate(`/courses/${courseId}/study`)} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
                                <ArrowLeft className="w-4 h-4" /> Volver al Curso
                            </Button>
                        )}
                    </div>
                </div>

                {/* Answer Review */}
                <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider px-1">
                        Revisión de respuestas
                    </h3>
                    {result.feedback.map((f, idx) => {
                        const question = quiz.questions.find(q => q.id === f.question_id);
                        const selectedAnswer = question?.answers.find(a => a.id === f.selected_answer_id);
                        const correctAnswer = question?.answers.find(a => a.id === f.correct_answer_id);

                        return (
                            <div key={idx} className={`p-4 rounded-xl border ${f.is_correct ? 'bg-emerald-50/50 border-emerald-100' : 'bg-rose-50/50 border-rose-100'
                                }`}>
                                <div className="flex items-start gap-3">
                                    <div className="mt-0.5">
                                        {f.is_correct ? (
                                            <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                                                <Check className="w-3.5 h-3.5" />
                                            </div>
                                        ) : (
                                            <div className="w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center">
                                                <XCircle className="w-3.5 h-3.5" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 space-y-1.5">
                                        <p className="text-sm font-medium text-gray-900">{f.question_text}</p>
                                        <p className={`text-xs font-medium ${f.is_correct ? 'text-emerald-700' : 'text-rose-700'}`}>
                                            Tu respuesta: {selectedAnswer?.answer_text || 'Sin responder'}
                                        </p>
                                        {!f.is_correct && (
                                            <p className="text-xs text-gray-600">
                                                Correcta: <span className="font-medium">{correctAnswer?.answer_text}</span>
                                            </p>
                                        )}
                                        {/* Justificación */}
                                        {!f.is_correct && f.explanation && (
                                            <div className="mt-2 p-2.5 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
                                                <MessageSquare className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
                                                <p className="text-xs text-amber-800">{f.explanation}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }

    // ══════════════════════════════════════
    // PANTALLA DE RESOLUCIÓN (una por una)
    // ══════════════════════════════════════
    const currentQuestion = quiz.questions[currentIndex];
    const isFirst = currentIndex === 0;
    const isLast = currentIndex === totalQuestions - 1;
    const allAnswered = answeredCount === totalQuestions;

    return (
        <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-300">
            {/* Progress Bar */}
            <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-gray-500">
                    <span className="font-medium">Pregunta {currentIndex + 1} de {totalQuestions}</span>
                    <span>{answeredCount} respondidas</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-blue-500 rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%` }}
                    />
                </div>
                {/* Mini dots */}
                <div className="flex items-center gap-1 justify-center pt-1">
                    {quiz.questions.map((q, i) => (
                        <button
                            key={q.id}
                            onClick={() => setCurrentIndex(i)}
                            className={`w-2.5 h-2.5 rounded-full transition-all ${i === currentIndex
                                ? 'bg-blue-500 scale-125'
                                : answers[q.id]
                                    ? 'bg-blue-300'
                                    : 'bg-gray-200'
                                }`}
                        />
                    ))}
                </div>
            </div>

            {/* Current Question */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <p className="text-base font-medium text-gray-900 mb-6 leading-relaxed">
                    {currentQuestion.question_text}
                </p>

                <div className={
                    currentQuestion.question_type === 'true_false'
                        ? 'grid grid-cols-2 gap-3'
                        : 'space-y-2.5'
                }>
                    {currentQuestion.answers.map(a => {
                        const isSelected = answers[currentQuestion.id] === a.id;
                        return (
                            <button
                                key={a.id}
                                onClick={() => handleSelectAnswer(currentQuestion.id, a.id)}
                                className={`w-full px-4 py-3.5 rounded-xl border-2 text-left transition-all ${isSelected
                                    ? 'border-blue-500 bg-blue-50 text-blue-800 shadow-sm shadow-blue-100'
                                    : 'border-gray-100 bg-gray-50 hover:border-gray-200 hover:bg-gray-100 text-gray-700'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${isSelected ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                                        }`}>
                                        {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                                    </div>
                                    <span className="text-sm font-medium">{a.answer_text}</span>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between pt-2">
                <Button
                    onClick={() => setCurrentIndex(i => i - 1)}
                    disabled={isFirst}
                    variant="outline"
                    className="gap-1.5"
                >
                    <ChevronLeft className="w-4 h-4" /> Anterior
                </Button>

                {isLast ? (
                    <Button
                        onClick={handleSubmit}
                        disabled={submitQuizMutation.isPending || !allAnswered}
                        className={`gap-1.5 px-6 ${allAnswered
                            ? 'bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200'
                            : 'bg-gray-300 cursor-not-allowed'
                            }`}
                    >
                        {submitQuizMutation.isPending ? (
                            <><Loader2 className="w-4 h-4 animate-spin" /> Enviando...</>
                        ) : (
                            <>Finalizar Evaluación <ChevronRight className="w-4 h-4" /></>
                        )}
                    </Button>
                ) : (
                    <Button
                        onClick={() => setCurrentIndex(i => i + 1)}
                        className="gap-1.5"
                    >
                        Siguiente <ChevronRight className="w-4 h-4" />
                    </Button>
                )}
            </div>
        </div>
    );
}
