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

- [ ] 1.1 `ModuleSidebar` acepta un modo **solo lectura** (sin unidad activa, sin navegación)
      para el preview, sin cambiar su comportamiento actual en el modo estudio.
      **Pendiente:** el preview sigue usando su propio `ModuleRow`.
- [~] 1.2 El preview ya muestra **tipo de material y minutos por unidad**, con la misma
      definición que el modo estudio (duración sólo si el contenido la declara). Lo que falta
      es que ambos usen el MISMO componente en vez de dos que coinciden — hoy la información
      es la misma, pero la lógica está duplicada en `ModuleRow` y `ModuleSidebar`.

## 2. Preview del curso

- [x] 2.1 Hero sobre la banda `#0a0a0c`: badges de nivel y versión, título grande (en la
      **sans de la app**, sin serif), cifras
      (módulos · unidades · contenidos · evaluaciones) en mono, progreso propio y **una sola
      acción** en blanco.
- [~] 2.2 Programa con tipo de material y minutos, módulos plegables (ya lo eran).
      Falta unificar el componente con el del modo estudio (1.1).
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
- [ ] 5.3 Prueba manual: entrar a una unidad, volver al dashboard y comprobar que «Continúa
      donde quedaste» apunta a esa unidad.
- [ ] 5.4 Recorrido de teclado en las tres pantallas (no regresar la capability
      `accessibility`).

## Diferido (anotado)
- Modo claro/oscuro (change aparte, después de `design-system-foundations`).
- Certificados y gráficos nuevos de analítica en el perfil.
