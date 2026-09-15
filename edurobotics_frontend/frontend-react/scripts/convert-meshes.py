#!/usr/bin/env python3
"""Convierte las mallas COLLADA de `robot_description` a glTF binario para la web.

Añadir un robot al visor es cargar su URDF, y su URDF apunta a mallas `.dae` que el
navegador no entiende. Este script cierra ese hueco: es lo único que separa «el robot está
descrito en ROS» de «el robot se ve en la web».

Detalle que cuesta caro si se ignora
------------------------------------
Los `.dae` de este paquete guardan la escala real (milímetros → metros) en las transformadas
del grafo de escena, no en los vértices. Exportar la escena directamente pierde esa escala y
produce un robot mil veces más grande, además de rotarlo a Y-arriba. Aplanar el grafo antes
de exportar aplica las transformadas y conserva metros y Z-arriba, que es lo que el URDF
espera.

Por eso el script se valida solo: convierte primero las mallas del UR5e, que ya existían
convertidas y se sabe que funcionan, y compara las medidas. Si no coinciden al milímetro,
se detiene en vez de producir mallas silenciosamente equivocadas.

Uso
---
    pip install "trimesh[easy]" pycollada
    python scripts/convert-meshes.py --simulation-repo /ruta/a/cirta_simulation --robot ur10e

Nota: las mallas viajan por Git LFS. Un clon sin `git lfs pull` trae punteros de texto de
131 bytes en vez de geometría, y el script lo detecta y lo dice.
"""
import argparse
import sys
from pathlib import Path

import numpy as np
import trimesh

TOLERANCE_M = 0.001

# Mallas ya convertidas cuya corrección está comprobada: sirven de patrón para validar el
# procedimiento antes de aplicarlo a un robot nuevo.
REFERENCE = {
    "source": "meshes/arms/ur5e/visual",
    "existing": "meshes/ur5",
    "names": ["base", "shoulder", "upperarm", "forearm", "wrist1", "wrist2", "wrist3"],
}


def convert(dae_path: Path) -> bytes:
    """DAE → GLB conservando metros y Z-arriba."""
    scene = trimesh.load(dae_path)
    # Aplanar aplica las transformadas del grafo, donde vive la escala real.
    mesh = trimesh.util.concatenate(scene.dump())
    return mesh.export(file_type="glb")


def extents(glb: bytes) -> np.ndarray:
    mesh = trimesh.load(trimesh.util.wrap_as_stream(glb), file_type="glb", force="mesh")
    return np.asarray(mesh.extents)


def check_lfs(path: Path) -> None:
    if path.stat().st_size < 1024 and b"git-lfs" in path.read_bytes()[:200]:
        sys.exit(
            f"{path.name} es un puntero de Git LFS, no geometría.\n"
            f"Ejecuta `git lfs pull` en el checkout de cirta_simulation."
        )


def validate(description: Path, public: Path) -> None:
    """Comprueba el procedimiento contra mallas cuya conversión ya se sabe correcta."""
    print("Validando la conversión contra las mallas conocidas del UR5e…")
    for name in REFERENCE["names"]:
        source = description / REFERENCE["source"] / f"{name}.dae"
        known = public / REFERENCE["existing"] / f"{name}.glb"
        if not source.is_file() or not known.is_file():
            sys.exit(f"Falta una malla de referencia: {source if not source.is_file() else known}")
        check_lfs(source)

        got = np.sort(extents(convert(source)))
        want = np.sort(extents(known.read_bytes()))
        if not np.allclose(got, want, atol=TOLERANCE_M):
            sys.exit(
                f"✗ {name}: la conversión da {np.round(got, 4)} y la malla buena mide "
                f"{np.round(want, 4)}. El procedimiento no reproduce lo conocido, así que "
                f"no es de fiar para un robot nuevo."
            )
    print(f"  ✓ las {len(REFERENCE['names'])} mallas de referencia coinciden "
          f"(tolerancia {TOLERANCE_M * 1000:.0f} mm)")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--simulation-repo", required=True, type=Path)
    parser.add_argument("--robot", required=True, help="p. ej. ur10e")
    parser.add_argument("--skip-validation", action="store_true",
                        help="Sáltate la comprobación contra el UR5e (no recomendado)")
    args = parser.parse_args()

    frontend = Path(__file__).resolve().parent.parent
    public = frontend / "public"
    description = args.simulation_repo / "ros2_pkgs" / "robot_description"
    if not description.is_dir():
        sys.exit(f"No encuentro robot_description en {description}")

    if not args.skip_validation:
        validate(description, public)

    source_dir = description / "meshes" / "arms" / args.robot / "visual"
    if not source_dir.is_dir():
        sys.exit(f"No hay mallas visuales para {args.robot} en {source_dir}")

    out_dir = public / "robots" / "robot_description" / "meshes" / "arms" / args.robot / "visual"
    out_dir.mkdir(parents=True, exist_ok=True)

    print(f"Convirtiendo {args.robot}…")
    for dae in sorted(source_dir.glob("*.dae")):
        check_lfs(dae)
        glb = convert(dae)
        (out_dir / f"{dae.stem}.glb").write_bytes(glb)
        size = np.round(extents(glb), 4)
        print(f"  {dae.stem:12} {len(glb) // 1024:5} kB   {size.tolist()} m")

    print(f"✓ {out_dir.relative_to(frontend)}")


if __name__ == "__main__":
    main()
