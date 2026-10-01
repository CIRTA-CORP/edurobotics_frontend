# Tasks — El brazo se mueve como un UR5e

## 0. Diagnóstico (hecho)

- [x] 0.1 Cinemática, límites y punta del brazo contra los parámetros oficiales
- [x] 0.2 Archivos desplegados idénticos a los del repositorio
- [x] 0.3 Medición en la máquina real: retraso, llegada, vuelta a cero, ritmo de
      escritura, lecturas a medias
- [x] 0.4 Respaldo de los originales del simulador, que no tiene control de versiones

## 1. Nodo de física (`bullet_node.py`)

- [x] 1.1 Pose sostenida del brazo y de la pinza, aplicada en todas las vueltas
- [x] 1.2 Revisión de órdenes cada 20 ms y escritura de posiciones cada 100 ms, por
      reloj
- [x] 1.3 Escritura atómica del archivo de posiciones
- [x] 1.4 Parada de protección por contacto propio o con el suelo, con estado en
      `robot_cmd_status.json`
- [x] 1.5 La lógica de trayectoria y de contactos en un módulo aparte, probable sin ROS

## 2. Arranque del contenedor

- [x] 2.1 Dejar de lanzar `joint_writer.py` y `command_executor.py`

## 3. `robot_api`

- [x] 3.1 Rechazar ángulos fuera de los límites del UR5e
- [x] 3.2 Alargar los movimientos demasiado rápidos y avisarlo
- [x] 3.3 Esperar a que el brazo llegue, con tope de tiempo
- [x] 3.4 `RobotCollisionError` ante una parada de protección
- [x] 3.5 Quitar los fotogramas inventados
- [x] 3.6 Corregir la documentación de `home()`: queda en horizontal

## 4. Backend

- [x] 4.1 Traducir las líneas de los tracebacks a las del alumno y marcarlo
- [x] 4.2 Descartar los fotogramas sin marca de tiempo cuando conviven con los nuevos

## 5. Frontend

- [x] 5.1 No restar el offset cuando el backend ya tradujo las líneas

## 6. Verificación

- [x] 6.1 Tests de la lógica de trayectoria, de contactos y de validación
- [x] 6.2 Contactos con la URDF real: poses normales sin contacto, poses de choque con
      contacto. PyBullet no tiene versión para Windows, así que se hizo **en la máquina de
      Fly, con una simulación aparte** de la de producción
- [x] 6.4 El ciclo nuevo completo en esa simulación aparte: llega, se mantiene, se para al
      chocar y se puede alejar del choque
- [x] 6.3 **Tras desplegar:** repetir las mediciones de `design.md` — 13/13 física, 10/10 de punta a punta

## 8. Hallazgos durante la implementación (ver design.md, 9–12)

- [x] 8.1 Paso de la física en tiempo real (`RealTimeStep`)
- [x] 8.2 Perfil de mínimo tirón y velocidad prevista al motor (`ArmDrive`)
- [x] 8.3 Programa comprimido, tope de tamaño y rechazos de Fly con estado 200
- [x] 8.4 Líneas de error traducidas por el backend y mensaje `error_line`

## 9. Hallazgos durante el despliegue (ver design.md, 13–16)

- [x] 9.1 Choques por fuerza (50 N sobre la línea base), no por penetración
- [x] 9.2 Límite del programa dentro de la máquina (`timeout 40`); 408 explicado
- [x] 9.3 Entorno de ROS guardado al arrancar: de ~17 s a ~1 s por ejecución
- [x] 9.4 Apertura de la pinza reflejada en su rango real; `robot_api` espera a que pare
- [x] 9.5 Límite de cierre recalculado para la fórmula corregida (cerrada a 0,785 rad)
- [x] 9.6 Tolerancia de 1e-4 rad en el muestreador frente al ruido de los motores

Nota: una prueba de `robot_api` (`test_unnamed_joints_keep_their_measured_position`)
falló una vez en ~14 corridas y no se reprodujo en 13 más. Está en el simulador falso de
las pruebas, que en Windows reemplaza archivos mientras otro hilo los lee. La causa no se
identificó.

## 7. Despliegue — con el OK de Mario

- [x] 7.1 Construir y desplegar la imagen en Fly (con `machine update`: la máquina no es de Fly Launch)
- [ ] 7.2 Subir backend y frontend
