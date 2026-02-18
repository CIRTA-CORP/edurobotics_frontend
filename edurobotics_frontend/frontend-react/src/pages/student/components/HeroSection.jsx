/**
 * Hero Section Component
 * 
 * Welcome banner displaying personalized greeting for the student.
 */

export function HeroSection({ user }) {
  return (
    <section className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">
              Hola, {user.first_name}
            </h2>
            <p className="text-gray-600 mt-2">
              Revisa tus cursos activos y continúa tu aprendizaje.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
