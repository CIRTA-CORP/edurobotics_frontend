import { LogOut, X } from 'lucide-react'

/**
 * Custom Logout Confirmation Modal
 * Styled modal that replaces the native window.confirm for logout.
 */
export function LogoutModal({ isOpen, onConfirm, onCancel }) {
    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
                onClick={onCancel}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-scale-in">
                {/* Close button */}
                <button
                    onClick={onCancel}
                    className="absolute top-3 right-3 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>

                {/* Content */}
                <div className="p-6 pt-8 text-center">
                    {/* Icon */}
                    <div className="mx-auto w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mb-4">
                        <LogOut className="w-6 h-6 text-red-500" />
                    </div>

                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        ¿Cerrar sesión?
                    </h3>
                    <p className="text-sm text-gray-500 mb-6">
                        Tendrás que volver a iniciar sesión para acceder a la plataforma.
                    </p>

                    {/* Buttons */}
                    <div className="flex gap-3">
                        <button
                            onClick={onCancel}
                            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={onConfirm}
                            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-red-500 hover:bg-red-600 transition-colors shadow-sm"
                        >
                            Cerrar sesión
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
