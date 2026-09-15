# Tasks — Reproducción fiel del movimiento

## 1. Captura (backend, `_WRAPPER`)

- [x] 1.1 Emitir `JOINTS:{"t": <segundos>, "a": {...}}` con reloj monótono
      relativo al arranque del muestreador
- [x] 1.2 No emitir si los ángulos son idénticos a los de la muestra anterior
- [x] 1.3 Muestrear con horario absoluto (`siguiente = t0 + n·intervalo`) en vez
      de `sleep` fijo
- [x] 1.4 Mantener `JOINT_SAMPLE_SEC` en 0,05 s —el doble del ritmo de escritura—
      y explicar en el comentario por qué subirlo a 0,1 s pierde posiciones

## 2. Reproducción (backend, `_run_code`)

- [x] 2.1 Parsear el formato nuevo y **seguir aceptando el antiguo** (un dict
      plano sin `t`), para que una máquina con la imagen vieja no rompa nada
- [x] 2.2 Reproducir con horario absoluto desde el inicio, descontando el tiempo
      de cada envío
- [x] 2.3 Enviar `t` en cada mensaje `joint_angles`
- [x] 2.4 Avisar por terminal de que empieza la animación, y su duración
- [x] 2.5 Registrar en el log fotogramas y duración, para poder comprobar la
      fidelidad sin abrir el navegador

## 3. Visor (frontend, `UrdfViewer`)

- [x] 3.1 Sustituir el seguimiento exponencial por interpolación entre el
      fotograma anterior y el actual según sus marcas de tiempo
- [x] 3.2 Colocar el primer fotograma sin interpolar
- [x] 3.3 Mantenerse quieto en la última posición conocida si no llega el
      siguiente fotograma, en vez de derivar
- [x] 3.4 Intervalo por defecto de 0,1 s cuando el fotograma no trae `t`
- [x] 3.5 Retirar `SMOOTH_TAU` y el comentario que lo justificaba

## 4. Diagnóstico

- [x] 4.1 Mostrar la línea de mallas solo con `?debug=viewer`
- [x] 4.2 Seguir mostrando siempre los errores de carga

## 5. Pruebas

- [x] 5.1 Test: el parseo acepta el formato nuevo y el antiguo
- [x] 5.2 Test: fotogramas consecutivos idénticos no se emiten dos veces
- [x] 5.3 Test: la reproducción respeta los intervalos entre marcas de tiempo
      (con reloj falso, sin esperar de verdad)
- [ ] 5.4 Ejecución real contra el backend: contar fotogramas y medir duración
      contra los criterios de `design.md` — **pendiente, necesita la máquina de
      Fly.io levantada**

## 6. Cierre

- [ ] 6.1 Anotar en el change los números medidos frente a los calculados
- [ ] 6.2 Volcar el delta en `openspec/specs/` y archivar
