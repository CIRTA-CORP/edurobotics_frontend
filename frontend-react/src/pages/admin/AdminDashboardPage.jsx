import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { clearStoredUser, getStoredUser } from '../../services/auth'
import {
  addModuleContent,
  addQuizAnswer,
  addQuizQuestion,
  createCourse,
  createModule,
  createQuiz,
  deleteCourse,
  deleteModule,
  deleteModuleContent,
  deleteQuiz,
  getCourseDetail,
  getCourses,
  setPrerequisites,
  updateCourse,
} from '../../services/courses'
import StudentDashboardPage from '../student/StudentDashboardPage'

function AdminDashboardPage() {
  const [user, setUser] = useState(null)
  const [adminView, setAdminView] = useState('student')
  const [courses, setCourses] = useState([])
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [adminToken, setAdminToken] = useState(localStorage.getItem('adminToken') || '')
  const [courseForm, setCourseForm] = useState({ title: '', description: '', level: 'beginner', version: 1 })
  const [moduleForm, setModuleForm] = useState({ title: '', position: 1 })
  const [contentForm, setContentForm] = useState({ content_type: 'text', content_value: '' })
  const [quizForm, setQuizForm] = useState({ title: '', passing_type: 'score', passing_score: 80 })
  const [questionForm, setQuestionForm] = useState({ question_text: '' })
  const [questionType, setQuestionType] = useState('single')
  const [answerOptions, setAnswerOptions] = useState([
    { answer_text: '', is_correct: false },
    { answer_text: '', is_correct: false },
  ])
  const [createdQuizzes, setCreatedQuizzes] = useState([])
  const [selectedModuleId, setSelectedModuleId] = useState('')
  const [selectedQuizId, setSelectedQuizId] = useState('')
  const [prereqIds, setPrereqIds] = useState('')
  const [message, setMessage] = useState(null)
  const [messageType, setMessageType] = useState('success')
  const [activeTab, setActiveTab] = useState('cursos')
  const [expandedSections, setExpandedSections] = useState({
    token: true,
    crear: true,
    editar: false,
    'modulos-crear': true,
    contenido: true,
    'quiz-crear': true,
    'quiz-preguntas': true,
    'quiz-lista': true,
  })
  const navigate = useNavigate()

  useEffect(() => {
    const storedUser = getStoredUser()
    if (!storedUser) {
      navigate('/login')
      return
    }
    setUser(storedUser)
  }, [navigate])

  useEffect(() => {
    const loadCourses = async () => {
      try {
        const response = await getCourses()
        setCourses(response.courses || [])
      } catch (error) {
        setMessageType('error')
        setMessage(error.message)
      }
    }
    loadCourses()
  }, [])

  const handleLogout = () => {
    clearStoredUser()
    navigate('/login')
  }

  const handleAdminTokenSave = () => {
    localStorage.setItem('adminToken', adminToken)
    setMessageType('success')
    setMessage('Token admin guardado')
  }

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  const refreshCourses = async () => {
    const response = await getCourses()
    setCourses(response.courses || [])
  }

  const refreshSelectedCourse = async (courseId = selectedCourse?.id) => {
    if (!courseId) return
    const detail = await getCourseDetail(courseId)
    setSelectedCourse(detail)
  }

  const handleCourseSelect = async (courseId) => {
    if (!courseId) {
      setSelectedCourse(null)
      setSelectedModuleId('')
      setSelectedQuizId('')
      setCreatedQuizzes([])
      return
    }
    const detail = await getCourseDetail(courseId)
    setSelectedCourse(detail)
    setSelectedModuleId('')
    setSelectedQuizId('')
    setCreatedQuizzes([])
  }

  const handleCourseCreate = async (event) => {
    event.preventDefault()
    setMessage(null)
    try {
      await createCourse(adminToken, courseForm)
      await refreshCourses()
      setMessageType('success')
      setMessage('Curso creado')
      setCourseForm({ title: '', description: '', level: 'beginner', version: 1 })
    } catch (error) {
      setMessageType('error')
      setMessage(error.message)
    }
  }

  const handleCourseUpdate = async (event) => {
    event.preventDefault()
    if (!selectedCourse) return
    setMessage(null)
    try {
      await updateCourse(adminToken, selectedCourse.id, courseForm)
      await refreshSelectedCourse(selectedCourse.id)
      await refreshCourses()
      setMessageType('success')
      setMessage('Curso actualizado')
    } catch (error) {
      setMessageType('error')
      setMessage(error.message)
    }
  }

  const handleCourseDelete = async () => {
    if (!selectedCourse) return
    setMessage(null)
    try {
      await deleteCourse(adminToken, selectedCourse.id)
      await refreshCourses()
      setSelectedCourse(null)
      setSelectedModuleId('')
      setMessageType('success')
      setMessage('Curso eliminado')
    } catch (error) {
      setMessageType('error')
      setMessage(error.message)
    }
  }

  const handlePrereqSave = async () => {
    if (!selectedCourse) return
    setMessage(null)
    try {
      const ids = prereqIds
        .split(',')
        .map((id) => parseInt(id.trim(), 10))
        .filter((id) => Number.isInteger(id))
      await setPrerequisites(adminToken, selectedCourse.id, ids)
      await refreshSelectedCourse(selectedCourse.id)
      setMessageType('success')
      setMessage('Prerequisitos guardados')
    } catch (error) {
      setMessageType('error')
      setMessage(error.message)
    }
  }

  const handleModuleCreate = async (event) => {
    event.preventDefault()
    if (!selectedCourse) return
    setMessage(null)
    try {
      await createModule(adminToken, selectedCourse.id, moduleForm)
      await refreshSelectedCourse(selectedCourse.id)
      setMessageType('success')
      setMessage('Módulo creado')
      setModuleForm({ title: '', position: 1 })
    } catch (error) {
      setMessageType('error')
      setMessage(error.message)
    }
  }

  const handleAddContent = async (event) => {
    event.preventDefault()
    if (!selectedModuleId) return
    setMessage(null)
    try {
      await addModuleContent(adminToken, selectedModuleId, contentForm)
      setMessageType('success')
      setMessage('Contenido agregado')
      setContentForm({ content_type: 'text', content_value: '' })
      await refreshSelectedCourse(selectedCourse?.id)
    } catch (error) {
      setMessageType('error')
      setMessage(error.message)
    }
  }

  const handleQuizCreate = async (event) => {
    event.preventDefault()
    if (!selectedModuleId) return
    setMessage(null)
    try {
      const result = await createQuiz(adminToken, selectedModuleId, quizForm)
      if (result?.quiz_id) {
        setCreatedQuizzes((prev) => [
          ...prev,
          { id: result.quiz_id, title: quizForm.title, moduleId: selectedModuleId },
        ])
        setSelectedQuizId(String(result.quiz_id))
      }
      setMessageType('success')
      setMessage('Quiz creado')
      setQuizForm({ title: '', passing_type: 'score', passing_score: 80 })
      await refreshSelectedCourse(selectedCourse?.id)
    } catch (error) {
      setMessageType('error')
      setMessage(error.message)
    }
  }

  const handleQuestionCreate = async (event) => {
    event.preventDefault()
    if (!selectedQuizId) return
    setMessage(null)
    try {
      const cleanAnswers = answerOptions
        .map((option) => ({
          answer_text: option.answer_text.trim(),
          is_correct: option.is_correct,
        }))
        .filter((option) => option.answer_text.length > 0)

      if (cleanAnswers.length < 2) {
        setMessageType('error')
        setMessage('Agrega al menos 2 alternativas')
        return
      }

      const correctCount = cleanAnswers.filter((option) => option.is_correct).length
      if (questionType === 'single' && correctCount !== 1) {
        setMessageType('error')
        setMessage('Selecciona exactamente 1 respuesta correcta')
        return
      }
      if (questionType === 'multiple' && correctCount < 1) {
        setMessageType('error')
        setMessage('Selecciona al menos 1 respuesta correcta')
        return
      }

      const questionResult = await addQuizQuestion(adminToken, selectedQuizId, questionForm)
      if (!questionResult?.question_id) {
        setMessageType('error')
        setMessage('No se pudo crear la pregunta')
        return
      }

      await Promise.all(
        cleanAnswers.map((option) =>
          addQuizAnswer(adminToken, questionResult.question_id, option)
        )
      )
      setMessageType('success')
      setMessage('Pregunta creada con sus respuestas')
      setQuestionForm({ question_text: '' })
      setQuestionType('single')
      setAnswerOptions([
        { answer_text: '', is_correct: false },
        { answer_text: '', is_correct: false },
      ])
      await refreshSelectedCourse(selectedCourse?.id)
    } catch (error) {
      setMessageType('error')
      setMessage(error.message)
    }
  }

  const handleAnswerChange = (index, updates) => {
    setAnswerOptions((prev) =>
      prev.map((option, idx) => (idx === index ? { ...option, ...updates } : option))
    )
  }

  const handleAddAnswerOption = () => {
    setAnswerOptions((prev) => [...prev, { answer_text: '', is_correct: false }])
  }

  const handleRemoveAnswerOption = (index) => {
    setAnswerOptions((prev) => prev.filter((_, idx) => idx !== index))
  }

  const handleModuleDelete = async (moduleId) => {
    if (!selectedCourse) return
    setMessage(null)
    try {
      await deleteModule(adminToken, moduleId)
      await refreshSelectedCourse(selectedCourse.id)
      setSelectedModuleId('')
      setMessageType('success')
      setMessage('Módulo eliminado')
    } catch (error) {
      setMessageType('error')
      setMessage(error.message)
    }
  }

  const handleContentDelete = async (contentId) => {
    if (!selectedCourse) return
    setMessage(null)
    try {
      await deleteModuleContent(adminToken, contentId)
      await refreshSelectedCourse(selectedCourse.id)
      setMessageType('success')
      setMessage('Contenido eliminado')
    } catch (error) {
      setMessageType('error')
      setMessage(error.message)
    }
  }

  const handleQuizDelete = async (quizId) => {
    if (!selectedCourse) return
    setMessage(null)
    try {
      await deleteQuiz(adminToken, quizId)
      await refreshSelectedCourse(selectedCourse.id)
      setCreatedQuizzes((prev) => prev.filter((quiz) => String(quiz.id) !== String(quizId)))
      if (String(selectedQuizId) === String(quizId)) {
        setSelectedQuizId('')
      }
      setMessageType('success')
      setMessage('Quiz eliminado')
    } catch (error) {
      setMessageType('error')
      setMessage(error.message)
    }
  }

  const selectedModule = selectedCourse?.modules?.find(
    (module) => String(module.id) === String(selectedModuleId)
  )

  if (!user) return <div className="loading">Cargando...</div>

  if (user.role !== 'admin') {
    return <StudentDashboardPage userOverride={user} hideLogout />
  }

  return (
    <div className="admin-view-wrapper">
      <div className="admin-view-toggle">
        <span>Vista:</span>
        <button
          className={`toggle-btn ${adminView === 'student' ? 'active' : ''}`}
          onClick={() => setAdminView('student')}
        >
          Estudiante
        </button>
        <button
          className={`toggle-btn ${adminView === 'admin' ? 'active' : ''}`}
          onClick={() => setAdminView('admin')}
        >
          Panel admin
        </button>
        <button className="btn-logout" onClick={handleLogout}>Salir</button>
      </div>

      {adminView === 'student' ? (
        <StudentDashboardPage userOverride={user} hideLogout />
      ) : (
        <div className="dashboard-admin-container">
          <header className="admin-header">
            <div className="header-content">
              <h1>🎓 Panel Admin EduRobotics</h1>
              <p>Gestión de cursos, módulos y quizzes</p>
            </div>
          </header>

          {message && (
            <div className={`message message-${messageType}`}>
              {message}
              <button onClick={() => setMessage(null)} className="close-msg">✕</button>
            </div>
          )}

          <div className="admin-wrapper">
            <aside className="admin-sidebar">
              <div className="sidebar-section">
                <h3>📚 Mis Cursos</h3>
                <div className="courses-list">
                  {courses.length === 0 ? (
                    <p className="empty-state">Sin cursos aún</p>
                  ) : (
                    courses.map((course) => (
                      <button
                        key={course.id}
                        onClick={() => handleCourseSelect(course.id)}
                        className={`course-item ${selectedCourse?.id === course.id ? 'active' : ''}`}
                      >
                        <span className="course-title">{course.title}</span>
                        <span className="course-level">{course.level}</span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </aside>

            <main className="admin-main">
              <div className="admin-tabs">
                <button
                  className={`tab-btn ${activeTab === 'cursos' ? 'active' : ''}`}
                  onClick={() => setActiveTab('cursos')}
                >
                  Cursos
                </button>
                <button
                  className={`tab-btn ${activeTab === 'modulos' ? 'active' : ''}`}
                  onClick={() => setActiveTab('modulos')}
                  disabled={!selectedCourse}
                >
                  Módulos
                </button>
                <button
                  className={`tab-btn ${activeTab === 'quizzes' ? 'active' : ''}`}
                  onClick={() => setActiveTab('quizzes')}
                  disabled={!selectedCourse}
                >
                  Quizzes
                </button>
              </div>

              {activeTab === 'cursos' && (
                <div className="tab-content">
                  <section className="card">
                    <div className="card-header" onClick={() => toggleSection('token')}>
                      <h3>🔐 Admin Token</h3>
                      <span className="toggle-icon">{expandedSections.token ? '−' : '+'}</span>
                    </div>
                    {expandedSections.token && (
                      <div className="card-body">
                        <input
                          type="password"
                          value={adminToken}
                          onChange={(e) => setAdminToken(e.target.value)}
                          placeholder="Ingresa el token admin"
                          className="input-field"
                        />
                        <button onClick={handleAdminTokenSave} className="btn btn-primary">
                          Guardar Token
                        </button>
                      </div>
                    )}
                  </section>

                  <section className="card">
                    <div className="card-header" onClick={() => toggleSection('crear')}>
                      <h3>➕ Crear Nuevo Curso</h3>
                      <span className="toggle-icon">{expandedSections.crear ? '−' : '+'}</span>
                    </div>
                    {expandedSections.crear && (
                      <div className="card-body">
                        <form onSubmit={handleCourseCreate} className="form-grid">
                          <input
                            type="text"
                            placeholder="Título del curso"
                            value={courseForm.title}
                            onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })}
                            required
                            className="input-field"
                          />
                          <textarea
                            placeholder="Descripción"
                            value={courseForm.description}
                            onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                            className="input-field"
                          />
                          <select
                            value={courseForm.level}
                            onChange={(e) => setCourseForm({ ...courseForm, level: e.target.value })}
                            className="input-field"
                          >
                            <option value="beginner">Principiante</option>
                            <option value="intermediate">Intermedio</option>
                            <option value="advanced">Avanzado</option>
                          </select>
                          <button type="submit" className="btn btn-success">
                            Crear Curso
                          </button>
                        </form>
                      </div>
                    )}
                  </section>

                  {selectedCourse && (
                    <section className="card">
                      <div className="card-header" onClick={() => toggleSection('editar')}>
                        <h3>✏️ Editar Curso: {selectedCourse.title}</h3>
                        <span className="toggle-icon">{expandedSections.editar ? '−' : '+'}</span>
                      </div>
                      {expandedSections.editar && (
                        <div className="card-body">
                          <form onSubmit={handleCourseUpdate} className="form-grid">
                            <input
                              type="text"
                              placeholder="Título"
                              value={courseForm.title}
                              onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })}
                              className="input-field"
                            />
                            <textarea
                              placeholder="Descripción"
                              value={courseForm.description}
                              onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                              className="input-field"
                            />
                            <button type="submit" className="btn btn-primary">
                              Actualizar
                            </button>
                            <button type="button" onClick={handleCourseDelete} className="btn btn-danger">
                              Eliminar Curso
                            </button>
                          </form>

                          <div className="form-grid" style={{ marginTop: '1rem' }}>
                            <input
                              type="text"
                              placeholder="Prerequisitos (IDs separados por coma)"
                              value={prereqIds}
                              onChange={(e) => setPrereqIds(e.target.value)}
                              className="input-field"
                            />
                            <button type="button" onClick={handlePrereqSave} className="btn btn-primary">
                              Guardar prerequisitos
                            </button>
                          </div>
                        </div>
                      )}
                    </section>
                  )}
                </div>
              )}

              {activeTab === 'modulos' && selectedCourse && (
                <div className="tab-content">
                  <section className="card">
                    <div className="card-header" onClick={() => toggleSection('modulos-crear')}>
                      <h3>➕ Crear Módulo</h3>
                      <span className="toggle-icon">{expandedSections['modulos-crear'] ? '−' : '+'}</span>
                    </div>
                    {expandedSections['modulos-crear'] && (
                      <div className="card-body">
                        <form onSubmit={handleModuleCreate} className="form-grid">
                          <input
                            type="text"
                            placeholder="Título del módulo"
                            value={moduleForm.title}
                            onChange={(e) => setModuleForm({ ...moduleForm, title: e.target.value })}
                            required
                            className="input-field"
                          />
                          <input
                            type="number"
                            placeholder="Posición"
                            value={moduleForm.position}
                            onChange={(e) => setModuleForm({ ...moduleForm, position: parseInt(e.target.value, 10) || 1 })}
                            className="input-field"
                          />
                          <button type="submit" className="btn btn-success">
                            Crear Módulo
                          </button>
                        </form>
                      </div>
                    )}
                  </section>

                  <section className="card">
                    <h3>📖 Módulos del Curso</h3>
                    <div className="modules-list">
                      {selectedCourse.modules && selectedCourse.modules.length > 0 ? (
                        selectedCourse.modules.map((module) => (
                          <div key={module.id} className="module-item">
                            <h4>{module.title}</h4>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <button
                                onClick={() => setSelectedModuleId(module.id)}
                                className={`btn ${selectedModuleId === module.id ? 'btn-primary' : 'btn-secondary'}`}
                              >
                                Gestionar
                              </button>
                              <button
                                onClick={() => handleModuleDelete(module.id)}
                                className="btn btn-danger"
                              >
                                Eliminar
                              </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="empty-state">Sin módulos aún</p>
                      )}
                    </div>
                  </section>

                  {selectedModuleId && (
                    <section className="card">
                      <div className="card-header" onClick={() => toggleSection('contenido')}>
                        <h3>📄 Agregar Contenido</h3>
                        <span className="toggle-icon">{expandedSections.contenido ? '−' : '+'}</span>
                      </div>
                      {expandedSections.contenido && (
                        <div className="card-body">
                          <form onSubmit={handleAddContent} className="form-grid">
                            <select
                              value={contentForm.content_type}
                              onChange={(e) => setContentForm({ ...contentForm, content_type: e.target.value })}
                              className="input-field"
                            >
                              <option value="text">Texto</option>
                              <option value="video">Video</option>
                              <option value="resource">Recurso</option>
                            </select>
                            <textarea
                              placeholder="Contenido"
                              value={contentForm.content_value}
                              onChange={(e) => setContentForm({ ...contentForm, content_value: e.target.value })}
                              className="input-field"
                              required
                            />
                            <button type="submit" className="btn btn-success">
                              Agregar Contenido
                            </button>
                          </form>

                          {selectedModule?.contents?.length > 0 && (
                            <div style={{ marginTop: '1rem' }}>
                              <h4>Contenidos del módulo</h4>
                              <ul className="module-content-list">
                                {selectedModule.contents.map((content) => (
                                  <li key={content.id} className="module-content-item">
                                    <span className="content-type">{content.content_type}</span>
                                    <span className="content-value">{content.content_value}</span>
                                    <button
                                      type="button"
                                      className="btn btn-danger"
                                      onClick={() => handleContentDelete(content.id)}
                                    >
                                      Eliminar
                                    </button>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </section>
                  )}
                </div>
              )}

              {activeTab === 'quizzes' && selectedCourse && (
                <div className="tab-content">
                  <section className="card">
                    <div className="card-header" onClick={() => toggleSection('quiz-crear')}>
                      <h3>➕ Crear Quiz</h3>
                      <span className="toggle-icon">{expandedSections['quiz-crear'] ? '−' : '+'}</span>
                    </div>
                    {expandedSections['quiz-crear'] && (
                      <div className="card-body">
                        <div className="form-grid">
                          <select
                            value={selectedModuleId}
                            onChange={(e) => setSelectedModuleId(e.target.value)}
                            className="input-field"
                          >
                            <option value="">Selecciona módulo...</option>
                            {selectedCourse.modules?.map((module) => (
                              <option key={module.id} value={module.id}>
                                {module.title}
                              </option>
                            ))}
                          </select>
                          <form onSubmit={handleQuizCreate} className="form-grid">
                            <input
                              type="text"
                              placeholder="Título del quiz"
                              value={quizForm.title}
                              onChange={(e) => setQuizForm({ ...quizForm, title: e.target.value })}
                              className="input-field"
                              required
                            />
                            <input
                              type="number"
                              placeholder="Puntaje mínimo"
                              value={quizForm.passing_score}
                              onChange={(e) => setQuizForm({ ...quizForm, passing_score: parseInt(e.target.value, 10) || 0 })}
                              className="input-field"
                            />
                            <button type="submit" className="btn btn-success">
                              Crear Quiz
                            </button>
                          </form>
                        </div>
                      </div>
                    )}
                  </section>

                  <section className="card">
                    <div className="card-header" onClick={() => toggleSection('quiz-preguntas')}>
                      <h3>🧩 Crear Pregunta</h3>
                      <span className="toggle-icon">{expandedSections['quiz-preguntas'] ? '−' : '+'}</span>
                    </div>
                    {expandedSections['quiz-preguntas'] && (
                      <div className="card-body">
                        <form onSubmit={handleQuestionCreate} className="form-grid">
                          <select
                            value={selectedQuizId}
                            onChange={(e) => setSelectedQuizId(e.target.value)}
                            className="input-field"
                            required
                          >
                            <option value="">Selecciona quiz...</option>
                            {createdQuizzes
                              .filter((quiz) => String(quiz.moduleId) === String(selectedModuleId))
                              .map((quiz) => (
                                <option key={quiz.id} value={quiz.id}>
                                  {quiz.title}
                                </option>
                              ))}
                          </select>

                          <input
                            type="text"
                            placeholder="Texto de la pregunta"
                            value={questionForm.question_text}
                            onChange={(e) => setQuestionForm({ question_text: e.target.value })}
                            className="input-field"
                            required
                          />

                          <select
                            value={questionType}
                            onChange={(e) => setQuestionType(e.target.value)}
                            className="input-field"
                          >
                            <option value="single">Una correcta</option>
                            <option value="multiple">Varias correctas</option>
                          </select>

                          <div className="answer-list">
                            {answerOptions.map((option, index) => (
                              <div key={index} className="answer-row">
                                <input
                                  type="text"
                                  placeholder={`Alternativa ${index + 1}`}
                                  value={option.answer_text}
                                  onChange={(e) => handleAnswerChange(index, { answer_text: e.target.value })}
                                  className="input-field"
                                  required
                                />
                                <label className="answer-check">
                                  <input
                                    type="checkbox"
                                    checked={option.is_correct}
                                    onChange={(e) => handleAnswerChange(index, { is_correct: e.target.checked })}
                                  />
                                  Correcta
                                </label>
                                {answerOptions.length > 2 && (
                                  <button
                                    type="button"
                                    className="btn btn-danger"
                                    onClick={() => handleRemoveAnswerOption(index)}
                                  >
                                    Quitar
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>

                          <div className="answer-actions">
                            <button type="button" className="btn btn-secondary" onClick={handleAddAnswerOption}>
                              + Agregar alternativa
                            </button>
                            <button type="submit" className="btn btn-success">
                              Crear pregunta
                            </button>
                          </div>
                        </form>
                        {createdQuizzes.length === 0 && (
                          <p className="empty-state" style={{ marginTop: '1rem' }}>
                            Crea un quiz primero para agregar preguntas.
                          </p>
                        )}
                      </div>
                    )}
                  </section>

                  {selectedModuleId && selectedModule?.quizzes?.length > 0 && (
                    <section className="card">
                      <div className="card-header" onClick={() => toggleSection('quiz-lista')}>
                        <h3>📋 Quizzes del módulo</h3>
                        <span className="toggle-icon">{expandedSections['quiz-lista'] ? '−' : '+'}</span>
                      </div>
                      {expandedSections['quiz-lista'] && (
                        <div className="card-body">
                          <div className="modules-list">
                            {selectedModule.quizzes.map((quiz) => (
                              <div key={quiz.id} className="module-item">
                                <h4>{quiz.title}</h4>
                                <p className="course-meta">
                                  Preguntas: {quiz.questions?.length || 0} · Mínimo {quiz.passing_score}
                                </p>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                  <button
                                    type="button"
                                    className="btn btn-danger"
                                    onClick={() => handleQuizDelete(quiz.id)}
                                  >
                                    Eliminar
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </section>
                  )}
                </div>
              )}
            </main>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminDashboardPage
