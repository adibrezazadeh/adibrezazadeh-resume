"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  ContactShadows,
  Html,
  PerformanceMonitor,
  Preload,
  RoundedBox,
  useGLTF,
  useTexture,
} from "@react-three/drei";
import { Bloom, EffectComposer, SMAA, Vignette } from "@react-three/postprocessing";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { RoomEnvironment as ThreeRoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { desk, KEY_ROWS } from "@/lib/desk-bus";
import { createDesktopTexture } from "./screenTexture";
import { usePhoto } from "@/lib/photo";
import { Books, DeskMat, ErgoChair, FloatingShelf, Headphones, LightBar, Mug, NeonSign, Notebook, PhotoFrame, Sideboard, SlatWall, SmartSpeaker, Vase } from "./ModernProps";
import { projects } from "@/lib/profile";
import type { Lang, Selection } from "@/lib/types";

// react-three-fiber 9.8 (latest) still constructs THREE.Clock, which three r186 deprecates with a console
// warning on every load. It is harmless; drop exactly that message and nothing else.
if (typeof window !== "undefined") {
  const warn = console.warn.bind(console);
  console.warn = (...args: unknown[]) => {
    if (typeof args[0] === "string" && args[0].startsWith("THREE.Clock: This module has been deprecated")) return;
    warn(...args);
  };
}

type Pose = { id: string; pos: [number, number, number]; look: [number, number, number] };

export type Hotspot = "monitor" | "shelf" | "phone" | "frames" | "orb";

type Props = {
  lang: Lang;
  selection: Selection;
  started: boolean;
  powered: boolean;
  hints: Hotspot[];
  hintLabels: Record<Hotspot, string>;
  onSelect: (selection: Selection) => void;
  onHover: (id: string | null) => void;
  onOpenAssistant: () => void;
  onReady: () => void;
  onProgress: (value: number) => void;
  screenInteractive?: boolean;
};

type Shared = {
  drag: { current: boolean };
  hovered: { current: string | null };
};

const HOME: Pose = { id: "room", pos: [0.12, 1.34, 2.22], look: [-0.02, 0.98, -0.45] };
const INTRO: Pose = { id: "intro", pos: [1.85, 2.05, 4.05], look: [0.25, 1.02, -0.7] };

function framing(aspect: number): { fov: number; yaw: number; home: Pose; intro: Pose } {
  if (aspect < 0.72) {
    return {
      fov: 58,
      yaw: 0.78,
      home: { id: "room", pos: [0.02, 1.62, 3.42], look: [0.02, 0.98, -0.12] },
      intro: { id: "intro", pos: [0.9, 2.1, 4.25], look: [0.02, 0.94, -0.18] },
    };
  }
  if (aspect < 1.05) {
    return {
      fov: 44,
      yaw: 0.55,
      home: { id: "room", pos: [0.06, 1.48, 2.95], look: [-0.02, 0.98, -0.28] },
      intro: { id: "intro", pos: [1.3, 2.05, 4.2], look: [0.1, 0.96, -0.4] },
    };
  }
  return { fov: 32, yaw: 0.32, home: HOME, intro: INTRO };
}

const TABLE_TOP = 0.958;
const DESK = { x: 0.02, z: -0.18, w: 2.2, d: 1.0, t: 0.042 };
const MONITOR_POS: [number, number, number] = [-0.06, TABLE_TOP, -0.46];
const SCREEN = {
  x: MONITOR_POS[0],
  y: MONITOR_POS[1] + 0.36,
  z: MONITOR_POS[2] + 0.016,
};
const SLOT_DISTANCE = 0.172;
/** World units per CSS pixel inside drei's transformed <Html>. */
const SLOT_SCALE = SLOT_DISTANCE / 400;
const SHELF_POS: [number, number, number] = [1.78, 0, -1.98];
const WINDOW = { x: -1.3, y: 1.58, w: 1.8, h: 1.46 };

function frameAt(index: number): [number, number, number] {
  const col = index % 5;
  const row = Math.floor(index / 5);
  return [-2.57, row === 0 ? 1.62 : 1.02, -1.08 + col * 0.46];
}

function poseFor(selection: Selection): Pose {
  if (selection.kind === "os") return { id: "os", pos: [SCREEN.x, SCREEN.y, SCREEN.z + 0.86], look: [SCREEN.x, SCREEN.y, SCREEN.z] };
  if (selection.kind === "skills") return { id: "skills", pos: [0.62, 1.32, -0.3], look: [1.8, 1.12, -2.0] };
  if (selection.kind === "contact") return { id: "contact", pos: [0.42, 1.16, 1.02], look: [0.96, 1.04, 0.2] };
  if (selection.kind === "project") {
    const index = Math.max(0, projects.findIndex((project) => project.id === selection.id));
    const frame = frameAt(index);
    return { id: selection.id, pos: [frame[0] + 1.15, frame[1], frame[2]], look: frame };
  }
  return HOME;
}

function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
}

function easeInOutQuint(t: number) {
  return t < 0.5 ? 16 * t ** 5 : 1 - (-2 * t + 2) ** 5 / 2;
}

function damp(current: number, target: number, rate: number, dt: number) {
  return THREE.MathUtils.lerp(current, target, 1 - Math.exp(-rate * dt));
}

/**
 * Feeds the boot screen's progress bar. Readiness comes from <WarmUp>, once the scene is really drawn.
 * Loaders report progress synchronously while a suspended component renders, so updates are
 * deferred to a task: setting React state from inside another component's render is an error.
 */
function LoadBridge({ onProgress, onReady }: { onProgress: (value: number) => void; onReady: () => void }) {
  useEffect(() => {
    const manager = THREE.DefaultLoadingManager;
    let pending = 0;
    const report = (value: number) => {
      window.clearTimeout(pending);
      pending = window.setTimeout(() => onProgress(Math.min(100, value)), 0);
    };
    manager.onStart = (_url, loaded, total) => report(total ? (loaded / total) * 100 : 0);
    manager.onProgress = (_url, loaded, total) => report(total ? (loaded / total) * 100 : 0);
    manager.onLoad = () => report(100);
    return () => {
      window.clearTimeout(pending);
      manager.onStart = undefined;
      manager.onProgress = () => {};
      manager.onLoad = () => {};
    };
  }, [onProgress]);
  useEffect(() => {
    // Safety net only: if an asset never arrives, let the visitor in anyway.
    const id = window.setTimeout(onReady, 20000);
    return () => window.clearTimeout(id);
  }, [onReady]);
  return null;
}

/**
 * Mounted with the loaded scene. One-time work (shader compiles, texture uploads, the soft-shadow
 * accumulation, the shadow bake) happens in the first frames; signalling "ready" only after them
 * keeps that work behind the boot screen instead of in the intro.
 */
function WarmUp({ onReady }: { onReady: () => void }) {
  const frames = useRef(0);
  const sent = useRef(false);
  useFrame(() => {
    frames.current += 1;
    if (frames.current === 1) performance.mark("office:scene");
    if (sent.current || frames.current < 20) return;
    sent.current = true;
    performance.mark("office:ready");
    onReady();
  });
  return null;
}

type Tween = {
  fp: THREE.Vector3;
  fl: THREE.Vector3;
  tp: THREE.Vector3;
  tl: THREE.Vector3;
  start: number;
  dur: number;
  arc: number;
  intro: boolean;
};

function CameraRig({ pose, started, drag, introOut }: { pose: Pose; started: boolean; drag: { current: boolean }; introOut: { current: number } }) {
  const camera = useThree((state) => state.camera);
  const gl = useThree((state) => state.gl);
  const size = useThree((state) => state.size);
  const aspect = size.width / Math.max(1, size.height);
  const shot = framing(aspect);
  const shotRef = useRef(shot);
  shotRef.current = shot;
  const poseRef = useRef(pose);
  poseRef.current = pose;
  const startedRef = useRef(started);
  startedRef.current = started;
  const aspectRef = useRef(aspect);
  aspectRef.current = aspect;

  const basePos = useRef(new THREE.Vector3(...shot.intro.pos));
  const baseLook = useRef(new THREE.Vector3(...shot.intro.look));
  const offPos = useRef(new THREE.Vector3());
  const offLook = useRef(new THREE.Vector3());
  const goalPos = useRef(new THREE.Vector3());
  const goalLook = useRef(new THREE.Vector3());
  const lookAt = useRef(new THREE.Vector3());
  const tween = useRef<Tween | null>(null);
  const lastKey = useRef("");
  const idle = useRef(0);
  const yaw = useRef(0);
  const pitch = useRef(0);
  const pointer = useRef({ x: 0, y: 0 });
  const reduce = useRef(false);
  const yawLimit = useRef(shot.yaw);
  const coarse = useRef(false);
  yawLimit.current = shot.yaw;

  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    cam.fov = shot.fov;
    cam.updateProjectionMatrix();
  }, [camera, shot.fov]);

  useEffect(() => {
    reduce.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    coarse.current = window.matchMedia("(pointer: coarse)").matches;
    const el = gl.domElement;
    el.style.touchAction = "none";
    let down = false;
    let lastX = 0;
    let lastY = 0;
    const onDown = (event: PointerEvent) => {
      down = true;
      drag.current = false;
      lastX = event.clientX;
      lastY = event.clientY;
      el.setPointerCapture?.(event.pointerId);
    };
    const onMove = (event: PointerEvent) => {
      pointer.current.x = (event.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = (event.clientY / window.innerHeight) * 2 - 1;
      if (!down) return;
      const dx = event.clientX - lastX;
      const dy = event.clientY - lastY;
      if (Math.abs(dx) + Math.abs(dy) > 3) drag.current = true;
      lastX = event.clientX;
      lastY = event.clientY;
      if (poseRef.current.id !== "room") return;
      const scale = coarse.current ? 0.0036 : 0.0016;
      const limit = yawLimit.current;
      yaw.current = THREE.MathUtils.clamp(yaw.current - dx * scale, -limit, limit);
      pitch.current = THREE.MathUtils.clamp(pitch.current + dy * scale * 0.72, -0.2, 0.16);
    };
    const onUp = (event: PointerEvent) => {
      down = false;
      if (el.hasPointerCapture?.(event.pointerId)) el.releasePointerCapture(event.pointerId);
      window.setTimeout(() => {
        drag.current = false;
      }, 40);
    };
    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointercancel", onUp);
    return () => {
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", onUp);
    };
  }, [gl, drag]);

  useFrame((state, dt) => {
    const now = state.clock.elapsedTime;
    const frame = shotRef.current;
    const current = poseRef.current;

    if (!startedRef.current) {
      // Before the visitor clicks in: a slow drift, behind the boot screen.
      const t = reduce.current ? 0 : now;
      basePos.current.set(frame.intro.pos[0] + Math.sin(t * 0.22) * 0.14, frame.intro.pos[1] + Math.sin(t * 0.37) * 0.03, frame.intro.pos[2]);
      baseLook.current.set(...frame.intro.look);
      camera.position.copy(basePos.current);
      camera.lookAt(baseLook.current);
      introOut.current = 0;
      desk.settledOn = "";
      return;
    }

    const goal = current.id === "room" ? frame.home : current;
    const pull = current.id === "os" && aspectRef.current < 0.9 ? 0.62 : 0;
    const key = `${current.id}|${frame.fov}|${pull}`;
    if (key !== lastKey.current) {
      const first = lastKey.current === "";
      const nearScreen = current.id === "os" || lastKey.current.startsWith("os|");
      tween.current = {
        fp: basePos.current.clone(),
        fl: baseLook.current.clone(),
        tp: new THREE.Vector3(goal.pos[0], goal.pos[1], goal.pos[2] + pull),
        tl: new THREE.Vector3(...goal.look),
        start: now,
        dur: reduce.current ? 0.35 : first ? 3.8 : nearScreen ? 1.7 : 1.4,
        arc: reduce.current ? 0 : first ? 0.22 : nearScreen ? 0.03 : 0.07,
        intro: first,
      };
      lastKey.current = key;
    }

    const tw = tween.current!;
    const raw = Math.min(1, Math.max(0, (now - tw.start) / tw.dur));
    const eased = tw.intro ? easeInOutQuint(raw) : easeInOutCubic(raw);
    basePos.current.lerpVectors(tw.fp, tw.tp, eased);
    basePos.current.y += Math.sin(Math.PI * raw) * tw.arc;
    baseLook.current.lerpVectors(tw.fl, tw.tl, eased);
    introOut.current = tw.intro ? raw : 1;
    desk.settledOn = raw >= 1 ? current.id : "";

    // Parallax and drag-to-look only once the camera has landed at home.
    const settled = raw >= 1 && current.id === "room";
    idle.current = damp(idle.current, settled ? 1 : 0, settled ? 2.2 : 6, dt);
    const px = pointer.current.x;
    const py = pointer.current.y;
    goalPos.current.set(px * 0.07 + yaw.current * 0.15, -py * 0.04, 0);
    goalLook.current.set(px * 0.05 + yaw.current, -py * 0.03 + pitch.current, 0);
    const k = 1 - Math.exp(-4.2 * dt);
    offPos.current.lerp(goalPos.current, k);
    offLook.current.lerp(goalLook.current, k);

    camera.position.copy(basePos.current).addScaledVector(offPos.current, idle.current);
    lookAt.current.copy(baseLook.current).addScaledVector(offLook.current, idle.current);
    camera.lookAt(lookAt.current);
  });

  return null;
}

function HitBox({
  id,
  position,
  size,
  onPick,
  onHover,
  shared,
}: {
  id: string;
  position: [number, number, number];
  size: [number, number, number];
  onPick: () => void;
  onHover: (id: string | null) => void;
  shared: Shared;
}) {
  const gl = useThree((state) => state.gl);
  return (
    <mesh
      position={position}
      onClick={(event) => {
        event.stopPropagation();
        if (shared.drag.current) return;
        onPick();
      }}
      onPointerOver={(event) => {
        event.stopPropagation();
        gl.domElement.style.cursor = "pointer";
        shared.hovered.current = id;
        onHover(id);
      }}
      onPointerOut={() => {
        gl.domElement.style.cursor = "grab";
        if (shared.hovered.current === id) shared.hovered.current = null;
        onHover(null);
      }}
    >
      <boxGeometry args={size} />
      {/* Never drawn: raycasting ignores `visible`, and an opacity-0 box still costs fill rate. */}
      <meshBasicMaterial visible={false} />
    </mesh>
  );
}

/* ---------- Materials ---------- */

type Maps = {
  wall: THREE.MeshStandardMaterial;
  ceiling: THREE.MeshStandardMaterial;
  floor: THREE.MeshStandardMaterial;
  rug: THREE.MeshStandardMaterial;
  oak: THREE.MeshStandardMaterial;
  frames: Record<string, THREE.MeshStandardMaterial>;
};

function grade(mat: THREE.MeshStandardMaterial, saturation: number, gain = 1) {
  if (saturation >= 0.98 && gain === 1) return;
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uSat = { value: saturation };
    shader.uniforms.uGain = { value: gain };
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", "#include <common>\nuniform float uSat;\nuniform float uGain;")
      .replace(
        "#include <color_fragment>",
        `#include <color_fragment>
         {
           float luma = dot(diffuseColor.rgb, vec3(0.2126, 0.7152, 0.0722));
           diffuseColor.rgb = mix(vec3(luma), diffuseColor.rgb, uSat) * uGain;
         }`,
      );
  };
  mat.customProgramCacheKey = () => "office-grade-v2";
}

function tiled(source: THREE.Texture, rx: number, ry: number, color: boolean) {
  const tex = source.clone();
  tex.repeat.set(rx, ry);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = color ? THREE.SRGBColorSpace : THREE.LinearSRGBColorSpace;
  tex.anisotropy = 8;
  tex.needsUpdate = true;
  return tex;
}

// No normal maps on the room's surfaces: at room distance the relief is invisible, but they cost
// about a fifth of each frame on integrated GPUs. Colour and roughness maps carry the look.
function material(
  diff: THREE.Texture,
  rough: THREE.Texture,
  repeat: [number, number],
  extra?: Partial<THREE.MeshStandardMaterialParameters>,
) {
  return new THREE.MeshStandardMaterial({
    map: tiled(diff, repeat[0], repeat[1], true),
    roughnessMap: tiled(rough, repeat[0], repeat[1], false),
    roughness: 1,
    metalness: 0,
    envMapIntensity: 0.55,
    ...extra,
  });
}

const FRAME_IDS = projects.map((project) => project.id);

function useMaps(): Maps {
  const tex = useTexture({
    wallDiff: "/textures/stucco_diff.jpg",
    wallRough: "/textures/stucco_rough.jpg",
    floorDiff: "/textures/parquet_diff.jpg",
    floorRough: "/textures/parquet_rough.jpg",
    rugDiff: "/textures/teddy_diff.jpg",
    rugRough: "/textures/teddy_rough.jpg",
    oakDiff: "/textures/oak_diff.jpg",
    oakRough: "/textures/oak_rough.jpg",
  });
  const posters = useTexture(FRAME_IDS.map((id) => `/frames/${id}.jpg`));
  return useMemo(() => {
    posters.forEach((poster) => {
      poster.colorSpace = THREE.SRGBColorSpace;
      poster.anisotropy = 8;
    });
    const wall = material(tex.wallDiff, tex.wallRough, [3, 1.2], { color: "#fbf7f0" });
    const ceiling = material(tex.wallDiff, tex.wallRough, [3, 3], { color: "#ffffff" });
    const floor = material(tex.floorDiff, tex.floorRough, [3.4, 3.4], { color: "#f4e6d4", roughness: 0.9, envMapIntensity: 0.7 });
    const rug = material(tex.rugDiff, tex.rugRough, [2.4, 1.7], { color: "#fffaf2" });
    const oak = material(tex.oakDiff, tex.oakRough, [1, 2], { color: "#f6ead9", roughness: 0.85, envMapIntensity: 0.7 });
    oak.map!.rotation = Math.PI / 2;
    grade(floor, 0.92, 1.02);
    return {
      wall,
      ceiling,
      floor,
      rug,
      oak,
      frames: Object.fromEntries(
        FRAME_IDS.map((id, index) => {
          const mat = new THREE.MeshStandardMaterial({ map: posters[index], roughness: 0.6 });
          return [id, mat];
        }),
      ),
    };
    // Textures are stable once useTexture resolves.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tex.wallDiff, tex.floorDiff, tex.rugDiff, tex.oakDiff, posters]);
}

const MODEL = {
  bigPlant: "/models/potted_plant_02/potted_plant_02_1k.gltf",
  succulent: "/models/potted_plant_04/potted_plant_04_1k.gltf",
  pendant: "/models/modern_ceiling_lamp_01/modern_ceiling_lamp_01_1k.gltf",
  vase: "/models/ceramic_vase_01/ceramic_vase_01_1k.gltf",
  clock: "/models/wall_clock/wall_clock_1k.gltf",
  sideTable: "/models/side_table_01/side_table_01_1k.gltf",
} as const;

function prepareMesh(root: THREE.Object3D, saturation = 0.95, gain = 1) {
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (!mesh.isMesh) return;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    const list = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    const next = list.map((source) => {
      const mat = source.clone();
      if (mat instanceof THREE.MeshStandardMaterial) {
        mat.envMapIntensity = 0.6;
        mat.emissiveIntensity = Math.min(mat.emissiveIntensity, 0.15);
        grade(mat, saturation, gain);
      }
      return mat;
    });
    mesh.material = Array.isArray(mesh.material) ? next : next[0];
  });
}

function useProp(url: string, saturation = 0.95, gain = 1) {
  const { scene } = useGLTF(url);
  return useMemo(() => {
    const clone = scene.clone(true);
    prepareMesh(clone, saturation, gain);
    return clone;
  }, [scene, saturation, gain]);
}

function Prop({
  url,
  position,
  rotation,
  scale,
  saturation,
  gain,
}: {
  url: string;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number | [number, number, number];
  saturation?: number;
  gain?: number;
}) {
  const object = useProp(url, saturation, gain);
  return <primitive object={object} position={position} rotation={rotation} scale={scale} />;
}

/* ---------- The window shows the visitor's own sky ---------- */

type Sky = {
  name: "dawn" | "day" | "dusk" | "night";
  stops: [string, string, string];
  orb: { x: number; y: number; r: number; color: string } | null;
  lit: number;
  glow: number;
  sun: { color: string; intensity: number };
  fill: { color: string; intensity: number };
  hemi: number;
  pendant: number;
};

function skyFor(hour: number): Sky {
  if (hour >= 5 && hour < 7.5) {
    return {
      name: "dawn",
      stops: ["#7d8bb0", "#e2b6a0", "#f6d2ae"],
      orb: { x: 0.72, y: 0.62, r: 26, color: "#ffe2b8" },
      lit: 0.2,
      glow: 0.9,
      sun: { color: "#ffd6aa", intensity: 7 },
      fill: { color: "#f6dcc4", intensity: 3 },
      hemi: 1,
      pendant: 2.4,
    };
  }
  if (hour >= 7.5 && hour < 17) {
    return {
      name: "day",
      stops: ["#8fb4dc", "#c3d8ea", "#e9eef1"],
      orb: null,
      lit: 0.03,
      glow: 1,
      sun: { color: "#fff3df", intensity: 6 },
      fill: { color: "#f3f1ec", intensity: 3.6 },
      hemi: 1.15,
      pendant: 1.2,
    };
  }
  if (hour >= 17 && hour < 19.5) {
    return {
      name: "dusk",
      stops: ["#4a4a78", "#c27a6e", "#f2b07a"],
      orb: { x: 0.3, y: 0.66, r: 30, color: "#ffc28a" },
      lit: 0.5,
      glow: 0.85,
      sun: { color: "#ffbf86", intensity: 7 },
      fill: { color: "#f3cdb0", intensity: 2.6 },
      hemi: 0.95,
      pendant: 3.2,
    };
  }
  return {
    name: "night",
    stops: ["#0f1830", "#1c2742", "#2a2f44"],
    orb: { x: 0.78, y: 0.18, r: 14, color: "#eef1f7" },
    lit: 1,
    glow: 0.65,
    sun: { color: "#b9c6e0", intensity: 1.2 },
    fill: { color: "#f6dfc2", intensity: 2.2 },
    hemi: 0.8,
    pendant: 7,
  };
}

function skyTexture(sky: Sky) {
  const W = 640;
  const H = 520;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new THREE.CanvasTexture(canvas);
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, sky.stops[0]);
  grad.addColorStop(0.6, sky.stops[1]);
  grad.addColorStop(1, sky.stops[2]);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  if (sky.name === "night") {
    for (let i = 0; i < 90; i += 1) {
      ctx.globalAlpha = 0.25 + Math.random() * 0.6;
      ctx.fillStyle = "#e8ecf5";
      ctx.fillRect(Math.random() * W, Math.random() * H * 0.5, 1.4, 1.4);
    }
  }
  if (sky.name === "day") {
    // Soft clouds
    for (let i = 0; i < 7; i += 1) {
      const cx = Math.random() * W;
      const cy = 40 + Math.random() * 160;
      const cloud = ctx.createRadialGradient(cx, cy, 0, cx, cy, 70 + Math.random() * 60);
      cloud.addColorStop(0, "rgba(255,255,255,0.75)");
      cloud.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = cloud;
      ctx.fillRect(0, 0, W, H);
    }
  }
  if (sky.orb) {
    const { x, y, r, color } = sky.orb;
    const halo = ctx.createRadialGradient(x * W, y * H, 0, x * W, y * H, r * 6);
    halo.addColorStop(0, color);
    halo.addColorStop(0.15, `${color}aa`);
    halo.addColorStop(1, `${color}00`);
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = halo;
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 1;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x * W, y * H, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Distant hills, then two layers of skyline; the near one carries the lit windows.
  const day = sky.name === "day" || sky.name === "dawn";
  ctx.fillStyle = day ? "#a9b7b0" : "#1a2030";
  ctx.beginPath();
  ctx.moveTo(0, 330);
  for (let x = 0; x <= W; x += 40) ctx.lineTo(x, 300 + Math.sin(x / 90) * 22 + Math.sin(x / 31) * 6);
  ctx.lineTo(W, H);
  ctx.lineTo(0, H);
  ctx.fill();
  const layers = [
    { base: 330, tone: day ? "#c4ccd2" : "#232838", alpha: 0.75, h: [40, 110] },
    { base: 390, tone: day ? "#9aa5ae" : "#11141c", alpha: 0.95, h: [50, 150] },
  ];
  layers.forEach((layer, li) => {
    let x = -10;
    while (x < W) {
      const w = 34 + Math.random() * 56;
      const h = layer.h[0] + Math.random() * (layer.h[1] - layer.h[0]);
      ctx.globalAlpha = layer.alpha;
      ctx.fillStyle = layer.tone;
      ctx.fillRect(x, layer.base - h + 120, w, h + 200);
      if (li === 1) {
        for (let wy = layer.base - h + 132; wy < H; wy += 13) {
          for (let wx = x + 6; wx < x + w - 6; wx += 10) {
            if (Math.random() > sky.lit * 0.55) continue;
            ctx.globalAlpha = 0.5 + Math.random() * 0.45;
            ctx.fillStyle = Math.random() > 0.3 ? "#f6dcaa" : "#e2e9f2";
            ctx.fillRect(wx, wy, 4, 6);
          }
        }
      }
      x += w + 2 + Math.random() * 8;
    }
  });
  ctx.globalAlpha = 1;
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/* ---------- Sunlight through the window, with the shadows of panes and swaying leaves ---------- */

/** Two blurred clusters of leaves, drawn once; each frame only moves them. */
function leafLayer(size: number, count: number, seed: number) {
  const layer = document.createElement("canvas");
  layer.width = layer.height = size;
  const ctx = layer.getContext("2d");
  if (!ctx) return layer;
  let s = seed;
  const rand = () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
  ctx.filter = "blur(1.5px)";
  ctx.fillStyle = "#000";
  ctx.strokeStyle = "#000";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(size * 0.3, size * 0.12, size * 0.66, size * 0.37);
  ctx.stroke();
  for (let i = 0; i < count; i += 1) {
    const t = rand();
    ctx.globalAlpha = 0.6 + rand() * 0.3;
    ctx.beginPath();
    ctx.ellipse(
      size * (0.06 + t * 0.58) + (rand() - 0.5) * size * 0.18,
      size * (0.04 + t * 0.33) + (rand() - 0.5) * size * 0.18,
      size * (0.02 + rand() * 0.035),
      size * (0.01 + rand() * 0.016),
      rand() * Math.PI,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }
  return layer;
}

function useGobo(reduce: boolean) {
  const { canvas, ctx, tex, near, far } = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 256;
    const ctx = canvas.getContext("2d");
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return { canvas, ctx, tex, near: leafLayer(256, 40, 7), far: leafLayer(256, 30, 23) };
  }, []);
  const last = useRef(-1);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (!ctx || (last.current >= 0 && (reduce || t - last.current < 1 / 12))) return;
    last.current = t;
    const W = canvas.width;
    // Open sky; the window frame's own geometry casts the mullion shadows.
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, W, W);
    const gust = Math.sin(t * 0.6) * 0.6 + Math.sin(t * 1.7) * 0.25;
    ctx.globalAlpha = 0.7;
    ctx.save();
    ctx.rotate(gust * 0.025);
    ctx.drawImage(far, gust * 3, gust * 1.5);
    ctx.restore();
    ctx.save();
    ctx.rotate(gust * 0.04 + Math.sin(t * 1.3) * 0.008);
    ctx.drawImage(near, gust * 5, gust * 2.5);
    ctx.restore();
    ctx.globalAlpha = 1;
    tex.needsUpdate = true;
  });

  return tex;
}

function Sunbeam({ sky, power, reduce }: { sky: Sky; power: { current: number }; reduce: boolean }) {
  const light = useRef<THREE.SpotLight>(null);
  const target = useRef<THREE.Object3D>(null);
  const gobo = useGobo(reduce);
  useEffect(() => {
    if (light.current && target.current) light.current.target = target.current;
  }, []);
  useFrame(() => {
    if (light.current) light.current.intensity = sky.sun.intensity * power.current;
  });
  return (
    <>
      <object3D ref={target} position={[0.35, 0.75, 0.35]} />
      <spotLight
        ref={light}
        position={[WINDOW.x - 0.5, 3.35, -5.3]}
        angle={0.3}
        penumbra={0.35}
        decay={0}
        intensity={0}
        color={sky.sun.color}
        map={gobo}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.03}
      />
    </>
  );
}

function Dust({ reduce }: { reduce: boolean }) {
  const ref = useRef<THREE.Points>(null);
  const count = 220;
  const positions = useMemo(() => {
    const data = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      data[i * 3] = (Math.random() - 0.5) * 1.6;
      data[i * 3 + 1] = Math.random() * 1.2;
      data[i * 3 + 2] = (Math.random() - 0.5) * 1.6;
    }
    return data;
  }, []);
  useFrame((_, dt) => {
    if (reduce || !ref.current) return;
    const attr = ref.current.geometry.getAttribute("position");
    const array = attr.array as Float32Array;
    for (let i = 0; i < count; i += 1) {
      array[i * 3 + 1] += dt * 0.02;
      array[i * 3] += Math.sin(array[i * 3 + 1] * 5 + i) * dt * 0.01;
      if (array[i * 3 + 1] > 1.2) array[i * 3 + 1] = 0;
    }
    attr.needsUpdate = true;
  });
  return (
    <points ref={ref} position={[-0.35, 0.9, -0.9]}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#fff6e6" size={0.006} transparent opacity={0.45} depthWrite={false} sizeAttenuation />
    </points>
  );
}

/** 0..1 lamp output for t seconds after the visitor clicks in: a click, a flicker, then steady. */
function lampCurve(t: number) {
  const s = t - 0.35;
  if (s < 0) return 0;
  if (s < 0.06) return 0.9;
  if (s < 0.12) return 0.12;
  if (s < 0.2) return 1;
  if (s < 0.25) return 0.35;
  return Math.min(1, 0.35 + (s - 0.25) * 3.2);
}

/** Room light rises from near-dark once the visitor clicks in. */
function usePower(started: boolean) {
  const power = useRef(0.08);
  const at = useRef<number | null>(null);
  const lamp = useRef(0);
  useFrame((state) => {
    const now = state.clock.elapsedTime;
    if (!started) {
      at.current = null;
      power.current = 0.08;
      lamp.current = 0;
      return;
    }
    if (at.current === null) at.current = now;
    const t = now - at.current;
    lamp.current = lampCurve(t);
    power.current = 0.08 + 0.92 * THREE.MathUtils.smoothstep(t, 0.3, 2.4);
  });
  return { power, lamp };
}

/* ---------- Furniture ---------- */

function ModernDesk({ oak }: { oak: THREE.MeshStandardMaterial }) {
  const steel = useMemo(() => new THREE.MeshStandardMaterial({ color: "#1f1f21", roughness: 0.42, metalness: 0.7 }), []);
  const legH = TABLE_TOP - DESK.t;
  const legX = DESK.w / 2 - 0.14;
  const legZ = DESK.d / 2 - 0.09;
  return (
    <group position={[DESK.x, 0, DESK.z]}>
      <RoundedBox args={[DESK.w, DESK.t, DESK.d]} radius={0.01} smoothness={3} position={[0, TABLE_TOP - DESK.t / 2, 0]} material={oak} castShadow receiveShadow />
      {[-legX, legX].map((x) => (
        <group key={x} position={[x, 0, 0]}>
          {[-legZ, legZ].map((z) => (
            <mesh key={z} position={[0, legH / 2, z]} material={steel} castShadow>
              <boxGeometry args={[0.045, legH, 0.045]} />
            </mesh>
          ))}
          <mesh position={[0, 0.015, 0]} material={steel} castShadow receiveShadow>
            <boxGeometry args={[0.05, 0.03, DESK.d - 0.12]} />
          </mesh>
          <mesh position={[0, legH - 0.02, 0]} material={steel} castShadow>
            <boxGeometry args={[0.05, 0.04, DESK.d - 0.12]} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, legH - 0.03, -legZ]} material={steel} castShadow>
        <boxGeometry args={[legX * 2, 0.04, 0.03]} />
      </mesh>
    </group>
  );
}

function Pendant({ sky, power }: { sky: Sky; power: { current: number } }) {
  const object = useProp(MODEL.pendant, 1);
  const light = useRef<THREE.PointLight>(null);
  useFrame(() => {
    if (light.current) light.current.intensity = sky.pendant * power.current;
  });
  return (
    <group position={[0.02, 2.8 - 1.173, -0.25]}>
      <primitive object={object} />
      {/* Every light is paid for on every pixel; the pendant only carries the room after dark. */}
      {sky.pendant >= 3 ? <pointLight ref={light} position={[0, 0.3, 0]} color="#ffe2bd" intensity={0} distance={7} decay={1.6} /> : null}
    </group>
  );
}

/** A wall clock that shows the visitor's real time. The model ships posed at 10:10:30. */
function WallClock() {
  const object = useProp(MODEL.clock, 1);
  const hands = useMemo(
    () => ({
      hour: object.getObjectByName("wall_clock_hours_hand"),
      minute: object.getObjectByName("wall_clock_minute_hand"),
      second: object.getObjectByName("wall_clock_second_hand"),
    }),
    [object],
  );
  useFrame(() => {
    const now = new Date();
    const s = now.getSeconds() + now.getMilliseconds() / 1000;
    const m = now.getMinutes() + s / 60;
    const h = (now.getHours() % 12) + m / 60;
    const turn = (deg: number, base: number) => -THREE.MathUtils.degToRad(deg - base);
    if (hands.hour) hands.hour.rotation.z = turn(h * 30, 305);
    if (hands.minute) hands.minute.rotation.z = turn(m * 6, 61);
    if (hands.second) hands.second.rotation.z = turn(Math.floor(s) * 6, 180);
  });
  return <primitive object={object} position={[0.82, 2.05, -2.15]} scale={1.05} />;
}

function Monitor({ powered, lang }: { powered: boolean; lang: Lang }) {
  const glow = useRef(0);
  const face = useRef<THREE.Group>(null);
  const screen = useRef<THREE.MeshBasicMaterial>(null);
  const corner = useMemo(() => new THREE.Vector3(), []);
  const photo = usePhoto();
  const desktop = useMemo(() => createDesktopTexture(lang, photo), [lang, photo]);
  useEffect(() => () => desktop.dispose(), [desktop]);
  useFrame((state, dt) => {
    glow.current = damp(glow.current, powered ? 1 : 0, 1.8, dt);
    desk.screen = glow.current;
    if (screen.current) screen.current.color.setScalar(glow.current * 0.92);
    // Project the screen's corners so the live desktop overlay can sit exactly on it.
    if (!face.current) return;
    const halfW = (1600 * SLOT_SCALE) / 2;
    const halfH = (900 * SLOT_SCALE) / 2;
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
      corner.set(sx * halfW, sy * halfH, 0.011).applyMatrix4(face.current.matrixWorld).project(state.camera);
      const px = ((corner.x + 1) / 2) * state.size.width + state.size.left;
      const py = ((1 - corner.y) / 2) * state.size.height + state.size.top;
      minX = Math.min(minX, px);
      maxX = Math.max(maxX, px);
      minY = Math.min(minY, py);
      maxY = Math.max(maxY, py);
    }
    desk.screenRect = { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
  });
  return (
    <group position={MONITOR_POS}>
      <RoundedBox args={[0.24, 0.008, 0.16]} radius={0.003} smoothness={3} position={[0, 0.004, 0.03]} castShadow>
        <meshStandardMaterial color="#c9ced4" metalness={0.94} roughness={0.18} />
      </RoundedBox>
      <mesh position={[0, 0.11, 0]} castShadow>
        <boxGeometry args={[0.03, 0.2, 0.018]} />
        <meshStandardMaterial color="#d5d9de" metalness={0.92} roughness={0.16} />
      </mesh>
      <group position={[0, 0.36, 0]} ref={face}>
        <RoundedBox args={[0.74, 0.426, 0.016]} radius={0.004} smoothness={4} castShadow>
          <meshStandardMaterial color="#1b1e22" metalness={0.78} roughness={0.26} />
        </RoundedBox>
        <mesh position={[0, 0, 0.006]}>
          <planeGeometry args={[0.72, 0.408]} />
          <meshStandardMaterial color="#d9d4cc" emissive="#cfc8bc" emissiveIntensity={0.12} />
        </mesh>
        <mesh position={[0, 0, 0.008]}>
          <planeGeometry args={[0.708, 0.398]} />
          <meshStandardMaterial color="#07090d" roughness={0.9} metalness={0} />
        </mesh>
        <mesh position={[0, 0, 0.011]}>
          <planeGeometry args={[1600 * SLOT_SCALE, 900 * SLOT_SCALE]} />
          <meshBasicMaterial ref={screen} map={desktop.tex} color="#000" toneMapped={false} />
        </mesh>
      </group>
    </group>
  );
}

/* ---------- Digital twin: the keyboard and mouse follow the visitor ---------- */

function Keyboard() {
  const caps = useMemo(() => {
    const rows = [14, 14, 13, 12, [1.1, 1.1, 4.2, 1.1, 1.1]];
    const list: { x: number; z: number; w: number; code: string }[] = [];
    rows.forEach((count, row) => {
      const widths = Array.isArray(count) ? count : Array.from({ length: count }, () => 1);
      const pitch = 0.024;
      const total = widths.reduce((sum, units) => sum + units * pitch, 0);
      let cursor = -total / 2;
      widths.forEach((units, col) => {
        const w = units * pitch - 0.004;
        list.push({ x: cursor + w / 2, z: -0.046 + row * 0.022, w, code: KEY_ROWS[row]?.[col] ?? "" });
        cursor += units * pitch;
      });
    });
    return list;
  }, []);
  // All caps are one instanced mesh: one draw call instead of seventy.
  const keys = useRef<THREE.InstancedMesh>(null);
  const capGeo = useMemo(() => new RoundedBoxGeometry(0.02, 0.007, 0.016, 2, 0.002), []);
  const capMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#f3f1ed", roughness: 0.5, metalness: 0.02 }), []);
  const press = useRef<number[]>(caps.map(() => 0));
  const matrix = useMemo(() => new THREE.Matrix4(), []);
  const glowMat = useRef<THREE.MeshStandardMaterial>(null);
  const glow = useRef(0);

  useFrame((_, dt) => {
    const now = performance.now();
    const typing = now - desk.lastAny < 600 ? 1 : 0;
    glow.current = damp(glow.current, typing, typing ? 10 : 1.5, dt);
    if (glowMat.current) glowMat.current.emissiveIntensity = 0.02 + glow.current * 0.35 * desk.screen;
    const mesh = keys.current;
    if (!mesh) return;
    let dirty = false;
    caps.forEach((cap, i) => {
      const down = desk.held.has(cap.code) ? 1 : 0;
      const next = damp(press.current[i], down, down ? 60 : 22, dt);
      if (Math.abs(next - press.current[i]) < 1e-4 && mesh.userData.ready) return;
      press.current[i] = next;
      matrix.makeScale(cap.w / 0.02, 1, 1).setPosition(cap.x, 0.016 - next * 0.0045, cap.z);
      mesh.setMatrixAt(i, matrix);
      dirty = true;
    });
    mesh.userData.ready = true;
    if (dirty) mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <group position={[-0.04, TABLE_TOP, 0.06]} rotation={[0, 0.06, 0]}>
      <RoundedBox args={[0.4, 0.012, 0.142]} radius={0.003} smoothness={3} position={[0, 0.006, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#e4e6e9" metalness={0.75} roughness={0.25} />
      </RoundedBox>
      <mesh position={[0, 0.0122, 0.004]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.36, 0.11]} />
        <meshStandardMaterial ref={glowMat} color="#2a2826" roughness={0.6} emissive="#d8c6a6" emissiveIntensity={0.02} />
      </mesh>
      <instancedMesh ref={keys} args={[capGeo, capMat, caps.length]} castShadow />
    </group>
  );
}

function Mouse() {
  const body = useRef<THREE.Group>(null);
  const shell = useRef<THREE.Mesh>(null);
  const click = useRef(0);
  useFrame((_, dt) => {
    if (!body.current) return;
    const tx = (desk.pointer.x - 0.5) * 0.1;
    const tz = (desk.pointer.y - 0.5) * 0.075;
    body.current.position.x = damp(body.current.position.x, tx, 14, dt);
    body.current.position.z = damp(body.current.position.z, tz, 14, dt);
    click.current = damp(click.current, desk.pressed ? 1 : 0, 40, dt);
    if (shell.current) shell.current.scale.y = 0.38 - click.current * 0.035;
  });
  return (
    <group position={[0.28, TABLE_TOP + 0.012, 0.1]}>
      <group ref={body}>
        <group rotation={[0, 0.35, 0]}>
          <mesh ref={shell} castShadow scale={[1, 0.38, 1.28]}>
            <sphereGeometry args={[0.03, 36, 24]} />
            <meshStandardMaterial color="#f0f1f3" metalness={0.2} roughness={0.35} />
          </mesh>
          <mesh position={[0, 0.012, -0.006]} rotation={[1.2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.0045, 0.0045, 0.014, 14]} />
            <meshStandardMaterial color="#8e949b" metalness={0.75} roughness={0.28} />
          </mesh>
        </group>
      </group>
    </group>
  );
}

function Laptop() {
  return (
    <group position={[0.66, TABLE_TOP, 0.02]} rotation={[0, -0.62, 0]}>
      <RoundedBox args={[0.318, 0.011, 0.218]} radius={0.004} smoothness={4} position={[0, 0.007, 0]} castShadow>
        <meshStandardMaterial color="#d8dbe0" metalness={0.9} roughness={0.2} />
      </RoundedBox>
      <mesh position={[0, 0.0132, 0.012]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.27, 0.15]} />
        <meshStandardMaterial color="#1a1d22" roughness={0.55} />
      </mesh>
      <group position={[0, 0.012, -0.102]} rotation={[0.48, 0, 0]}>
        <RoundedBox args={[0.318, 0.208, 0.005]} radius={0.003} smoothness={3} position={[0, 0.104, 0]} castShadow>
          <meshStandardMaterial color="#e4e7eb" metalness={0.88} roughness={0.18} />
        </RoundedBox>
        <mesh position={[0, 0.104, 0.0032]}>
          <planeGeometry args={[0.294, 0.184]} />
          <meshStandardMaterial color="#1c1b19" emissive="#2e2c29" emissiveIntensity={0.18} roughness={0.4} />
        </mesh>
      </group>
    </group>
  );
}

function Phone() {
  return (
    <group position={[0.98, TABLE_TOP, 0.2]} rotation={[0, -0.7, 0]}>
      <RoundedBox args={[0.055, 0.006, 0.048]} radius={0.002} smoothness={2} position={[0, 0.003, 0.012]} castShadow>
        <meshStandardMaterial color="#cfd3d8" metalness={0.9} roughness={0.2} />
      </RoundedBox>
      <mesh position={[0, 0.028, -0.006]} rotation={[0.55, 0, 0]} castShadow>
        <boxGeometry args={[0.036, 0.046, 0.004]} />
        <meshStandardMaterial color="#e1e4e8" metalness={0.86} roughness={0.22} />
      </mesh>
      <group position={[0, 0.095, 0.002]} rotation={[-0.38, 0, 0]}>
        <RoundedBox args={[0.074, 0.154, 0.008]} radius={0.01} smoothness={4} castShadow>
          <meshStandardMaterial color="#16181c" metalness={0.7} roughness={0.24} />
        </RoundedBox>
        <mesh position={[0, 0.002, 0.0044]}>
          <planeGeometry args={[0.064, 0.136]} />
          <meshStandardMaterial color="#20242c" emissive="#5a6b86" emissiveIntensity={0.25} roughness={0.35} metalness={0.04} />
        </mesh>
      </group>
    </group>
  );
}

function Orb({ shared }: { shared: Shared }) {
  const mat = useRef<THREE.MeshStandardMaterial>(null);
  useFrame((state, dt) => {
    if (!mat.current) return;
    const hot = shared.hovered.current === "orb" ? 1 : 0;
    const pulse = 0.5 + 0.5 * Math.sin(state.clock.elapsedTime * 1.6);
    mat.current.emissiveIntensity = damp(mat.current.emissiveIntensity, 0.15 + pulse * 0.2 + hot * 0.6, 6, dt);
  });
  return (
    <group position={[-0.62, TABLE_TOP, 0.16]}>
      <mesh position={[0, 0.012, 0]} castShadow>
        <cylinderGeometry args={[0.03, 0.034, 0.024, 32]} />
        <meshStandardMaterial color="#e9e3d8" roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.058, 0]} castShadow>
        <sphereGeometry args={[0.04, 32, 24]} />
        <meshStandardMaterial ref={mat} color="#f7efe2" emissive="#ffcf8a" emissiveIntensity={0.15} roughness={0.15} metalness={0.05} />
      </mesh>
    </group>
  );
}

function Desk({
  maps,
  interactive,
  powered,
  lamp,
  lang,
  onSelect,
  onHover,
  onOpenAssistant,
  shared,
}: {
  maps: Maps;
  interactive: boolean;
  powered: boolean;
  lamp: { current: number };
  lang: Lang;
  onSelect: Props["onSelect"];
  onHover: Props["onHover"];
  onOpenAssistant: () => void;
  shared: Shared;
}) {
  return (
    <group>
      <ModernDesk oak={maps.oak} />
      <Monitor powered={powered} lang={lang} />
      {!interactive ? (
        <HitBox
          id="monitor"
          position={[SCREEN.x, SCREEN.y, SCREEN.z]}
          size={[0.76, 0.46, 0.06]}
          onPick={() => onSelect({ kind: "os" })}
          onHover={onHover}
          shared={shared}
        />
      ) : null}
      <Keyboard />
      <DeskMat position={[0.06, TABLE_TOP + 0.002, 0.1]} size={[0.82, 0.36]} />
      <Mouse />
      <Laptop />
      <Phone />
      <LightBar position={[MONITOR_POS[0], TABLE_TOP + 0.573, MONITOR_POS[2]]} lamp={lamp} />
      <Headphones position={[-0.92, TABLE_TOP, -0.36]} rotation={0.35} />
      <Mug position={[-0.4, TABLE_TOP, 0.02]} rotation={-0.6} />
      <Notebook position={[-0.74, TABLE_TOP, 0.12]} rotation={0.28} />
      <Books position={[-1.02, TABLE_TOP, 0.02]} count={3} seed={4} lying rotation={-0.15} />
      <Prop url={MODEL.succulent} position={[-0.6, TABLE_TOP, -0.52]} scale={1.15} />
      <HitBox id="phone" position={[0.98, TABLE_TOP + 0.1, 0.2]} size={[0.16, 0.2, 0.12]} onPick={() => onSelect({ kind: "contact" })} onHover={onHover} shared={shared} />
      <Orb shared={shared} />
      <HitBox id="orb" position={[-0.62, TABLE_TOP + 0.06, 0.16]} size={[0.12, 0.12, 0.12]} onPick={onOpenAssistant} onHover={onHover} shared={shared} />
    </group>
  );
}

/** Floating oak shelves over a fluted sideboard: the stack lives here. */
function Shelf({ maps, onSelect, onHover, shared }: { maps: Maps; onSelect: Props["onSelect"]; onHover: Props["onHover"]; shared: Shared }) {
  const photo = usePhoto();
  const [x, , z] = SHELF_POS;
  const lower = 1.28;
  const upper = 1.72;
  const top = 0.58;
  return (
    <group>
      <FloatingShelf oak={maps.oak} position={[x, lower, z - 0.1]} width={1.25} />
      <FloatingShelf oak={maps.oak} position={[x + 0.12, upper, z - 0.1]} width={1.0} />
      <Books position={[x - 0.56, lower + 0.0175, z - 0.1]} count={9} seed={2} />
      <Vase position={[x + 0.18, lower + 0.0175, z - 0.1]} color="#c9b8a4" scale={0.9} />
      <Prop url={MODEL.succulent} position={[x + 0.45, lower + 0.0175, z - 0.1]} scale={1.1} />
      <Books position={[x - 0.25, upper + 0.0175, z - 0.1]} count={3} seed={5} lying />
      <Books position={[x + 0.05, upper + 0.0175, z - 0.1]} count={6} seed={7} />
      <Vase position={[x + 0.52, upper + 0.0175, z - 0.1]} color="#2f3033" scale={0.75} />
      {photo ? <PhotoFrame url={photo} oak={maps.oak} position={[x + 0.33, upper + 0.0175, z - 0.12]} rotation={-0.18} /> : null}
      <Sideboard oak={maps.oak} position={[x, 0, z + 0.04]} width={1.5} />
      <SmartSpeaker position={[x - 0.5, top, z + 0.04]} />
      <Books position={[x - 0.05, top, z + 0.04]} count={3} seed={3} lying rotation={0.2} />
      <Prop url={MODEL.vase} position={[x + 0.5, top, z + 0.02]} scale={0.7} />
      <HitBox id="shelf" position={[x, 1.0, z + 0.05]} size={[1.6, 2.0, 0.6]} onPick={() => onSelect({ kind: "skills" })} onHover={onHover} shared={shared} />
    </group>
  );
}

function WallFrames({ mats, onSelect, onHover, shared }: {
  mats: Maps;
  onSelect: Props["onSelect"];
  onHover: Props["onHover"];
  shared: Shared;
}) {
  const refs = useRef<(THREE.Group | null)[]>([]);
  useFrame((_, dt) => {
    projects.forEach((project, index) => {
      const group = refs.current[index];
      if (!group) return;
      const hot = shared.hovered.current === project.id ? 1 : 0;
      const base = frameAt(index)[0];
      group.position.x = damp(group.position.x, base + hot * 0.035, 8, dt);
      group.rotation.z = damp(group.rotation.z, hot * 0.012, 8, dt);
    });
  });
  return (
    <group>
      {projects.map((project, index) => {
        const [x, y, z] = frameAt(index);
        return (
          <group
            key={project.id}
            ref={(group: THREE.Group | null) => {
              refs.current[index] = group;
            }}
            position={[x, y, z]}
            rotation={[0, Math.PI / 2, 0]}
          >
            <RoundedBox args={[0.4, 0.52, 0.03]} radius={0.006} smoothness={2} material={mats.oak} castShadow />
            <mesh position={[0, 0, 0.0155]}>
              <planeGeometry args={[0.36, 0.48]} />
              <meshStandardMaterial color="#fbf8f2" roughness={0.9} />
            </mesh>
            <mesh position={[0, 0, 0.017]} material={mats.frames[project.id]}>
              <planeGeometry args={[0.3, 0.4]} />
            </mesh>
          </group>
        );
      })}
      {projects.map((project, index) => {
        const [x, y, z] = frameAt(index);
        return (
          <HitBox
            key={`hit-${project.id}`}
            id={project.id}
            position={[x + 0.04, y, z]}
            size={[0.08, 0.56, 0.44]}
            onPick={() => onSelect({ kind: "project", id: project.id })}
            onHover={onHover}
            shared={shared}
          />
        );
      })}
    </group>
  );
}

function RoomShell({ maps, sky, skyMap }: { maps: Maps; sky: Sky; skyMap: THREE.Texture }) {
  const trim = useMemo(() => new THREE.MeshStandardMaterial({ color: "#f7f4ee", roughness: 0.6 }), []);
  const frame = useMemo(() => new THREE.MeshStandardMaterial({ color: "#2b2a28", roughness: 0.45, metalness: 0.5 }), []);
  const halfW = WINDOW.w / 2;
  const halfH = WINDOW.h / 2;
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0.35]} receiveShadow material={maps.floor}>
        <planeGeometry args={[8, 8]} />
      </mesh>
      <mesh position={[0, 2.8, 0.35]} rotation={[Math.PI / 2, 0, 0]} material={maps.ceiling}>
        <planeGeometry args={[8, 8]} />
      </mesh>
      <mesh position={[0, 1.4, -2.2]} receiveShadow material={maps.wall}>
        <planeGeometry args={[8, 2.8]} />
      </mesh>
      <mesh position={[-2.6, 1.4, 0.55]} rotation={[0, Math.PI / 2, 0]} receiveShadow material={maps.wall}>
        <planeGeometry args={[8, 2.8]} />
      </mesh>
      <mesh position={[2.6, 1.4, 0.55]} rotation={[0, -Math.PI / 2, 0]} receiveShadow material={maps.wall}>
        <planeGeometry args={[8, 2.8]} />
      </mesh>
      {/* Skirting boards */}
      <mesh position={[0, 0.05, -2.19]} material={trim} receiveShadow>
        <boxGeometry args={[5.2, 0.1, 0.02]} />
      </mesh>
      <mesh position={[-2.59, 0.05, 0.55]} material={trim} receiveShadow>
        <boxGeometry args={[0.02, 0.1, 8]} />
      </mesh>
      <mesh position={[2.59, 0.05, 0.55]} material={trim} receiveShadow>
        <boxGeometry args={[0.02, 0.1, 8]} />
      </mesh>

      {/* Window: sky, black steel frame, oak sill */}
      <mesh position={[WINDOW.x, WINDOW.y, -2.185]}>
        <planeGeometry args={[WINDOW.w, WINDOW.h]} />
        <meshBasicMaterial map={skyMap} toneMapped={false} color={new THREE.Color(sky.glow, sky.glow, sky.glow)} />
      </mesh>
      {[
        { p: [WINDOW.x, WINDOW.y + halfH, -2.17], s: [WINDOW.w + 0.06, 0.05, 0.05] },
        { p: [WINDOW.x, WINDOW.y - halfH, -2.17], s: [WINDOW.w + 0.06, 0.05, 0.05] },
        { p: [WINDOW.x - halfW, WINDOW.y, -2.17], s: [0.05, WINDOW.h, 0.05] },
        { p: [WINDOW.x + halfW, WINDOW.y, -2.17], s: [0.05, WINDOW.h, 0.05] },
        { p: [WINDOW.x, WINDOW.y, -2.17], s: [0.03, WINDOW.h, 0.035] },
        { p: [WINDOW.x, WINDOW.y + 0.12, -2.17], s: [WINDOW.w, 0.03, 0.035] },
      ].map((bar, i) => (
        <mesh key={i} position={bar.p as [number, number, number]} material={frame} castShadow>
          <boxGeometry args={bar.s as [number, number, number]} />
        </mesh>
      ))}
      <RoundedBox args={[WINDOW.w + 0.16, 0.035, 0.16]} radius={0.006} smoothness={2} position={[WINDOW.x, WINDOW.y - halfH - 0.02, -2.12]} material={maps.oak} castShadow receiveShadow />

      <mesh rotation={[-Math.PI / 2, 0, 0.06]} position={[0.05, 0.006, 0.55]} receiveShadow material={maps.rug}>
        <planeGeometry args={[2.6, 1.8]} />
      </mesh>
      {/* Soft contact shadow under the desk and chair, rendered once and then just a textured plane. */}
      <ContactShadows frames={1} position={[0.1, 0.008, 0.1]} scale={[5, 4.4]} resolution={512} blur={2.4} far={1.2} opacity={0.5} color="#3d2d20" />
    </group>
  );
}

function RoomLights({ sky, power }: { sky: Sky; power: { current: number } }) {
  const hemi = useRef<THREE.HemisphereLight>(null);
  useFrame(() => {
    // One hemisphere tinted by the sky stands in for separate window and front fill lights.
    if (hemi.current) hemi.current.intensity = (sky.hemi + 0.25 + sky.fill.intensity * 0.12) * power.current;
  });
  return <hemisphereLight ref={hemi} args={[sky.fill.color, "#b9a58f", 0.1]} />;
}

function Hints({ hints, labels, onSelect, onOpenAssistant }: {
  hints: Hotspot[];
  labels: Record<Hotspot, string>;
  onSelect: Props["onSelect"];
  onOpenAssistant: () => void;
}) {
  const spots: { id: Hotspot; at: [number, number, number]; go: () => void }[] = [
    { id: "monitor", at: [SCREEN.x + 0.3, SCREEN.y + 0.16, SCREEN.z + 0.05], go: () => onSelect({ kind: "os" }) },
    { id: "shelf", at: [SHELF_POS[0] - 0.3, 1.5, SHELF_POS[2] + 0.2], go: () => onSelect({ kind: "skills" }) },
    { id: "phone", at: [0.98, TABLE_TOP + 0.22, 0.2], go: () => onSelect({ kind: "contact" }) },
    { id: "orb", at: [-0.62, TABLE_TOP + 0.16, 0.16], go: onOpenAssistant },
    { id: "frames", at: [frameAt(2)[0] + 0.05, frameAt(2)[1] + 0.32, frameAt(2)[2]], go: () => onSelect({ kind: "project", id: projects[0].id }) },
  ];
  return (
    <>
      {spots.map((spot) => (
        <Html key={spot.id} position={spot.at} center zIndexRange={[15, 0]} style={{ display: hints.includes(spot.id) ? "block" : "none" }}>
          <button type="button" className="hotspot" onClick={spot.go} aria-label={labels[spot.id]}>
            <span className="hotspot-label">{labels[spot.id]}</span>
          </button>
        </Html>
      ))}
    </>
  );
}

function OfficeScene({
  lang,
  selection,
  started,
  powered,
  hints,
  hintLabels,
  onSelect,
  onHover,
  onOpenAssistant,
  onReady,
  shared,
  screenInteractive = true,
}: Omit<Props, "onProgress"> & { shared: Shared }) {
  const maps = useMaps();
  const sky = useMemo(() => {
    const now = new Date();
    return skyFor(now.getHours() + now.getMinutes() / 60);
  }, []);
  const skyMap = useMemo(() => skyTexture(sky), [sky]);
  const reduce = useMemo(() => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches, []);
  const interactive = selection.kind === "os" && screenInteractive;
  const { power, lamp } = usePower(started);

  return (
    <>
      <RoomEnvironment />
      <RoomLights sky={sky} power={power} />
      {sky.name !== "night" ? <Sunbeam sky={sky} power={power} reduce={reduce} /> : null}
      <Pendant sky={sky} power={power} />
      <RoomShell maps={maps} sky={sky} skyMap={skyMap} />
      <Desk
        maps={maps}
        interactive={interactive}
        powered={powered}
        lamp={lamp}
        lang={lang}
        onSelect={onSelect}
        onHover={onHover}
        onOpenAssistant={onOpenAssistant}
        shared={shared}
      />
      <ErgoChair position={[0.42, 0, 0.98]} rotation={0.62} />
      <Prop url={MODEL.bigPlant} position={[-2.12, 0, -1.78]} rotation={[0, 0.8, 0]} scale={1.55} />
      <Prop url={MODEL.sideTable} position={[1.75, 0, 0.35]} rotation={[0, -0.4, 0]} />
      <Prop url={MODEL.vase} position={[1.72, 0.548, 0.3]} scale={0.75} />
      <SlatWall oak={maps.oak} from={-0.3} to={2.58} height={2.8} z={-2.176} glowAt={[SCREEN.x, 1.32, 0]} night={sky.name === "night" || sky.name === "dusk"} />
      <NeonSign position={[SCREEN.x, 1.8, -2.15]} started={started} />
      <Shelf maps={maps} onSelect={onSelect} onHover={onHover} shared={shared} />
      <WallClock />
      <WallFrames mats={maps} onSelect={onSelect} onHover={onHover} shared={shared} />
      <Dust reduce={reduce} />
      {/* Mounted with the loaded scene, so the frozen shadows include every model. */}
      <ShadowBaker />
      {/* Compile shaders and upload textures up front, so nothing stalls the first time it comes into view. */}
      <Preload all />
      <WarmUp onReady={onReady} />
      {/* Kept mounted and hidden instead of remounted on every camera move. */}
      {started ? <Hints hints={selection.kind === "room" ? hints : []} labels={hintLabels} onSelect={onSelect} onOpenAssistant={onOpenAssistant} /> : null}
    </>
  );
}

function Grade({ enabled }: { enabled: boolean }) {
  // Kept lean on purpose: SMAA, a soft bloom for the neon and light bar, and a light vignette.
  // On a GPU that cannot hold the frame rate even at reduced resolution, post-processing goes.
  if (!enabled) return null;
  return (
    <EffectComposer multisampling={0} enableNormalPass={false}>
      <SMAA />
      <Bloom intensity={0.18} luminanceThreshold={0.9} luminanceSmoothing={0.25} mipmapBlur levels={5} />
      <Vignette eskil={false} offset={0.35} darkness={0.16} />
    </EffectComposer>
  );
}

/** three's procedural studio room as the reflection environment: nothing to download. */
function RoomEnvironment() {
  const gl = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const env = pmrem.fromScene(new ThreeRoomEnvironment(), 0.04).texture;
    scene.environment = env;
    scene.environmentIntensity = 0.45;
    return () => {
      scene.environment = null;
      env.dispose();
      pmrem.dispose();
    };
  }, [gl, scene]);
  return null;
}

/**
 * The room does not move, so shadow maps are rendered while it settles in and then frozen.
 * This removes three depth passes from every frame.
 */
function ShadowBaker() {
  const gl = useThree((state) => state.gl);
  const frames = useRef(0);
  useEffect(() => {
    gl.shadowMap.autoUpdate = false;
    gl.shadowMap.needsUpdate = true;
    return () => {
      gl.shadowMap.autoUpdate = true;
    };
  }, [gl]);
  useFrame(() => {
    if (frames.current > 20) return;
    frames.current += 1;
    gl.shadowMap.needsUpdate = true;
  });
  return null;
}

export default function OfficeCanvas({
  lang,
  selection,
  started,
  powered,
  hints,
  hintLabels,
  onSelect,
  onHover,
  onOpenAssistant,
  onReady,
  onProgress,
  screenInteractive = true,
}: Props) {
  const shared = useRef<Shared>({ drag: { current: false }, hovered: { current: null } });
  const intro = useRef({ current: 0 });
  // Sharpness matters most: resolution only gives way a little (to 85%) on GPUs that cannot keep up;
  // post-processing is what goes first.
  const [quality, setQuality] = useState(1);
  const startedRef = useRef(started);
  useEffect(() => {
    startedRef.current = started;
  }, [started]);
  const dpr = Math.min(typeof window === "undefined" ? 1 : window.devicePixelRatio, 1.5) * quality;
  const pose = poseFor(selection);

  return (
    <Canvas
      className="office-canvas"
      // drei's <Html> layers have no inline `left`, so under an RTL page they anchor to the right edge.
      style={{ direction: "ltr" }}
      dpr={dpr}
      // PCF explicitly: r3f's default asks for PCFSoftShadowMap, which three r186 removed (and warns about).
      shadows="percentage"
      camera={{ position: INTRO.pos, fov: 36, near: 0.08, far: 28 }}
      gl={{ antialias: true, alpha: false, powerPreference: "high-performance", stencil: false }}
      onPointerMissed={(event: MouseEvent) => {
        if (shared.current.drag.current) return;
        // Clicks inside the screen's DOM bubble through the canvas wrapper; they are not misses.
        if ((event.target as HTMLElement | null)?.closest?.(".os-overlay, .hotspot")) return;
        if (selection.kind !== "room") onSelect({ kind: "room" });
      }}
      onCreated={({ gl, scene, camera, size }) => {
        gl.setClearColor("#1b1915");
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.12;
        gl.shadowMap.enabled = true;
        // Skips a synchronous status query per shader (faster first load) and the D3D compiler's
        // harmless precision notes that ANGLE would otherwise print to the console on Windows.
        gl.debug.checkShaderErrors = false;
        scene.environmentIntensity = 0.55;
        const shot = framing(size.width / Math.max(1, size.height));
        const view = camera as THREE.PerspectiveCamera;
        view.position.set(...shot.intro.pos);
        view.fov = shot.fov;
        view.updateProjectionMatrix();
        gl.domElement.style.cursor = "grab";
      }}
    >
      <PerformanceMonitor
        factor={1}
        step={0.25}
        ms={200}
        iterations={5}
        bounds={(refresh) => (refresh > 90 ? [60, 90] : [48, 58])}
        flipflops={6}
        // Decided while the boot screen is up, then frozen: a resolution change mid-visit stalls a frame.
        onChange={({ factor }) => {
          if (!startedRef.current) setQuality(0.85 + 0.15 * factor);
        }}
        onFallback={() => {
          if (!startedRef.current) setQuality(0.85);
        }}
      />
      <LoadBridge onProgress={onProgress} onReady={onReady} />
      <CameraRig pose={pose} started={started} drag={shared.current.drag} introOut={intro.current} />
      <Suspense fallback={null}>
        <OfficeScene
          lang={lang}
          selection={selection}
          started={started}
          powered={powered}
          hints={hints}
          hintLabels={hintLabels}
          onSelect={onSelect}
          onHover={onHover}
          onOpenAssistant={onOpenAssistant}
          onReady={onReady}
          shared={shared.current}
          screenInteractive={screenInteractive}
        />
      </Suspense>
      <Grade enabled={quality > 0.95} />
    </Canvas>
  );
}

Object.values(MODEL).forEach((url) => {
  useGLTF.preload(url);
});
