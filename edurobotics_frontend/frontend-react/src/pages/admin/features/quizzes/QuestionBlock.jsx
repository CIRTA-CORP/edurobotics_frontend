/**
 * QuestionBlock — Self-contained, collapsible question editor
 *
 * Extracted from QuizEditor for better modularity.
 * Uses local state for inputs to avoid parent re-renders (performance).
 * Starts collapsed — shows only question text + answer count.
 * Expand to edit question and answers.
 */

import { useState, useEffect } from 'react'
import { Button } from '../../../../components/ui/button'
import {
    Trash2, X, Check, ChevronDown, ChevronUp,
    MessageSquare, Plus, GripVertical
} from 'lucide-react'

export function QuestionBlock({
    q, idx, onSaveQuestion, onDeleteQuestion,
    onSetCorrect, onSaveAnswer, onAddAnswer, onDeleteAnswer,
    defaultExpanded = false
}) {
    const [questionText, setQuestionText] = useState(q.question_text)
    const [showExplanations, setShowExplanations] = useState({})
    const [answerTexts, setAnswerTexts] = useState({})
    const [explanationTexts, setExplanationTexts] = useState({})
    const [dirty, setDirty] = useState(false)
    const [expanded, setExpanded] = useState(defaultExpanded)

    // Init local answer state
    useEffect(() => {
        const texts = {}
        const exps = {}
        q.answers.forEach(a => {
            texts[a.id] = a.answer_text
            exps[a.id] = a.explanation || ''
        })
        setAnswerTexts(texts)
        setExplanationTexts(exps)
    }, [q.answers])

    // Sync question text if parent updates it
    useEffect(() => {
        setQuestionText(q.question_text)
    }, [q.question_text])

    const toggleExplanation = (answerId) => {
        setShowExplanations(prev => ({ ...prev, [answerId]: !prev[answerId] }))
    }

    const correctAnswer = q.answers.find(a => a.is_correct)

    return (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden transition-all duration-200 hover:border-gray-300">
            {/* Collapsed Header — always visible */}
            <button
                type="button"
                className="w-full p-4 flex items-center gap-3 text-left hover:bg-gray-50/50 transition-colors"
                onClick={() => setExpanded(!expanded)}
            >
                <div className="w-7 h-7 rounded-lg bg-gray-200 text-gray-600 flex-shrink-0 flex items-center justify-center text-xs font-bold">
                    {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{questionText}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                            {q.question_type === 'true_false' ? 'V/F' : 'Opción Múltiple'}
                        </span>
                        <span className="text-[10px] text-gray-400">
                            · {q.answers.length} opciones
                        </span>
                        {correctAnswer && (
                            <span className="text-[10px] text-emerald-500 font-medium">
                                · ✓ {correctAnswer.answer_text}
                            </span>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                    {dirty && (
                        <span className="w-2 h-2 rounded-full bg-amber-400" title="Sin guardar" />
                    )}
                    {expanded ? (
                        <ChevronUp className="w-4 h-4 text-gray-400" />
                    ) : (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                    )}
                </div>
            </button>

            {/* Expanded Content */}
            {expanded && (
                <div className="border-t border-gray-200">
                    {/* Question Text Editor */}
                    <div className="p-4 bg-gray-50 border-b border-gray-200">
                        <div className="flex items-start gap-3">
                            <div className="flex-1 space-y-2">
                                <input
                                    type="text"
                                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                                    value={questionText}
                                    onChange={(e) => { setQuestionText(e.target.value); setDirty(true) }}
                                    placeholder="Escribe el enunciado aquí..."
                                    onClick={(e) => e.stopPropagation()}
                                />
                                <div className="flex items-center justify-end gap-1.5">
                                    {dirty && (
                                        <Button size="sm" variant="outline" className="text-xs h-7 px-2.5"
                                            onClick={(e) => { e.stopPropagation(); onSaveQuestion(q.id, questionText); setDirty(false) }}>
                                            <Check className="w-3 h-3 mr-1" /> Guardar
                                        </Button>
                                    )}
                                    <Button size="sm" variant="ghost" className="text-gray-400 hover:text-red-500 h-7 px-2"
                                        onClick={(e) => { e.stopPropagation(); onDeleteQuestion(q.id) }}>
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Answers */}
                    <div className="p-4 space-y-2">
                        {[...q.answers].sort((a, b) => a.id - b.id).map(a => (
                            <div key={a.id} className="space-y-1">
                                <div className={`flex items-center gap-2.5 p-2.5 rounded-lg border transition-colors ${a.is_correct ? 'border-emerald-200 bg-emerald-50/40' : 'border-gray-100 bg-white'
                                    }`}>
                                    {/* Correct toggle */}
                                    <button
                                        onClick={() => onSetCorrect(q.id, a.id)}
                                        className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 cursor-pointer transition-colors ${a.is_correct ? 'bg-emerald-500 text-white' : 'bg-gray-100 hover:bg-emerald-100'
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
                                            className={`p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors ${(explanationTexts[a.id] || showExplanations[a.id]) ? 'text-amber-500' : ''
                                                }`}
                                            title="Justificación (opcional)"
                                        >
                                            <MessageSquare className="w-3.5 h-3.5" />
                                        </button>
                                    )}

                                    {/* Delete answer */}
                                    {q.question_type !== 'true_false' && (
                                        <button onClick={() => onDeleteAnswer(a.id)}
                                            className="p-1 text-gray-300 hover:text-red-500 rounded transition-colors">
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
            )}
        </div>
    )
}
