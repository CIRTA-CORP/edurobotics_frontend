import { useEffect, useRef, useState } from "react";
import {
  Engine, Scene, ArcRotateCamera,
  HemisphericLight, DirectionalLight,
  Vector3, MeshBuilder, StandardMaterial,
  Color3, TransformNode, Color4, SceneLoader,
} from "@babylonjs/core";
import "@babylonjs/loaders/glTF";

// UR5 URDF joint XYZ offsets (metres) — source: universal_robot/ur_description/urdf/ur5.urdf.xacro
// These are the translations between consecutive joint frames, NOT DH parameters.
const D = {
  // shoulder_pan  → xyz="0 0 0.089159"  (base height)
  d1:   0.089159,
  // shoulder_lift → xyz="0 0.13585 0"   (Y offset in ROS = -Z in Babylon)
  j2y: -0.13585,
  // elbow         → xyz="0 -0.1197 0.425" (Y→-Z, Z→Y in Babylon)
  j3z:  0.1197,  j3y: 0.425,
  // wrist_1       → xyz="0 0 0.39225"   (Z→Y in Babylon)
  j4y:  0.39225,
  // wrist_2       → xyz="0 0.093 0"     (Y→-Z in Babylon)
  j5z: -0.093,
  // wrist_3       → xyz="0 0 0.09465"   (Z→Y in Babylon)
  j6y:  0.09465,
  // tool0         → xyz="0 0 0.0823"    (flange to tool0 in Z)
  d6:   0.0823,
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

const ARM_JOINT_NAMES = [
  "shoulder_pan_joint", "shoulder_lift_joint", "elbow_joint",
  "wrist_1_joint", "wrist_2_joint", "wrist_3_joint",
];

// Robotiq 85 gripper — all joints rotate around Y in Babylon.
const GRIPPER_DEFS = [
  { name: "robotiq_85_left_knuckle_joint",         axis: "y", scale:  1 },
  { name: "robotiq_85_right_knuckle_joint",        axis: "y", scale: -1 },
  { name: "robotiq_85_left_inner_knuckle_joint",   axis: "y", scale:  1 },
  { name: "robotiq_85_right_inner_knuckle_joint",  axis: "y", scale: -1 },
  { name: "robotiq_85_left_finger_tip_joint",      axis: "y", scale:  1 },
  { name: "robotiq_85_right_finger_tip_joint",     axis: "y", scale: -1 },
];

const ALL_JOINT_NAMES = [...ARM_JOINT_NAMES, ...GRIPPER_DEFS.map(g => g.name)];

// Gripper mounts on tool0 (= end of wrist_3 link, at the flange face).
// TOOL0_OFFSET uses -(D.d6 + 0.020) on Z to position the gripper flush against the flange face.
// GRIPPER_MOUNT_POSITION is zeroed because the coupling mesh origin
// already sits at its mounting surface.
// GRIPPER_MOUNT_ROTATION orients the gripper so fingers point forward.
const TOOL0_OFFSET           = new Vector3(0, 0, -(D.d6 + 0.020));
const GRIPPER_MOUNT_POSITION = new Vector3(0, 0, 0);
const GRIPPER_MOUNT_ROTATION = new Vector3(-Math.PI / 2, 0, Math.PI / 2);

// Joint offsets inside the gripper (URDF xyz → Babylon, with y/z swap).
const GRIPPER_LINK_OFFSETS = {
  g_lk:  new Vector3(0.0549, 0, -0.0306),
  g_rk:  new Vector3(0.0549, 0,  0.0306),
  g_lik: new Vector3(0.0614, 0, -0.0127),
  g_rik: new Vector3(0.0614, 0,  0.0127),
  g_lf:  new Vector3(-0.00409, 0, -0.03149),
  g_rf:  new Vector3(-0.00409, 0,  0.03149),
  g_lft: new Vector3(0.04304, 0, -0.03760),
  g_rft: new Vector3(0.04304, 0,  0.03760),
};

// Robust joint-name normalization so backend rename/prefix changes don't break animation.
const JOINT_ALIASES = {
  shoulder_pan_joint:  ["shoulder_pan",  "shoulder_pan_joint",  "ur5/shoulder_pan_joint"],
  shoulder_lift_joint: ["shoulder_lift", "shoulder_lift_joint", "ur5/shoulder_lift_joint"],
  elbow_joint:         ["elbow",         "elbow_joint",         "ur5/elbow_joint"],
  wrist_1_joint:       ["wrist_1",       "wrist_1_joint",       "ur5/wrist_1_joint"],
  wrist_2_joint:       ["wrist_2",       "wrist_2_joint",       "ur5/wrist_2_joint"],
  wrist_3_joint:       ["wrist_3",       "wrist_3_joint",       "ur5/wrist_3_joint"],
  robotiq_85_left_knuckle_joint:        ["robotiq_85_left_knuckle_joint", "left_knuckle", "finger_joint"],
  robotiq_85_right_knuckle_joint:       ["robotiq_85_right_knuckle_joint", "right_knuckle"],
  robotiq_85_left_inner_knuckle_joint:  ["robotiq_85_left_inner_knuckle_joint", "left_inner_knuckle"],
  robotiq_85_right_inner_knuckle_joint: ["robotiq_85_right_inner_knuckle_joint", "right_inner_knuckle"],
  robotiq_85_left_finger_tip_joint:     ["robotiq_85_left_finger_tip_joint", "left_finger_tip"],
  robotiq_85_right_finger_tip_joint:    ["robotiq_85_right_finger_tip_joint", "right_finger_tip"],
};

function findJointValue(rawAngles, canonicalName) {
  const aliases = JOINT_ALIASES[canonicalName] || [canonicalName];
  for (const k of Object.keys(rawAngles)) {
    const stripped = k.includes("/") ? k.split("/").pop() : k;
    if (aliases.includes(k) || aliases.includes(stripped)) {
      return rawAngles[k];
    }
  }
  return undefined;
}

function normalizeJointAngles(rawAngles, fallback) {
  if (!rawAngles || typeof rawAngles !== "object") return null;
  const out = {};
  for (const name of ALL_JOINT_NAMES) {
    const v = findJointValue(rawAngles, name);
    if (typeof v === "number") {
      out[name] = v;
    } else if (fallback && typeof fallback[name] === "number") {
      out[name] = fallback[name];
    }
  }
  return out;
}

const isGripperDebugEnabled = () => {
  if (typeof window === "undefined") return false;
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get("debugGripper") === "1") return true;
  } catch { /* ignore */ }
  try {
    return window.localStorage?.getItem("debugGripper") === "true";
  } catch { return false; }
};

// Smoothing time constant (seconds) for the critically-damped follow: the robot
// eases toward the latest target each render frame. Smaller = snappier / tracks
// tighter; larger = smoother / more lag. Frame-rate independent.
const SMOOTH_TAU = 0.12;

const CAMERA_PRESETS = {
  free:  { alpha: -Math.PI / 2, beta: 1.1,          radius: 2.8, target: new Vector3(0, 0.8, 0) },
  top:   { alpha: -Math.PI / 2, beta: 0.05,          radius: 3.5, target: new Vector3(0, 0.5, 0) },
  front: { alpha: -Math.PI / 2, beta: Math.PI / 2,  radius: 3.0, target: new Vector3(0, 0.5, 0) },
  side:  { alpha: 0,            beta: Math.PI / 2,  radius: 3.0, target: new Vector3(0, 0.5, 0) },
};

export default function BabylonViewer({ jointAngles, cameraView = "free" }) {
  const canvasRef       = useRef(null);
  const jointNodesRef   = useRef({});
  const targetAnglesRef = useRef(null);
  const latestAnglesRef = useRef(null);
  const cameraRef       = useRef(null);
  const gripperNodesRef = useRef([]);

  const debugEnabled = isGripperDebugEnabled();
  const [debugInfo, setDebugInfo] = useState({ rawKeys: [], mapped: {} });

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

    // ── Joint frames (URDF XYZ → Babylon, with ROS Z-up → Babylon Y-up conversion)
    // ROS:     X right, Y forward, Z up
    // Babylon: X right, Y up,      Z forward (into screen)
    // Mapping: ros.X→bab.X,  ros.Y→bab.-Z,  ros.Z→bab.Y

    // j1 = shoulder_pan  — sits on top of base at height d1
    const j1 = new TransformNode("j1", scene);
    j1.parent     = root;
    j1.position.y = D.d1;   // ros xyz=(0,0,0.089159) → bab Y=0.089159
    j1.metadata   = { axis: "y" };

    // j2 = shoulder_lift — offset ros xyz=(0, 0.13585, 0) → bab Z=-0.13585
    const j2 = new TransformNode("j2", scene);
    j2.parent     = j1;
    j2.position.z = D.j2y;  // = -0.13585
    j2.metadata   = { axis: "z" };

    // j3 = elbow         — offset ros xyz=(0, -0.1197, 0.425) → bab Y=0.425, Z=0.1197
    const j3 = new TransformNode("j3", scene);
    j3.parent     = j2;
    j3.position.y = D.j3y;  // = 0.425  (ros Z → bab Y)
    j3.position.z = D.j3z;  // = 0.1197 (ros Y negated → bab +Z because ros Y was -0.1197)
    j3.metadata   = { axis: "z" };

    // j4 = wrist_1       — offset ros xyz=(0, 0, 0.39225) → bab Y=0.39225
    const j4 = new TransformNode("j4", scene);
    j4.parent     = j3;
    j4.position.y = D.j4y;  // = 0.39225
    j4.metadata   = { axis: "z" };

    // j5 = wrist_2 — offset ros xyz=(0, 0.093, 0) → bab Z=-0.093
    // -0.032 correction pushes wrist_2 toward the front to align its face with wrist_1's face.
    const j5 = new TransformNode("j5", scene);
    j5.parent     = j4;
    j5.position.z = D.j5z - 0.032;  // base -0.093 + 32mm front correction
    j5.metadata   = { axis: "y" };

    // j6 = wrist_3       — offset ros xyz=(0, 0, 0.09465) → bab Y=0.09465
    const j6 = new TransformNode("j6", scene);
    j6.parent     = j5;
    j6.position.y = D.j6y;  // = 0.09465
    j6.metadata   = { axis: "z" };

    jointNodesRef.current = { j1, j2, j3, j4, j5, j6 };

    // tool0 = end of wrist_3 link (+d6 along Y). Gripper mounts here, not directly on j6.
    const tool0 = new TransformNode("tool0", scene);
    tool0.parent   = j6;
    tool0.position = TOOL0_OFFSET.clone();

    // Gripper root: combines coupling + gripper chain from URDF as a single node.
    // Quaternion derived from Rz(π/2)*Ry(-π/2) in ROS, converted to Babylon basis.
    const GB = new TransformNode("gripper_root", scene);
    GB.parent   = tool0;
    GB.position = GRIPPER_MOUNT_POSITION.clone();
    GB.rotation = GRIPPER_MOUNT_ROTATION.clone();

    const makeNode = (name, parent, offset) => {
      const n = new TransformNode(name, scene);
      n.parent   = parent;
      n.position = offset.clone();
      return n;
    };

    const g_lk  = makeNode("g_lk",  GB,    GRIPPER_LINK_OFFSETS.g_lk);
    const g_rk  = makeNode("g_rk",  GB,    GRIPPER_LINK_OFFSETS.g_rk);
    const g_lik = makeNode("g_lik", GB,    GRIPPER_LINK_OFFSETS.g_lik);
    const g_rik = makeNode("g_rik", GB,    GRIPPER_LINK_OFFSETS.g_rik);
    const g_lf  = makeNode("g_lf",  g_lk,  GRIPPER_LINK_OFFSETS.g_lf);
    const g_rf  = makeNode("g_rf",  g_rk,  GRIPPER_LINK_OFFSETS.g_rf);
    const g_lft = makeNode("g_lft", g_lik, GRIPPER_LINK_OFFSETS.g_lft);
    const g_rft = makeNode("g_rft", g_rik, GRIPPER_LINK_OFFSETS.g_rft);

    gripperNodesRef.current = [g_lk, g_rk, g_lik, g_rik, g_lft, g_rft];

    if (debugEnabled) {
      [
        { node: g_lk,  color: new Color3(1,0,0) },
        { node: g_rk,  color: new Color3(0,1,0) },
        { node: g_lik, color: new Color3(0,0,1) },
        { node: g_rik, color: new Color3(1,1,0) },
        { node: g_lft, color: new Color3(1,0,1) },
        { node: g_rft, color: new Color3(0,1,1) },
      ].forEach(({ node, color }) => {
        const s = MeshBuilder.CreateSphere("dbg", { diameter: 0.01 }, scene);
        const m = new StandardMaterial("dbgm", scene);
        m.diffuseColor = color; m.emissiveColor = color;
        s.material = m; s.parent = node;
      });
    }

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
      loadLink(scene, grip + "robotiq_85_knuckle_link.glb",          g_lk,  Vector3.Zero(), ROS_FIX_L),
      loadLink(scene, grip + "robotiq_85_knuckle_link.glb",          g_rk,  Vector3.Zero(), ROS_FIX),
      loadLink(scene, grip + "robotiq_85_inner_knuckle_link.glb",    g_lik, Vector3.Zero(), ROS_FIX_L),
      loadLink(scene, grip + "robotiq_85_inner_knuckle_link.glb",    g_rik, Vector3.Zero(), ROS_FIX),
      loadLink(scene, grip + "robotiq_85_finger_link.glb",           g_lf,  Vector3.Zero(), ROS_FIX_L),
      loadLink(scene, grip + "robotiq_85_finger_link.glb",           g_rf,  Vector3.Zero(), ROS_FIX),
      loadLink(scene, grip + "robotiq_85_basic_finger_tip_link.glb", g_lft, Vector3.Zero(), ROS_FIX_L),
      loadLink(scene, grip + "robotiq_85_basic_finger_tip_link.glb", g_rft, Vector3.Zero(), ROS_FIX),
    ]).then(() => console.log("[BabylonViewer] ✅ All meshes loaded"));

    let lastRender = performance.now();
    engine.runRenderLoop(() => {
      const now = performance.now();
      const dt  = Math.min((now - lastRender) / 1000, 0.1); // seconds, clamped
      lastRender = now;

      const target = targetAnglesRef.current;
      if (target) {
        // Critically-damped follow: each render frame move a fraction toward the
        // latest target. Frame-rate independent, no per-waypoint pulsing, natural
        // ease-out, and it smooths the gripper open/close so it no longer snaps.
        const alpha = 1 - Math.exp(-dt / SMOOTH_TAU);

        const arm = [
          jointNodesRef.current.j1, jointNodesRef.current.j2,
          jointNodesRef.current.j3, jointNodesRef.current.j4,
          jointNodesRef.current.j5, jointNodesRef.current.j6,
        ];
        arm.forEach((node, i) => {
          if (!node) return;
          const to = target[ARM_JOINT_NAMES[i]];
          if (to === undefined) return;
          const ax  = node.metadata?.axis;
          const cur = ax === "y" ? node.rotation.y : ax === "z" ? node.rotation.z : node.rotation.x;
          const val = cur + (to - cur) * alpha;
          if      (ax === "y") node.rotation.y = val;
          else if (ax === "z") node.rotation.z = val;
          else if (ax === "x") node.rotation.x = val;
        });

        gripperNodesRef.current.forEach((node, i) => {
          if (!node) return;
          const def = GRIPPER_DEFS[i];
          const raw = target[def.name];
          if (raw === undefined) return;
          const to  = raw * def.scale;
          const ax  = def.axis;
          const cur = ax === "x" ? node.rotation.x : ax === "y" ? node.rotation.y : node.rotation.z;
          const val = cur + (to - cur) * alpha;
          if      (ax === "x") node.rotation.x = val;
          else if (ax === "y") node.rotation.y = val;
          else if (ax === "z") node.rotation.z = val;
        });
      }
      scene.render();
    });

    const onResize = () => engine.resize();
    window.addEventListener("resize", onResize);
    return () => { window.removeEventListener("resize", onResize); engine.dispose(); };
  }, [debugEnabled]);

  useEffect(() => {
    if (!jointAngles) return;
    const normalized = normalizeJointAngles(jointAngles, latestAnglesRef.current);
    if (!normalized) return;
    latestAnglesRef.current = normalized;
    // The render loop smoothly follows this target each frame (see runRenderLoop).
    targetAnglesRef.current = normalized;

    if (debugEnabled) {
      setDebugInfo({ rawKeys: Object.keys(jointAngles), mapped: normalized });
    }
  }, [jointAngles, debugEnabled]);

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
    <div className="relative w-full h-full">
      <canvas
        ref={canvasRef}
        className="w-full h-full outline-none block"
        style={{ touchAction: "none" }}
      />
      {debugEnabled && (
        <div className="absolute top-2 left-2 max-w-[320px] bg-black/70 text-[11px] text-green-300 font-mono p-2 rounded pointer-events-none">
          <div className="text-white mb-1">gripper debug</div>
          <div className="text-gray-400">raw keys:</div>
          <div className="break-all">{debugInfo.rawKeys.join(", ") || "—"}</div>
          <div className="text-gray-400 mt-1">mapped:</div>
          {GRIPPER_DEFS.map(({ name }) => (
            <div key={name}>{name.replace("robotiq_85_", "")}: {debugInfo.mapped?.[name]?.toFixed?.(3) ?? "—"}</div>
          ))}
        </div>
      )}
    </div>
  );
}
