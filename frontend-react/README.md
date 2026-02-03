# EduRobotics Frontend (React + Vite)

Frontend de la plataforma EduRobotics. Se comunica con el backend FastAPI mediante `fetch`.

## Stack
- React + Vite
- React Router
- CSS plano (App.css)

## Scripts
- `npm install`
- `npm run dev`
- `npm run build`

## Rutas principales
- `/login` → Inicio de sesión
- `/register` → Registro
- `/dashboard` → Redirige por rol
- `/student` → Dashboard estudiante
- `/admin` → Panel admin con toggle (estudiante / admin)
- `/courses/:courseId` → Vista de curso

## Estructura (resumen)
- `src/pages/admin/AdminDashboardPage.jsx` → Panel admin (cursos, módulos, quizzes)
- `src/pages/student/StudentDashboardPage.jsx` → Dashboard estudiante (lista de cursos)
- `src/pages/CoursePage.jsx` → Vista de curso con módulos/contendidos/quizzes
- `src/pages/DashboardPage.jsx` → Redirección por rol
- `src/services/` → llamadas al backend
- `src/App.css` → estilos globales

## Notas de desarrollo
- El rol se obtiene desde `localStorage` con `getStoredUser()`.
- El token admin se guarda en `localStorage` como `adminToken`.
- Los endpoints públicos se consumen sin token; los admin requieren `X-Admin-Token`.

## Convenciones
- El admin siempre puede alternar entre vista estudiante y panel admin.
- Los estudiantes solo ven el dashboard de cursos.
