import { useState, useEffect, useCallback } from 'react';
import { Button } from '../../../../components/ui/button';
import {
    Plus, Trash2, X, HelpCircle, Check, Loader2, AlertCircle,
    ClipboardCheck, BookOpen, Settings, ChevronDown, ChevronUp, MessageSquare, Edit3
} from 'lucide-react';
import quizService from '../../../../services/quizzes';

/**
 * QuizEditor — Full-page tab component for managing quizzes
 * Designed to match the admin panel aesthetic (Cursos, Módulos, Unidades, Contenido)
 */
export function QuizEditor({ unitId, moduleId }) {
    const [quizzes, setQuizzes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedQuiz, setSelectedQuiz] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('success');
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [confirmDelete, setConfirmDelete] = useState(null); // { type: 'quiz'|'question', id, title }
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [editTitleValue, setEditTitleValue] = useState('');

    const showMessage = useCallback((msg, type = 'success') => {
        setMessage(msg);
        setMessageType(type);
        setTimeout(() => setMessage(''), 3000);
    }, []);

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
            showMessage('Error al cargar evaluaciones', 'error');
        } finally {
            setLoading(false);
        }
    }, [unitId, moduleId, showMessage]);

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
            showMessage('Título actualizado exitosamente');
            // Refresh list in background to sync main list
            loadQuizzes();
        } catch (err) {
            showMessage('Error al actualizar el título', 'error');
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
            showMessage('Evaluación creada');
            setNewTitle('');
            setShowCreateForm(false);
            await loadQuizzes();
        } catch (err) {
            showMessage('Error al crear', 'error');
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
            showMessage('Evaluación eliminada');
            setConfirmDelete(null);
            await loadQuizzes();
        } catch (err) {
            showMessage('Error al eliminar', 'error');
        }
    };

    const startEditing = async (quiz) => {
        try {
            setLoading(true);
            const data = await quizService.getAdminQuiz(quiz.id);
            setSelectedQuiz(data);
            setQuestions(data.questions || []);
        } catch (err) {
            showMessage('No se pudieron cargar los detalles', 'error');
        } finally {
            setLoading(false);
        }
    };

    // ── QUESTION CRUD ──
    const handleAddQuestion = async (type = 'alternative') => {
        try {
            setSaving(true);
            const res = await quizService.addQuestion(selectedQuiz.id, {
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
            const data = await quizService.getAdminQuiz(selectedQuiz.id);
            setQuestions(data.questions);
            showMessage('Pregunta añadida');
        } catch (err) {
            showMessage('Error al añadir pregunta', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleSaveQuestion = async (questionId, text) => {
        try {
            await quizService.updateQuestion(questionId, { question_text: text });
            showMessage('Pregunta guardada');
        } catch (err) {
            showMessage('Error al guardar', 'error');
        }
    };

    const handleDeleteQuestion = async (questionId) => {
        try {
            setSaving(true);
            await quizService.deleteQuestion(questionId);
            const data = await quizService.getAdminQuiz(selectedQuiz.id);
            setQuestions(data.questions);
            showMessage('Pregunta eliminada');
            setConfirmDelete(null);
        } catch (err) {
            showMessage('Error al eliminar', 'error');
        } finally {
            setSaving(false);
        }
    };

    // ── ANSWER CRUD ──
    const handleAddAnswer = async (questionId) => {
        try {
            setSaving(true);
            await quizService.addAnswer(questionId, { answer_text: 'Nueva opción', is_correct: false });
            const data = await quizService.getAdminQuiz(selectedQuiz.id);
            setQuestions(data.questions);
        } catch (err) {
            showMessage('Error al añadir opción', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleSaveAnswer = async (answerId, text, explanation) => {
        try {
            await quizService.updateAnswer(answerId, { answer_text: text, explanation: explanation || null });
        } catch (err) {
            showMessage('Error al guardar opción', 'error');
        }
    };

    const handleSetCorrect = async (questionId, answerId) => {
        try {
            setSaving(true);
            await quizService.updateAnswer(answerId, { is_correct: true });
            const data = await quizService.getAdminQuiz(selectedQuiz.id);
            setQuestions(data.questions);
            showMessage('Respuesta correcta actualizada');
        } catch (err) {
            showMessage('Error al marcar', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteAnswer = async (answerId) => {
        try {
            setSaving(true);
            await quizService.deleteAnswer(answerId);
            const data = await quizService.getAdminQuiz(selectedQuiz.id);
            setQuestions(data.questions);
            setConfirmDelete(null);
        } catch (err) {
            showMessage('Error al eliminar opción', 'error');
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

    // ── TOAST ──
    const Toast = message ? (
        <div className={`mb-4 p-3 rounded-lg border flex items-center gap-2 text-sm font-medium ${messageType === 'error'
            ? 'bg-red-50 border-red-200 text-red-700'
            : 'bg-emerald-50 border-emerald-200 text-emerald-700'
            }`}>
            {messageType === 'error' ? <AlertCircle className="w-4 h-4" /> : <Check className="w-4 h-4" />}
            {message}
        </div>
    ) : null;

    // ══════════════════════════════════════
    // VISTA: EDITOR DE PREGUNTAS
    // ══════════════════════════════════════
    if (selectedQuiz) {
        return (
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => { setSelectedQuiz(null); setQuestions([]); }}
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
                                {saving && <span className="ml-2 text-gray-400">Guardando...</span>}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button onClick={() => handleAddQuestion('alternative')} variant="outline" size="sm" className="gap-1.5 text-xs">
                            <Plus className="w-3.5 h-3.5" /> Alternativa
                        </Button>
                        <Button onClick={() => handleAddQuestion('true_false')} size="sm" className="gap-1.5 text-xs">
                            <Plus className="w-3.5 h-3.5" /> V/F
                        </Button>
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
                                        showMessage('Configuración actualizada');
                                    } catch { showMessage('Error al actualizar', 'error'); }
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
                                            showMessage('Puntaje actualizado');
                                        } catch { showMessage('Error al actualizar', 'error'); }
                                    }}
                                    onTouchEnd={async (e) => {
                                        try {
                                            await quizService.updateQuiz(selectedQuiz.id, { passing_score: parseInt(e.target.value) });
                                            showMessage('Puntaje actualizado');
                                        } catch { showMessage('Error al actualizar', 'error'); }
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

                {Toast}

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

                {/* Questions */}
                {questions.length === 0 ? (
                    <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50">
                        <HelpCircle className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                        <p className="text-sm text-gray-500 font-medium">Añade tu primera pregunta para comenzar</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {questions.map((q, idx) => (
                            <QuestionBlock
                                key={q.id}
                                q={q}
                                idx={idx}
                                onSaveQuestion={handleSaveQuestion}
                                onDeleteQuestion={() => setConfirmDelete({ type: 'question', id: q.id })}
                                onSetCorrect={handleSetCorrect}
                                onSaveAnswer={handleSaveAnswer}
                                onAddAnswer={handleAddAnswer}
                                onDeleteAnswer={handleDeleteAnswer}
                            />
                        ))}
                    </div>
                )}
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
                        <Button variant="outline" size="sm" onClick={() => { setShowCreateForm(false); setNewTitle(''); }}>
                            Cancelar
                        </Button>
                        <Button size="sm" onClick={handleCreateQuiz} disabled={!newTitle.trim() || saving} className="gap-1.5">
                            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                            Crear
                        </Button>
                    </div>
                </div>
            )}

            {Toast}

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


/**
 * QuestionBlock — Self-contained question editor
 * Uses local state for inputs to avoid parent re-renders (performance)
 */
function QuestionBlock({ q, idx, onSaveQuestion, onDeleteQuestion, onSetCorrect, onSaveAnswer, onAddAnswer, onDeleteAnswer }) {
    const [questionText, setQuestionText] = useState(q.question_text);
    const [showExplanations, setShowExplanations] = useState({});
    const [answerTexts, setAnswerTexts] = useState({});
    const [explanationTexts, setExplanationTexts] = useState({});
    const [dirty, setDirty] = useState(false);

    // Init local answer state
    useEffect(() => {
        const texts = {};
        const exps = {};
        q.answers.forEach(a => {
            texts[a.id] = a.answer_text;
            exps[a.id] = a.explanation || '';
        });
        setAnswerTexts(texts);
        setExplanationTexts(exps);
    }, [q.answers]);

    const toggleExplanation = (answerId) => {
        setShowExplanations(prev => ({ ...prev, [answerId]: !prev[answerId] }));
    };

    return (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            {/* Question Header */}
            <div className="p-4 bg-gray-50 border-b border-gray-200">
                <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg bg-gray-200 text-gray-600 flex-shrink-0 flex items-center justify-center text-xs font-bold mt-0.5">
                        {idx + 1}
                    </div>
                    <div className="flex-1 space-y-2">
                        <input
                            type="text"
                            className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            value={questionText}
                            onChange={(e) => { setQuestionText(e.target.value); setDirty(true); }}
                            placeholder="Escribe el enunciado aquí..."
                        />
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                {q.question_type === 'true_false' ? 'Verdadero / Falso' : 'Opción Múltiple'}
                            </span>
                            <div className="flex items-center gap-1.5">
                                {dirty && (
                                    <Button size="sm" variant="outline" className="text-xs h-7 px-2.5"
                                        onClick={() => { onSaveQuestion(q.id, questionText); setDirty(false); }}>
                                        <Check className="w-3 h-3 mr-1" /> Guardar
                                    </Button>
                                )}
                                <Button size="sm" variant="ghost" className="text-gray-400 hover:text-red-500 h-7 px-2"
                                    onClick={() => onDeleteQuestion(q.id)}>
                                    <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Answers */}
            <div className="p-4 space-y-2">
                {[...q.answers].sort((a, b) => a.id - b.id).map(a => (
                    <div key={a.id} className="space-y-1">
                        <div className={`flex items-center gap-2.5 p-2.5 rounded-lg border ${a.is_correct ? 'border-emerald-200 bg-emerald-50/40' : 'border-gray-100 bg-white'
                            }`}>
                            {/* Correct toggle */}
                            <button
                                onClick={() => onSetCorrect(q.id, a.id)}
                                className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 cursor-pointer ${a.is_correct ? 'bg-emerald-500 text-white' : 'bg-gray-100 hover:bg-emerald-100'
                                    }`}
                            >
                                {a.is_correct && <Check className="w-3 h-3" />}
                            </button>

                            {/* Answer text */}
                            <input
                                className={`flex-1 bg-transparent border-none outline-none text-sm ${a.is_correct ? 'text-emerald-900 font-medium' : 'text-gray-700'
                                    }`}
                                value={answerTexts[a.id] ?? a.answer_text}
                                onChange={(e) => setAnswerTexts(prev => ({ ...prev, [a.id]: e.target.value }))}
                                onBlur={() => onSaveAnswer(a.id, answerTexts[a.id], explanationTexts[a.id])}
                                placeholder="Respuesta..."
                            />

                            {/* Explanation toggle */}
                            {!a.is_correct && (
                                <button
                                    onClick={() => toggleExplanation(a.id)}
                                    className={`p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 ${(explanationTexts[a.id] || showExplanations[a.id]) ? 'text-amber-500' : ''
                                        }`}
                                    title="Justificación (opcional)"
                                >
                                    <MessageSquare className="w-3.5 h-3.5" />
                                </button>
                            )}

                            {/* Delete answer */}
                            {q.question_type !== 'true_false' && (
                                <button onClick={() => onDeleteAnswer(a.id)}
                                    className="p-1 text-gray-300 hover:text-red-500 rounded">
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>

                        {/* Explanation input (collapsible) */}
                        {!a.is_correct && showExplanations[a.id] && (
                            <div className="ml-8 mr-2">
                                <input
                                    className="w-full bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-900 placeholder:text-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-300"
                                    value={explanationTexts[a.id] ?? ''}
                                    onChange={(e) => setExplanationTexts(prev => ({ ...prev, [a.id]: e.target.value }))}
                                    onBlur={() => onSaveAnswer(a.id, answerTexts[a.id], explanationTexts[a.id])}
                                    placeholder="¿Por qué esta respuesta es incorrecta? (opcional)"
                                />
                            </div>
                        )}
                    </div>
                ))}

                {q.question_type !== 'true_false' && (
                    <button onClick={() => onAddAnswer(q.id)}
                        className="inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg text-xs font-medium transition-colors">
                        <Plus className="w-3.5 h-3.5" /> Añadir Opción
                    </button>
                )}
            </div>
        </div>
    );
}
