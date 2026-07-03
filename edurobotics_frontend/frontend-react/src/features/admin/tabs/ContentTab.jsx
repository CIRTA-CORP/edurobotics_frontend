import { ContentForm } from '@/features/admin/features/content/ContentForm'
import { useAdmin } from '@/features/admin/context/AdminContext'

export function ContentTab() {
  const {
    selectedUnit,
    selectedCourse,
    expandedSections,
    toggleSection,
    handleContentDelete,
    contentHooks,
  } = useAdmin()

  if (!selectedUnit) return null

  return (
    <div className="space-y-6">
      <ContentForm
        selectedUnit={selectedUnit}
        onRichContentSave={(html) => contentHooks.handleRichContentSave(html, selectedUnit, selectedCourse)}
        onContentDelete={handleContentDelete}
        onMigrateLegacy={() => contentHooks.handleMigrateLegacy(selectedUnit, selectedCourse)}
        onSimulatorToggle={() => contentHooks.handleSimulatorToggle(selectedUnit, selectedCourse)}
        onSimulatorDescriptionSave={(desc) => contentHooks.handleSimulatorDescriptionSave(desc, selectedUnit, selectedCourse)}
        saving={contentHooks.saving}
        expanded={expandedSections.contenido}
        onToggle={() => toggleSection('contenido')}
      />
    </div>
  )
}
