import {
  BarChart3, BookOpen, Layers, FileText, Package, ClipboardCheck
} from 'lucide-react'
import { useAdmin } from '@/features/admin/context/AdminContext'

export function AdminTabBar() {
  const { activeTab, setActiveTab, selectedCourse, selectedModule, selectedUnit } = useAdmin()

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3, enabled: true },
    { id: 'cursos', label: 'Cursos', icon: BookOpen, enabled: true },
    { id: 'modulos', label: 'Módulos', icon: Layers, enabled: !!selectedCourse },
    { id: 'unidades', label: 'Unidades', icon: FileText, enabled: !!selectedModule },
    { id: 'contenido', label: 'Contenido', icon: Package, enabled: !!selectedUnit },
    { id: 'evaluaciones', label: 'Evaluaciones', icon: ClipboardCheck, enabled: !!selectedUnit },
  ]

  return (
    <div className="mb-4 lg:mb-6">
      <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 overflow-x-auto">
        {tabs.map(tab => {
          const TabIcon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              disabled={!tab.enabled}
              className={`flex items-center justify-center gap-1.5 px-3 lg:px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap ${isActive
                ? 'bg-white text-gray-900 shadow-sm'
                : tab.enabled
                  ? 'text-gray-500 hover:text-gray-700'
                  : 'text-gray-300 cursor-not-allowed'
                }`}
            >
              <TabIcon className="w-4 h-4 flex-shrink-0" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
