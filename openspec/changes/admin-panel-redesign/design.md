# admin-panel-redesign — decisiones de diseño

## Decisión 1 — El mapa de cobertura es el contrato, no una referencia

El canvas trae un artboard con **las 72 funciones del panel actual**, cada una con dónde está
hoy y dónde queda. 24 cambian de lugar y ninguna desaparece. Ese mapa es lo que convierte un
rediseño grande en algo verificable: al cerrar cada rebanada se repasa función por función.

Consecuencia práctica: **si al implementar una función no encuentra sitio en el diseño nuevo, se
para y se pregunta.** No se borra ni se "deja para después" en silencio. Es el único
salvavidas que tenemos, porque el proyecto no tiene tests de interfaz.

## Decisión 2 — Seleccionar es navegar

El problema real del panel de hoy no es estético: es que **hay dos sitios para una sola cosa**.
Eliges el módulo con un botón «Gestionar» en el centro de la pantalla, y eso habilita una
pestaña en el lateral. El estado vive en dos lugares y la pantalla no dice en cuál estás.

El árbol lo colapsa: la jerarquía se ve entera, el clic selecciona y navega a la vez, y el panel
derecho muestra lo que corresponde a lo seleccionado. Por eso la barra de migas se reduce a una
línea de contexto — el árbol ya cumple esa función.

**El árbol reutiliza el lenguaje del índice del alumno** (nodos numerados, verde para completo).
Que el admin y el alumno vean la misma estructura no es coquetería: es lo que hace que la
directora entienda de un vistazo qué está viendo el estudiante.

## Decisión 3 — Lo que se mueve de sitio y lo que se toca por dentro

**Se mueve, no se reescribe:** el editor TipTap, los formularios de módulo/unidad/curso, el
editor de evaluaciones con su guardado automático, el panel de cursos asignados al profesor.
Cambian de contenedor; su lógica queda intacta.

**Se reescribe la composición:** `AdminDashboardPage` (el layout), `AdminSidebarNav` (el rail),
y las pestañas que hoy encadenan Módulos → Unidades → Contenido → Evaluaciones.

Esta separación es deliberada: el riesgo de romper algo está en la lógica, y la lógica no se
toca. Lo que cambia es dónde vive cada cosa en la pantalla.

## Decisión 4 — Rebanadas desplegables, no un big bang

Seis rebanadas, cada una deja el panel funcionando:

1. Armazón (hecho) → 2. Taller del curso → 3. Detalle del curso → 4. Usuarios y progreso →
5. Analítica → 6. Sitio.

El orden no es arbitrario: el armazón es donde viven las demás; el taller es el que resuelve el
problema real (y el de más riesgo, así que va cuando el armazón ya está estable); las tres
últimas son en su mayoría reordenar y reestilar lo que ya existe.

**Regla:** no se empieza una rebanada sin cerrar la anterior, con su repaso contra el mapa y sus
capturas. Si a mitad de camino hay que parar, el panel queda usable.

## Decisión 5 — Color en analítica: un tono para magnitud

Hoy los números de admin están repartidos en tres pantallas y usan colores distintos por
sección, lo que hace leer "azul" como si significara algo. En el rediseño:

- **Un solo tono para magnitud** (barras, cifras, gráficos).
- **Verde y ámbar solo como estado**, y **siempre acompañados de etiqueta** — nunca color solo,
  porque el color solo no es accesible y además obliga a recordar una convención.

Se mantiene la regla de `learning-analytics`: donde el backend informa «datos insuficientes», la
pantalla lo dice en vez de dibujar un promedio de una persona.

## Decisión 6 — Qué NO entra

- **Métricas nuevas.** Esto es rediseño: si un número no existe hoy en el backend, no se inventa
  aquí. La analítica junta y ordena lo que ya hay.
- **Vista móvil del panel.** El canvas solo cubre escritorio y el panel se usa en computador. Si
  hiciera falta, es otro change.
- **Modo claro/oscuro**, que va en `theme-switching`.

## Verificación

No hay tests de interfaz en el proyecto, así que la verificación es manual y explícita por
rebanada:

- `npm run build` verde; `npm run lint` sin empeorar (53 problemas / 48 errores de línea base).
- Capturas antes/después de la pantalla tocada.
- Recorrido de teclado (la capability `accessibility` no puede regresar).
- **Repaso contra el mapa** de las funciones de esa rebanada.
- Para la rebanada 2, además: prueba manual de punta a punta — crear módulo, crear unidad,
  escribir contenido, guardar, crear evaluación, añadir preguntas y verlo como alumno.
