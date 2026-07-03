import { QuizEditor } from '@/features/admin/features/quizzes/QuizEditor'
import { useAdmin } from '@/features/admin/context/AdminContext'

export function EvaluationsTab() {
  const { selectedUnit } = useAdmin()

  if (!selectedUnit) return null

  return (
    <div className="space-y-6">
      <QuizEditor unitId={selectedUnit.id} />
    </div>
  )
}
