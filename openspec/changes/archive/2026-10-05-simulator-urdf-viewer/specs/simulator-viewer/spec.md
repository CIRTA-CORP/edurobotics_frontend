## ADDED Requirements

### Requirement: The viewer renders the robot from its URDF description
El visor SHALL construir la cadena cinemática cargando el archivo URDF del robot, y SHALL NOT
contener medidas del robot en el código. La descripción usada SHALL ser la exportada desde el
mismo `robot_description` que usa ROS, de modo que exista una única fuente de verdad.

#### Scenario: El robot se dibuja con sus medidas reales
- **WHEN** el visor carga el URDF del UR5e
- **THEN** cada junta queda en la posición que declara el URDF, sin constantes ni
  correcciones en el código

#### Scenario: Cambiar de robot no exige cambiar código
- **WHEN** se entrega al visor el URDF de otro robot con sus mallas
- **THEN** ese robot se dibuja correctamente sin modificar el visor

### Requirement: Joint transforms honour position and rotation
El visor SHALL aplicar tanto la traslación (`xyz`) como la rotación (`rpy`) declaradas en el
origen de cada junta, y SHALL aplicar el `<origin>` propio de cada elemento `<visual>`.

#### Scenario: Una junta con rotación declarada
- **WHEN** el URDF declara una junta con `rpy` distinto de cero
- **THEN** el eslabón hijo queda rotado según ese `rpy`

#### Scenario: Una malla con origen propio
- **WHEN** un `<visual>` declara su propio `<origin>` con desplazamiento o rotación
- **THEN** la malla se dibuja en ese origen, y no en el de la junta

### Requirement: The gripper closes as a linkage
El visor SHALL respetar las juntas `mimic` del gripper Robotiq 85, de modo que sus eslabones
se muevan como el cuadrilátero articulado que describe el URDF.

#### Scenario: Cerrar el gripper
- **WHEN** el gripper recibe un valor de cierre
- **THEN** los dedos se cierran manteniéndose unidos, sin separarse de los nudillos

### Requirement: Joint placement is verified numerically
El proyecto SHALL verificar con un test automático que las posiciones de las juntas coinciden
con la descripción del robot, con una tolerancia de 1 mm.

#### Scenario: Se reintroduce una medida equivocada
- **WHEN** una constante cinemática sustituye al valor del URDF
- **THEN** el test falla indicando la junta y la desviación

### Requirement: The new viewer coexists with the current one
Mientras el spike no se apruebe, el visor actual SHALL seguir siendo el predeterminado, y el
visor nuevo SHALL activarse de forma explícita.

#### Scenario: Acceso normal al simulador
- **WHEN** un estudiante abre el simulador sin parámetros
- **THEN** ve el visor actual, sin cambios

#### Scenario: Acceso para comparar
- **WHEN** se abre el simulador con `?viewer=urdf`
- **THEN** se monta el visor basado en URDF, recibiendo los mismos ángulos
