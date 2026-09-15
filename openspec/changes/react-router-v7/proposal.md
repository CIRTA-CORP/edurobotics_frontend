# Migrar a React Router v7

## Why

Quedan dos avisos moderados en `react-router` tras la subida de dependencias:
redirección abierta por barra invertida en `<Link>` y `useNavigate`, y por rutas
que empiezan con `//` reinterpretadas como URL relativa al protocolo.

El aviso cubre **de la 6.0.0 a la 7.17.0**, así que no hay parche dentro de la
v6: limpiarlo es migrar.

Una redirección abierta en una plataforma con menores no es teórica: es el
vehículo habitual de un enlace de phishing que parece del dominio propio.

## What Changes

Subir `react-router-dom` a v7 (≥ 7.18) y ajustar lo que haga falta.

La migración es pequeña porque el proyecto usa el **modo declarativo**:
`BrowserRouter` + `Routes` + `Route`. De React Router se usan nueve APIs
—`BrowserRouter`, `Routes`, `Route`, `Link`, `Navigate`, `useNavigate`,
`useParams`, `useLocation`, `useSearchParams`— y **las nueve existen igual en
v7**. No se usan cargadores de datos, `RouterProvider` ni rutas de framework,
que es donde v7 concentra sus rupturas.

Los requisitos de v7 ya se cumplen de sobra: pide Node ≥ 20 y React ≥ 18; el
proyecto va con Node 24 y React 19.

## Capabilities

**Modified**
- `security` — sin redirección abierta desde los enlaces de la aplicación.

## Impact

**Frontend**
- `package.json` / `package-lock.json`.
- Posibles ajustes de import si algún símbolo se mueve a `react-router`.

**Backend** — sin cambios.

**Riesgo**: bajo por el modo declarativo, pero es un salto de versión mayor y
toca el enrutado de toda la aplicación. Hay que recorrer las rutas a mano, no
solo compilar.
