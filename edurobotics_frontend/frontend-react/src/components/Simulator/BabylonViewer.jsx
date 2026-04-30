import { useEffect, useRef } from "react";
import {
  Engine, Scene, ArcRotateCamera,
  HemisphericLight, DirectionalLight,
  Vector3, MeshBuilder, StandardMaterial,
  Color3, TransformNode, Color4, SceneLoader,
} from "@babylonjs/core";
import "@babylonjs/loaders/glTF";

// UR5e DH parameters (meters) — from the official UR5e spec
const D = {
  d1: 0.1625,   // base to shoulder (Z)
  a2: -0.425,   // shoulder to elbow (X in ROS → length of upper arm)
  a3: -0.3922,  // elbow to wrist1 (forearm length)
  d4:  0.1333,  // wrist1 offset
  d5:  0.0997,  // wrist2 offset
  d6:  0.0996,  // wrist3 to flange
};

export const UR5_JOINT_NAMES = [
  "shoulder_pan_joint",
  "shoulder_lift_joint",
  "elbow_joint",
  "wrist_1_joint",
  "wrist_2_joint",
  "wrist_3_joint",
];

// Loads a GLB and attaches meshes to parent, applying ROS→Babylon coord fix
async function loadLink(scene, url, parent, pos = Vector3.Zero(), rot = Vector3.Zero()) {
  try {
    const { meshes } = await SceneLoader.ImportMeshAsync("", url, "", scene);
    const root = new TransformNode(url, scene);
    root.parent   = parent;
    root.position = pos;
    root.rotation = rot;
    meshes.forEach(m => { if (!m.parent) m.parent = root; });
    return root;
  } catch (e) {
    console.warn("loadLink failed:", url, e);
    return null;
  }
}

export default function BabylonViewer({ jointAngles }) {
  const canvasRef     = useRef(null);
  const jointNodesRef = useRef({});

  useEffect(() => {
    const canvas = canvasRef.current;
    const engine = new Engine(canvas, true);
    const scene  = new Scene(engine);
    scene.clearColor = new Color4(0.08, 0.09, 0.12, 1);

    // Camera — looking slightly down at the robot
    const cam = new ArcRotateCamera("cam", -Math.PI / 2, 1.1, 2.8, new Vector3(0, 0.8, 0), scene);
    cam.attachControl(canvas, true);
    cam.lowerRadiusLimit = 0.5;
    cam.upperRadiusLimit = 8;
    cam.wheelPrecision   = 50;

    // Lights
    new HemisphericLight("hemi", new Vector3(0, 1, 0), scene).intensity = 0.8;
    const dir = new DirectionalLight("dir", new Vector3(-1, -2, -1), scene);
    dir.intensity = 0.7;

    // Floor + grid
    const floor = MeshBuilder.CreateGround("floor", { width: 4, height: 4 }, scene);
    const floorMat = new StandardMaterial("fm", scene);
    floorMat.diffuseColor  = new Color3(0.13, 0.14, 0.18);
    floorMat.specularColor = Color3.Black();
    floor.material = floorMat;
    for (let i = -2; i <= 2; i += 0.25) {
      const c = Math.abs(i) < 0.01 ? new Color3(0.3,0.6,1) : new Color3(0.18,0.28,0.42);
      MeshBuilder.CreateLines("gx"+i,{points:[new Vector3(i,0.001,-2),new Vector3(i,0.001,2)]},scene).color=c;
      MeshBuilder.CreateLines("gz"+i,{points:[new Vector3(-2,0.001,i),new Vector3(2,0.001,i)]},scene).color=c;
    }

    // ── Joint hierarchy ────────────────────────────────────────────────────────
    // Each TransformNode is the rotation pivot.
    // Positions are in Babylon Y-up space (ROS Z → Babylon Y).
    // ROS joint axes: j1=Z(pan), j2=Y(lift), j3=Y(elbow), j4=Y, j5=Z, j6=Y

    const root = new TransformNode("robot_root", scene);
    root.position = new Vector3(0, 0, 0);

    // j1 — shoulder pan — sits on top of the base column
    const j1 = new TransformNode("j1", scene);
    j1.parent     = root;
    j1.position.y = D.d1;
    j1.metadata   = { axis: "y" };

    // j2 — shoulder lift — offset laterally (ROS: d4 along Y → Babylon: Z)
    const j2 = new TransformNode("j2", scene);
    j2.parent     = j1;
    j2.position.z = D.d4;   // shoulder-to-elbow lateral offset
    j2.metadata   = { axis: "z" };

    // j3 — elbow — offset along the upper arm (ROS: a2 along X → Babylon: -Y after rotation)
    const j3 = new TransformNode("j3", scene);
    j3.parent     = j2;
    j3.position.y = -D.a2;  // upper arm length (a2 is negative in UR5e DH)
    j3.metadata   = { axis: "z" };

    // j4 — wrist1 — offset along the forearm
    const j4 = new TransformNode("j4", scene);
    j4.parent     = j3;
    j4.position.y = -D.a3;  // forearm length
    j4.metadata   = { axis: "z" };

    // j5 — wrist2 — offset (ROS: d5 along Z → Babylon: Y)
    const j5 = new TransformNode("j5", scene);
    j5.parent     = j4;
    j5.position.z = D.d5;
    j5.metadata   = { axis: "y" };

    // j6 — wrist3 — offset (ROS: d6 along Z → Babylon: Y)
    const j6 = new TransformNode("j6", scene);
    j6.parent     = j5;
    j6.position.y = D.d6;
    j6.metadata   = { axis: "z" };

    jointNodesRef.current = { j1, j2, j3, j4, j5, j6 };

    // ROS meshes are Z-up; rotate -90° around X to convert to Babylon Y-up
    const ROS_FIX = new Vector3(-Math.PI / 2, 0, 0);

    const ur5  = "/meshes/ur5/";
    const grip = "/meshes/robotiq/";

    Promise.all([
      loadLink(scene, ur5 + "base.glb",      j1,  Vector3.Zero(), ROS_FIX),
      loadLink(scene, ur5 + "shoulder.glb",  j1,  Vector3.Zero(), ROS_FIX),
      loadLink(scene, ur5 + "upperarm.glb",  j2,  Vector3.Zero(), ROS_FIX),
      loadLink(scene, ur5 + "forearm.glb",   j3,  Vector3.Zero(), ROS_FIX),
      loadLink(scene, ur5 + "wrist1.glb",    j4,  Vector3.Zero(), ROS_FIX),
      loadLink(scene, ur5 + "wrist2.glb",    j5,  Vector3.Zero(), ROS_FIX),
      loadLink(scene, ur5 + "wrist3.glb",    j6,  Vector3.Zero(), ROS_FIX),
      loadLink(scene, grip + "robotiq_gripper_coupling.glb", j6,
        new Vector3(0, D.d6, 0), ROS_FIX),
      loadLink(scene, grip + "robotiq_85_base_link.glb", j6,
        new Vector3(0, D.d6 + 0.01, 0), ROS_FIX),
    ]).then(() => console.log("✅ All UR5 meshes loaded"));

    engine.runRenderLoop(() => scene.render());
    const onResize = () => engine.resize();
    window.addEventListener("resize", onResize);
    return () => { window.removeEventListener("resize", onResize); engine.dispose(); };
  }, []);

  // Apply joint angles from /joint_states
  useEffect(() => {
    if (!jointAngles) return;
    const { j1, j2, j3, j4, j5, j6 } = jointNodesRef.current;
    [j1, j2, j3, j4, j5, j6].forEach((node, i) => {
      const angle = jointAngles[UR5_JOINT_NAMES[i]];
      if (!node || typeof angle !== "number") return;
      const ax = node.metadata?.axis;
      if (ax === "y") node.rotation.y = angle;
      else if (ax === "z") node.rotation.z = angle;
      else if (ax === "x") node.rotation.x = angle;
    });
  }, [jointAngles]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full outline-none block"
      style={{ touchAction: "none" }}
    />
  );
}
