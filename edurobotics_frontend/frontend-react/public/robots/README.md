# Descripciones de robots

Los archivos `.urdf` de este directorio **no se editan a mano**. Se generan desde
[CIRTA-CORP/cirta_simulation](https://github.com/CIRTA-CORP/cirta_simulation), que es la
descripción que también usa PyBullet. Ésa es la única fuente de verdad: si el robot se
describe en dos sitios, tarde o temprano dejan de coincidir — que es exactamente lo que
pasó antes de este trabajo.

## Regenerar

```bash
pip install xacro pyyaml
python scripts/export-robot-urdf.py --simulation-repo /ruta/a/cirta_simulation
```

## Verificar

```bash
python scripts/verify-robot-kinematics.py --simulation-repo /ruta/a/cirta_simulation
```

Compara los orígenes de las juntas contra `config/<robot>/default_kinematics.yaml` con
tolerancia de 1 mm, y comprueba que el visor no tenga medidas del robot escritas en el
código. Conviene ejecutarlo después de regenerar y cada vez que cambie la descripción en
ROS.

## Decisiones tomadas al exportar

- **Cinemática nominal, no calibrada.** Se usa `default_kinematics.yaml`, que es lo que
  `load_ur5e_robotiq.launch` carga por defecto y por tanto lo que simula PyBullet. Las
  calibraciones por brazo físico (`kinematics_unagi.yaml`, `kinematics_uni.yaml`) describen
  un brazo concreto, difieren en micras y harían que el visor y la simulación dejaran de
  coincidir. Además, para enseñar conviene el número que el estudiante encuentra en la hoja
  de datos.
- **Sin cámara RealSense ni link `world`.** El visor no los necesita y el árbol queda
  enraizado en `base_link`.
- **Sin `<collision>`.** La física corre en el servidor; el navegador solo dibuja, y esas
  entradas apuntan a `.stl` que no se sirven.
- **Mallas reutilizadas.** El `.urdf` apunta a los `.glb` que ya estaban en
  `public/meshes/`. Las mallas nunca estuvieron mal: el defecto era el ensamblaje. La
  carpeta se llama `meshes/ur5/` aunque el robot es un **UR5e** — ese nombre fue el origen
  de la confusión y conviene renombrarlo si el visor URDF se adopta.
