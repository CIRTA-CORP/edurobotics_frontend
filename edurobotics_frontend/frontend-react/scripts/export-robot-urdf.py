#!/usr/bin/env python3
"""Exporta la descripción de un robot desde `cirta_simulation` a un URDF plano para la web.

Por qué existe este script
--------------------------
El visor tenía las medidas del robot copiadas a mano en el código, y estaban mal: eran las
de un UR5 mientras las mallas son de un UR5e. El robot pasa a describirse **una sola vez**,
en `cirta_simulation`, que es la misma descripción que usa PyBullet. Este script es el
puente, y se ejecuta a mano cuando la descripción cambia en ROS — no en cada build.

Qué hace
--------
1. Resuelve `$(find robot_description)`, que sin ROS instalado no se puede expandir.
2. Instancia la macro del robot (los `.xacro` del repo solo la definen) sin la cámara
   RealSense y sin el link `world`: el visor no los necesita y el árbol queda enraizado
   en `base_link`.
3. Ejecuta `xacro` para obtener un URDF plano.
4. Reescribe las rutas de malla `package://...*.dae` a las rutas web de los `.glb` que ya
   están en `public/meshes/`. Las mallas nunca estuvieron mal: se reutilizan tal cual.
5. Quita los `<collision>`: la física corre en el servidor y el navegador solo dibuja, así
   que apuntarían a `.stl` que no se sirven.

Uso
---
    pip install xacro
    python scripts/export-robot-urdf.py --simulation-repo /ruta/a/cirta_simulation

Cinemática: se usa `default_kinematics.yaml` (nominal del fabricante), que es lo que
`load_ur5e_robotiq.launch` carga por defecto y por tanto lo que simula PyBullet. Las
calibraciones por brazo físico (`kinematics_unagi.yaml`, `kinematics_uni.yaml`) se descartan
a propósito: describen un brazo con nombre propio, difieren en micras y harían que el visor
y la simulación dejaran de coincidir, que es justo el defecto que este trabajo corrige.
"""
import argparse
import re
import shutil
import subprocess
import sys
import tempfile
import xml.etree.ElementTree as ET
from pathlib import Path

# Las mallas ya convertidas a .glb viven hoy en carpetas planas, heredadas del visor
# anterior. El URDF conserva sus URIs `package://` —como en ROS— y este mapa dice de dónde
# sacar cada archivo para copiarlo al layout espejo bajo `public/robots/`.
#
# Espejar el paquete, en vez de reescribir rutas a carpetas planas, es lo que hace que el
# URDF de cualquier robot futuro funcione sin tocar nada: sus `package://` se resuelven
# solos.
MESH_SOURCE_DIRS = {
    "arms/ur5e": "meshes/ur5",
    "grippers/robotiq": "meshes/robotiq",
}

# Prefijo web al que se mapea `package://robot_description/`.
PACKAGE_WEB_ROOT = "robots/robot_description"

WRAPPER = """<?xml version="1.0"?>
<robot xmlns:xacro="http://ros.org/wiki/xacro" name="{name}">
  <xacro:include filename="{macro_file}"/>
  <xacro:{macro_name} prefix="" load_camera="false" load_world="false"/>
</robot>
"""


def resolve_package_paths(tree_root: Path) -> None:
    """Sustituye `$(find robot_description)` por la ruta real en todos los .xacro."""
    for xacro_file in tree_root.rglob("*.xacro"):
        text = xacro_file.read_text(encoding="utf-8", errors="replace")
        if "$(find robot_description)" not in text:
            continue
        xacro_file.write_text(
            text.replace("$(find robot_description)", str(tree_root)), encoding="utf-8"
        )


def run_xacro(wrapper_path: Path, out_path: Path) -> None:
    result = subprocess.run(
        ["xacro", str(wrapper_path), "-o", str(out_path)],
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        sys.exit(f"xacro falló:\n{result.stderr}")


MESH_PATTERN = re.compile(
    r"package://robot_description/meshes/(?P<group>[^\"']+?)/visual/(?P<name>[^/\"']+?)\.dae"
)


def rewrite_meshes(urdf_path: Path) -> int:
    """Cambia solo la extensión: `…/visual/<n>.dae` → `…/visual/<n>.glb`.

    Las URIs `package://` se conservan tal cual, que es como ROS las escribe. El visor las
    resuelve configurando `loader.packages`, de modo que el URDF de otro robot no necesite
    ninguna reescritura de rutas.
    """
    text = urdf_path.read_text(encoding="utf-8")
    text, count = MESH_PATTERN.subn(
        lambda m: f"package://robot_description/meshes/{m.group('group')}"
                  f"/visual/{m.group('name')}.glb",
        text,
    )
    urdf_path.write_text(text, encoding="utf-8")
    return count


def copy_meshes(urdf_path: Path, public_dir: Path) -> int:
    """Copia los .glb al layout espejo del paquete, bajo `public/robots/robot_description/`."""
    root = ET.parse(urdf_path).getroot()
    copied = 0
    missing = []

    for mesh in root.iter("mesh"):
        filename = mesh.get("filename", "")
        if not filename.startswith("package://robot_description/"):
            continue
        relative = filename.replace("package://robot_description/", "")
        destination = public_dir / PACKAGE_WEB_ROOT / relative
        # Las mallas de un robot nuevo las deja ya en su sitio `convert-meshes.py`.
        if destination.is_file():
            continue

        group = Path(relative).parent.parent.parent.name + "/" + Path(relative).parent.parent.name
        source_dir = MESH_SOURCE_DIRS.get(group)
        if source_dir is None:
            missing.append(f"{group} (¿falta correr convert-meshes.py --robot …?)")
            continue

        source = public_dir / source_dir / Path(relative).name
        if not source.is_file():
            missing.append(str(source.relative_to(public_dir)))
            continue

        destination.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(source, destination)
        copied += 1

    if missing:
        sys.exit(f"Mallas que no se pudieron resolver: {sorted(set(missing))}")
    return copied


def strip_collisions(urdf_path: Path) -> int:
    """Quita los <collision>: el navegador solo dibuja, la física está en el servidor."""
    ET.register_namespace("xacro", "http://ros.org/wiki/xacro")
    tree = ET.parse(urdf_path)
    root = tree.getroot()
    removed = 0
    for link in root.findall("link"):
        for collision in link.findall("collision"):
            link.remove(collision)
            removed += 1
    tree.write(urdf_path, encoding="utf-8", xml_declaration=True)
    return removed


def verify(urdf_path: Path, public_dir: Path) -> None:
    """Comprueba que cada malla referenciada existe realmente donde el visor la buscará."""
    root = ET.parse(urdf_path).getroot()
    refs = {
        mesh.get("filename")
        for mesh in root.iter("mesh")
        if mesh.get("filename", "").startswith("package://robot_description/")
    }
    missing = [
        ref for ref in sorted(refs)
        if not (public_dir / PACKAGE_WEB_ROOT
                / ref.replace("package://robot_description/", "")).is_file()
    ]
    if missing:
        sys.exit(f"El URDF referencia mallas que no existen en public/: {missing}")

    movable = [j for j in root.findall("joint") if j.get("type") != "fixed"]
    mimics = root.findall(".//mimic")
    print(f"  {len(root.findall('link'))} links, {len(movable)} juntas móviles, "
          f"{len(mimics)} mimic, {len(refs)} mallas — todas presentes")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--simulation-repo", required=True, type=Path,
                        help="Ruta a un checkout de CIRTA-CORP/cirta_simulation")
    parser.add_argument("--robot", default="ur5e",
                        help="Robot a exportar (por ahora: ur5e)")
    args = parser.parse_args()

    frontend = Path(__file__).resolve().parent.parent
    public_dir = frontend / "public"
    out_dir = public_dir / "robots" / args.robot
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / f"{args.robot}_robotiq.urdf"

    description = args.simulation_repo / "ros2_pkgs" / "robot_description"
    if not description.is_dir():
        sys.exit(f"No encuentro robot_description en {description}")

    if shutil.which("xacro") is None:
        sys.exit("Falta la herramienta `xacro`. Instálala con: pip install xacro")

    with tempfile.TemporaryDirectory() as tmp:
        work = Path(tmp) / "robot_description"
        # Se trabaja sobre una copia: el checkout de ROS no se modifica.
        shutil.copytree(description, work)
        resolve_package_paths(work)

        macro_file = work / "xacros" / "robots" / args.robot / f"{args.robot}_robotiq2f85.xacro"
        if not macro_file.is_file():
            sys.exit(f"No encuentro el xacro del robot: {macro_file}")

        wrapper = Path(tmp) / "wrapper.xacro"
        wrapper.write_text(
            WRAPPER.format(
                name=f"{args.robot}_robotiq2f85",
                macro_file=macro_file,
                macro_name=f"{args.robot}_with_robotiq2f85",
            ),
            encoding="utf-8",
        )

        print(f"Exportando {args.robot}…")
        run_xacro(wrapper, out_path)

    meshes = rewrite_meshes(out_path)
    collisions = strip_collisions(out_path)
    copied = copy_meshes(out_path, public_dir)
    print(f"  {meshes} mallas .dae → .glb, {collisions} <collision> eliminados, "
          f"{copied} mallas copiadas al layout del paquete")
    verify(out_path, public_dir)
    print(f"✓ {out_path.relative_to(frontend)}")


if __name__ == "__main__":
    main()
