# student-pages-redesign — preview, dashboard y perfil

> Referencia: artboards `Preview.dc.html`, `Dashboard.dc.html` y `Perfil.dc.html` del canvas
> `c82ae7d9-48bd-4fc8-a55f-18531fdc0f8c`.
> **Requiere `design-system-foundations` cerrado**: pintar estas pantallas con los tokens viejos
> es trabajo que hay que rehacer.

## 0. Backend: contexto de la última visita

- [x] 0.1 `get_last_accessed_content` devuelve además curso (id y título), módulo (título y
      número) y unidad (id, título, posición «unidad N de M»). Aditivo y de solo lectura;
      **sin migración**.
- [x] 0.2 Test: usuario con progreso devuelve el contexto completo; usuario sin progreso sigue
      devolviendo `last_accessed: null` sin romper el dashboard.

## 1. Índice reutilizable

- [x] 1.1 `ModuleSidebar` acepta un modo **solo lectura** (sin unidad activa, sin navegación)
      para el preview, sin cambiar su comportamiento actual en el modo estudio.
      **Hecho (2026-10-07):** prop `readOnly` (+ `defaultExpandedModuleId`, `className`): las
      unidades son filas sin botón, nada se atenúa como "por venir", los módulos se siguen
      plegando, y se añade el tipo de material en texto y los minutos del módulo. Sin la prop,
      el modo estudio pinta lo mismo que antes. `CoursePreviewPage` lo usa y se borró
      `ModuleRow`; el avance por unidad sale del roadmap (`getUnitProgress`/`getModuleProgress`).
      **Ojo para 5.2:** el programa del preview ahora tiene la escala del índice del modo
      estudio (más compacta que el `ModuleRow` anterior).
- [x] 1.2 El preview ya muestra **tipo de material y minutos por unidad**, con la misma
      definición que el modo estudio (duración sólo si el contenido la declara). Lo que falta
      es que ambos usen el MISMO componente en vez de dos que coinciden — hoy la información
      es la misma, pero la lógica está duplicada en `ModuleRow` y `ModuleSidebar`.
      **Hecho con 1.1:** un solo componente; la lógica duplicada se borró del preview.

## 2. Preview del curso

- [x] 2.1 Hero sobre la banda `#0a0a0c`: badges de nivel y versión, título grande (en la
      **sans de la app**, sin serif), cifras
      (módulos · unidades · contenidos · evaluaciones) en mono, progreso propio y **una sola
      acción** en blanco.
- [x] 2.2 Programa con tipo de material y minutos, módulos plegables (ya lo eran).
      Falta unificar el componente con el del modo estudio (1.1). **Unificado (1.1).**
- [x] 2.3 Posición en la malla: ya existía (`MiniRoadmap`) y se conserva; sólo cambió su
      lenguaje visual con los tokens nuevos.
- [x] 2.4 Lógica de prerrequisitos y matrícula **intacta**: sólo cambió su presentación.

## 3. Dashboard del alumno

- [x] 3.1 Banda de bienvenida con el resumen real (unidades hechas / cursos activos).
- [x] 3.2 Tarjeta **«Continúa donde quedaste»** con curso, módulo, unidad exacta y botón,
      alimentada por 0.1. Si no hay última visita, la tarjeta **no se muestra** (nada de
      estados inventados).
- [x] 3.3 Tarjetas de curso: conservar la foto con degradado de legibilidad, retirar los
      degradados de relleno, botón visible al pasar el cursor.
- [x] 3.4 **Especializaciones: conservar la tarjeta con foto** (decisión de Mario). Adoptar del
      canvas solo radio, borde, contadores en mono y barra de avance. NO cambiar a la tarjeta de
      punto de color del artboard.
- [x] 3.5 El filtro «solo disponibles» sigue funcionando igual.

## 4. Perfil del alumno

- [x] 4.1 Cabecera: avatar sólido, nombre en grande (sans de la app), usuario/correo/fecha de
      alta, cifras en mono.
- [x] 4.2 Pestaña Resumen: inscritos / completados / en progreso y las **mismas tarjetas de
      curso del dashboard**, agrupadas por estado.
- [x] 4.3 Pestaña Configuración: datos personales y cambio de contraseña con sus estados de
      error (incluido «las contraseñas nuevas no coinciden»), en español.

## 5. Verificación

- [x] 5.1 `pytest` verde (por 0.1/0.2); `npm run build` verde; `npm run lint` sin empeorar.
- [ ] 5.2 Capturas antes/después de las tres pantallas, escritorio y 390 px.
      **Nota (2026-10-07):** el "antes" ya no existe (rediseño desplegado sin capturas
      previas); solo puede hacerse el "después".
- [x] 5.3 Prueba manual: entrar a una unidad, volver al dashboard y comprobar que «Continúa
      donde quedaste» apunta a esa unidad. Hecho en local (2026-10-07): apunta a la unidad y
      muestra 100 % tras completarla. De paso: el saludo decía «Aún no has empezado ningún
      curso» a quien había terminado todos los que empezó; ahora cuenta los terminados
- [ ] 5.4 Recorrido de teclado en las tres pantallas (no regresar la capability
      `accessibility`).
      **Revisión por código hecha (2026-10-07), falta el recorrido real con Tab.** Arreglado:
      las tarjetas de curso (`CourseGrid`, dashboard y perfil) y de especialización eran
      `<article onClick>` sin nada enfocable — no se podía abrir un curso con teclado; ahora
      un `<button>` cubre la tarjeta, con anillo en la tarjeta y el CTA visible también con
      foco. Menú móvil de `StudentHeader` sin nombre ni `aria-expanded`; enlaces de
      navegación con `aria-current`; filtro «Solo disponibles» con `aria-pressed`; campos de
      Configuración del perfil con foco de ~1,6:1 → borde del acento. Pestañas del perfil:
      Radix, correctas. Pendiente menor: en la mini-malla del preview las tarjetas no
      clicables siguen siendo botones enfocables que no hacen nada.

## Diferido (anotado)
- Modo claro/oscuro (change aparte, después de `design-system-foundations`).
- Certificados y gráficos nuevos de analítica en el perfil.
