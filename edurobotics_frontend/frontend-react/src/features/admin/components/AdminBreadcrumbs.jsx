import { BarChart3, ChevronRight } from 'lucide-react'
import { useAdmin } from '@/features/admin/context/AdminContext'

export function AdminBreadcrumbs() {
  const { activeTab, setActiveTab, selectedCourse, selectedModule, selectedUnit } = useAdmin()

  return (
    <nav className="mb-4 lg:mb-6">
      <ol className="flex items-center gap-1 text-sm flex-wrap">
        <li>
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-2.5 py-1.5 rounded-lg font-medium transition-colors ${activeTab === 'dashboard' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}
          >
            <BarChart3 className="w-3.5 h-3.5 inline mr-1" />
            Admin
          </button>
        </li>
        <li className="text-gray-300"><ChevronRight className="w-3.5 h-3.5" /></li>
        <li>
          <button
            onClick={() => setActiveTab('cursos')}
            className={`px-2.5 py-1.5 rounded-lg font-medium transition-colors ${activeTab === 'cursos' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}
          >
            {selectedCourse ? selectedCourse.title : 'Cursos'}
          </button>
        </li>
        {selectedCourse && selectedModule && (
          <>
            <li className="text-gray-300"><ChevronRight className="w-3.5 h-3.5" /></li>
            <li>
              <button
                onClick={() => setActiveTab('modulos')}
                className={`px-2.5 py-1.5 rounded-lg font-medium transition-colors ${activeTab === 'modulos' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
              >
                {selectedModule.title}
              </button>
            </li>
          </>
        )}
        {selectedUnit && (
          <>
            <li className="text-gray-300"><ChevronRight className="w-3.5 h-3.5" /></li>
            <li>
              <button
                onClick={() => setActiveTab('unidades')}
                className={`px-2.5 py-1.5 rounded-lg font-medium transition-colors ${activeTab === 'unidades' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
              >
                {selectedUnit.title}
              </button>
            </li>
          </>
        )}
        {selectedUnit && (activeTab === 'contenido' || activeTab === 'evaluaciones') && (
          <>
            <li className="text-gray-300"><ChevronRight className="w-3.5 h-3.5" /></li>
            <li>
              <span className="px-2.5 py-1.5 rounded-lg font-medium bg-indigo-100 text-indigo-700">
                {activeTab === 'contenido' ? 'Contenido' : 'Evaluaciones'}
              </span>
            </li>
          </>
        )}
      </ol>
    </nav>
  )
}
