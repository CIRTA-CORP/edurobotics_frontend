# La landing deja de prometer bloques

## Why

Blockly está apagado en el simulador desde que se puso `"blockly?": false` en
`LeftPanel.jsx`. El código se conserva a propósito para poder reactivarlo, pero
**el producto que se entrega hoy no tiene programación por bloques**, y la
plataforma sigue prometiéndola en dos sitios distintos:

1. **La landing**, en 7 lugares — incluido el conmutador `Bloques / Código` del
   mockup del hero, que es el gancho visual de la página.
2. **La documentación dentro del propio simulador**, que le dice al alumno
   *«Tienes dos formas de escribir tu programa: la pestaña Bloques… o la pestaña
   Editor»* y le manda usar «los bloques de Movimiento, Sensores y Pantalla LED
   de la columna izquierda». Eso no es copy de marketing: es un alumno buscando
   una pestaña que no existe.

Además, `BlocklyPanel` se importa de forma estática, así que el chunk de Blockly
(**205 kB gzip**) se descarga en toda visita a `/simulator` aunque el flag esté
apagado y la interfaz no lo muestre nunca.

## What Changes

**El relato cambia de progresión a autenticidad.** Hoy es «empieza con bloques y
pasa a código cuando estés listo». Pasa a ser: **se programa el robot de verdad,
en Python, sobre un simulador fiel**.

Ese segundo punto es un diferenciador real que hoy la landing no menciona en
ningún sitio: el visor carga el mismo `robot_description` que usa PyBullet, y la
cinemática coincide con ROS a 1 mm (verificado por
`scripts/verify-robot-kinematics.py`). Es más defendible que «tenemos bloques»,
que cualquiera puede añadir.

| Dónde | Antes | Después |
|---|---|---|
| Mockup del hero | pestañas `Bloques / Código` | pestañas **`Código / Salida`** |
| Código del mockup | `robot.move_j(90, -45)` — API inventada | la API real de `robot_api.py` |
| Tarjeta 1 del simulador | «Programación por bloques» | **«Simulación fiel»** |
| Tarjeta 2 | «los bloques se sincronizan con el editor» | **«Python real»** |
| Estadística | `2 · Modos: bloques y código` | **`1 mm · Precisión frente al robot real`** |
| Paso 2 de «cómo funciona» | «Usa bloques visuales o escribe código» | «Escribe tu programa en Python y ejecútalo» |
| Subtítulo del hero | «Programa con bloques o código» | «Programa en Python» |
| FAQ «¿Necesito saber programar?» | «bloques tipo Scratch» | los cursos empiezan desde cero |
| Curso de respaldo | «Programación con Bloques» | «Programación en Python» |
| Bullet del registro | «De bloques a código real» | «Python real, guiado paso a paso» |

**Y se arreglan los dos defectos de Blockly:**
- La documentación del simulador describe solo lo que existe.
- `BlocklyPanel` pasa a `lazy()`, así que con el flag apagado no se descarga.

## Capabilities

**New**
- `landing` — la página pública no promete capacidades que el producto no entrega.

**Modified**
- `simulator` — la ayuda en pantalla describe solo las herramientas disponibles.
- `performance` — una función desactivada por flag no se descarga.

## Impact

**Frontend** (`edurobotics_frontend/frontend-react`)
- `src/features/landing/pages/LandingPage.jsx` — mockup, estadísticas, tarjetas,
  pasos y curso de respaldo.
- `src/features/landing/landingContent.js` — subtítulo del hero y FAQ (valores
  por defecto; los textos que la directora ya haya sobrescrito desde el admin
  **no** se tocan — ver `design.md`).
- `src/features/auth/pages/RegisterPage.jsx` — bullet.
- `src/features/simulator/components/DocumentationPanel.jsx` — pasos 2 y 3.
- `src/features/simulator/components/LeftPanel.jsx` — `lazy(BlocklyPanel)`.

**Backend** — sin cambios.

**Riesgo**: los textos de la landing son editables desde el admin y se guardan en
`landing_content`. Si la directora ya editó el subtítulo o las FAQ, el default
nuevo no se aplica. Se detalla en `design.md`.
