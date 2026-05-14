import { useEffect, useRef, useState } from "react";
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

// Gripper mounting: tool0 (= j6 + d6 along Y) → gripper_root (with extra mount offset).
// 0.01125 m comes from the chained fixed offsets in the xacro coupling (0.003 + 0.00825).
const TOOL0_OFFSET           = new Vector3(0, D.d6, 0);
const GRIPPER_MOUNT_POSITION = new Vector3(0, 0.01125, 0);
const GRIPPER_MOUNT_ROTATION = new Vector3(0, 0, Math.PI / 2);

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
  const latestAnglesRef = useRef(null);
  const frameTimeRef    = useRef(null);
  const frameDurRef     = useRef(FRAME_MS);
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

    const j1 = new TransformNode("j1", scene);
    j1.parent     = root;
    j1.position.y = D.d1;
    j1.metadata   = { axis: "y" };

    const j2 = new TransformNode("j2", scene);
    j2.parent   = j1;
    j2.metadata = { axis: "z" };

    const j3 = new TransformNode("j3", scene);
    j3.parent     = j2;
    j3.position.y = -D.a2;
    j3.metadata   = { axis: "z" };

    const j4 = new TransformNode("j4", scene);
    j4.parent     = j3;
    j4.position.y = -D.a3;
    j4.metadata   = { axis: "z" };

    const j5 = new TransformNode("j5", scene);
    j5.parent     = j4;
    j5.position.z = -D.d4;
    j5.metadata   = { axis: "y" };

    const j6 = new TransformNode("j6", scene);
    j6.parent     = j5;
    j6.position.y = D.d5;
    j6.metadata   = { axis: "z" };

    jointNodesRef.current = { j1, j2, j3, j4, j5, j6 };

    // tool0 = end of wrist_3 link (+d6 along Y). Gripper mounts here, not directly on j6.
    const tool0 = new TransformNode("tool0", scene);
    tool0.parent   = j6;
    tool0.position = TOOL0_OFFSET.clone();

    // Robotiq mount: small fixed offset from coupling chain in xacro + Rz(90°) so
    // the gripper's URDF +X (forward) aligns with the arm's +Y direction.
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

    // Semi-transparent base housing so the finger mechanisms inside are visible.
    const onBaseLoaded = (r) => {
      if (!r) return;
      r.getChildMeshes().forEach((m) => {
        if (m.material) {
          m.material.alpha = 0.35;
          m.material.transparencyMode = 2;
        }
      });
    };

    Promise.all([
      loadLink(scene, ur5  + "base.glb",                    root, Vector3.Zero(), ROS_FIX),
      loadLink(scene, ur5  + "shoulder.glb",                j1,   Vector3.Zero(), ROS_FIX),
      loadLink(scene, ur5  + "upperarm.glb",                j2,   Vector3.Zero(), ROS_FIX),
      loadLink(scene, ur5  + "forearm.glb",                 j3,   Vector3.Zero(), ROS_FIX),
      loadLink(scene, ur5  + "wrist1.glb",                  j4,   Vector3.Zero(), ROS_FIX),
      loadLink(scene, ur5  + "wrist2.glb",                  j5,   Vector3.Zero(), ROS_FIX),
      loadLink(scene, ur5  + "wrist3.glb",                  j6,   Vector3.Zero(), ROS_FIX),
      loadLink(scene, grip + "robotiq_gripper_coupling.glb", GB,   Vector3.Zero(), ROS_FIX),
      loadLink(scene, grip + "robotiq_85_base_link.glb",    GB,   Vector3.Zero(), ROS_FIX).then(onBaseLoaded),
      loadLink(scene, grip + "robotiq_85_knuckle_link.glb",          g_lk,  Vector3.Zero(), ROS_FIX_L),
      loadLink(scene, grip + "robotiq_85_knuckle_link.glb",          g_rk,  Vector3.Zero(), ROS_FIX),
      loadLink(scene, grip + "robotiq_85_inner_knuckle_link.glb",    g_lik, Vector3.Zero(), ROS_FIX_L),
      loadLink(scene, grip + "robotiq_85_inner_knuckle_link.glb",    g_rik, Vector3.Zero(), ROS_FIX),
      loadLink(scene, grip + "robotiq_85_finger_link.glb",           g_lf,  Vector3.Zero(), ROS_FIX_L),
      loadLink(scene, grip + "robotiq_85_finger_link.glb",           g_rf,  Vector3.Zero(), ROS_FIX),
      loadLink(scene, grip + "robotiq_85_basic_finger_tip_link.glb", g_lft, Vector3.Zero(), ROS_FIX_L),
      loadLink(scene, grip + "robotiq_85_basic_finger_tip_link.glb", g_rft, Vector3.Zero(), ROS_FIX),
    ]).then(() => console.log("[BabylonViewer] ✅ All meshes loaded"));

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
          const from = prev[ARM_JOINT_NAMES[i]] ?? 0;
          const to   = target[ARM_JOINT_NAMES[i]] ?? from;
          const angle = from + (to - from) * t;
          const ax = node.metadata?.axis;
          if      (ax === "y") node.rotation.y = angle;
          else if (ax === "z") node.rotation.z = angle;
          else if (ax === "x") node.rotation.x = angle;
        });

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
  }, [debugEnabled]);

  useEffect(() => {
    if (!jointAngles) return;
    const normalized = normalizeJointAngles(jointAngles, latestAnglesRef.current);
    if (!normalized) return;
    latestAnglesRef.current = normalized;

    // Snapshot current displayed angles (arm + gripper) as the interpolation start.
    const { j1, j2, j3, j4, j5, j6 } = jointNodesRef.current;
    const nodes = [j1, j2, j3, j4, j5, j6];
    const current = {};
    nodes.forEach((node, i) => {
      if (!node) return;
      const ax = node.metadata?.axis;
      current[ARM_JOINT_NAMES[i]] =
        ax === "y" ? node.rotation.y :
        ax === "z" ? node.rotation.z : node.rotation.x;
    });
    gripperNodesRef.current.forEach((node, i) => {
      if (!node) return;
      const def = GRIPPER_DEFS[i];
      const ax  = def.axis;
      const r   = ax === "x" ? node.rotation.x : ax === "y" ? node.rotation.y : node.rotation.z;
      current[def.name] = r / (def.scale || 1);
    });

    const prev = Object.keys(current).length ? current : normalized;
    const maxDelta = ARM_JOINT_NAMES.reduce((acc, name) => {
      return Math.max(acc, Math.abs((prev[name] ?? 0) - (normalized[name] ?? 0)));
    }, 0);
    frameDurRef.current     = maxDelta > 0.5 ? FIRST_FRAME_MS : FRAME_MS;
    prevAnglesRef.current   = prev;
    targetAnglesRef.current = normalized;
    frameTimeRef.current    = Date.now();

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
