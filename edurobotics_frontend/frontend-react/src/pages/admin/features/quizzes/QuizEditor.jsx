import { useState, useEffect } from 'react';
import { Button } from '../../../../components/ui/button';
import { Card, CardContent } from '../../../../components/ui/card';
import {
    Plus, Trash2, Save, X, HelpCircle, Check, Loader2, AlertCircle,
    ClipboardCheck, BookOpen, Settings, ChevronRight, Edit3
} from 'lucide-react';
import quizService from '../../../../services/quizzes';
import { cn } from '../../../../lib/utils';

/**
 * QuizEditor Component
 * Perfectly aligned with EduRobotics Admin aesthetics
 */
export function QuizEditor({ unitId, moduleId, onBack }) {
    const [quizzes, setQuizzes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingQuiz, setEditingQuiz] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('success');

    const showMessage = (msg, type = 'success') => {
        setMessage(msg);
        setMessageType(type);
        setTimeout(() => setMessage(''), 3000);
    };

    useEffect(() => {
        loadQuizzes();
    }, [unitId, moduleId]);

    const loadQuizzes = async () => {
        try {
            setLoading(true);
            let data = [];
            if (unitId) {
                data = await quizService.listUnitQuizzes(unitId);
            } else if (moduleId) {
                // Necesitamos este método en quizService
                data = await quizService.listModuleQuizzes(moduleId);
            }
            setQuizzes(data);
        } catch (err) {
            console.error('Error loading quizzes:', err);
            showMessage('Error al cargar cuestionarios', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateQuiz = async () => {
        const title = prompt('Título del cuestionario:');
        if (!title) return;

        try {
            setSaving(true);
            await quizService.createQuiz({
                title,
                unit_id: unitId || null,
                module_id: moduleId || null
            });
            showMessage('Cuestionario creado con éxito');
            await loadQuizzes();
        } catch (err) {
            showMessage('Error al crear el cuestionario', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteQuiz = async (id, title) => {
        if (!window.confirm(`¿Estás seguro de eliminar el examen "${title}"? esta acción no se puede deshacer.`)) return;
        try {
            await quizService.deleteQuiz(id);
            showMessage('Examen eliminado');
            await loadQuizzes();
        } catch (err) {
            showMessage('Error al eliminar', 'error');
        }
    };

    const startEditing = async (quiz) => {
        try {
            setLoading(true);
            const data = await quizService.getAdminQuiz(quiz.id);
            setEditingQuiz(data);
            setQuestions(data.questions || []);
        } catch (err) {
            showMessage('No se pudieron cargar los detalles', 'error');
        } finally {
            setLoading(false);
        }
    };

    // --- Question Handlers ---

    const handleAddQuestion = async (type = 'alternative') => {
        try {
            setSaving(true);
            const res = await quizService.addQuestion(editingQuiz.id, {
                question_text: type === 'true_false' ? 'Pregunta de Verdadero o Falso' : 'Nueva pregunta',
                question_type: type
            });

            if (res.success && res.question_id) {
                if (type === 'true_false') {
                    await quizService.addAnswer(res.question_id, { answer_text: 'Verdadero', is_correct: true });
                    await quizService.addAnswer(res.question_id, { answer_text: 'Falso', is_correct: false });
                } else {
                    await quizService.addAnswer(res.question_id, { answer_text: 'Opción 1', is_correct: true });
                }
            }

            const data = await quizService.getAdminQuiz(editingQuiz.id);
            setQuestions(data.questions);
            showMessage('Pregunta añadida');
        } catch (err) {
            showMessage('Fallo al añadir pregunta', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleUpdateQuestion = async (questionId, text) => {
        try {
            await quizService.updateQuestion(questionId, { question_text: text });
        } catch (err) {
            showMessage('Error al guardar texto', 'error');
        }
    };

    const handleDeleteQuestion = async (questionId) => {
        if (!window.confirm('¿Eliminar esta pregunta completamente?')) return;
        try {
            setSaving(true);
            await quizService.deleteQuestion(questionId);
            const data = await quizService.getAdminQuiz(editingQuiz.id);
            setQuestions(data.questions);
            showMessage('Pregunta eliminada');
        } catch (err) {
            showMessage('Fallo al eliminar', 'error');
        } finally {
            setSaving(false);
        }
    };

    // --- Answer Handlers ---

    const handleAddAnswer = async (questionId) => {
        try {
            setSaving(true);
            await quizService.addAnswer(questionId, {
                answer_text: 'Nueva opción',
                is_correct: false
            });
            const data = await quizService.getAdminQuiz(editingQuiz.id);
            setQuestions(data.questions);
        } catch (err) {
            showMessage('Fallo al añadir opción', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleUpdateAnswer = async (answerId, text) => {
        try {
            await quizService.updateAnswer(answerId, { answer_text: text });
        } catch (err) {
            showMessage('Error al guardar opción', 'error');
        }
    };

    const handleSetCorrect = async (questionId, answerId) => {
        try {
            setSaving(true);
            await quizService.updateAnswer(answerId, { is_correct: true });
            const data = await quizService.getAdminQuiz(editingQuiz.id);
            setQuestions(data.questions);
            showMessage('Respuesta correcta actualizada');
        } catch (err) {
            showMessage('Error al marcar respuesta', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteAnswer = async (answerId) => {
        if (!window.confirm('¿Borrar esta opción?')) return;
        try {
            setSaving(true);
            await quizService.deleteAnswer(answerId);
            const data = await quizService.getAdminQuiz(editingQuiz.id);
            setQuestions(data.questions);
        } catch (err) {
            showMessage('Error al eliminar opción', 'error');
        } finally {
            setSaving(false);
        }
    };

    // --- Main Layout ---

    if (loading && !editingQuiz) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-4" />
                <p className="text-sm text-gray-500 font-medium tracking-tight">Cargando evaluaciones...</p>
            </div>
        );
    }

    if (!editingQuiz) {
        return (
            <div className="space-y-4 animate-in fade-in duration-300">
                {/* Header like AdminDashboard */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center shadow-lg shadow-slate-200">
                            <ClipboardCheck className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-gray-900 leading-none">Exámenes Disponibles</h3>
                            <p className="text-[11px] text-gray-500 mt-1">{quizzes.length} evaluación{quizzes.length !== 1 ? 'es' : ''} en esta unidad</p>
                        </div>
                    </div>
                    <Button onClick={handleCreateQuiz} size="sm" className="bg-indigo-600 hover:bg-indigo-700 rounded-xl font-bold">
                        <Plus className="w-4 h-4 mr-1.5" /> Crear Examen
                    </Button>
                </div>

                {message && (
                    <div className={cn(
                        "p-3 rounded-xl border mb-4 flex items-center gap-2 animate-in slide-in-from-top-2 duration-300",
                        messageType === 'error' ? "bg-red-50 border-red-100 text-red-700" : "bg-emerald-50 border-emerald-100 text-emerald-700"
                    )}>
                        {messageType === 'error' ? <AlertCircle className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                        <span className="text-xs font-bold uppercase tracking-tight">{message}</span>
                    </div>
                )}

                <div className="space-y-3">
                    {quizzes.length === 0 ? (
                        <div className="text-center py-16 border-2 border-dashed border-gray-100 rounded-2xl bg-gray-50/50">
                            <HelpCircle className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                            <p className="text-sm text-gray-400 font-medium">No hay exámenes configurados</p>
                        </div>
                    ) : (
                        quizzes.map(q => (
                            <div key={q.id} className="p-4 bg-white rounded-xl border border-gray-200 flex items-center justify-between hover:border-indigo-300 hover:shadow-md transition-all duration-200 group">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300">
                                        <BookOpen className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-900 text-sm">{q.title}</h4>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[10px] font-black text-indigo-400 bg-indigo-50 px-2 py-0.5 rounded-full uppercase truncate">Mínimo: {q.passing_score}%</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button onClick={() => startEditing(q)} variant="outline" size="sm" className="rounded-xl font-bold text-xs h-9">
                                        Gestionar
                                    </Button>
                                    <button
                                        onClick={() => handleDeleteQuiz(q.id, q.title)}
                                        className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
            {/* Header refined */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-5 sticky top-0 bg-white/95 backdrop-blur-sm z-20 -mt-2 pt-2">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setEditingQuiz(null)}
                        className="w-10 h-10 rounded-2xl hover:bg-gray-100 flex items-center justify-center transition-all bg-gray-50 border border-gray-100 active:scale-90"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                    <div>
                        <h3 className="text-lg font-black text-gray-900 leading-none">{editingQuiz.title}</h3>
                        <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-[9px] font-black text-white bg-slate-800 px-2 py-0.5 rounded-full uppercase tracking-widest">Editor de Preguntas</span>
                            {saving && <span className="text-[9px] font-black text-indigo-500 animate-pulse flex items-center gap-1 uppercase"><Loader2 className="w-2.5 h-2.5 animate-spin" /> Guardando...</span>}
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button onClick={() => handleAddQuestion('alternative')} variant="outline" size="sm" className="rounded-xl border-gray-200 text-xs font-bold h-9">
                        <Plus className="w-3.5 h-3.5 mr-1" /> Alternativa
                    </Button>
                    <Button onClick={() => handleAddQuestion('true_false')} size="sm" className="bg-slate-800 hover:bg-black text-white rounded-xl text-xs font-bold h-9 shadow-lg shadow-slate-100">
                        <Plus className="w-3.5 h-3.5 mr-1" /> V/F
                    </Button>
                </div>
            </div>

            {message && (
                <div className={cn(
                    "p-3 rounded-xl border flex items-center gap-2 animate-in fade-in duration-300",
                    messageType === 'error' ? "bg-red-50 border-red-100 text-red-600" : "bg-emerald-50 border-emerald-100 text-emerald-600"
                )}>
                    {messageType === 'error' ? <AlertCircle className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                    <span className="text-[10px] font-black uppercase tracking-widest">{message}</span>
                </div>
            )}

            <div className="space-y-6 pb-12">
                {questions.length === 0 ? (
                    <div className="text-center py-20 rounded-2xl border-2 border-dashed border-gray-100 bg-gray-50/10">
                        <Info className="w-10 h-10 text-gray-100 mx-auto mb-4" />
                        <p className="text-sm font-medium text-gray-400">Añade tu primera pregunta para comenzar</p>
                    </div>
                ) : (
                    questions.map((q, idx) => (
                        <div key={q.id} className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:border-indigo-100 transition-all duration-300">
                            {/* Question Header */}
                            <div className="p-4 bg-gray-50/50 border-b border-gray-100 flex items-start justify-between gap-4">
                                <div className="flex gap-3 flex-1 min-w-0">
                                    <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex-shrink-0 flex items-center justify-center text-sm font-black shadow-md shadow-indigo-100">
                                        {idx + 1}
                                    </div>
                                    <div className="flex-1">
                                        <textarea
                                            className="w-full bg-transparent border-none focus:ring-0 outline-none font-bold text-gray-800 placeholder:text-gray-200 resize-none h-auto overflow-hidden text-sm pt-1.5"
                                            defaultValue={q.question_text}
                                            rows={1}
                                            onBlur={(e) => handleUpdateQuestion(q.id, e.target.value)}
                                            onInput={(e) => {
                                                e.target.style.height = 'auto';
                                                e.target.style.height = e.target.scrollHeight + 'px';
                                            }}
                                            placeholder="Escribe el enunciado aquí..."
                                        />
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[9px] font-black text-indigo-400 uppercase tracking-tighter">
                                                {q.question_type === 'true_false' ? 'Verdadero / Falso' : 'Opción Múltiple'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <button onClick={() => handleDeleteQuestion(q.id)} className="p-2 text-gray-300 hover:text-red-500 bg-white border border-transparent hover:border-red-100 rounded-xl transition-all shadow-sm">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Answers Area */}
                            <div className="p-5 bg-white space-y-3">
                                <div className="grid grid-cols-1 gap-2.5">
                                    {q.answers.map(a => (
                                        <div
                                            key={a.id}
                                            className={cn(
                                                "flex items-center gap-3 p-3 rounded-xl border-2 transition-all group",
                                                a.is_correct
                                                    ? "border-emerald-400 bg-emerald-50/40"
                                                    : "border-gray-50 bg-gray-50/20 hover:border-gray-100"
                                            )}
                                        >
                                            <button
                                                onClick={() => handleSetCorrect(q.id, a.id)}
                                                className={cn(
                                                    "w-7 h-7 rounded-lg flex items-center justify-center transition-all",
                                                    a.is_correct
                                                        ? "bg-emerald-500 text-white shadow-lg shadow-emerald-100"
                                                        : "bg-white border-2 border-gray-100 text-transparent hover:border-emerald-200 hover:text-emerald-200"
                                                )}
                                            >
                                                <Check className={cn("w-4 h-4", a.is_correct ? "scale-100" : "scale-0")} />
                                            </button>

                                            <input
                                                className={cn(
                                                    "flex-1 bg-transparent border-none outline-none text-xs font-bold focus:ring-0",
                                                    a.is_correct ? "text-emerald-900" : "text-gray-600"
                                                )}
                                                defaultValue={a.answer_text}
                                                onBlur={(e) => handleUpdateAnswer(a.id, e.target.value)}
                                                placeholder="Respuesta..."
                                            />

                                            {q.question_type !== 'true_false' && (
                                                <button onClick={() => handleDeleteAnswer(a.id)} className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-300 hover:text-red-500 hover:bg-white rounded-lg transition-all">
                                                    <X className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {q.question_type !== 'true_false' && (
                                    <button
                                        onClick={() => handleAddAnswer(q.id)}
                                        className="inline-flex items-center gap-2 mt-4 px-4 py-2 text-indigo-500 hover:bg-indigo-50 rounded-xl text-[11px] font-black transition-all group"
                                    >
                                        <Plus className="w-3.5 h-3.5 transition-transform group-hover:rotate-90" /> AÑADIR OPCIÓN
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
