# Design — Reproducción fiel del movimiento

## Context

La cadena que lleva el movimiento del robot a la pantalla tiene cuatro tramos, y
**tres de ellos pierden o inventan información**:

```
contenedor            backend (muestreador)                backend (reproductor)   visor
joint_states.json  →  lee cada 0,05 s, sin marca de tiempo → sleep fijo 0,05 s  →  persigue con τ=0,12
   cada 0,1 s         (mitad repetidos, huecos silenciosos)  (no sabe qué pasó)     (nunca llega)
```

El único tramo sano es el primero: el contenedor escribe posiciones reales a un
ritmo constante y conocido.

### Por qué se ve «bugeado»

**Repetidos irregulares.** Se lee al doble de velocidad de lo que se escribe, así
que aproximadamente uno de cada dos fotogramas no aporta nada. Y no es
alternado: los dos relojes van por libre —el muestreador duerme 0,05 s *después*
de leer, así que su periodo real es 0,05 s más lo que tarde la lectura, y deriva—
de modo que el patrón es 2 repetidos, 1, 2, 3, 1… El brazo se queda quieto
tiempos desiguales y luego salta. Eso es el tirón.

**Huecos invisibles.** Si la lectura falla —y falla, porque se lee un fichero
mientras otro proceso lo reescribe, así que a veces se pilla JSON a medias— la
excepción se traga y esa muestra desaparece. Nadie lo sabe: al reproducir a
intervalo fijo, un hueco se convierte en un salto brusco, no en una pausa.

**El visor persigue y no alcanza.** `alpha = 1 - exp(-dt/0,12)` significa que
cada fotograma se recorre una fracción de la distancia que falta. Con τ=0,12 s
hacen falta ~0,36 s para llegar «de verdad» (3·τ, el 95 %), pero llega un
objetivo nuevo cada 0,1 s. El brazo **nunca alcanza ninguna de las posiciones
intermedias**: recorta todas las curvas por dentro y se queda a media distancia
en cada cambio de dirección. Por eso «hace movimientos raros» y «no ejecuta todo
como corresponde» — literalmente no pasa por donde el robot pasó.

Al terminar el programa sí llega a la última posición, porque deja de recibir
objetivos nuevos, pero tarda ~0,36 s más en asentarse. De ahí la sensación de que
«termina en 2 segundos» y sigue moviéndose.

### Las cuentas, para un `move_joints(duration=2.0)`

`robot_api` espera `duration + 0.4` = **2,4 s**.

| | hoy | con el cambio |
|---|---|---|
| Posiciones reales del robot | 24 | 24 |
| Fotogramas enviados | ~47 | **24** |
| Con información nueva | 24 (51 %) | 24 (100 %) |
| Resolución efectiva | 10 Hz irregular | 10 Hz regular |
| Duración de la reproducción | 2,35 s + deriva del envío | 2,4 s |
| Posiciones por las que pasa el brazo | ninguna exacta | todas |
| Suavidad en pantalla | saltos de 0,1 s | interpolado a 60 fps |

## Goals

- Que el brazo pase exactamente por donde pasó el robot.
- Que la reproducción dure lo que duró la ejecución.
- Que se vea fluido aunque los datos lleguen a 10 Hz.

## Non-Goals

- **No** se sube el ritmo de escritura del contenedor. Ver Decisión 6.
- **No** se pasa a transmisión en vivo. La API `exec` de Fly.io es de tanda:
  devuelve `stdout` y `stderr` cuando el proceso termina, así que la animación
  solo puede ser una reproducción posterior. Cambiar eso significa otro
  transporte (un proceso largo con salida en streaming) y es otro trabajo.
- **No** se toca la cinemática, el URDF ni el mapeo de nombres de junta. El
  problema es de tiempo, no de geometría.
- **No** se añade control de la reproducción (pausa, rebobinar, velocidad).

## Decisions

### 1. Cada muestra lleva su instante

El muestreador emite `JOINTS:{"t": 1.234, "a": {...}}` donde `t` son segundos
desde que arrancó el muestreo, con reloj monótono.

Es el cambio que hace posible todo lo demás: sin saber cuándo se tomó cada
muestra, reproducir «a la velocidad real» es adivinar, y es lo que se hace hoy.

Con marca de tiempo, un hueco deja de ser un salto y pasa a ser lo que fue: un
intervalo en el que no hubo dato. El reproductor espera ese intervalo y el visor
interpola a lo largo de él.

### 2. Los repetidos se descartan en origen

Si los ángulos son idénticos a los de la muestra anterior, no se emite.

Se hace en el contenedor y no en el backend por una razón concreta: esas líneas
viajan por `stderr` dentro de la respuesta HTTP de Fly.io. Un programa de 30 s
genera hoy ~600 líneas de las que la mitad sobran. Filtrar en origen recorta la
respuesta a la mitad.

No se pierde nada porque la marca de tiempo conserva el hueco. Un
`time.sleep(1)` del alumno sin movimiento produce **cero** fotogramas y un salto
de 1,0 s en `t` — que es exactamente lo que pasó, y el brazo se queda quieto ese
segundo.

Se compara el diccionario completo, sin tolerancia. PyBullet devuelve el mismo
valor bit a bit cuando no se ha simulado un paso nuevo, así que la igualdad
exacta detecta justo lo que queremos: fichero no reescrito. Una tolerancia
numérica descartaría además movimiento lento real, que es movimiento.

### 3. El muestreo va con horario, no con cronómetro — y sigue al doble de ritmo

Hoy: leer, dormir 0,05 s, repetir → el periodo real es 0,05 s más el coste de la
lectura, y se acumula.

Cambia a un horario absoluto: la muestra *n* toca en `t0 + n·intervalo`, y se
duerme lo que falte para llegar. Si una lectura se pasa de tiempo, la siguiente
recorta en vez de arrastrar el retraso.

**El intervalo se queda en 0,05 s, y esto es una corrección.** La primera versión
de este diseño lo subía a 0,1 s razonando que muestrear más rápido que la fuente
no puede aportar resolución. Suena bien y es falso. Medido, con un escritor a
10 Hz y 24 posiciones reales en 2,4 s:

| intervalo de muestreo | posiciones capturadas de 24 |
|---|---|
| 0,100 s | **17, 19, 20** — distinto en cada ejecución |
| 0,050 s | 24, 24, 24 |
| 0,033 s | 24, 24, 24 |

Leyendo al mismo ritmo al que se escribe, las dos fases se cruzan: a veces se lee
dos veces el mismo valor y la siguiente escritura pasa sin verse. Se pierde una
de cada cinco posiciones, y una cantidad distinta cada vez. Al doble de ritmo eso
no puede ocurrir.

Lo que cambia respecto a hoy no es la frecuencia: es que **antes esa frecuencia
producía 47 fotogramas con la mitad repetidos, y ahora produce 24 sin ninguno**.
Sobremuestrear solo es gratis porque hay dedup (Decisión 2); son la misma
decisión vista desde los dos lados.

Sigue habiendo un desfase de hasta 0,1 s entre lo que el robot hace y lo que se
captura —es inevitable leyendo un fichero sin aviso de cambio— pero es un
desfase constante, no un temblor.

### 4. La reproducción sigue las marcas de tiempo y descuenta lo que tarda

En vez de `sleep(0,05)` fijo, se espera hasta el instante `t` de cada fotograma,
medido desde que empezó la reproducción.

Lo importante es **descontar el tiempo del envío**. Hoy cada vuelta cuesta 0,05 s
de espera *más* lo que tarde el `send_json`, así que la reproducción va
sistemáticamente más lenta que el original y el error crece con la duración. Con
horario absoluto, un envío lento se come parte de la espera siguiente y el total
no se desvía.

Si un fotograma llega tarde de todos modos, se envía sin esperar: mejor
recuperar el ritmo que arrastrar el retraso.

### 5. El visor interpola entre fotogramas en vez de perseguirlos

Se sustituye el seguimiento exponencial por interpolación lineal entre el
fotograma anterior y el actual, gobernada por sus marcas de tiempo.

El visor guarda dos posiciones —`desde` y `hasta`— y el intervalo que las separa.
En cada frame de render calcula qué fracción de ese intervalo ha transcurrido y
coloca las juntas ahí. A 60 fps con datos a 10 Hz, eso son 6 pasos intermedios
calculados entre cada par de posiciones reales.

Diferencias con lo de hoy:

| | seguimiento exponencial | interpolación |
|---|---|---|
| ¿Alcanza cada posición? | no, se queda al 34 % | sí, exactamente |
| Retraso | ~0,36 s constante | ninguno |
| Si el dato tarda | sigue derivando | se queda quieto donde debía |

Ese último punto es una mejora de honestidad además de una de suavidad: cuando
no hay dato nuevo, el brazo se detiene en la última posición conocida en vez de
seguir moviéndose hacia un objetivo viejo.

**El primer fotograma de una ejecución no se interpola**, se coloca directamente:
no hay un «desde» con el que mezclar, y el robot ya estaba ahí.

**Compatibilidad**: si llega un fotograma sin `t` —un backend antiguo— se
interpola con el intervalo por defecto de 0,1 s. Nada se rompe durante el
despliegue, que no es simultáneo en Railway y Vercel.

### 6. El contenedor no se toca

Subir el ritmo de escritura de 0,1 a 0,02 s daría 50 Hz reales y sería la
solución de fuerza bruta. No se hace:

- Obliga a reconstruir la imagen y redesplegar la máquina de Fly.io, que es el
  único robot que hay y el que la directora va a enseñar.
- Multiplica por cinco las líneas de `stderr` de cada ejecución, y esa respuesta
  viaja entera por HTTP.
- **Y no hace falta.** El movimiento de un brazo es continuo y suave; entre dos
  posiciones separadas 0,1 s la trayectoria real es casi recta. Interpolando, la
  diferencia entre 10 Hz y 50 Hz en pantalla es imperceptible.

La regla que guía esto: 10 Hz bien reproducidos se ven mejor que 20 Hz mal
reproducidos. El problema nunca fue la cantidad de datos.

### 7. El mensaje de «terminado» se queda donde está

Hoy `success` se envía antes de la reproducción, así que la terminal dice
«Done.» y el brazo se mueve después. Es deliberado —la terminal informa del
programa, no de la animación— y cambiarlo tampoco ayudaría: el programa
*terminó*, decir lo contrario sería falso.

Lo que sí se añade es un aviso de que la animación empieza, para que el desfase
entre «terminado» y «el brazo sigue moviéndose» esté explicado en lugar de
parecer un fallo.

### 8. El diagnóstico de mallas sale de la vista por defecto

`ur5e_robotiq · 22 juntas · 34 mallas` en la esquina aparece hoy en cualquier
entorno de desarrollo. Nació para depurar un fallo concreto —el robot cargaba con
juntas y sin geometría— y sigue sirviendo para eso.

Pasa a mostrarse **solo con `?debug=viewer`**, que ya está implementado y ya
funciona. No se borra: el día que un robot cargue sin mallas, esa línea vuelve a
ser lo primero que hay que mirar. Simplemente deja de estar delante cuando nadie
la pidió.

Los errores de carga son otra cosa y **se siguen mostrando siempre**: si el URDF
no carga, el visor está vacío y el estudiante tiene que ver por qué, no un
rectángulo negro.

## Risks

**La marca de tiempo aumenta el tamaño de cada línea** (~20 bytes). Compensado de
sobra por descartar la mitad de las líneas.

**Si el reloj del muestreador y el del reproductor midieran cosas distintas**, la
duración saldría mal. Se evita usando en ambos lados tiempos *relativos al primer
fotograma*, nunca absolutos: no se comparan relojes de máquinas distintas.

**Un programa que mueve el robot mucho tiempo** genera muchos fotogramas y la
reproducción dura lo mismo que la ejecución. Ya era así; con dedup, menos.

## Verification

No basta con «se ve mejor». Lo que cierra este change:

1. Un programa con `move_joints(duration=2.0)` produce **24 ± 3** fotogramas, no
   47. Se cuenta en el mensaje `done`, que ya los reporta.
2. La reproducción tarda **2,4 s ± 0,15 s**, medido entre el primer
   `joint_angles` y el `done`.
3. Dos ejecuciones idénticas dan el mismo número de fotogramas. Hoy no lo dan,
   porque el número depende de la deriva entre los dos relojes.
4. Un programa con una pausa (`move`, `sleep(1)`, `move`) reproduce la pausa como
   pausa: el brazo se detiene un segundo y sigue.
5. A ojo: el brazo llega a las posiciones que el código pide, en vez de quedarse
   cerca.


## Medido

Contra la implementación, no contra el cálculo.

**Captura** — escritor a 10 Hz, 24 posiciones reales en 2,4 s, tres ejecuciones
de cada configuración:

| | fotogramas | posiciones distintas |
|---|---|---|
| Antes (0,05 s, sin dedup) | 45, 48, 48 | 24 |
| Ahora (0,05 s, con dedup) | 24, 24, 24 | 24 |
| Descartado (0,1 s, con dedup) | 20, 17, 19 | 20, 17, 19 |

El «antes» confirma el diagnóstico exacto: **la mitad de los fotogramas no
aportaban nada**. Y el número variaba entre ejecuciones (45 y 48), que es la
deriva entre los dos relojes.

**Reproducción** — `tests/test_joint_playback.py`:

- 24 fotogramas separados 0,1 s se reproducen en 2,3 s ± 0,15 s.
- Con envíos que cuestan 20 ms cada uno, sigue tardando 2,3 s. La espera fija
  habría tardado 2,78 s: casi medio segundo de más, y creciendo con la duración.
- Una pausa de 0,6 s se reproduce como 0,6 s.

**Suites**: 123 tests del backend en verde (había 110 antes de este trabajo, 118
tras los primeros cinco de este change). Frontend compila; ESLint no añade
hallazgos nuevos.

**Pendiente**: la ejecución real contra la máquina de Fly.io, que es la que puede
confirmar los 24 ± 3 fotogramas y los 2,4 s de extremo a extremo.
