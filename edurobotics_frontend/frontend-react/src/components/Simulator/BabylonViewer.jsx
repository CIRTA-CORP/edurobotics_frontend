import { useEffect, useRef } from "react";
import {
  Engine, Scene, ArcRotateCamera,
  HemisphericLight, DirectionalLight,
  Vector3, MeshBuilder, StandardMaterial,
  Color3, TransformNode, Color4, SceneLoader,
} from "@babylonjs/core";
import "@babylonjs/loaders/glTF";

// UR5 DH parameters (metres)
const D = {
  d1: 0.1625, a2: -0.425, a3: -0.3922,
  d4: 0.1333, d5: 0.0997, d6: 0.0996,
};

async function loadLink(scene, url, parent, pos = Vector3.Zero(), rot = Vector3.Zero()) {
  try {
    const { meshes } = await SceneLoader.ImportMeshAsync("", url, "", scene);
    const root = new TransformNode(url, scene);
    root.parent   = parent;
    root.position = pos.clone();
    root.rotation = rot.clone();
    meshes.forEach(m => { if (!m.parent) m.parent = root; });
    return root;
  } catch (e) {
    console.warn("[BabylonViewer] loadLink failed:", url, e);
    return null;
  }
}

const JOINT_NAMES = [
  "shoulder_pan_joint", "shoulder_lift_joint", "elbow_joint",
  "wrist_1_joint", "wrist_2_joint", "wrist_3_joint",
];

// Robotiq 85 gripper — all joints rotate around Y in Babylon.
// Scales flipped from initial attempt based on observed closing direction.
const GRIPPER_DEFS = [
  { name: "robotiq_85_left_knuckle_joint",         axis: "y", scale:  1 },
  { name: "robotiq_85_right_knuckle_joint",        axis: "y", scale: -1 },
  { name: "robotiq_85_left_inner_knuckle_joint",   axis: "y", scale:  1 },
  { name: "robotiq_85_right_inner_knuckle_joint",  axis: "y", scale: -1 },
  { name: "robotiq_85_left_finger_tip_joint",      axis: "y", scale:  1 },
  { name: "robotiq_85_right_finger_tip_joint",     axis: "y", scale: -1 },
];

const FRAME_MS       = 110; // expected ms between backend frames
const FIRST_FRAME_MS = 500; // longer transition for first frame (avoids jump from visual override)

const CAMERA_PRESETS = {
  free:  { alpha: -Math.PI / 2, beta: 1.1,          radius: 2.8, target: new Vector3(0, 0.8, 0) },
  top:   { alpha: -Math.PI / 2, beta: 0.05,          radius: 3.5, target: new Vector3(0, 0.5, 0) },
  front: { alpha: -Math.PI / 2, beta: Math.PI / 2,  radius: 3.0, target: new Vector3(0, 0.5, 0) },
  side:  { alpha: 0,            beta: Math.PI / 2,  radius: 3.0, target: new Vector3(0, 0.5, 0) },
};

export default function BabylonViewer({ jointAngles, cameraView = "free" }) {
  const canvasRef       = useRef(null);
  const jointNodesRef   = useRef({});
  const prevAnglesRef   = useRef(null);
  const targetAnglesRef = useRef(null);
  const frameTimeRef    = useRef(null);
  const frameDurRef     = useRef(FRAME_MS);
  const cameraRef       = useRef(null);
  const gripperNodesRef = useRef([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const engine = new Engine(canvas, true);
    const scene  = new Scene(engine);
    scene.clearColor = new Color4(0.08, 0.09, 0.12, 1);

    const cam = new ArcRotateCamera("cam", -Math.PI / 2, 1.1, 2.8, new Vector3(0, 0.8, 0), scene);
    cam.attachControl(canvas, true);
    cam.lowerRadiusLimit = 0.5;
    cam.upperRadiusLimit = 8;
    cam.wheelPrecision = 50;
    cameraRef.current = cam;

    new HemisphericLight("hemi", new Vector3(0, 1, 0), scene).intensity = 0.8;
    const dir = new DirectionalLight("dir", new Vector3(-1, -2, -1), scene);
    dir.intensity = 0.7;

    const floor = MeshBuilder.CreateGround("floor", { width: 4, height: 4 }, scene);
    const fm = new StandardMaterial("fm", scene);
    fm.diffuseColor  = new Color3(0.13, 0.14, 0.18);
    fm.specularColor = Color3.Black();
    floor.material = fm;
    for (let i = -2; i <= 2; i += 0.25) {
      const c = Math.abs(i) < 0.01 ? new Color3(0.3,0.6,1) : new Color3(0.18,0.28,0.42);
      MeshBuilder.CreateLines("gx"+i,{points:[new Vector3(i,0.001,-2),new Vector3(i,0.001,2)]},scene).color=c;
      MeshBuilder.CreateLines("gz"+i,{points:[new Vector3(-2,0.001,i),new Vector3(2,0.001,i)]},scene).color=c;
    }

    const root = new TransformNode("robot_root", scene);
    root.position = Vector3.Zero();

    // ROS meshes are Z-up: rotate -90° around X to convert to Babylon Y-up
    const ROS_FIX   = new Vector3(-Math.PI / 2, 0, 0);
    // Left-side gripper meshes have rpy=(π,0,0) in URDF → Rx(-90°)×Rx(π) = Rx(+90°)
    const ROS_FIX_L = new Vector3( Math.PI / 2, 0, 0);

    // GLB meshes are Z_UP (trimesh export from COLLADA).
    // After ROS_FIX Rx(-90°): Z→Y, so each link mesh extends in Babylon +Y.
    // Wrist1/wrist3 extend in original Y → after ROS_FIX become Babylon -Z.
    //
    // j1: shoulder_pan height = d1
    // j2: co-located with j1 (shoulder_lift at xyz=0 in shoulder frame)
    // j3: upper arm extends +Y → j3 is d|-a2| above j2
    // j4: forearm extends +Y  → j4 is |a3| above j3
    // j5: wrist1 extends -Z   → j5 is d4 in -Z from j4
    // j6: wrist2 extends +Y   → j6 is d5 above j5

    const j1 = new TransformNode("j1", scene);
    j1.parent     = root;
    j1.position.y = D.d1;  // 0.1625
    j1.metadata   = { axis: "y" };

    const j2 = new TransformNode("j2", scene);
    j2.parent   = j1;
    // shoulder_lift joint at xyz=(0,0,0) in shoulder frame — no positional offset
    j2.metadata = { axis: "z" };

    const j3 = new TransformNode("j3", scene);
    j3.parent     = j2;
    j3.position.y = -D.a2;  // +0.425 — upper arm length, arm extends in +Y
    j3.metadata   = { axis: "z" };

    const j4 = new TransformNode("j4", scene);
    j4.parent     = j3;
    j4.position.y = -D.a3;  // +0.3922 — forearm length
    j4.metadata   = { axis: "z" };

    const j5 = new TransformNode("j5", scene);
    j5.parent     = j4;
    j5.position.z = -D.d4;  // -0.1333 — wrist1 extends in -Z
    j5.metadata   = { axis: "y" };

    const j6 = new TransformNode("j6", scene);
    j6.parent     = j5;
    j6.position.y = D.d5;   // +0.0997 — wrist2 extends in +Y
    j6.metadata   = { axis: "z" };

    jointNodesRef.current = { j1, j2, j3, j4, j5, j6 };

    // ── Robotiq 85 gripper hierarchy ──────────────────────────────────────────
    // The gripper base extends in +X after ROS_FIX, but should point +Y (up)
    // along the arm. Rz(+90°) rotates +X → +Y so the gripper points correctly.
    const GB = new TransformNode("gripper_root", scene);
    GB.parent = j6;
    GB.rotation.z = Math.PI / 2;

    // Knuckle/finger positions in Babylon: URDF xyz converted via (x,y,z)→(x,z,-y)
    // Left knuckle  (0.0549, 0.0306, 0) → (0.0549, 0, -0.0306)
    const g_lk = new TransformNode("g_lk", scene);
    g_lk.parent = GB; g_lk.position.set(0.0549, 0, -0.0306);

    // Right knuckle (0.0549,-0.0306, 0) → (0.0549, 0,  0.0306)
    const g_rk = new TransformNode("g_rk", scene);
    g_rk.parent = GB; g_rk.position.set(0.0549, 0,  0.0306);

    // Left inner knuckle  (0.0614, 0.0127, 0) → (0.0614, 0, -0.0127)
    const g_lik = new TransformNode("g_lik", scene);
    g_lik.parent = GB; g_lik.position.set(0.0614, 0, -0.0127);

    // Right inner knuckle (0.0614,-0.0127, 0) → (0.0614, 0,  0.0127)
    const g_rik = new TransformNode("g_rik", scene);
    g_rik.parent = GB; g_rik.position.set(0.0614, 0,  0.0127);

    // Left finger FIXED: joint xyz=(-0.00409,-0.03149,0) in left knuckle frame.
    // Left knuckle frame has Rx(π) → Y,Z flipped in parent → Z becomes -Z in Babylon.
    const g_lf = new TransformNode("g_lf", scene);
    g_lf.parent = g_lk; g_lf.position.set(-0.00409, 0, -0.03149);

    // Right finger FIXED: xyz=(-0.00409,-0.03149,0) in right knuckle frame (no flip).
    const g_rf = new TransformNode("g_rf", scene);
    g_rf.parent = g_rk; g_rf.position.set(-0.00409, 0,  0.03149);

    // Left finger tip: xyz=(0.04304,-0.03760,0) in left inner knuckle frame (Rx(π) → flip Z).
    const g_lft = new TransformNode("g_lft", scene);
    g_lft.parent = g_lik; g_lft.position.set(0.04304, 0, -0.03760);

    // Right finger tip: same xyz, right inner knuckle frame (no flip).
    const g_rft = new TransformNode("g_rft", scene);
    g_rft.parent = g_rik; g_rft.position.set(0.04304, 0,  0.03760);

    // Store gripper nodes aligned with GRIPPER_DEFS order
    gripperNodesRef.current = [g_lk, g_rk, g_lik, g_rik, g_lft, g_rft];

    // DEBUG spheres — remove once positions confirmed correct
    [
      { node: g_lk,  color: new Color3(1,0,0) },   // red   = left knuckle
      { node: g_rk,  color: new Color3(0,1,0) },   // green = right knuckle
      { node: g_lik, color: new Color3(0,0,1) },   // blue  = left inner knuckle
      { node: g_rik, color: new Color3(1,1,0) },   // yellow= right inner knuckle
      { node: g_lft, color: new Color3(1,0,1) },   // magenta= left finger tip
      { node: g_rft, color: new Color3(0,1,1) },   // cyan  = right finger tip
    ].forEach(({ node, color }) => {
      const s = MeshBuilder.CreateSphere("dbg", { diameter: 0.01 }, scene);
      const m = new StandardMaterial("dbgm", scene);
      m.diffuseColor = color; m.emissiveColor = color;
      s.material = m; s.parent = node;
    });


    const ur5  = "/meshes/ur5/";
    const grip = "/meshes/robotiq/";

    Promise.all([
      loadLink(scene, ur5  + "base.glb",                    root, Vector3.Zero(), ROS_FIX),
      loadLink(scene, ur5  + "shoulder.glb",                j1,   Vector3.Zero(), ROS_FIX),
      loadLink(scene, ur5  + "upperarm.glb",                j2,   Vector3.Zero(), ROS_FIX),
      loadLink(scene, ur5  + "forearm.glb",                 j3,   Vector3.Zero(), ROS_FIX),
      loadLink(scene, ur5  + "wrist1.glb",                  j4,   Vector3.Zero(), ROS_FIX),
      loadLink(scene, ur5  + "wrist2.glb",                  j5,   Vector3.Zero(), ROS_FIX),
      loadLink(scene, ur5  + "wrist3.glb",                  j6,   Vector3.Zero(), ROS_FIX),
      loadLink(scene, grip + "robotiq_gripper_coupling.glb", GB,   Vector3.Zero(), ROS_FIX),
      loadLink(scene, grip + "robotiq_85_base_link.glb",    GB,   Vector3.Zero(), ROS_FIX),
      // Left-side meshes use ROS_FIX_L (Rx+90°), right-side use ROS_FIX (Rx-90°)
      loadLink(scene, grip + "robotiq_85_knuckle_link.glb",          g_lk,  Vector3.Zero(), ROS_FIX_L),
      loadLink(scene, grip + "robotiq_85_knuckle_link.glb",          g_rk,  Vector3.Zero(), ROS_FIX),
      loadLink(scene, grip + "robotiq_85_inner_knuckle_link.glb",    g_lik, Vector3.Zero(), ROS_FIX_L),
      loadLink(scene, grip + "robotiq_85_inner_knuckle_link.glb",    g_rik, Vector3.Zero(), ROS_FIX),
      loadLink(scene, grip + "robotiq_85_finger_link.glb",           g_lf,  Vector3.Zero(), ROS_FIX_L),
      loadLink(scene, grip + "robotiq_85_finger_link.glb",           g_rf,  Vector3.Zero(), ROS_FIX),
      loadLink(scene, grip + "robotiq_85_basic_finger_tip_link.glb", g_lft, Vector3.Zero(), ROS_FIX_L),
      loadLink(scene, grip + "robotiq_85_basic_finger_tip_link.glb", g_rft, Vector3.Zero(), ROS_FIX),
    ]).then(() => console.log("[BabylonViewer] ✅ All meshes loaded"));

    // Time-based linear interpolation between frames at 60fps.
    // When a frame arrives we snapshot the current displayed angles (prev)
    // and the new target. In each render frame we compute how far through
    // the inter-frame interval we are and set the exact linear position.
    engine.runRenderLoop(() => {
      const prev   = prevAnglesRef.current;
      const target = targetAnglesRef.current;
      const ft     = frameTimeRef.current;
      if (prev && target && ft) {
        const t = Math.min((Date.now() - ft) / frameDurRef.current, 1);
        const nodes = [
          jointNodesRef.current.j1, jointNodesRef.current.j2,
          jointNodesRef.current.j3, jointNodesRef.current.j4,
          jointNodesRef.current.j5, jointNodesRef.current.j6,
        ];
        nodes.forEach((node, i) => {
          if (!node) return;
          const from = prev[JOINT_NAMES[i]] ?? 0;
          const to   = target[JOINT_NAMES[i]] ?? from;
          const angle = from + (to - from) * t;
          const ax = node.metadata?.axis;
          if      (ax === "y") node.rotation.y = angle;
          else if (ax === "z") node.rotation.z = angle;
          else if (ax === "x") node.rotation.x = angle;
        });

        // Animate gripper fingers
        gripperNodesRef.current.forEach((node, i) => {
          if (!node) return;
          const def   = GRIPPER_DEFS[i];
          const from  = prev[def.name]   ?? 0;
          const to    = target[def.name] ?? from;
          const angle = (from + (to - from) * t) * def.scale;
          if      (def.axis === "x") node.rotation.x = angle;
          else if (def.axis === "y") node.rotation.y = angle;
          else if (def.axis === "z") node.rotation.z = angle;
        });
      }
      scene.render();
    });

    const onResize = () => engine.resize();
    window.addEventListener("resize", onResize);
    return () => { window.removeEventListener("resize", onResize); engine.dispose(); };
  }, []);

  useEffect(() => {
    if (!jointAngles) return;
    // Snapshot current displayed angles as the interpolation start point
    const { j1, j2, j3, j4, j5, j6 } = jointNodesRef.current;
    const nodes = [j1, j2, j3, j4, j5, j6];
    const current = {};
    nodes.forEach((node, i) => {
      if (!node) return;
      const ax = node.metadata?.axis;
      current[JOINT_NAMES[i]] =
        ax === "y" ? node.rotation.y :
        ax === "z" ? node.rotation.z : node.rotation.x;
    });
    const prev = Object.keys(current).length ? current : jointAngles;
    // If the visual position is far from the incoming frame, use a longer
    // transition so it looks like a smooth move instead of a jump.
    const maxDelta = JOINT_NAMES.reduce((acc, name) => {
      return Math.max(acc, Math.abs((prev[name] ?? 0) - (jointAngles[name] ?? 0)));
    }, 0);
    frameDurRef.current   = maxDelta > 0.5 ? FIRST_FRAME_MS : FRAME_MS;
    prevAnglesRef.current   = prev;
    targetAnglesRef.current = jointAngles;
    frameTimeRef.current    = Date.now();
  }, [jointAngles]);

  // Smooth camera transition when view changes
  useEffect(() => {
    const cam = cameraRef.current;
    if (!cam) return;
    const preset = CAMERA_PRESETS[cameraView] ?? CAMERA_PRESETS.free;
    const STEPS = 30;
    let step = 0;
    const startAlpha  = cam.alpha;
    const startBeta   = cam.beta;
    const startRadius = cam.radius;
    const startTarget = cam.target.clone();
    const id = setInterval(() => {
      step++;
      const t = step / STEPS;
      const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      cam.alpha  = startAlpha  + (preset.alpha  - startAlpha)  * ease;
      cam.beta   = startBeta   + (preset.beta   - startBeta)   * ease;
      cam.radius = startRadius + (preset.radius - startRadius) * ease;
      cam.target = Vector3.Lerp(startTarget, preset.target, ease);
      if (step >= STEPS) clearInterval(id);
    }, 16);
    return () => clearInterval(id);
  }, [cameraView]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full outline-none block"
      style={{ touchAction: "none" }}
    />
  );
}
