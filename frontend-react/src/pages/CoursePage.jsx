import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getStoredUser } from '../services/auth'
import { getCourseDetail } from '../services/courses'

function CoursePage() {
  const { courseId } = useParams()
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [course, setCourse] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [expandedModuleId, setExpandedModuleId] = useState(null)

  useEffect(() => {
    const storedUser = getStoredUser()
    if (!storedUser) {
      navigate('/login')
      return
    }
    setUser(storedUser)
  }, [navigate])

  useEffect(() => {
    const loadCourse = async () => {
      try {
        const data = await getCourseDetail(courseId)
        setCourse(data)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    loadCourse()
  }, [courseId])

  if (loading) return <div className="loading">Cargando curso...</div>
  if (error) return <div className="error">{error}</div>
  if (!course) return <div className="error">Curso no encontrado</div>

  return (
    <div className="course-page">
      <header className="course-header">
        <button className="btn-outline" onClick={() => navigate('/dashboard')}>
          ← Volver a cursos
        </button>
        <div>
          <p className="course-header-meta">{course.level} · Versión {course.version}</p>
          <h1>{course.title}</h1>
          <p className="course-header-desc">{course.description || 'Curso sin descripción.'}</p>
        </div>
        {user && <span className="course-user">{user.first_name}</span>}
      </header>

      <div className="course-layout">
        <aside className="course-sidebar">
          <h3>Módulos</h3>
          <div className="course-module-list">
            {(course.modules || []).map((module) => (
              <button
                key={module.id}
                className={`course-module-item ${expandedModuleId === module.id ? 'active' : ''}`}
                onClick={() => setExpandedModuleId(expandedModuleId === module.id ? null : module.id)}
              >
                <span>{module.title}</span>
                <span className="module-position">Unidad {module.position}</span>
              </button>
            ))}
            {course.modules?.length === 0 && <p className="empty-state">Sin módulos aún</p>}
          </div>
        </aside>

        <main className="course-main">
          <div className="course-main-header">
            <h2>Contenido del curso</h2>
            <button className="btn-primary">Continuar con el curso</button>
          </div>

          {(course.modules || []).map((module) => (
            <div key={module.id} className="course-unit-card">
              <div className="unit-header">
                <h3>{module.title}</h3>
                <span className="unit-tag">Unidad {module.position}</span>
              </div>
              <p className="unit-description">
                {module.contents?.length
                  ? 'Contenidos del módulo:'
                  : 'Aquí se mostrarán los contenidos del módulo cuando los agregues.'}
              </p>

              {module.contents?.length > 0 && (
                <ul className="module-content-list">
                  {module.contents.map((content) => (
                    <li key={content.id} className="module-content-item">
                      <span className="content-type">{content.content_type}</span>
                      <span className="content-value">{content.content_value}</span>
                    </li>
                  ))}
                </ul>
              )}

              {module.quizzes?.length > 0 && (
                <div className="module-quiz-list">
                  <h4>Quizzes</h4>
                  {module.quizzes.map((quiz) => (
                    <div key={quiz.id} className="quiz-card">
                      <div className="quiz-header">
                        <strong>{quiz.title}</strong>
                        <span className="quiz-meta">
                          Mínimo: {quiz.passing_score}
                        </span>
                      </div>
                      {quiz.questions?.length > 0 ? (
                        <ol className="quiz-questions">
                          {quiz.questions.map((question) => (
                            <li key={question.id}>
                              <p>{question.question_text}</p>
                              <ul className="quiz-answers">
                                {question.answers.map((answer) => (
                                  <li key={answer.id} className={answer.is_correct ? 'answer-correct' : ''}>
                                    {answer.answer_text}
                                  </li>
                                ))}
                              </ul>
                            </li>
                          ))}
                        </ol>
                      ) : (
                        <p className="empty-state">Sin preguntas aún</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </main>
      </div>
    </div>
  )
}

export default CoursePage
