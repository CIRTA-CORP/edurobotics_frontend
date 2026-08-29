# student-pages-redesign — preview, dashboard y perfil

> Referencia: artboards `Preview.dc.html`, `Dashboard.dc.html` y `Perfil.dc.html` del canvas
> `c82ae7d9-48bd-4fc8-a55f-18531fdc0f8c`.
> **Requiere `design-system-foundations` cerrado**: pintar estas pantallas con los tokens viejos
> es trabajo que hay que rehacer.

## 0. Backend: contexto de la última visita

- [ ] 0.1 `get_last_accessed_content` devuelve además curso (id y título), módulo (título y
      número) y unidad (id, título, posición «unidad N de M»). Aditivo y de solo lectura;
      **sin migración**.
- [ ] 0.2 Test: usuario con progreso devuelve el contexto completo; usuario sin progreso sigue
      devolviendo `last_accessed: null` sin romper el dashboard.

## 1. Índice reutilizable

- [ ] 1.1 `ModuleSidebar` acepta un modo **solo lectura** (sin unidad activa, sin navegación)
      para el preview, sin cambiar su comportamiento actual en el modo estudio.
- [ ] 1.2 El preview lo usa con tipo de material y minutos por unidad — el mismo índice que el
      alumno verá dentro del curso.

## 2. Preview del curso

- [ ] 2.1 Hero sobre la banda `#0a0a0c`: badges de nivel y versión, título en serif, cifras
      (módulos · unidades · contenidos · evaluaciones) en mono, progreso propio y **una sola
      acción** en blanco.
- [ ] 2.2 Programa con la línea de módulos (1.2), módulos plegables.
- [ ] 2.3 Posición en la malla: curso actual marcado «Estás aquí», prerrequisitos y cursos que
      desbloquea, con enlace a la malla completa.
- [ ] 2.4 **No tocar** la lógica de prerrequisitos ni de matrícula: solo su presentación.

## 3. Dashboard del alumno

- [ ] 3.1 Banda de bienvenida con el resumen real (unidades hechas / cursos activos).
- [ ] 3.2 Tarjeta **«Continúa donde quedaste»** con curso, módulo, unidad exacta y botón,
      alimentada por 0.1. Si no hay última visita, la tarjeta **no se muestra** (nada de
      estados inventados).
- [ ] 3.3 Tarjetas de curso: conservar la foto con degradado de legibilidad, retirar los
      degradados de relleno, botón visible al pasar el cursor.
- [ ] 3.4 **Especializaciones: conservar la tarjeta con foto** (decisión de Mario). Adoptar del
      canvas solo radio, borde, contadores en mono y barra de avance. NO cambiar a la tarjeta de
      punto de color del artboard.
- [ ] 3.5 El filtro «solo disponibles» sigue funcionando igual.

## 4. Perfil del alumno

- [ ] 4.1 Cabecera: avatar sólido, nombre en serif, usuario/correo/fecha de alta, cifras en mono.
- [ ] 4.2 Pestaña Resumen: inscritos / completados / en progreso y las **mismas tarjetas de
      curso del dashboard**, agrupadas por estado.
- [ ] 4.3 Pestaña Configuración: datos personales y cambio de contraseña con sus estados de
      error (incluido «las contraseñas nuevas no coinciden»), en español.

## 5. Verificación

- [ ] 5.1 `pytest` verde (por 0.1/0.2); `npm run build` verde; `npm run lint` sin empeorar.
- [ ] 5.2 Capturas antes/después de las tres pantallas, escritorio y 390 px.
- [ ] 5.3 Prueba manual: entrar a una unidad, volver al dashboard y comprobar que «Continúa
      donde quedaste» apunta a esa unidad.
- [ ] 5.4 Recorrido de teclado en las tres pantallas (no regresar la capability
      `accessibility`).

## Diferido (anotado)
- Modo claro/oscuro (change aparte, después de `design-system-foundations`).
- Certificados y gráficos nuevos de analítica en el perfil.
