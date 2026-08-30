# simulator-urdf-viewer — visor del simulador basado en URDF

Spike en `feature/3-urdf-viewer`. Producción no se toca: el visor actual sigue siendo el
predeterminado durante todo el change.

## 0. Antes de empezar

- [ ] 0.1 Mario confirma qué robot y qué calibración usa el spike: `ur5e` con
      `default_kinematics.yaml` (nominal del fabricante) o con `kinematics_unagi.yaml` /
      `kinematics_uni.yaml` (calibración de un brazo físico real).
- [ ] 0.2 Medir y anotar el tamaño actual del bundle como línea base
      (hoy: `vendor-babylon` 6.59 MB, 1.43 MB gzip) para poder comparar al final.

## 1. Exportar la descripción del robot

- [ ] 1.1 Exportar `ur5e_robotiq2f85.xacro` → `.urdf` plano usando la herramienta `xacro`
      dentro del Docker de `cirta_simulation`. Una vez, offline.
- [ ] 1.2 Aplicar la calibración elegida en 0.1 al exportar.
- [ ] 1.3 Convertir las mallas `.dae` referenciadas a `.glb`, conservando las rutas relativas
      que declara el `.urdf`.
- [ ] 1.4 Versionar el resultado en `public/robots/ur5e/` y dejar anotado en el README del
      directorio el comando exacto de regeneración.

## 2. Base del visor nuevo

- [ ] 2.1 Añadir `three` y `urdf-loader`.
- [ ] 2.2 `UrdfViewer.jsx` con la misma interfaz que el actual (`{ jointAngles, cameraView }`),
      para que el intercambio no afecte a nada aguas arriba.
- [ ] 2.3 Cargar el `.urdf` y montarlo en la escena.
- [ ] 2.4 Portar los presets de cámara (`ArcRotateCamera` → `OrbitControls`) y el suavizado
      exponencial del render loop; son matemáticas independientes del motor.

## 3. Movimiento

- [ ] 3.1 Aplicar los ángulos del WebSocket con `robot.setJointValues()`, reutilizando la
      normalización de nombres que ya existe (`JOINT_ALIASES`) para no romper el contrato
      con el backend.
- [ ] 3.2 **Verificar temprano el gripper Robotiq 85**: comprobar que `urdf-loader` resuelve
      el lazo cerrado con juntas `mimic` y que los dedos cierran sin separarse. Es el mayor
      riesgo técnico del spike; si falla aquí, conviene saberlo antes de seguir.

## 4. Verificación numérica

- [ ] 4.1 Test que carga el URDF, fija una pose conocida y compara la posición mundial de
      cada junta contra `default_kinematics.yaml`, con tolerancia de 1 mm. Debe fallar si
      alguien reintroduce las constantes del UR5 (con `d1 = 0.089159` falla por 73 mm).
- [ ] 4.2 Confirmar que el visor no contiene **ninguna** constante cinemática: sin `D = {...}`,
      sin correcciones tipo `- 0.032`, sin `TOOL0_OFFSET`.

## 5. Convivencia y comparación

- [ ] 5.1 Selección por `?viewer=urdf` en `SimulatorPanel.jsx`. Sin el parámetro, el visor
      actual, intacto.
- [ ] 5.2 Capturas de ambos visores en la misma pose, para comparar lado a lado.
- [ ] 5.3 Medir el bundle resultante y reportar el número real frente a la línea base de 0.2,
      sin estimaciones.

## 6. Decisión

- [ ] 6.1 Mario revisa la comparación y decide: se adopta, se ajusta o se descarta.
- [ ] 6.2 Si se adopta, un change aparte cubre el cambio del visor por defecto, la baja de
      Babylon y la incorporación de `ur10e` y `pupi`.

## Fuera de alcance (anotado, no se hace aquí)

- Mejoras estéticas (PBR, HDRI, sombras de contacto). Primero correcto, después bonito, para
  poder atribuir el resultado.
- Los otros robots (`ur10e`, `pupi`, `bluerov2`). El spike prueba el camino con uno.
- `SIM_MAX_CONCURRENT = 3` sobre una única máquina Fly compartida: tres estudiantes
  simultáneos. Es de arquitectura y merece su propio change; conviene decidirlo antes del
  piloto.
