# Tasks — La landing deja de prometer bloques

Tres bloques, uno por tema, para que sean tres commits separados.

## 1. Landing sin bloques

- [x] 1.1 `SimulatorMockup`: conmutador `Bloques / Código` → `Código / Salida`,
      con `code` como vista inicial. Retirar el array `blocks` y su render.
- [x] 1.2 Sustituir el snippet por el API real de `robot_api.py`
      (`Robot()` + `move_joints(dict, duration=)`).
- [x] 1.3 Escribir la vista de salida con lo que imprime esa ejecución de verdad
      (líneas `[robot_api]`, cierre del backend).
- [x] 1.4 Ensanchar la columna izquierda del mockup lo necesario para que el
      código no se parta. **Ajustar mirándolo en el navegador**, no a ojo.
- [x] 1.5 Estadística `2 · Modos: bloques y código` → `1 mm · Precisión frente al
      robot real`.
- [x] 1.6 Tarjetas de `SimulatorSection`: «Programación por bloques» →
      «Simulación fiel»; «Editor de código» → «Python real» sin la frase de
      sincronización con bloques.
- [x] 1.7 Paso 2 de `HowItWorks`.
- [x] 1.8 Curso de respaldo `'Programación con Bloques'` → `'Programación en Python'`.
- [x] 1.9 `landingContent.js`: subtítulo del hero y FAQ «¿Necesito saber programar?».
- [x] 1.10 `RegisterPage.jsx`: bullet «De bloques a código real, a tu ritmo».
- [x] 1.11 Retirar el icono `Blocks` de los imports si queda sin uso.
- [x] 1.12 Comprobar que no queda ninguna mención a bloques en texto de usuario
      (excluyendo `admin/tabs/LandingTab.jsx` y `ContentForm.jsx`, donde «bloques»
      se refiere a bloques de contenido, no a Blockly).

## 2. La documentación del simulador describe lo que existe

- [x] 2.1 Reescribir los pasos 2 y 3 de `DocumentationPanel.jsx` para el flujo de
      editor único, conservando la mención a `robot_interface`.
- [x] 2.2 Comprobar que no queda ninguna referencia a la pestaña «Bloques».

## 3. Blockly deja de descargarse — REVERTIDO

- [~] 3.1 `LeftPanel.jsx`: `BlocklyPanel` a `lazy()` con su `Suspense`.
- [x] 3.2 `npm run build` confirmó el ahorro: `Ide-*.js` bajó de 57,66 a 40,27 kB
      y `vendor-blockly` (205 kB gzip) dejó de ser import estático.
- [x] 3.3 **La reactivación SÍ se rompía.** Con `"blockly?": true`, abrir la
      pestaña Bloques daba pantalla en blanco en `npm run dev`:
      «Can only have one anonymous define call per script file». Monaco instala un
      cargador AMD con un `define` global; al cargar Blockly después, su envoltorio
      UMD se registra como módulo anónimo y el cargador aborta.
      En el build de **producción** el `lazy()` funciona bien (verificado: workspace
      640x610, 10 categorías, sin errores) porque Rollup convierte el UMD a ESM.
      Dos intentos de arreglo, ambos fallidos y descartados:
        · `delete window.define` antes del import → Monaco lo define como NO
          configurable, así que lanza TypeError.
        · `optimizeDeps.exclude: ['blockly']` → el ESM crudo de Blockly no expone
          export `default`, que es justo lo que sintetizaba el pre-bundle.
      **Revertido a import estático.** El ahorro no compensa romper la vía de
      reactivación que el equipo conserva a propósito. Ver la nota para Mario.

## Verificación final

- [x] 4.1 `npm run lint` sin hallazgos nuevos (baseline: 45 errores, 5 warnings).
- [x] 4.2 `npm run build` sin errores.
- [x] 4.3 Abrir la landing en el navegador y revisar el mockup en las dos
      pestañas, la cinta de estadísticas y las tarjetas del simulador.
- [x] 4.4 Abrir `/simulator` y leer la documentación en pantalla.
- [~] 4.5 **Avisar a Mario** si el subtítulo del hero o las FAQ tienen contenido
      guardado en el admin: ahí el default nuevo no se aplica y hay que editarlo
      desde la pestaña Landing (ver `design.md` §4).
      En la base LOCAL `landing_content` está vacía (0 filas), así que los defaults
      nuevos se ven tal cual. **Falta comprobarlo en producción**:
      `select count(1) from landing_content;` contra el DATABASE_URL de Supabase.
- [ ] 4.6 Incorporar los deltas a `specs/` y archivar el change.
