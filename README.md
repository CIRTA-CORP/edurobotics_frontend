# EduRobotics — frontend

La web de **EduRobotics**, la plataforma de CIRTA para aprender robótica: página pública,
cursos con contenidos y evaluaciones, panel del alumno y del profesor, panel de
administración, y un simulador de un brazo UR5e que se programa en Python.

**React 19 + Vite 7 + Tailwind 4 + TanStack Query.** Tiptap para escribir el contenido,
Monaco para el editor de código, three.js + urdf-loader para el robot en 3D. Desplegado en
**Vercel** (www.edurobotics.cl).

## Cómo encaja con lo demás

```
Navegador ──▶ Frontend (Vercel, este repo)
                 │ HTTPS (REST) + WebSocket (simulador)
                 ▼
             Backend (Railway, repo edurobotics_backend) ──▶ Supabase: Postgres + Storage
                 │
                 ▼
             Simulador (Fly.io: ROS2 + PyBullet + UR5e)
```

El frontend no habla con Supabase ni con Fly: todo pasa por el backend.

## Qué hay en este repositorio

```
edurobotics_frontend/frontend-react/   la aplicación (todo lo de abajo es relativo a aquí)
openspec/                              decisiones de los DOS repositorios (ver más abajo)
CLAUDE.md                              reglas del proyecto y lo que no es obvio
```

### Mapa de `src/`

```
main.jsx        arranque: React Query, router, estilos
App.jsx         todas las rutas, y cuáles exigen sesión o rol
config.js       API_BASE, la dirección del backend
index.css       Tailwind 4 y los estilos globales (animaciones del simulador incluidas)
shared/         lo que usan varias áreas
features/       una carpeta por área de la aplicación
```

| Carpeta | Qué contiene |
|---|---|
| `shared/services/api.js` | **la única puerta al backend**: `apiGet`, `apiGetCached`, `apiPost`, `apiPut`, `apiDelete`, `apiUploadFile`. Pone el token, y ante un 401 cierra la sesión |
| `shared/lib/` | cliente de React Query (`queryClient.js`), saneado de HTML (`sanitizeHtml.js`), utilidades |
| `shared/components/` | piezas de interfaz comunes: botón, tarjeta, modal, cajón lateral, pestañas, barra pública |
| `features/landing` | la página pública; sus textos se editan desde el panel de administración |
| `features/auth` | entrar, registrarse, recuperar la contraseña, `ProtectedRoute` |
| `features/legal` | términos, privacidad y cookies |
| `features/dashboard`, `student`, `roadmap` | inicio del alumno, su mapa de ruta |
| `features/courses` | página del curso, modo estudio, vista para imprimir; el visor del contenido (`ContentViewer`) |
| `features/quizzes`, `progress` | evaluaciones y avance |
| `features/specializations` | especializaciones (grupos de cursos) |
| `features/profile` | perfil, cambiar la contraseña, descargar mis datos, borrar la cuenta |
| `features/teacher` | datos del panel del profesor |
| `features/admin` | panel de administración: cursos y su contenido (taller), usuarios, analítica, progreso, landing, respaldos |
| `features/simulator` | el simulador (detalle abajo) |

### El simulador (`features/simulator/`)

| Pieza | Qué hace |
|---|---|
| `pages/SimulatorPage.jsx` | la página: cabecera, estado del servidor, aviso en móvil |
| `components/Ide.jsx` | une las dos mitades: editor a la izquierda, robot a la derecha |
| `components/LeftPanel.jsx` | editor, terminal y Guía; envía el programa por WebSocket y recibe la salida y los fotogramas |
| `components/SimulatorPanel.jsx` | encender el simulador, fila de espera, visor 3D, vista previa de posturas |
| `components/DocumentationPanel.jsx` | la Guía: referencia de `robot_api` con ejemplos probados en la máquina |
| `components/Terminal.jsx`, `JointSliders.jsx`, `CodeButtons.jsx` | terminal, deslizadores de la vista previa, barra de botones |
| `editors/EditorPanel.jsx` | Monaco **autoalojado**, con su tema y letra |
| `viewer/UrdfViewer.jsx` | el robot en 3D, construido desde `public/robots/ur5e/ur5e_robotiq.urdf`; interpola entre fotogramas usando sus marcas de tiempo |
| `lib/` | lógica sin React: clasificar las líneas de la terminal, armar el código de «Añadir al editor», estado del servidor compartido, la letra del código |

Cómo funciona una ejecución, del lado del servidor: el README de `robotics` en el backend.

## En local

Requisitos: Node 20.19 o 22.12 en adelante (lo exige Vite 7). Desde `edurobotics_frontend/frontend-react/`:

```bash
npm install
```

```bash
npm run dev
```

Abre `http://localhost:5173` y espera el backend en `http://localhost:8001`. Para apuntar a
otro backend, crear `.env.development.local` con `VITE_API_BASE=https://…`.

Otras órdenes: `npm run build` (producción, en `dist/`), `npm run lint` (ESLint),
`npm run preview` (sirve el build).

**El servidor de desarrollo no aplica la CSP de producción** (`vercel.json`). Algo que
funciona en local puede fallar publicado si la CSP lo bloquea: pasó con las texturas del
robot. Ante un fallo que solo ocurre en producción, mirar primero la consola del navegador
en www.edurobotics.cl.

## Despliegue

Vercel publica cada push a `main`. `vercel.json` (en `frontend-react/`) define:

- **las rutas**: toda URL sirve `index.html` y React Router decide qué mostrar;
- **la CSP y las cabeceras de seguridad**. Solo se permiten scripts, fuentes y workers
  propios, por eso Monaco y la letra del código vienen empaquetados y no de un CDN.
  `connect-src` lleva `blob:` porque three.js lee así las texturas del robot.

La variable de entorno de producción es `VITE_API_BASE`, en el panel de Vercel.

## OpenSpec: dónde está el porqué

Todo cambio de comportamiento, de este repo o del backend, se propone antes de programarse en
`openspec/changes/<nombre>/`:

- `proposal.md`: por qué, con datos;
- `design.md`: decisiones y lo que queda fuera;
- `tasks.md`: casillas que se marcan al terminar y verificar;
- `specs/`: los requisitos que añade o cambia.

Al cerrarse, sus requisitos pasan a `openspec/specs/` (lo que la plataforma **hace hoy**) y
el change va a `openspec/changes/archive/`. Para entender por qué algo es como es, buscarlo
ahí. Ver `openspec/AGENTS.md` y `CLAUDE.md`.

## Recetas

**Agregar una página.**
1. Crear la página en `features/<área>/pages/`.
2. Registrar la ruta en `App.jsx`. Envolverla en `ProtectedRoute`, con `requiredRole` o
   `allowedRoles` si no es pública. Cargarla con `lazy()` si es pesada.
3. Todo texto visible, en español.

**Pedir datos al backend.**
1. Escribir la función en `features/<área>/services/` usando `shared/services/api.js`, nunca
   `fetch` suelto.
2. Usarla desde el componente con `useQuery` / `useMutation` de React Query.
3. En las escrituras, pasar `{ invalidate: '/api/…' }` para refrescar solo lo afectado.

**Agregar una sección al panel de administración.**
1. El componente va en `features/admin/tabs/`.
2. Cargarlo con `named(...)` y mostrarlo según `activeTab` en `pages/AdminDashboardPage.jsx`.
3. Añadir su botón en `components/AdminSidebarNav.jsx`.
4. Si es solo de administrador, sumarlo a la lista que redirige a los profesores, en el mismo
   `AdminDashboardPage.jsx`.

**Agregar un ejemplo a la Guía del simulador.**
1. Ejecutarlo en la máquina del simulador y comprobar que no choca ni avisa.
2. Agregarlo a `DocumentationPanel.jsx` con `<Recipe>` (o `<CodeBlock>`); hereda el
   coloreado y los botones «Copiar» y «Abrir en el editor».

**Cambiar la CSP.** Editar `vercel.json` y probar el resultado **publicado**: ni
`npm run dev` ni `npm run preview` aplican las cabeceras de Vercel.

**Actualizar dependencias.** Revisar qué propone `npm audit fix` antes de aceptarlo: ya rompió
Tiptap una vez al subir solo `@tiptap/core`. Los paquetes `@tiptap/*` se suben juntos.
