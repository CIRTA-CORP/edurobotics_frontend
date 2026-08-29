# design-system-foundations — la hoja de «Fundamentos» en el repo

> Referencia: artboard **`Sistema.dc.html` («Fundamentos»)** del canvas
> `c82ae7d9-48bd-4fc8-a55f-18531fdc0f8c`. Los primitivos de shadcn/ui no se reemplazan:
> cambian sus tokens y un par de variantes.

## 1. Tokens

- [ ] 1.1 `src/index.css` → `@theme`: fondo `#ffffff`, muted `#fafafa`, secondary `#f4f3f8`,
      border `#ececf1`, foreground `#16151b`, muted-foreground `#8b8a95`, primary `#16151b`,
      ring/acento `#4b46d6`. Radio de tarjeta 14, radio de botón 12.
- [ ] 1.2 Focus ring accesible: cambiar `#2563eb` por el acento **verificando contraste AA**
      sobre fondo blanco y sobre la banda `#0a0a0c` (no regresar la capability
      `accessibility`).
- [ ] 1.3 Barrido: `grep -rn "2563eb\|0f172a\|from-rose\|to-orange\|from-blue-500\|slate-700"`
      en `src/` y retirar lo que quede, salvo `specStyle.js` (paleta de especializaciones, que
      **se conserva**).

## 2. Primitivos

- [ ] 2.1 `shared/components/button.jsx`: variante `default` al negro de marca, radio 12,
      altura 44 en el tamaño por defecto; variante invertida (blanco) para uso sobre la banda
      oscura.
- [ ] 2.2 `shared/components/card.jsx`: un solo radio (14) y borde `#e9e9ee`; eliminar la
      mezcla de `xl`/`2xl`.

## 3. Superficies del alumno

- [ ] 3.1 `features/student/components/StudentHeader.jsx`: avatar sólido (fuera el degradado
      `blue-500→indigo-600`); enlace activo con el tinte del acento.
- [ ] 3.2 `features/student/components/CourseGrid.jsx`: barra de avance en verde/acento y el
      mismo radio de tarjeta que el resto. **Conservar la foto de portada con su degradado de
      legibilidad** — lo que se retira son los degradados de relleno, no las fotos.
- [ ] 3.3 `features/courses/components/ContentViewer.jsx`: verificar que no quede nada del
      degradado rosa/azul (ya se hizo en `study-mode-redesign`; esto es solo comprobación).

## 4. Tipografía

- [x] 4.1 **La familia tipográfica NO cambia** (decisión de Mario). Se queda la sans de
      producción en toda la app, incluida la lección. La serif editorial del canvas se descarta
      y la que se había colado en la rama del visor ya se retiró (`.rich-content` y el título
      de unidad). No reintroducirla en ninguna pantalla.
- [ ] 4.2 Mono **solo** para lo contable: progresos, duraciones, versiones, contadores.
      Etiquetas de sección en mono 10 px, `0.14em`, mayúsculas. Esto no cambia la familia del
      texto, solo distingue los números.

## 5. Verificación

- [ ] 5.1 `npm run build` verde; `npm run lint` sin empeorar la línea base (53 problemas /
      48 errores al cerrar `study-mode-redesign`).
- [ ] 5.2 **Revisar el panel admin y el simulador**, que no están en el canvas pero heredan
      `button` y `card`: comprobar que no quedaron ilegibles ni descoloridos.
- [ ] 5.3 Capturas antes/después de: dashboard, una lección, el panel admin y el simulador.
- [ ] 5.4 Contraste AA del focus ring en fondo claro y sobre la banda oscura.

## Diferido (anotado)
- Modo claro/oscuro (`theme-switching`): este change lo habilita al dejar los tokens
  centralizados; se hace después y por separado.
- Personalización tipográfica por parte del usuario.
