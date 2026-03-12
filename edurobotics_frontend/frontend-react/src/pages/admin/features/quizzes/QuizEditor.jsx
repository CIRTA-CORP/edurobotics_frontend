import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { Button } from '../../../../components/ui/button';
import {
    Plus, Trash2, X, HelpCircle, Check, Loader2, AlertCircle,
    ClipboardCheck, BookOpen, Settings, Edit3
} from 'lucide-react';
import quizService from '../../../../services/quizzes';
import { QuestionBlock } from './QuestionBlock';

/**
 * QuizEditor — Full-page tab component for managing quizzes
 * 
 * Key performance improvements:
 * - Optimistic UI: local state updates first, API syncs in background
 * - Collapsible questions: each QuestionBlock starts collapsed
 * - Sticky footer: "Add Question" buttons always visible
 * - Sonner toasts: no more inline message banners
 */
export function QuizEditor({ unitId, moduleId }) {
    const [quizzes, setQuizzes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedQuiz, setSelectedQuiz] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [saving, setSaving] = useState(false);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [confirmDelete, setConfirmDelete] = useState(null);
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [editTitleValue, setEditTitleValue] = useState('');

    const loadQuizzes = useCallback(async () => {
        try {
            setLoading(true);
            let data = [];
            if (unitId) {
                data = await quizService.listUnitQuizzes(unitId);
            } else if (moduleId) {
                data = await quizService.listModuleQuizzes(moduleId);
            }
            setQuizzes(data);
        } catch (err) {
            toast.error('Error al cargar evaluaciones');
        } finally {
            setLoading(false);
        }
    }, [unitId, moduleId]);

    useEffect(() => {
        loadQuizzes();
        setSelectedQuiz(null);
        setQuestions([]);
    }, [loadQuizzes]);

    // ── QUIZ CRUD ──
    const handleSaveTitle = async () => {
        if (!editTitleValue.trim() || editTitleValue === selectedQuiz.title) {
            setIsEditingTitle(false);
            return;
        }
        try {
            setSaving(true);
            await quizService.updateQuiz(selectedQuiz.id, { title: editTitleValue.trim() });
            setSelectedQuiz(prev => ({ ...prev, title: editTitleValue.trim() }));
            setIsEditingTitle(false);
            toast.success('Título actualizado');
            loadQuizzes();
        } catch (err) {
            toast.error('Error al actualizar el título');
        } finally {
            setSaving(false);
        }
    };

    const handleCreateQuiz = async () => {
        if (!newTitle.trim()) return;
        try {
            setSaving(true);
            await quizService.createQuiz({
                title: newTitle.trim(),
                unit_id: unitId || null,
                module_id: moduleId || null
            });
            toast.success('Evaluación creada');
            setNewTitle('');
            setShowCreateForm(false);
            await loadQuizzes();
        } catch (err) {
            toast.error('Error al crear evaluación');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteQuiz = async (id) => {
        try {
            await quizService.deleteQuiz(id);
            if (selectedQuiz?.id === id) {
                setSelectedQuiz(null);
                setQuestions([]);
            }
            toast.success('Evaluación eliminada');
            setConfirmDelete(null);
            await loadQuizzes();
        } catch (err) {
            toast.error('Error al eliminar');
        }
    };

    const startEditing = async (quiz) => {
        try {
            setLoading(true);
            const data = await quizService.getAdminQuiz(quiz.id);
            setSelectedQuiz(data);
            setQuestions(data.questions || []);
        } catch (err) {
            toast.error('No se pudieron cargar los detalles');
        } finally {
            setLoading(false);
        }
    };

    // ── QUESTION CRUD (optimistic) ──
    const handleAddQuestion = async (type = 'alternative') => {
        // 1) Optimistic: add a placeholder question to local state immediately
        const tempId = `temp-${Date.now()}`;
        const defaultAnswers = type === 'true_false'
            ? [
                { id: `ta-${Date.now()}-1`, answer_text: 'Verdadero', is_correct: true, explanation: null },
                { id: `ta-${Date.now()}-2`, answer_text: 'Falso', is_correct: false, explanation: null },
            ]
            : [
                { id: `ta-${Date.now()}-1`, answer_text: 'Opción 1', is_correct: true, explanation: null },
            ];

        const optimisticQuestion = {
            id: tempId,
            question_text: type === 'true_false' ? 'Pregunta de Verdadero o Falso' : 'Nueva pregunta',
            question_type: type,
            answers: defaultAnswers,
        };

        setQuestions(prev => [...prev, optimisticQuestion]);
        toast.success('Pregunta añadida');

        // 2) API call in background
        try {
            setSaving(true);
            const res = await quizService.addQuestion(selectedQuiz.id, {
                question_text: optimisticQuestion.question_text,
                question_type: type
            });

            if (res.success && res.question_id) {
                if (type === 'true_false') {
                    await Promise.all([
                        quizService.addAnswer(res.question_id, { answer_text: 'Verdadero', is_correct: true }),
                        quizService.addAnswer(res.question_id, { answer_text: 'Falso', is_correct: false }),
                    ]);
                } else {
                    await quizService.addAnswer(res.question_id, { answer_text: 'Opción 1', is_correct: true });
                }
            }

            // 3) Sync with real data from server (replaces temp IDs)
            const data = await quizService.getAdminQuiz(selectedQuiz.id);
            setQuestions(data.questions);
        } catch (err) {
            // Rollback: remove optimistic question
            setQuestions(prev => prev.filter(q => q.id !== tempId));
            toast.error('Error al añadir pregunta');
        } finally {
            setSaving(false);
        }
    };

    const handleSaveQuestion = async (questionId, text) => {
        try {
            await quizService.updateQuestion(questionId, { question_text: text });
            toast.success('Pregunta guardada');
        } catch (err) {
            toast.error('Error al guardar');
        }
    };

    const handleDeleteQuestion = async (questionId) => {
        // Optimistic: remove from local state immediately
        const backup = [...questions];
        setQuestions(prev => prev.filter(q => q.id !== questionId));
        setConfirmDelete(null);
        toast.success('Pregunta eliminada');

        try {
            setSaving(true);
            await quizService.deleteQuestion(questionId);
        } catch (err) {
            // Rollback
            setQuestions(backup);
            toast.error('Error al eliminar');
        } finally {
            setSaving(false);
        }
    };

    // ── ANSWER CRUD (optimistic) ──
    const handleAddAnswer = async (questionId) => {
        // Optimistic: add placeholder answer
        const tempAnswerId = `ta-${Date.now()}`;
        setQuestions(prev => prev.map(q => {
            if (q.id !== questionId) return q;
            return { ...q, answers: [...q.answers, { id: tempAnswerId, answer_text: 'Nueva opción', is_correct: false, explanation: null }] };
        }));

        try {
            setSaving(true);
            await quizService.addAnswer(questionId, { answer_text: 'Nueva opción', is_correct: false });
            const data = await quizService.getAdminQuiz(selectedQuiz.id);
            setQuestions(data.questions);
        } catch (err) {
            // Rollback
            setQuestions(prev => prev.map(q => {
                if (q.id !== questionId) return q;
                return { ...q, answers: q.answers.filter(a => a.id !== tempAnswerId) };
            }));
            toast.error('Error al añadir opción');
        } finally {
            setSaving(false);
        }
    };

    const handleSaveAnswer = async (answerId, text, explanation) => {
        try {
            await quizService.updateAnswer(answerId, { answer_text: text, explanation: explanation || null });
        } catch (err) {
            toast.error('Error al guardar opción');
        }
    };

    const handleSetCorrect = async (questionId, answerId) => {
        // Optimistic: update local state immediately
        setQuestions(prev => prev.map(q => {
            if (q.id !== questionId) return q;
            return { ...q, answers: q.answers.map(a => ({ ...a, is_correct: a.id === answerId })) };
        }));
        toast.success('Respuesta correcta actualizada');

        try {
            setSaving(true);
            await quizService.updateAnswer(answerId, { is_correct: true });
        } catch (err) {
            // Refetch to restore correct state
            const data = await quizService.getAdminQuiz(selectedQuiz.id);
            setQuestions(data.questions);
            toast.error('Error al marcar');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteAnswer = async (answerId) => {
        // Optimistic: remove from local state
        const backup = questions.map(q => ({ ...q, answers: [...q.answers] }));
        setQuestions(prev => prev.map(q => ({
            ...q, answers: q.answers.filter(a => a.id !== answerId)
        })));

        try {
            setSaving(true);
            await quizService.deleteAnswer(answerId);
            setConfirmDelete(null);
        } catch (err) {
            setQuestions(backup);
            toast.error('Error al eliminar opción');
        } finally {
            setSaving(false);
        }
    };

    // ── LOADING ──
    if (loading && !selectedQuiz) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400 mb-4" />
                <p className="text-sm text-gray-500">Cargando evaluaciones...</p>
            </div>
        );
    }

    // ══════════════════════════════════════
    // VISTA: EDITOR DE PREGUNTAS
    // ══════════════════════════════════════
    if (selectedQuiz) {
        return (
            <div className="space-y-4 relative">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => { setSelectedQuiz(null); setQuestions([]) }}
                            className="w-9 h-9 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                        <div>
                            {isEditingTitle ? (
                                <div className="flex items-center gap-1">
                                    <input
                                        type="text"
                                        className="text-lg font-semibold text-gray-900 bg-white border border-gray-200 rounded px-2 py-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        value={editTitleValue}
                                        onChange={(e) => setEditTitleValue(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleSaveTitle();
                                            if (e.key === 'Escape') setIsEditingTitle(false);
                                        }}
                                        autoFocus
                                    />
                                    <Button size="sm" variant="ghost" onClick={handleSaveTitle} className="h-7 w-7 p-0 text-blue-600">
                                        <Check className="w-4 h-4" />
                                    </Button>
                                    <Button size="sm" variant="ghost" onClick={() => setIsEditingTitle(false)} className="h-7 w-7 p-0 text-gray-400 hover:text-red-500">
                                        <X className="w-4 h-4" />
                                    </Button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 group">
                                    <h3 className="text-lg font-semibold text-gray-900 leading-tight">{selectedQuiz.title}</h3>
                                    <button
                                        onClick={() => {
                                            setEditTitleValue(selectedQuiz.title);
                                            setIsEditingTitle(true);
                                        }}
                                        className="opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity p-1 text-gray-400 hover:text-blue-600 rounded"
                                        title="Editar Título"
                                    >
                                        <Edit3 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            )}
                            <p className="text-xs text-gray-500 mt-0.5">
                                {questions.length} pregunta{questions.length !== 1 ? 's' : ''} · Mínimo: {selectedQuiz.passing_score}%
                                {saving && <span className="ml-2 text-gray-400">Sincronizando...</span>}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Settings Panel */}
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-3">
                    <div className="flex items-center gap-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        <Settings className="w-3.5 h-3.5" />
                        Configuración de aprobación
                    </div>
                    <div className="flex flex-wrap items-end gap-4">
                        <div className="flex-1 min-w-[180px]">
                            <label className="block text-xs font-medium text-gray-600 mb-1">Tipo de aprobación</label>
                            <select
                                value={selectedQuiz.passing_type || 'score'}
                                onChange={async (e) => {
                                    const newType = e.target.value;
                                    setSelectedQuiz(prev => ({ ...prev, passing_type: newType }));
                                    try {
                                        await quizService.updateQuiz(selectedQuiz.id, { passing_type: newType });
                                        toast.success('Configuración actualizada');
                                    } catch { toast.error('Error al actualizar'); }
                                }}
                                className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            >
                                <option value="score">Puntaje mínimo (%)</option>
                                <option value="all_correct">Todas las respuestas correctas</option>
                            </select>
                        </div>
                        {(selectedQuiz.passing_type || 'score') === 'score' && (
                            <div className="flex-1 min-w-[180px]">
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                    Puntaje mínimo: <span className="font-bold text-blue-600">{selectedQuiz.passing_score ?? 80}%</span>
                                </label>
                                <input
                                    type="range"
                                    min="10"
                                    max="100"
                                    step="5"
                                    value={selectedQuiz.passing_score ?? 80}
                                    onChange={(e) => {
                                        setSelectedQuiz(prev => ({ ...prev, passing_score: parseInt(e.target.value) }));
                                    }}
                                    onMouseUp={async (e) => {
                                        try {
                                            await quizService.updateQuiz(selectedQuiz.id, { passing_score: parseInt(e.target.value) });
                                            toast.success('Puntaje actualizado');
                                        } catch { toast.error('Error al actualizar'); }
                                    }}
                                    onTouchEnd={async (e) => {
                                        try {
                                            await quizService.updateQuiz(selectedQuiz.id, { passing_score: parseInt(e.target.value) });
                                            toast.success('Puntaje actualizado');
                                        } catch { toast.error('Error al actualizar'); }
                                    }}
                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                />
                                <div className="flex justify-between text-[10px] text-gray-400 mt-0.5">
                                    <span>10%</span>
                                    <span>100%</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Confirm Delete Dialog */}
                {confirmDelete && confirmDelete.type === 'question' && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-red-500" />
                            <span className="text-sm text-red-800">¿Eliminar esta pregunta? No se puede deshacer.</span>
                        </div>
                        <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => setConfirmDelete(null)}>Cancelar</Button>
                            <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white" onClick={() => handleDeleteQuestion(confirmDelete.id)}>Eliminar</Button>
                        </div>
                    </div>
                )}

                {/* Questions (collapsible) */}
                {questions.length === 0 ? (
                    <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50">
                        <HelpCircle className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                        <p className="text-sm text-gray-500 font-medium">Añade tu primera pregunta para comenzar</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {questions.map((q, idx) => (
                            <QuestionBlock
                                key={q.id}
                                q={q}
                                idx={idx}
                                defaultExpanded={typeof q.id === 'string' && q.id.startsWith('temp-')}
                                onSaveQuestion={handleSaveQuestion}
                                onDeleteQuestion={(qId) => setConfirmDelete({ type: 'question', id: qId })}
                                onSetCorrect={handleSetCorrect}
                                onSaveAnswer={handleSaveAnswer}
                                onAddAnswer={handleAddAnswer}
                                onDeleteAnswer={handleDeleteAnswer}
                            />
                        ))}
                    </div>
                )}

                {/* Sticky Add Question Footer */}
                <div className="sticky bottom-0 bg-white/90 backdrop-blur-sm border-t border-gray-200 -mx-3 px-3 py-3 mt-4 flex items-center justify-between rounded-b-xl">
                    <span className="text-xs text-gray-400">
                        {questions.length} pregunta{questions.length !== 1 ? 's' : ''}
                    </span>
                    <div className="flex gap-2">
                        <Button onClick={() => handleAddQuestion('alternative')} variant="outline" size="sm" className="gap-1.5 text-xs" disabled={saving}>
                            <Plus className="w-3.5 h-3.5" /> Alternativa
                        </Button>
                        <Button onClick={() => handleAddQuestion('true_false')} size="sm" className="gap-1.5 text-xs" disabled={saving}>
                            <Plus className="w-3.5 h-3.5" /> V/F
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    // ══════════════════════════════════════
    // VISTA: LISTA DE QUIZZES
    // ══════════════════════════════════════
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Evaluaciones</h3>
                {!showCreateForm && (
                    <Button onClick={() => setShowCreateForm(true)} className="gap-1.5">
                        <Plus className="w-4 h-4" /> Crear Evaluación
                    </Button>
                )}
            </div>

            {/* Inline Create Form */}
            {showCreateForm && (
                <div className="p-4 bg-white rounded-xl border border-gray-200 space-y-3">
                    <label className="block text-sm font-medium text-gray-700">Título de la evaluación</label>
                    <input
                        type="text"
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Ej: Evaluación Final - Unidad 1"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleCreateQuiz()}
                        autoFocus
                    />
                    <div className="flex items-center gap-2 justify-end">
                        <Button variant="outline" size="sm" onClick={() => { setShowCreateForm(false); setNewTitle('') }}>
                            Cancelar
                        </Button>
                        <Button size="sm" onClick={handleCreateQuiz} disabled={!newTitle.trim() || saving} className="gap-1.5">
                            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                            Crear
                        </Button>
                    </div>
                </div>
            )}

            {quizzes.length === 0 ? (
                <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50">
                    <ClipboardCheck className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm text-gray-500 font-medium">No hay evaluaciones configuradas</p>
                    <p className="text-xs text-gray-400 mt-1">Crea la primera evaluación para esta unidad</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {quizzes.map(q => (
                        <div key={q.id} className="p-4 bg-white rounded-xl border border-gray-200 flex flex-wrap items-center justify-between hover:border-gray-300 hover:shadow-sm transition-all">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-lg bg-gray-100 text-gray-500 flex items-center justify-center">
                                    <BookOpen className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-gray-900 text-sm">{q.title}</h4>
                                    <span className="text-xs text-gray-500">Mínimo: {q.passing_score}%</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Button onClick={() => startEditing(q)} variant="outline" size="sm" className="text-xs gap-1.5">
                                    <Settings className="w-3.5 h-3.5" /> Gestionar
                                </Button>
                                <Button onClick={() => setConfirmDelete({ type: 'quiz', id: q.id, title: q.title })} variant="ghost" size="sm"
                                    className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-2">
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                            {/* Inline confirm delete for this quiz */}
                            {confirmDelete && confirmDelete.type === 'quiz' && confirmDelete.id === q.id && (
                                <div className="w-full mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                                    <span className="text-xs text-red-600">¿Eliminar "{q.title}"? No se puede deshacer.</span>
                                    <div className="flex gap-2">
                                        <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => setConfirmDelete(null)}>Cancelar</Button>
                                        <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white text-xs h-7" onClick={() => handleDeleteQuiz(q.id)}>Eliminar</Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
