# admin-panel-redesign — el panel por rebanadas

> Diseño: artboards `Admin`, `AdminCurso`, `AdminDatos`, `AdminAnalitica`, `AdminSitio` y el
> **mapa de cobertura** `AdminMapa` del canvas `c82ae7d9-48bd-4fc8-a55f-18531fdc0f8c`.
> **Exportados a `canvas/*.dc.html` en este change** — las medidas/colores exactos de cada
> tarea pendiente están anotados en la **sección 8** de abajo.
>
> **Regla del change:** el mapa de cobertura manda. 72 funciones, 24 cambian de lugar, **ninguna
> desaparece**. Si al implementar una rebanada una función no encuentra sitio, se para y se
> pregunta — no se borra.
>
> Cada rebanada debe dejar el panel **funcionando y desplegable**. No empezar la siguiente sin
> cerrar la anterior.

## 0. Antes de codear (bloqueante)

- [ ] 0.1 **Mario revisa el mapa de cobertura** (`canvas/AdminMapa.dc.html`) y confirma que no
      falta ninguna función que use a diario. Lo que falte se agrega al mapa ANTES de tocar código.
- [ ] 0.2 Capturas del estado actual de: pestaña Módulos, pestaña Contenido con el editor,
      pestaña Evaluaciones, Usuarios, Analítica y Landing.
- [x] 0.3 Exportar los seis artboards a `canvas/` dentro del change (fuente de la sección 8).

## 1. Armazón (7 funciones) — HECHO

> **Corrección estructural (2026-08-30).** El primer intento dejó la lista de cursos dentro del
> rail; en el canvas son **tres columnas**: rail de secciones · lista de cursos y árbol · área de
> trabajo. Corregido: la lista vive en `CourseColumn`, el rail solo lleva secciones.

- [x] 1.1 Barra del panel: segmentado admin/estudiante, accesos a simulador e inicio como
      iconos, avatar, cerrar sesión. Commit `c13b969`.
- [x] 1.2 Rail de 236 px a altura completa, fondo `#fafafa`, filete a la derecha, etiquetas de
      sección en mono, activo en negro de marca, contadores en mono.
- [x] 1.3 El rail oculta para profesor: Dashboard, Usuarios, Especializaciones, Landing y
      Detalle del curso (hoy ya oculta parte; repasar contra el mapa).

## 2. Taller del curso (Módulos 6 + Unidades 5 + Contenido 12 + Evaluaciones 11)

### 2a. El árbol
- [x] 2a.1 Columna de árbol entre el rail y el editor: curso seleccionado arriba con su código,
      luego módulos como nodos numerados y sus unidades debajo — los **mismos nodos** del modo
      estudio (reusar el lenguaje de `ModuleSidebar`, no inventar otro). **Ancho 320px (canvas
      §8.1; corregir el 260px actual de `CourseColumn`).**
- [x] 2a.2 **Seleccionar es navegar**: clic en unidad abre su editor a la derecha. Se elimina el
      botón «Gestionar» y el paso de habilitar pestañas laterales.
- [x] 2a.3 «Crear módulo» al pie del árbol; «Crear curso» e «Importar respaldo (.json)» sobre la
      lista de cursos.
- [x] 2a.4 Módulos: crear, editar título/descripción/orden, eliminar, reordenar — todas siguen
      existiendo, ahora desde el árbol y la pestaña Ajustes.
- [x] 2a.5 Unidades: crear, editar título/descripción/orden, eliminar — desde el árbol y Ajustes.
- [x] 2a.6 La barra de migas se reduce a **línea de contexto** del editor (el árbol ya dice dónde
      estás).

### 2b. El editor: pestaña Contenido (12 funciones)
- [x] 2b.1 Pestañas del panel derecho: **Contenido · Evaluación · Ajustes**, con contador en
      Evaluación.
- [x] 2b.2 El editor TipTap se movió **tal cual** (mismo componente `ContentForm`): negrita, cursiva, subrayado, tachado, código,
      H1–H3, listas, cita, bloque de código, enlace, imagen, YouTube, adjuntar, separador,
      alineación, deshacer/rehacer y redimensionar imagen arrastrando. **No tocar el editor por
      dentro.**
- [x] 2b.3 Guardar pasa al botón **«Guardar» de la cabecera** del editor, con «Último guardado
      hace N» y el aviso «Los cambios no se publican hasta que guardas». **Espec: §8.2.**
      **Pendiente:** exige tocar `ContentForm` por dentro; hoy conserva su guardado propio y funciona igual que antes.
- [x] 2b.4 Simulador 3D: tarjeta con la banda de marca (hoy bloque azul). **Espec: §8.2.**
      **Pendiente:** está dentro de `ContentForm`, que se movió sin tocar.
- [x] 2b.5 Contenido heredado como tarjeta ámbar con su explicación. **Espec: §8.2.**
      **Pendiente:** la función existe y funciona; falta el tratamiento visual, que vive en `ContentForm`.

### 2c. El editor: pestaña Evaluación (11 funciones)
- [x] 2c.1 `QuizEditor` movido tal cual a la pestaña Evaluación: ver, crear la primera,
      título, eliminar.
- [x] 2c.2 Tipo de aprobación como **segmentado**. **Espec: §8.2.** **Pendiente:** vive dentro
      de `QuizEditor`, que se movió sin tocar; el selector actual sigue funcionando.
- [x] 2c.3 Preguntas (crear, editar, opciones, eliminar): siguen funcionando igual — `QuizEditor`
      se movió de contenedor, no se tocó por dentro.
- [x] 2c.4 Conservar el guardado automático con su indicador «Sincronizando…».

### 2d. Cierre de la rebanada
- [ ] 2d.1 **Repaso función por función** de las 34 funciones de Módulos, Unidades, Contenido y
      Evaluaciones contra el mapa. Cualquiera que no tenga sitio: parar y preguntar.
- [ ] 2d.2 Prueba manual completa: crear módulo → crear unidad → escribir contenido → guardar →
      crear evaluación → añadir preguntas → verlo como alumno.

## 3. Detalle del curso (12 funciones)

- [x] 3.1 Formulario **siempre visible** con cabecera de acciones (Ver como alumno, PDF,
      respaldo, **Guardar cambios**), título con estado publicado y pestañas Detalle · Métricas ·
      Feedback. `CourseForm` gana `formId`/`hideSubmit` para que Guardar viva en la cabecera.
- [x] 3.2 Portada (máx. 5 MB): intacta, dentro del formulario que ahora está a la vista.
- [x] 3.3 Prerequisitos en **columna derecha**, con su explicación y la etiqueta REQUERIDO.
      `CourseForm` gana `hidePrereqs` para no duplicarlos.
- [x] 3.4 Descargar PDF del curso y descargar respaldo: se quedan donde están.
- [x] 3.5 Eliminar curso pasa a tarjeta **«Zona sensible»** que recuerda descargar el respaldo
      antes, con confirmación.
- [x] 3.6 Ocultar esta pantalla para profesor (no gestiona la meta del curso).

## 4. Usuarios y progreso (5 funciones)

- [x] 4.1 Buscador por nombre/usuario/correo y **filtro por rol** sobre la tabla.
- [x] 4.2 Cambiar rol sigue en la fila; el panel de cursos asignados al profesor sigue abriéndose
      por la derecha.
- [x] 4.3 La regla «no puedes cambiar tu propio rol ni dejar cero admins» se **enuncia bajo la
      tabla**, no solo al fallar.
- [x] 4.4 Progreso de alumnos sigue en el rail, bajo el mismo grupo (no cambió de sitio).

## 5. Analítica (8 funciones)

- [x] 5.1 Juntar en una sola pantalla lo de Dashboard, pestaña Cursos y Analítica. **Espec: §8.5 (estructura vertical completa).** Pantalla única construida
      (tarjetas → sesiones por día → dedicación/contenidos → rendimiento/falladas →
      inactividad/feedback); las vistas anteriores se conservan como respaldo.
- [x] 5.2 Orden por pregunta: **sesiones por día** · fila de tarjetas de cifras globales ·
      **tiempo por módulo** con rango mín–máx · **quién abre y quién termina** (contenidos) ·
      tabla de **rendimiento** de evaluaciones · **preguntas más falladas** en barras
      horizontales · **alumnos sin actividad reciente** con su antigüedad. **Espec: §8.5.**
- [x] 5.3 **Un solo tono para magnitud.** Verde y ámbar solo como estado y **siempre con
      etiqueta** — nunca color solo.
- [x] 5.4 «Datos insuficientes» ya se respetaba desde `learning-analytics`; se conserva.

## 6. Sitio (6 funciones)

- [ ] 6.1 Landing como **lista de bloques en el orden de la página**, cada uno con interruptor en
      su cabecera y su contenido al desplegarlo. **Espec: §8.5 (bloques y estados).**
- [ ] 6.2 Editar textos de cada sección al desplegar; foto del robot del mockup igual que hoy.
      **Espec: §8.5 (campos del Hero, markup `*asteriscos*`).**
- [ ] 6.3 FAQ: añadir, editar y eliminar preguntas. **Espec: §8.5 (lista con handle de arrastre).**
- [ ] 6.4 Páginas legales (Términos, Privacidad, Cookies) en su propio bloque.
- [ ] 6.5 Especializaciones (crear, editar, publicar, eliminar) debajo de la landing, en el rail
      «Sitio». **Espec: §8.5 (grid de 3 tarjetas).**

## 7. Verificación (cada rebanada)

- [ ] 7.1 `npm run build` verde y `npm run lint` sin empeorar la línea base (53 problemas /
      48 errores).
- [ ] 7.2 Capturas antes/después de la pantalla tocada.
- [ ] 7.3 Recorrido de teclado de la pantalla (no regresar la capability `accessibility`).
- [ ] 7.4 Repaso contra el mapa de cobertura de las funciones de esa rebanada.

## 8. Especificaciones del canvas — guía de implementación (fuente: `canvas/*.dc.html`)

> Los seis artboards exportados viven en `canvas/` (commit). Esta sección extrae las
> medidas, colores y textos exactos para cerrar las tareas pendientes. Referencias:
> `Admin.dc.html` (taller), `AdminCurso.dc.html` (detalle), `AdminDatos.dc.html`
> (usuarios+progreso), `AdminAnalitica.dc.html`, `AdminSitio.dc.html`, `AdminMapa.dc.html`
> (mapa de cobertura: 72 funciones · 24 cambian · ámbar = cambia de lugar).

### 8.1 Token globales (ya montados, verificar)
- Header 56px, `border-bottom #ececf1`, padding `0 18px`. Logo 28px `#16151b`; badge
  `ADMIN` pill mono 9.5px `#16151b`. Segmentado Vista admin/estudiante: contenedor
  `#f4f3f8` r10 p3, activo `#fff` + sombra `0 1px 3px rgba(22,21,27,0.09)`, alto 30.
  Iconos simulador/inicio 32px r8 `#8b8a95`; avatar iniciales círculo 28px `#16151b`.
- Rail 236px `#fafafa` `border-right #ececf1` p `16px 12px`; `.lbl` mono 9.5px
  `#a9a8b4` ls 0.14em; ítem 36px r9 g10 f13; activo `#16151b` blanco 600; contador pill
  activo `rgba(255,255,255,0.22)` / inactivo `#e7e6ee` `#8b8a95`. Nota profesor:
  11px `#b3b2be` `margin: 26px 10px 0`.
- **Segunda columna: 320 px** (corregir el `lg:w-[260px]` actual de `CourseColumn`),
  padding 14px. «Crear curso» pri flex-1 h38 f12.5; importar icono 38px. Fila de curso:
  p `9px 10px` r9, punto de nivel 8px, **código `CR-N`** mono 9.5 (hoy se muestra `#id`;
  ver 8.6), seleccionado `rgba(75,70,214,0.08)` + `#4b46d6` + barra inset 2.5px.
- Área de trabajo: p `22px 28px 56px`. Crumb mono 10.5px upper `#a9a8b4`.
  **h1 serif**: `'Iowan Old Style', 'Palatino Linotype', Palatino, Georgia, serif`
  28px lh1.16 w700 ls -0.014em `margin: 14px 0 0`. Pestañas: contenedor `#f4f3f8` r10
  p3; pestaña h34 p `0 15px` r8 f13 w600; activa `#fff` + sombra; contador pill mono
  9.5 (activo tint/acento; inactivo `#e7e6ee` `#8b8a95`).

### 8.2 Rebanada 2 — taller (pendientes 2b.3, 2b.4, 2b.5, 2c.2)
- **2b.3 Guardar en cabecera** (`Admin.dc.html`): la fila superior del editor lleva
  «Ver como alumno» (sec h36) y **«Guardar» pri h36** (`#16151b`). El pie del editor
  (barra `border-top #f2f1f6` bg `#fcfcfd` p `11px 14px`) muestra **«Último guardado
  hace 2 min»** mono 10.5 `#a9a8b4` a la izquierda y **«Los cambios no se publican hasta
  que guardas.»** 12px a la derecha. Exige sacar el guardado propio de `ContentForm`
  (props tipo `hideSubmit` + callback al padre, como ya se hizo con `CourseForm`).
- **2b.4 Simulador** (`Admin.dc.html` L237): tarjeta r14 **bg `#0a0a0c`** con trama de
  puntos (22px, máscara radial), p `20px 22px`, texto blanco. Icono 38px r11
  `rgba(255,255,255,0.1)` borde `rgba(255,255,255,0.2)`; título 14.5px w600 «Simulador
  3D»; sub 12.5 `rgba(255,255,255,0.6)` «Esta unidad incluye un acceso al simulador.»;
  botón «Quitar» h34 borde `rgba(255,255,255,0.24)`. Bloque «Instrucciones para el
  alumno» (lbl `rgba(255,255,255,0.4)` + caja bg `rgba(255,255,255,0.06)` borde
  `rgba(255,255,255,0.12)`).
- **2b.5 Heredado** (`Admin.dc.html` L260): tarjeta r14 borde `#f0e6c8` bg `#fffdf6`
  p18. Título «Contenido heredado · 2 bloques» 13.5px w600 `#92400e` + icono triángulo
  `#b45309`; texto 12.5 `#a16207`; botón **«Migrar al editor»** pri h36. Filas de
  bloque: bg `#fff` borde `#f0e6c8` r10 p `10px 12px`, pills por tipo (texto
  `#eef2ff/#4338ca`, video `#f5edfb/#7e22ce`, recurso `#fdf0d9/#b45309`, imagen
  `#e7f8f1/#047857`, archivo `#fdeef1/#b4425a`), icono eliminar 30px.
- **2c.2 Aprobación segmentada** (`Admin.dc.html` L302): grid 2 columnas; izquierda
  «Tipo de aprobación» segmentado h32 («Puntaje mínimo» activo / «Todas correctas»);
  derecha «Puntaje mínimo · **70%**» con slider (riel 5px `#eceaf2`, relleno acento,
  thumb 17px blanco borde 2px acento + sombra).
- **Evaluación, extras del canvas**: tarjetas de pregunta r14 p18 con número en
  círculo 26px mono, pill de tipo (tint/acento), iconos duplicar/eliminar 30px;
  opciones correctas borde `#cdeee0` bg `#f7fdfa` + punto verde `#10b981` con check +
  etiqueta `CORRECTA` mono 9.5 `#047857`; botones «Opción múltiple» / «Verdadero o
  falso» dashed h42; «Se guarda solo · sincronizado» mono 10.5.
- **Ajustes** (`Admin.dc.html` L382): max-width 560; campos título/descripción/orden
  (orden input mono 88px + nota «Posición en la que el alumno verá esta unidad.»);
  «Guardar cambios» pri h42 y «Eliminar unidad» borde `#f0d5d5` `#b4425a` al pie.

### 8.3 Rebanada 3 — detalle (hecho; verificar contra canvas)
- Header de acciones: «Cursos · CR-2» mono; «Ver como alumno»/«Descargar PDF»/
  «Descargar respaldo» sec h38; **«Guardar cambios» pri h38**. h1 serif 28px + pill
  «Publicado» bg `#ecfdf5` `#047857` punto `#10b981` (11.5px w600). Pestañas Detalle ·
  Métricas · Feedback h34.
- Columna izquierda 460px: labels `.fl` 11.5px w600 `#55545f` mb7; inputs `.fi` h40
  r10 borde `#e3e2ea` f13.5. Portada 148px r12 bg `#0a0a0c` con trama de puntos +
  caption mono 10 `rgba(255,255,255,0.6)` «portada-ur5.jpg · PNG, JPG, WEBP · máx 5 MB».
  **Nivel segmentado** (3 opciones h38 r9; activa borde `#cdcbe8` bg tint `#4b46d6`).
  Fila «Publicado» con toggle 44×25 `#10b981` y nota.
- Derecha: Prerequisitos (filas checkbox 17px r5; título 13.5 w600 `#2c2b34`; sub mono
  «CR-1 · Principiante»; `REQUERIDO` mono 9.5 w700 acento) + Zona sensible (borde
  `#f0d5d5`, título `#b4425a`, botón borde `#f0d5d5`).

### 8.4 Rebanada 4 — usuarios y progreso (hecho; verificar contra canvas)
- Buscador 300px con icono; filtro por rol segmentado h32 (Todos / Estudiantes /
  Profesores / Admin); «128 usuarios» mono 11. Tabla: `.th` mono 9.5 `#a9a8b4` bg
  `#fcfcfd`; `.td` 13.5 `#33323b` borde-t `#f2f1f6` p `13px 14px`; avatar 32px `#16151b`;
  nombre 13.5 w600 + `@user · correo` mono 10.5; **pill de rol con chevron** (Admin
  `#16151b` blanco; Profesor `#e6e6fb` `#4338ca`; Estudiante `#f4f3f8` `#55545f`);
  fecha mono 12.5; completados `#047857`. Profesores: botón «Cursos asignados» sec h32.
- Panel lateral «Cursos asignados»: **372px**, bg `#fff`, borde-l `#ececf1`, sombra
  `-18px 0 40px rgba(22,21,27,0.07)`, p24; h2 serif 21px con el nombre del profe; nota
  «Solo verá el progreso y la analítica de los cursos marcados aquí. Se guarda al
  instante.». Progreso debajo con separador `1px #ececf1` m40; selector de curso sec
  h40 con punto + «24 alumnos inscritos» mono 11; tabla con columnas Alumno · Curso ·
  Iniciados · Completados · Evaluaciones · Última actividad (mono; `#b45309` si >14
  días).

### 8.5 Rebanadas 5 y 6 — analítica y sitio (pendientes 5.1/5.2 y 6.1–6.5)
- **Analítica consolidada** (`AdminAnalitica.dc.html`), orden vertical:
  1. Header: h1 «Analítica» + selector de curso (sec h40, punto nivel) + **segmentado
     de período 7/14/90 días** (h32).
  2. **Fila de 4 tarjetas** (r14 p `18px 20px`; número mono 30px w700): Alumnos
     activos («24» «de 128», nota «+6 respecto a los 14 días previos»), Tiempo activo
     («41» «h», «Suma del tiempo real en el curso»), Contenidos completados («312»,
     «68 % de los que se abrieron»), Aprobación media («76» «%», «Umbral del curso:
     70 %»).
  3. **Sesiones por día**: card con gráfico de barras `#7d79e3` (riel `#f2f1f6`,
     etiquetas mono), nota «Toda la plataforma · últimos 14 días».
  4. Grid 2: **Dedicación — Tiempo por módulo** (barra 220px riel `#f2f1f6` relleno
     `#4b46d6`; mediana mono 12 + rango mono 10.5 «9 – 34 min») · **Contenidos — Quién
     abre y quién termina** (barra 210px; % mono 12 + «23 de 25»).
  5. Grid 2: **Evaluaciones — Rendimiento** (tabla Intentos · Promedio · Aprobación
     con pill «Sano» `#ecfdf5`/`#047857` o «Revisar» `#fffbeb`/`#b45309` · Hasta
     aprobar) · **Preguntas más falladas** (barras 200px + % de respuestas incorrectas).
  6. Grid 2: **Sin actividad reciente** (icono reloj `#b45309`; filas avatar 28px +
     «hace N días» mono 11 `#b45309`) · **Feedback del curso** («18 respuestas de 24
     alumnos que completaron»; Dificultad 3.4/5 y Utilidad 4.6/5 con 5 barras 26×8).
  Un solo tono para magnitud; verde/ámbar solo estado con etiqueta (5.3/5.4 ya
  cumplidos). Origen de datos: combinar Dashboard (sesiones/globales), Cursos
  (feedback/métricas por curso) y Analítica existente; reusar endpoints actuales.
- **Sitio** (`AdminSitio.dc.html`): header «Página de inicio» + nota («Cada bloque de
  la landing se enciende, se apaga y se edita aquí…») + «Ver la página» sec + «Guardar»
  pri. Lista de bloques max-width 880, gap 10, cada uno card r14 con cabecera
  (título 14px w600 + descripción 12.5 `#a9a8b4` + **toggle 40×23** — on `#10b981`,
  off `#dcdbe4` — + chevron) y contenido al desplegar. Bloques en orden: **Hero**
  (insignia, título con markup `*asteriscos*`, subtítulo, foto del robot 190×110 en
  mockup), **Estadísticas**, **Simulador**, **Cursos**, **Cómo funciona**, **Para
  quién** (estado apagado: bg `#fcfcfd`, título `#a9a8b4`), **Preguntas frecuentes**
  (lista con handle de arrastre 24px, pregunta input h38 w600, respuesta textarea),
  **Llamado a la acción final**, **Páginas legales** (Términos, Privacidad, Cookies).
  Debajo, separador `1px #ececf1` m42 y **Especializaciones**: «Nueva especialización»
  pri + grid 3 col con tarjetas (cabecera 96px `#0a0a0c` + pill Publicada
  `#ecfdf5`/`#047857` o Borrador `#f4f4f7`/`#8b8a95`; título 14.5 w600; «N cursos» mono
  10.5; Editar sec h32; Eliminar icono 32).

### 8.6 Decisiones de datos que el canvas asume
- **Código de curso `CR-N`**: el modelo no tiene campo `code`. v1: mostrar
  `CR-<id>` derivado (barato, honesto). Si Luz quiere códigos reales editables, es
  cambio de backend aparte (no en este change).
- **«Último guardado hace N»**: requiere guardar un `updated_at` del contenido que ya
  existe en el backend (`UnitContent.updated_at`/`onupdate`) — el frontend puede
  computar "hace N" con el `updated_at` devuelto; verificar que el GET lo expone.
- **Contador de Evaluación**: `quiz count` de la unidad (dato ya presente en el
  detalle del curso).

## Diferido (anotado)
- Modo claro/oscuro del panel (change aparte, `theme-switching`).
- Vista móvil del panel admin: el canvas solo cubre escritorio.
- Métricas nuevas: esto es rediseño, no funcionalidad nueva.
