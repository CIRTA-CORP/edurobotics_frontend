import { useEffect, useState } from 'react'
import { Modal } from '@/shared/components/Modal'
import { LoginForm } from '@/features/auth/components/LoginForm'
import { RegisterForm } from '@/features/auth/components/RegisterForm'

/**
 * AuthModal — modal de autenticación para la landing.
 *
 * Reutiliza exactamente los mismos LoginForm / RegisterForm que las páginas
 * /login y /register, así que no hay lógica de auth duplicada. Permite alternar
 * entre iniciar sesión y registrarse sin recargar ni salir de la landing.
 *
 * @param {boolean} isOpen
 * @param {Function} onClose
 * @param {'login'|'register'} [initialView='login'] - Vista con la que se abre.
 */
export function AuthModal({ isOpen, onClose, initialView = 'login' }) {
  const [view, setView] = useState(initialView)

  // Sincronizar la vista cada vez que se abre el modal
  useEffect(() => {
    if (isOpen) setView(initialView)
  }, [isOpen, initialView])

  const isLogin = view === 'login'

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="" size="sm">
      <div className="text-center mb-6 -mt-2">
        <img src="/cirtanitido.svg" alt="CIRTA" className="mx-auto h-8" />
        <h2 className="mt-4 text-2xl font-bold tracking-tight">
          {isLogin ? 'Iniciar sesión' : 'Crear cuenta gratis'}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {isLogin
            ? 'Accede a la plataforma de robótica'
            : 'Regístrate gratis y entra al simulador'}
        </p>
      </div>

      {isLogin ? (
        <LoginForm onSwitchToRegister={() => setView('register')} />
      ) : (
        <RegisterForm onSwitchToLogin={() => setView('login')} />
      )}
    </Modal>
  )
}
