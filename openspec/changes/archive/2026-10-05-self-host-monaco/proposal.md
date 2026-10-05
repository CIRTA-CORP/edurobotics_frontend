# Autoalojar Monaco

## Why

El editor donde el alumno escribe Python no viaja con la aplicación: se descarga
de un CDN de terceros cada vez que alguien abre el simulador.

`@monaco-editor/react` es solo el envoltorio de React. El editor de verdad,
`monaco-editor`, es una `peerDependency` declarada que **nunca se instaló**, y
`@monaco-editor/loader` trae la URL de respaldo cableada en su código:

```js
paths: { vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.55.1/min/vs' }
```

Salió a la luz al probar la CSP del change anterior: la política bloqueó el
script, y después su hoja de estilos. Hubo que abrirle un hueco al CDN en tres
directivas para que el simulador siguiera funcionando.

Tres consecuencias, en orden de gravedad:

1. **Seguridad.** Si ese paquete se compromete en el CDN, su código se ejecuta
   dentro de la aplicación, con acceso al `localStorage` donde vive el token de
   cada alumno. La CSP no puede impedirlo: le hemos dicho al navegador que
   confíe en ese origen.
2. **Privacidad.** Cada alumno hace una petición a una empresa que no aparece en
   la política de privacidad, donde sí se listan Supabase, Railway, Vercel,
   Fly.io y Resend. Con usuarios menores de edad y la Ley 21.719, es una
   transferencia que hay que poder justificar o eliminar.
3. **Disponibilidad.** Si jsDelivr está caído o filtrado —hay redes escolares que
   bloquean CDNs— el alumno ve el simulador sin editor, mientras los servidores
   propios funcionan perfectamente y nadie se entera.

## What Changes

Instalar `monaco-editor` y decirle al envoltorio que use esa copia en lugar de ir
al CDN, con `loader.config({ monaco })`.

**No se trae el paquete entero.** El editor usa un solo lenguaje (`python`) y de
toda la API de Monaco el código llama exactamente a una cosa: `monaco.Range`. Se
importa la API del editor y la contribución de Python, no las decenas de
lenguajes que no se usan.

Con el CDN fuera, la CSP se estrecha: desaparece `https://cdn.jsdelivr.net` de
`script-src`, `style-src` y `font-src`.

## Capabilities

**Modified**
- `security` — no se ejecuta código de terceros traído en tiempo de ejecución.
- `performance` — el editor viaja con la aplicación y se carga bajo demanda.

## Impact

**Frontend**
- `package.json` — `monaco-editor` como dependencia directa.
- `src/features/simulator/editors/EditorPanel.jsx` — configurar el loader y los
  workers.
- `vite.config.js` — revisar el grupo `vendor-monaco`, que ahora captura el
  editor de verdad y no solo el envoltorio.
- `vercel.json` — quitar el CDN de las tres directivas.

**Backend** — sin cambios.

**Riesgo**: medio. Monaco necesita *web workers* y empaquetarlo con Vite tiene
sus aristas. Si sale mal, el síntoma es un editor que no aparece, que es
exactamente la pieza central del simulador. Hay que probarlo escribiendo en él,
no compilando.
