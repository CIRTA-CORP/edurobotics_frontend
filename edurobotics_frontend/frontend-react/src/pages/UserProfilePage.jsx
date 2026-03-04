/**
 * User Profile Page
 *
 * Displays user account details, course progress, and academic history.
 * Accessible via /profile route from the navigation avatar.
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getStoredUser } from '../services/auth'
import { getUserProfile } from '../services/courses'
import { Button } from '../components/ui/button'
import {
    User, BookOpen, CheckCircle, Clock, ArrowLeft,
    GraduationCap, Zap, Trophy, Shield, Mail, Calendar,
    Loader2, TrendingUp, BarChart3
} from 'lucide-react'

const LEVEL_CONFIG = {
    beginner: { label: 'Principiante', icon: GraduationCap, color: 'text-emerald-600 bg-emerald-50' },
    intermediate: { label: 'Intermedio', icon: Zap, color: 'text-amber-600 bg-amber-50' },
    advanced: { label: 'Avanzado', icon: Trophy, color: 'text-rose-600 bg-rose-50' },
}

function UserProfilePage() {
    const navigate = useNavigate()
    const [user, setUser] = useState(null)
    const [profileData, setProfileData] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const storedUser = getStoredUser()
        if (!storedUser) { navigate('/login'); return }
        setUser(storedUser)

        getUserProfile(storedUser.id)
            .then(data => setProfileData(data))
            .catch(err => console.error('Profile load error:', err))
            .finally(() => setLoading(false))
    }, [navigate])

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        )
    }

    const profile = profileData?.profile
    const courses = profileData?.courses || []
    const stats = profileData?.stats || {}
    const completedCourses = courses.filter(c => c.state === 'completed')
    const inProgressCourses = courses.filter(c => c.state === 'in_progress')

    const initials = ((profile?.first_name?.[0] || '') + (profile?.last_name?.[0] || '')).toUpperCase()

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 px-6 py-4">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Volver al Dashboard
                    </button>
                    <h1 className="text-sm font-semibold text-gray-700">Mi Perfil</h1>
                </div>
            </header>

            <div className="max-w-5xl mx-auto p-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column – Profile Card */}
                    <div className="lg:col-span-1 space-y-4">
                        <div className="bg-white rounded-2xl border border-gray-200 p-6 text-center">
                            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                                {initials}
                            </div>
                            <h2 className="text-lg font-bold text-gray-900">
                                {profile?.first_name} {profile?.last_name}
                            </h2>
                            <p className="text-sm text-gray-500">@{profile?.username}</p>

                            {profile?.role === 'admin' && (
                                <span className="inline-flex items-center gap-1 mt-2 text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-800 text-white">
                                    <Shield className="w-3 h-3" />
                                    Administrador
                                </span>
                            )}

                            <div className="mt-5 space-y-3 text-left">
                                <div className="flex items-center gap-3 text-sm text-gray-600">
                                    <Mail className="w-4 h-4 text-gray-400" />
                                    <span className="truncate">{profile?.email}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-gray-600">
                                    <Calendar className="w-4 h-4 text-gray-400" />
                                    <span>
                                        Miembro desde{' '}
                                        {profile?.created_at
                                            ? new Date(profile.created_at).toLocaleDateString('es-CL', {
                                                year: 'numeric',
                                                month: 'long',
                                            })
                                            : '—'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Stats Card */}
                        <div className="bg-white rounded-2xl border border-gray-200 p-5">
                            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
                                Resumen Académico
                            </h3>
                            <div className="grid grid-cols-3 gap-3 text-center">
                                <div>
                                    <div className="text-2xl font-bold text-blue-600">{stats.total_enrolled || 0}</div>
                                    <div className="text-[10px] text-gray-400 mt-0.5">Inscritos</div>
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-emerald-600">{stats.completed || 0}</div>
                                    <div className="text-[10px] text-gray-400 mt-0.5">Completados</div>
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-amber-600">{stats.in_progress || 0}</div>
                                    <div className="text-[10px] text-gray-400 mt-0.5">En Progreso</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column – Course History */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* In Progress */}
                        {inProgressCourses.length > 0 && (
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <Clock className="w-4 h-4 text-amber-500" />
                                    <h3 className="text-sm font-semibold text-gray-700">
                                        Cursos en Progreso ({inProgressCourses.length})
                                    </h3>
                                </div>
                                <div className="space-y-3">
                                    {inProgressCourses.map(course => (
                                        <CourseCard key={course.id} course={course} navigate={navigate} />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Completed */}
                        {completedCourses.length > 0 && (
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                                    <h3 className="text-sm font-semibold text-gray-700">
                                        Cursos Completados ({completedCourses.length})
                                    </h3>
                                </div>
                                <div className="space-y-3">
                                    {completedCourses.map(course => (
                                        <CourseCard key={course.id} course={course} navigate={navigate} completed />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Empty state */}
                        {courses.length === 0 && (
                            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
                                <BookOpen className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-gray-700 mb-2">Sin cursos aún</h3>
                                <p className="text-sm text-gray-500 mb-4">
                                    Comienza tu primer curso para ver tu progreso aquí.
                                </p>
                                <Button onClick={() => navigate('/dashboard')}>
                                    Explorar Cursos
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

function CourseCard({ course, navigate, completed = false }) {
    const level = LEVEL_CONFIG[course.level] || LEVEL_CONFIG.beginner
    const LevelIcon = level.icon

    return (
        <div
            onClick={() => navigate(`/courses/${course.id}`)}
            className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md hover:border-gray-300 transition-all cursor-pointer group"
        >
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <h4 className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {course.title}
                    </h4>
                    <span className={`inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${level.color}`}>
                        <LevelIcon className="w-2.5 h-2.5" />
                        {level.label}
                    </span>
                </div>
                {completed && (
                    <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                )}
            </div>
            <div className="flex items-center gap-3">
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                        className={`h-full rounded-full transition-all duration-500 ${completed ? 'bg-emerald-500' : 'bg-blue-500'
                            }`}
                        style={{ width: `${course.percentage}%` }}
                    />
                </div>
                <span className={`text-xs font-bold ${completed ? 'text-emerald-600' : 'text-blue-600'}`}>
                    {course.percentage}%
                </span>
            </div>
            <div className="text-[10px] text-gray-400 mt-1.5">
                {course.completed_contents}/{course.total_contents} contenidos completados
            </div>
        </div>
    )
}

export default UserProfilePage
