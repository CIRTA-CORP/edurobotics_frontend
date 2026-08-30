#!/usr/bin/env python3
"""Comprueba que el robot que dibuja la web coincide con el que describe ROS.

Por qué existe
--------------
El defecto que originó este trabajo pasó inadvertido porque «las piezas calzan» era un
juicio visual. El visor tenía la altura del hombro en 0.089159 m (un UR5) mientras la
descripción real dice 0.1625 m (un UR5e): 73 mm de diferencia que nadie midió.

Este script convierte esa pregunta en un número. Comprueba dos cosas:

  1. Que los orígenes de las juntas del URDF publicado coinciden con
     `config/ur5e/default_kinematics.yaml`, con tolerancia de 1 mm.
  2. Que el visor no contiene medidas del robot. Si alguien vuelve a escribir constantes
     en el código, la cadena «una sola fuente de verdad» se rompe aunque el URDF esté bien.

Uso
---
    python scripts/verify-robot-kinematics.py --simulation-repo /ruta/a/cirta_simulation

Devuelve 0 si todo cuadra y 1 con el detalle de la desviación si no.
"""
import argparse
import re
import sys
import xml.etree.ElementTree as ET
from pathlib import Path

import yaml

# Tolerancia: 1 mm. Las diferencias reales entre calibraciones rondan las micras, así que
# 1 mm distingue holgadamente «otra calibración» de «otro robot».
TOLERANCE_M = 0.001

# Cada bloque del YAML de cinemática describe el origen de una junta del URDF.
YAML_TO_JOINT = {
    "shoulder": "shoulder_pan_joint",
    "upper_arm": "shoulder_lift_joint",
    "forearm": "elbow_joint",
    "wrist_1": "wrist_1_joint",
    "wrist_2": "wrist_2_joint",
    "wrist_3": "wrist_3_joint",
}

# Señales de que alguien volvió a escribir medidas del robot en el visor.
CONSTANT_PATTERNS = [
    (re.compile(r"0\.089159"), "altura de hombro de UR5 (el robot es un UR5e)"),
    (re.compile(r"0\.39225"), "longitud de antebrazo de UR5"),
    (re.compile(r"0\.09465"), "muñeca 3 de UR5"),
    (re.compile(r"0\.0823"), "brida de UR5"),
    (re.compile(r"TOOL0_OFFSET"), "desplazamiento de herramienta escrito a mano"),
]


def parse_urdf_joints(urdf_path: Path) -> dict:
    root = ET.parse(urdf_path).getroot()
    joints = {}
    for joint in root.findall("joint"):
        origin = joint.find("origin")
        if origin is None:
            continue
        xyz = [float(v) for v in (origin.get("xyz") or "0 0 0").split()]
        joints[joint.get("name")] = xyz
    return joints


def check_kinematics(urdf_path: Path, kinematics_path: Path) -> list:
    expected = yaml.safe_load(kinematics_path.read_text(encoding="utf-8"))["kinematics"]
    actual = parse_urdf_joints(urdf_path)
    failures = []

    for block, joint_name in YAML_TO_JOINT.items():
        if joint_name not in actual:
            failures.append(f"{joint_name}: no está en el URDF")
            continue
        want = [float(expected[block][axis]) for axis in ("x", "y", "z")]
        got = actual[joint_name]
        for axis, w, g in zip("xyz", want, got):
            delta = abs(w - g)
            if delta > TOLERANCE_M:
                failures.append(
                    f"{joint_name}.{axis}: URDF {g:.6f} m vs descripción {w:.6f} m "
                    f"— desviación {delta * 1000:.1f} mm"
                )
    return failures


def check_no_constants(viewer_path: Path) -> list:
    if not viewer_path.is_file():
        return [f"No encuentro el visor: {viewer_path}"]
    text = viewer_path.read_text(encoding="utf-8")
    return [
        f"{viewer_path.name} contiene {label}"
        for pattern, label in CONSTANT_PATTERNS
        if pattern.search(text)
    ]


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--simulation-repo", required=True, type=Path)
    parser.add_argument("--robot", default="ur5e")
    args = parser.parse_args()

    frontend = Path(__file__).resolve().parent.parent
    urdf = frontend / "public" / "robots" / args.robot / f"{args.robot}_robotiq.urdf"
    kinematics = (args.simulation_repo / "ros2_pkgs" / "robot_description" / "config"
                  / args.robot / "default_kinematics.yaml")
    viewer = frontend / "src" / "features" / "simulator" / "viewer" / "UrdfViewer.jsx"

    for path, what in ((urdf, "URDF publicado"), (kinematics, "cinemática de ROS")):
        if not path.is_file():
            sys.exit(f"Falta el {what}: {path}")

    failures = check_kinematics(urdf, kinematics)
    failures += check_no_constants(viewer)

    if failures:
        print(f"✗ El robot de la web NO coincide con el de ROS ({len(failures)} problemas):")
        for failure in failures:
            print(f"    · {failure}")
        sys.exit(1)

    print(f"✓ {args.robot}: las {len(YAML_TO_JOINT)} juntas del brazo coinciden con "
          f"la descripción de ROS (tolerancia {TOLERANCE_M * 1000:.0f} mm)")
    print("✓ el visor no contiene medidas del robot")


if __name__ == "__main__":
    main()
