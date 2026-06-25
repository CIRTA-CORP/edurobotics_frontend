/**
 * User Profile Page
 *
 * Displays user account details, course progress, and academic history.
 * Accessible via /profile route from the navigation avatar.
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { clearStoredUser, getStoredUser } from '@/features/auth/services/auth'
import { getUserProfile } from '@/features/courses/services/courses'
import { Button } from '@/shared/components/button'
import { StudentHeader } from '@/features/student/components/StudentHeader'
import { LogoutModal } from '@/shared/components/LogoutModal'
import { ProfileSettings } from '@/features/profile/components/ProfileSettings'
import { CourseGrid } from '@/features/student/components/CourseGrid'
import {
    BookOpen, CheckCircle, Clock,
    GraduationCap, Zap, Trophy, Shield, Mail, Calendar,
    Loader2, LayoutGrid, Settings
} from 'lucide-react'

const LEVEL_CONFIG = {
    beginner: { label: 'Principiante', icon: GraduationCap, color: 'text-emerald-600 bg-emerald-50' },
    intermediate: { label: 'Intermedio', icon: Zap, color: 'text-amber-600 bg-amber-50' },
    advanced: { label: 'Avanzado', icon: Trophy, color: 'text-rose-600 bg-rose-50' },
}

function UserProfilePage() {
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const [user, setUser] = useState(() => getStoredUser())
    const [showLogout, setShowLogout] = useState(false)
    const [activeTab, setActiveTab] = useState('resumen')

    useEffect(() => {
        if (!user) { navigate('/login'); return }
    }, [navigate, user])

    const handleProfileUpdated = () => {
        setUser(getStoredUser())  // re-read updated name from the fresh token
        queryClient.invalidateQueries({ queryKey: ['user-profile', user?.id] })
    }

    const { data: profileData, isLoading: loading } = useQuery({
        queryKey: ['user-profile', user?.id],
        queryFn: () => getUserProfile(user.id),
        enabled: !!user?.id,
        staleTime: 30_000,
    })

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
    // Map to the shape CourseGrid expects, so course cards look identical to the dashboard.
    const toGridCourse = (c) => ({ ...c, roadmapSummary: { state: c.state, percentage: c.percentage } })
    const completedCourses = courses.filter(c => c.state === 'completed').map(toGridCourse)
    const inProgressCourses = courses.filter(c => c.state === 'in_progress').map(toGridCourse)

    const initials = ((profile?.first_name?.[0] || '') + (profile?.last_name?.[0] || '')).toUpperCase()

    return (
        <div className="min-h-screen bg-gray-50">
            <LogoutModal
                isOpen={showLogout}
                onConfirm={() => { clearStoredUser(); navigate('/') }}
                onCancel={() => setShowLogout(false)}
            />
            {/* Persistent app shell (same header as the rest of the student area) */}
            <StudentHeader user={user} onLogout={() => setShowLogout(true)} />

            <div className="max-w-5xl mx-auto p-6">
                {/* Tabs */}
                <div className="mb-6 inline-flex rounded-xl border border-gray-200 bg-white p-1">
                    {[
                        { id: 'resumen', label: 'Resumen', icon: LayoutGrid },
                        { id: 'configuracion', label: 'Configuración', icon: Settings },
                    ].map((tab) => {
                        const Icon = tab.icon
                        const active = activeTab === tab.id
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                                    active ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                <Icon className="h-4 w-4" />
                                {tab.label}
                            </button>
                        )
                    })}
                </div>

                {activeTab === 'configuracion' && (
                    <div className="max-w-2xl">
                        <ProfileSettings profile={profile} onUpdated={handleProfileUpdated} />
                    </div>
                )}

                {activeTab === 'resumen' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column – Profile Card */}
                    <div className="lg:col-span-1 space-y-4">
                        <div className="bg-white rounded-2xl border border-gray-200 p-6 text-center">
                            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
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
                                <CourseGrid courses={inProgressCourses} onCourseClick={(id) => navigate(`/courses/${id}`)} />
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
                                <CourseGrid courses={completedCourses} onCourseClick={(id) => navigate(`/courses/${id}`)} />
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
                )}
            </div>
        </div>
    )
}

export default UserProfilePage
