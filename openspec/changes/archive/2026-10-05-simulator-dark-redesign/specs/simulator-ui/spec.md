## ADDED Requirements

### Requirement: The simulator uses one dark scale
El simulador SHALL usar una única escala de grises construida desde el negro de marca, con
un solo color de acento. SHALL NOT convivir varias escalas oscuras distintas en la misma
pantalla.

#### Scenario: Recorrer el simulador completo
- **WHEN** un estudiante pasa del editor a la guía, a la terminal y al visor 3D
- **THEN** los fondos, filetes y textos pertenecen a la misma escala, sin saltos de tono

#### Scenario: El visor 3D pertenece a la pantalla
- **WHEN** se dibuja el robot
- **THEN** el lienzo y la rejilla usan la misma paleta que el resto del simulador

### Requirement: The simulator carries the CIRTA brand
La cabecera del simulador SHALL mostrar el logo de CIRTA, legible sobre fondo oscuro.

#### Scenario: Abrir el simulador
- **WHEN** se carga la pantalla del simulador
- **THEN** la cabecera muestra el logo de CIRTA junto al nombre de la pantalla

### Requirement: Typography stays as it ships
Los rediseños SHALL conservar la familia tipográfica de producción. SHALL NOT introducir una
familia distinta (serif u otra) aunque el diseño de origen la proponga.

#### Scenario: Títulos de las pantallas de estado
- **WHEN** se muestran las pantallas «solo escritorio», «lleno» o de inicio
- **THEN** sus títulos usan la tipografía del resto de la plataforma

### Requirement: The robot is named correctly in the interface
Los textos que ve el estudiante SHALL nombrar el modelo real del robot.

#### Scenario: Nombre del robot en pantalla
- **WHEN** la interfaz menciona el robot (cabecera, pantallas de inicio o guía)
- **THEN** lo llama UR5e, que es el modelo que se simula y se dibuja

### Requirement: The editor starts on runnable code
El editor SHALL presentar, para quien no tenga código guardado, un programa válido en el
lenguaje del entorno. SHALL NOT presentar texto que falle al ejecutarse sin modificarlo.

#### Scenario: Primera visita, pulsar Ejecutar
- **WHEN** un estudiante abre el simulador por primera vez y pulsa Ejecutar sin escribir nada
- **THEN** el programa se ejecuta y el robot se mueve, en vez de fallar con un error de
  sintaxis

### Requirement: Generated joint code reaches the editor
El botón de copiar del panel de juntas SHALL insertar el código generado en el editor y
traerlo al frente, por un único mecanismo.

#### Scenario: Copiar la pose actual
- **WHEN** el estudiante ajusta las juntas y pulsa «Copiar al editor»
- **THEN** el código aparece en el editor, que queda visible aunque estuviera en otra pestaña

### Requirement: Motion respects the reduced-motion preference
Las animaciones SHALL detenerse cuando el sistema pide menos movimiento, y SHALL declararse
de forma que esa preferencia pueda anularlas.

#### Scenario: Pantalla de arranque con movimiento reducido
- **WHEN** el sistema del estudiante pide `prefers-reduced-motion: reduce`
- **THEN** la barra de progreso del arranque no se anima y sigue comunicando el estado
