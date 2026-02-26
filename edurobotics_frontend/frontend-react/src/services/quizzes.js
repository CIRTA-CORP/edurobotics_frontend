import { apiGet, apiPost, apiDelete, apiRequest } from './api';

/**
 * Quiz Service
 * Handles all quiz-related API calls using the centralized API client
 */
const quizService = {
    /**
     * List all quizzes for a unit
     */
    listUnitQuizzes: async (unitId) => {
        try {
            const response = await apiGet(`/api/units/${unitId}/quizzes`);
            return response.quizzes || [];
        } catch (error) {
            console.error('Error listing unit quizzes:', error);
            return [];
        }
    },

    /**
     * List all quizzes for a module
     */
    listModuleQuizzes: async (moduleId) => {
        try {
            const response = await apiGet(`/api/modules/${moduleId}/quizzes`);
            return response.quizzes || [];
        } catch (error) {
            console.error('Error listing module quizzes:', error);
            return [];
        }
    },

    /**
     * Get quiz details for a student (no correct answers)
     */
    getQuiz: async (quizId) => {
        return apiGet(`/api/quizzes/${quizId}`);
    },

    /**
     * Get quiz details for admin (includes correct answers)
     */
    getAdminQuiz: async (quizId) => {
        return apiGet(`/api/admin/quizzes/${quizId}`);
    },

    /**
     * Create a new quiz
     */
    createQuiz: async (quizData) => {
        return apiPost(`/api/admin/quizzes`, quizData);
    },

    /**
     * Delete a quiz
     */
    deleteQuiz: async (quizId) => {
        return apiDelete(`/api/quizzes/${quizId}`);
    },

    /**
     * Update quiz settings (title, passing criteria)
     */
    updateQuiz: async (quizId, data) => {
        return apiRequest(`/api/quizzes/${quizId}`, {
            method: 'PATCH',
            body: JSON.stringify(data)
        });
    },

    /**
   * Add a question to a quiz
   */
    addQuestion: async (quizId, questionData) => {
        return apiPost(`/api/quizzes/${quizId}/questions`, questionData);
    },

    /**
     * Update a question
     */
    updateQuestion: async (questionId, questionData) => {
        return apiRequest(`/api/questions/${questionId}`, {
            method: 'PATCH',
            body: JSON.stringify(questionData)
        });
    },

    /**
     * Delete a question
     */
    deleteQuestion: async (questionId) => {
        return apiRequest(`/api/questions/${questionId}`, {
            method: 'DELETE'
        });
    },

    /**
     * Add an answer to a question
     */
    addAnswer: async (questionId, answerData) => {
        return apiPost(`/api/questions/${questionId}/answers`, {
            answer_text: answerData.answer_text,
            is_correct: answerData.is_correct || false,
            explanation: answerData.explanation || null
        });
    },

    /**
     * Update an answer
     */
    updateAnswer: async (answerId, answerData) => {
        return apiRequest(`/api/answers/${answerId}`, {
            method: 'PATCH',
            body: JSON.stringify({
                answer_text: answerData.answer_text,
                is_correct: answerData.is_correct,
                explanation: answerData.explanation !== undefined ? answerData.explanation : undefined
            })
        });
    },

    /**
     * Delete an answer
     */
    deleteAnswer: async (answerId) => {
        return apiRequest(`/api/answers/${answerId}`, {
            method: 'DELETE'
        });
    },

    /**
     * Submit quiz answers
     */
    submitQuiz: async (quizId, submissionData) => {
        return apiPost(`/api/quizzes/${quizId}/submit`, submissionData);
    }
};

export default quizService;
