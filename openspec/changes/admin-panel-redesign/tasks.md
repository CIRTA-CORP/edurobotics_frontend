# admin-panel-redesign — el panel por rebanadas

> Diseño: artboards `Admin`, `AdminCurso`, `AdminDatos`, `AdminAnalitica`, `AdminSitio` y el
> **mapa de cobertura** `AdminMapa` del canvas `c82ae7d9-48bd-4fc8-a55f-18531fdc0f8c`.
>
> **Regla del change:** el mapa de cobertura manda. 72 funciones, 24 cambian de lugar, **ninguna
> desaparece**. Si al implementar una rebanada una función no encuentra sitio, se para y se
> pregunta — no se borra.
>
> Cada rebanada debe dejar el panel **funcionando y desplegable**. No empezar la siguiente sin
> cerrar la anterior.

## 0. Antes de codear (bloqueante)

- [ ] 0.1 **Mario revisa el mapa de cobertura** en el canvas y confirma que no falta ninguna
      función que use a diario. Lo que falte se agrega al mapa ANTES de tocar código.
- [ ] 0.2 Capturas del estado actual de: pestaña Módulos, pestaña Contenido con el editor,
      pestaña Evaluaciones, Usuarios, Analítica y Landing.

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
      estudio (reusar el lenguaje de `ModuleSidebar`, no inventar otro).
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
- [ ] 2b.3 Guardar pasa al botón **«Guardar» de la cabecera** del editor, con «Último guardado
      hace N» y el aviso «Los cambios no se publican hasta que guardas». **Pendiente:** exige
      tocar `ContentForm` por dentro; hoy conserva su guardado propio y funciona igual que antes.
- [ ] 2b.4 Simulador 3D: tarjeta con la banda de marca (hoy bloque azul). **Pendiente:** está
      dentro de `ContentForm`, que se movió sin tocar.
- [ ] 2b.5 Contenido heredado como tarjeta ámbar con su explicación. **Pendiente:** la función
      existe y funciona; falta el tratamiento visual, que vive en `ContentForm`.

### 2c. El editor: pestaña Evaluación (11 funciones)
- [x] 2c.1 `QuizEditor` movido tal cual a la pestaña Evaluación: ver, crear la primera,
      título, eliminar.
- [ ] 2c.2 Tipo de aprobación como **segmentado**. **Pendiente:** vive dentro de `QuizEditor`,
      que se movió sin tocar; el selector actual sigue funcionando.
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

- [ ] 5.1 Juntar en una sola pantalla lo de Dashboard, pestaña Cursos y Analítica. **Pendiente:**
      solo se unificó el color; la consolidación de las tres pantallas no está hecha.
- [ ] 5.2 Orden por pregunta: **sesiones por día** · fila de tarjetas de cifras globales ·
      **tiempo por módulo** con rango mín–máx · **quién abre y quién termina** (contenidos) ·
      tabla de **rendimiento** de evaluaciones · **preguntas más falladas** en barras
      horizontales · **alumnos sin actividad reciente** con su antigüedad.
- [x] 5.3 **Un solo tono para magnitud.** Verde y ámbar solo como estado y **siempre con
      etiqueta** — nunca color solo.
- [x] 5.4 «Datos insuficientes» ya se respetaba desde `learning-analytics`; se conserva.

## 6. Sitio (6 funciones)

- [ ] 6.1 Landing como **lista de bloques en el orden de la página**, cada uno con interruptor en
      su cabecera y su contenido al desplegarlo.
- [ ] 6.2 Editar textos de cada sección al desplegar; foto del robot del mockup igual que hoy.
- [ ] 6.3 FAQ: añadir, editar y eliminar preguntas.
- [ ] 6.4 Páginas legales (Términos, Privacidad, Cookies) en su propio bloque.
- [ ] 6.5 Especializaciones (crear, editar, publicar, eliminar) debajo de la landing, en el rail
      «Sitio».

## 7. Verificación (cada rebanada)

- [ ] 7.1 `npm run build` verde y `npm run lint` sin empeorar la línea base (53 problemas /
      48 errores).
- [ ] 7.2 Capturas antes/después de la pantalla tocada.
- [ ] 7.3 Recorrido de teclado de la pantalla (no regresar la capability `accessibility`).
- [ ] 7.4 Repaso contra el mapa de cobertura de las funciones de esa rebanada.

## Diferido (anotado)
- Modo claro/oscuro del panel (change aparte, `theme-switching`).
- Vista móvil del panel admin: el canvas solo cubre escritorio.
- Métricas nuevas: esto es rediseño, no funcionalidad nueva.
