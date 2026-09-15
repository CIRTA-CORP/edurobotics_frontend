// Campo de contraseña con control para mostrarla u ocultarla.
//
// Reemplaza directamente a `<Input type="password" ... />`: acepta las mismas
// props y las reenvía, así que sustituirlo no cambia nada más del formulario.
//
// Detalles que importan y son fáciles de perder:
//   - El botón lleva `type="button"`. Sin eso, dentro de un <form> pulsarlo
//     ENVÍA el formulario en vez de revelar la contraseña.
//   - Cada campo tiene su propio estado, así que en el registro «Contraseña» y
//     «Confirmar contraseña» se revelan por separado.
//   - `autoComplete` se reenvía tal cual (`current-password` al entrar,
//     `new-password` al crear o restablecer): de él dependen los gestores de
//     contraseñas para ofrecer guardar y rellenar.
//   - El icono es decorativo (`aria-hidden`); lo que anuncia el lector de
//     pantalla es el `aria-label` del botón, que cambia con el estado.
import * as React from 'react'
import { Eye, EyeOff } from 'lucide-react'

import { Input } from '@/shared/components/input'
import { cn } from '@/shared/lib/utils'

const PasswordInput = React.forwardRef(({ className, ...props }, ref) => {
  const [visible, setVisible] = React.useState(false)
  const label = visible ? 'Ocultar contraseña' : 'Mostrar contraseña'
  const Icon = visible ? EyeOff : Eye

  return (
    <div className="relative">
      <Input
        {...props}
        ref={ref}
        type={visible ? 'text' : 'password'}
        // Hueco a la derecha para que el texto no pase por debajo del botón.
        className={cn('pr-10', className)}
      />
      <button
        type="button"
        onClick={() => setVisible((shown) => !shown)}
        aria-label={label}
        aria-pressed={visible}
        title={label}
        tabIndex={0}
        className="absolute inset-y-0 right-0 flex w-10 items-center justify-center rounded-r-md text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <Icon className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  )
})
PasswordInput.displayName = 'PasswordInput'

export { PasswordInput }
