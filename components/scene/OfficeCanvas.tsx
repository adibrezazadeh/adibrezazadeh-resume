"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { AccumulativeShadows, Environment, Html, RandomizedLight, RoundedBox, useGLTF, useProgress, useTexture } from "@react-three/drei";
import { Bloom, DepthOfField, EffectComposer, Noise, SMAA, Vignette } from "@react-three/postprocessing";
import type { DepthOfFieldEffect } from "postprocessing";
import { Suspense, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { ShahrokhOS } from "@/components/os/ShahrokhOS";
import { projects } from "@/lib/profile";
import type { Lang, Selection } from "@/lib/types";

type Pose = { id: string; pos: [number, number, number]; look: [number, number, number] };

type Props = {
  lang: Lang;
  selection: Selection;
  onSelect: (selection: Selection) => void;
  onHover: (id: string | null) => void;
  onOpenAssistant: () => void;
  onReady: () => void;
  onProgress: (value: number) => void;
};

const HOME: Pose = { id: "room", pos: [0.12, 1.34, 2.22], look: [-0.02, 0.98, -0.45] };
const INTRO: Pose = { id: "intro", pos: [0.95, 1.68, 3.05], look: [0.05, 0.92, -0.7] };

const TABLE_TOP = 0.958;
const TV_POS: [number, number, number] = [-0.22, TABLE_TOP, -0.5];
const SCREEN = {
  x: TV_POS[0],
  y: TV_POS[1] + 0.26,
  z: TV_POS[2] + 0.2,
};

function frameAt(index: number): [number, number, number] {
  const col = index % 5;
  const row = Math.floor(index / 5);
  return [-2.3, row === 0 ? 1.58 : 0.98, -1.5 + col * 0.46];
}

function poseFor(selection: Selection): Pose {
  if (selection.kind === "os") return { id: "os", pos: [SCREEN.x, SCREEN.y, SCREEN.z + 0.98], look: [SCREEN.x, SCREEN.y, SCREEN.z] };
  if (selection.kind === "skills") return { id: "skills", pos: [0.15, 1.22, -0.72], look: [1.05, 1.15, -1.85] };
  if (selection.kind === "contact") return { id: "contact", pos: [0.28, 1.12, 0.95], look: [0.72, 1.0, 0.12] };
  if (selection.kind === "project") {
    const index = Math.max(0, projects.findIndex((project) => project.id === selection.id));
    const frame = frameAt(index);
    return { id: selection.id, pos: [frame[0] + 1.15, frame[1], frame[2]], look: frame };
  }
  return HOME;
}

function easeInOut(t: number) {
  return t < 0.5 ? 2 * t * t : 1 - ((-2 * t + 2) ** 2) / 2;
}

function LoadBridge({ onProgress, onReady }: { onProgress: (value: number) => void; onReady: () => void }) {
  const { progress, active } = useProgress();
  const done = useRef(false);
  useEffect(() => {
    onProgress(Math.min(100, progress));
    if (!done.current && !active && progress >= 100) {
      done.current = true;
      onReady();
    }
  }, [progress, active, onProgress, onReady]);
  useEffect(() => {
    const id = window.setTimeout(() => {
      if (done.current) return;
      done.current = true;
      onReady();
    }, 7000);
    return () => window.clearTimeout(id);
  }, [onReady]);
  return null;
}

function CameraRig({ pose, drag, introOut }: { pose: Pose; drag: { current: boolean }; introOut: { current: number } }) {
  const camera = useThree((state) => state.camera);
  const gl = useThree((state) => state.gl);
  const currentPos = useRef(new THREE.Vector3(...INTRO.pos));
  const currentLook = useRef(new THREE.Vector3(...INTRO.look));
  const targetPos = useRef(new THREE.Vector3());
  const targetLook = useRef(new THREE.Vector3());
  const yaw = useRef(0);
  const pitch = useRef(0);
  const pointer = useRef({ x: 0, y: 0 });
  const intro = useRef(0);
  const reduce = useRef(false);

  useEffect(() => {
    reduce.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce.current) intro.current = 1;
    const el = gl.domElement;
    let down = false;
    let lastX = 0;
    let lastY = 0;
    const onDown = (event: PointerEvent) => {
      down = true;
      drag.current = false;
      lastX = event.clientX;
      lastY = event.clientY;
    };
    const onMove = (event: PointerEvent) => {
      pointer.current.x = (event.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = (event.clientY / window.innerHeight) * 2 - 1;
      if (!down) return;
      const dx = event.clientX - lastX;
      const dy = event.clientY - lastY;
      if (Math.abs(dx) + Math.abs(dy) > 4) drag.current = true;
      lastX = event.clientX;
      lastY = event.clientY;
      if (pose.id !== "room") return;
      yaw.current = THREE.MathUtils.clamp(yaw.current - dx * 0.0016, -0.28, 0.28);
      pitch.current = THREE.MathUtils.clamp(pitch.current + dy * 0.0011, -0.12, 0.12);
    };
    const onUp = () => {
      down = false;
      window.setTimeout(() => {
        drag.current = false;
      }, 40);
    };
    el.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      el.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [gl, pose.id, drag]);

  useFrame((_, dt) => {
    if (!reduce.current) intro.current = Math.min(1, intro.current + dt / 3.4);
    const introT = reduce.current ? 1 : easeInOut(intro.current);
    const idle = pose.id === "room" && intro.current >= 1;
    const px = idle ? pointer.current.x : 0;
    const py = idle ? pointer.current.y : 0;
    const base = pose.id === "room" ? HOME : pose;
    const from = pose.id === "room" ? INTRO : pose;
    targetPos.current.set(
      THREE.MathUtils.lerp(from.pos[0], base.pos[0], introT) + (idle ? px * 0.07 + yaw.current * 0.15 : 0),
      THREE.MathUtils.lerp(from.pos[1], base.pos[1], introT) + (idle ? -py * 0.04 : 0),
      THREE.MathUtils.lerp(from.pos[2], base.pos[2], introT),
    );
    targetLook.current.set(
      THREE.MathUtils.lerp(from.look[0], base.look[0], introT) + (idle ? px * 0.05 + yaw.current : 0),
      THREE.MathUtils.lerp(from.look[1], base.look[1], introT) + (idle ? -py * 0.03 + pitch.current : 0),
      THREE.MathUtils.lerp(from.look[2], base.look[2], introT),
    );
    const k = reduce.current || pose.id !== "room" ? 1 - Math.exp(-2.4 * dt) : 1 - Math.exp(-4.2 * dt);
    if (pose.id !== "room") {
      currentPos.current.lerp(targetPos.current, 1 - Math.exp(-2.1 * dt));
      currentLook.current.lerp(targetLook.current, 1 - Math.exp(-2.1 * dt));
    } else {
      currentPos.current.lerp(targetPos.current, k);
      currentLook.current.lerp(targetLook.current, k);
    }
    camera.position.copy(currentPos.current);
    camera.lookAt(currentLook.current);
    introOut.current = intro.current;
  });

  return null;
}

function HitBox({
  id,
  position,
  size,
  onPick,
  onHover,
  drag,
}: {
  id: string;
  position: [number, number, number];
  size: [number, number, number];
  onPick: () => void;
  onHover: (id: string | null) => void;
  drag: { current: boolean };
}) {
  const gl = useThree((state) => state.gl);
  return (
    <mesh
      position={position}
      onClick={(event) => {
        event.stopPropagation();
        if (drag.current) return;
        onPick();
      }}
      onPointerOver={(event) => {
        event.stopPropagation();
        gl.domElement.style.cursor = "pointer";
        onHover(id);
      }}
      onPointerOut={() => {
        gl.domElement.style.cursor = "grab";
        onHover(null);
      }}
    >
      <boxGeometry args={size} />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} />
    </mesh>
  );
}

type Maps = {
  wall: THREE.MeshStandardMaterial;
  planks: THREE.MeshStandardMaterial;
  carpet: THREE.MeshStandardMaterial;
  frames: Record<string, THREE.Texture>;
};

function prepare(tex: THREE.Texture, color: boolean) {
  tex.colorSpace = color ? THREE.SRGBColorSpace : THREE.LinearSRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  return tex;
}

function tiled(source: THREE.Texture, rx: number, ry: number, color: boolean) {
  const tex = source.clone();
  tex.repeat.set(rx, ry);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = color ? THREE.SRGBColorSpace : THREE.LinearSRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

function material(
  diff: THREE.Texture,
  nor: THREE.Texture,
  rough: THREE.Texture,
  repeat: [number, number],
  extra?: Partial<THREE.MeshStandardMaterialParameters>,
) {
  return new THREE.MeshStandardMaterial({
    map: tiled(diff, repeat[0], repeat[1], true),
    normalMap: tiled(nor, repeat[0], repeat[1], false),
    roughnessMap: tiled(rough, repeat[0], repeat[1], false),
    roughness: 1,
    metalness: 0,
    envMapIntensity: 0.4,
    ...extra,
  });
}

const FRAME_IDS = projects.map((project) => project.id);

function useMaps(): Maps {
  const tex = useTexture({
    wallDiff: "/textures/wall_diff.jpg",
    wallNor: "/textures/wall_nor.jpg",
    wallRough: "/textures/wall_rough.jpg",
    planksDiff: "/textures/planks_diff.jpg",
    planksNor: "/textures/planks_nor.jpg",
    planksRough: "/textures/planks_rough.jpg",
    carpetDiff: "/textures/carpet_diff.jpg",
    carpetNor: "/textures/carpet_nor.jpg",
    carpetRough: "/textures/carpet_rough.jpg",
  });
  const posters = useTexture(FRAME_IDS.map((id) => `/frames/${id}.jpg`));
  return useMemo(() => {
    prepare(tex.wallDiff, true);
    prepare(tex.planksDiff, true);
    prepare(tex.carpetDiff, true);
    posters.forEach((poster) => {
      poster.colorSpace = THREE.SRGBColorSpace;
      poster.anisotropy = 8;
    });
    return {
      wall: material(tex.wallDiff, tex.wallNor, tex.wallRough, [2.2, 1.4], { color: "#8a8178", roughness: 0.92 }),
      planks: material(tex.planksDiff, tex.planksNor, tex.planksRough, [3.2, 2.6], { color: "#6a5040", roughness: 0.86 }),
      carpet: material(tex.carpetDiff, tex.carpetNor, tex.carpetRough, [1.6, 1.3], { color: "#5c3a32", roughness: 0.95 }),
      frames: Object.fromEntries(FRAME_IDS.map((id, index) => [id, posters[index]])),
    };
    // Textures are stable once useTexture resolves.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tex.wallDiff, tex.planksDiff, tex.carpetDiff, posters]);
}

const MODEL = {
  table: "/models/painted_wooden_table/painted_wooden_table_1k.gltf",
  chair: "/models/GreenChair_01/GreenChair_01_1k.gltf",
  tv: "/models/Television_01/Television_01_1k.gltf",
  lamp: "/models/desk_lamp_arm_01/desk_lamp_arm_01_1k.gltf",
  shelf: "/models/wooden_bookshelf_worn/wooden_bookshelf_worn_1k.gltf",
  books: "/models/book_encyclopedia_set_01/book_encyclopedia_set_01_1k.gltf",
  plant: "/models/potted_plant_01/potted_plant_01_1k.gltf",
  notebook: "/models/binder_notebook/binder_notebook_1k.gltf",
  pen: "/models/stationery_supplies/stationery_supplies_1k.gltf",
  laptop: "/models/classic_laptop/classic_laptop_1k.gltf",
  cables: "/models/modular_electric_cables/modular_electric_cables_1k.gltf",
} as const;

function prepareMesh(root: THREE.Object3D) {
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (!mesh.isMesh) return;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    const list = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    const next = list.map((source) => {
      const mat = source.clone();
      if (mat instanceof THREE.MeshStandardMaterial) {
        mat.envMapIntensity = 0.55;
        if (/light/i.test(mat.name)) {
          mat.emissiveIntensity = 8;
          mat.toneMapped = false;
        }
      }
      return mat;
    });
    mesh.material = Array.isArray(mesh.material) ? next : next[0];
  });
}

function useProp(url: string) {
  const { scene } = useGLTF(url);
  return useMemo(() => {
    const clone = scene.clone(true);
    prepareMesh(clone);
    return clone;
  }, [scene]);
}

function Prop({ url, position, rotation, scale }: { url: string; position?: [number, number, number]; rotation?: [number, number, number]; scale?: number }) {
  const object = useProp(url);
  return <primitive object={object} position={position} rotation={rotation} scale={scale} />;
}

function cityLights() {
  const canvas = document.createElement("canvas");
  canvas.width = 640;
  canvas.height = 480;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new THREE.CanvasTexture(canvas);
  const sky = ctx.createLinearGradient(0, 0, 0, 480);
  sky.addColorStop(0, "#24364c");
  sky.addColorStop(0.42, "#101820");
  sky.addColorStop(1, "#07090d");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, 640, 480);
  const tones = ["#f3d7a4", "#d5e6f6", "#9eb6d4", "#ffc48a", "#e7eef6", "#7f93ab"];
  for (let i = 0; i < 90; i += 1) {
    const x = Math.random() * 640;
    const y = 150 + Math.random() * 300;
    const r = 2 + Math.random() * 16;
    ctx.globalAlpha = 0.18 + Math.random() * 0.55;
    ctx.fillStyle = tones[i % tones.length];
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 0.35;
  ctx.fillStyle = "#0c1016";
  for (let i = 0; i < 18; i += 1) {
    ctx.fillRect(24 + (i % 9) * 68, 250 + Math.floor(i / 9) * 70, 36, 48 + (i % 3) * 16);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function Dust({ reduce }: { reduce: boolean }) {
  const ref = useRef<THREE.Points>(null);
  const count = 140;
  const positions = useMemo(() => {
    const data = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      data[i * 3] = (Math.random() - 0.5) * 0.9;
      data[i * 3 + 1] = Math.random() * 0.7;
      data[i * 3 + 2] = (Math.random() - 0.2) * 0.8;
    }
    return data;
  }, []);
  useFrame((_, dt) => {
    if (reduce || !ref.current) return;
    const attr = ref.current.geometry.getAttribute("position");
    const array = attr.array as Float32Array;
    for (let i = 0; i < count; i += 1) {
      array[i * 3 + 1] += dt * 0.03;
      array[i * 3] += Math.sin(array[i * 3 + 1] * 7) * dt * 0.008;
      if (array[i * 3 + 1] > 0.75) array[i * 3 + 1] = 0;
    }
    attr.needsUpdate = true;
  });
  return (
    <points ref={ref} position={[0.45, 1.15, -0.2]}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#ffd7a8" size={0.007} transparent opacity={0.45} depthWrite={false} sizeAttenuation />
    </points>
  );
}

function DeskLamp() {
  const lamp = useProp(MODEL.lamp);
  const light = useRef<THREE.SpotLight>(null);
  const target = useRef<THREE.Object3D>(null);
  useEffect(() => {
    if (light.current && target.current) light.current.target = target.current;
  }, []);
  return (
    <group position={[0.95, TABLE_TOP + 0.088, -0.42]} rotation={[0, Math.PI * 0.9, 0]}>
      <primitive object={lamp} />
      <object3D ref={target} position={[0.05, 0.12, -0.95]} />
      <spotLight
        ref={light}
        position={[0, 0.7, -0.17]}
        angle={0.62}
        penumbra={0.82}
        intensity={160}
        color="#ffb15a"
        distance={4.2}
        decay={2}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.04}
      />
      <pointLight position={[0, 0.69, -0.18]} color="#ffe1b5" intensity={14} distance={1.5} decay={2} />
    </group>
  );
}

function Monitor({ interactive, lang, onLeave }: { interactive: boolean; lang: Lang; onLeave: () => void }) {
  const tv = useProp(MODEL.tv);
  return (
    <group position={TV_POS}>
      <primitive object={tv} />
      <mesh position={[0, 0.26, 0.186]}>
        <planeGeometry args={[0.44, 0.32]} />
        <meshBasicMaterial color="#100c09" />
      </mesh>
      <Html transform distanceFactor={0.162} position={[0, 0.258, 0.2]} zIndexRange={[20, 0]} style={{ pointerEvents: "none" }}>
        <div className="crt-screen" style={{ width: 900, height: 640, pointerEvents: interactive ? "auto" : "none" }}>
          <ShahrokhOS lang={lang} embedded onLeave={onLeave} />
          <div className="crt-scan" />
        </div>
      </Html>
    </group>
  );
}

function Cables() {
  const { scene } = useGLTF(MODEL.cables);
  const group = useMemo(() => {
    const root = new THREE.Group();
    const layout: [string, number, number, number][] = [
      ["cable_scurve_2", -0.06, 0.04, 0.5],
      ["cable_straight_medium", 0.1, -0.02, 1.2],
      ["cable_end", 0.02, 0.08, -0.2],
      ["cable_turn_short", 0.18, 0.05, 0.9],
    ];
    layout.forEach(([name, x, z, yaw]) => {
      const src = scene.getObjectByName(name);
      if (!src) return;
      const clone = src.clone(true);
      clone.position.set(x, 0, z);
      clone.rotation.set(-Math.PI / 2, 0, yaw);
      prepareMesh(clone);
      root.add(clone);
    });
    return root;
  }, [scene]);
  return <primitive object={group} position={[-0.28, TABLE_TOP + 0.01, -0.18]} />;
}

function DeskBooks() {
  const { scene } = useGLTF(MODEL.books);
  const group = useMemo(() => {
    const root = new THREE.Group();
    ["book_encyclopedia_set_01_book01", "book_encyclopedia_set_01_book08", "book_encyclopedia_set_01_book16"].forEach((name, index) => {
      const src = scene.getObjectByName(name);
      if (!src) return;
      const clone = src.clone(true);
      clone.position.set(index * 0.05, 0, 0);
      clone.rotation.set(0, (index - 1) * 0.08, 0);
      prepareMesh(clone);
      root.add(clone);
    });
    return root;
  }, [scene]);
  return <primitive object={group} position={[-0.88, TABLE_TOP, 0.12]} rotation={[0, 0.15, 0]} />;
}

function Desk({
  interactive,
  lang,
  onLeave,
  onSelect,
  onHover,
  onOpenAssistant,
  drag,
  reduce,
}: {
  interactive: boolean;
  lang: Lang;
  onLeave: () => void;
  onSelect: Props["onSelect"];
  onHover: Props["onHover"];
  onOpenAssistant: () => void;
  drag: { current: boolean };
  reduce: boolean;
}) {
  return (
    <group>
      <Prop url={MODEL.table} position={[0.02, 0, -0.18]} />
      <Monitor interactive={interactive} lang={lang} onLeave={onLeave} />
      {!interactive ? (
        <HitBox
          id="monitor"
          position={[SCREEN.x, SCREEN.y, SCREEN.z]}
          size={[0.5, 0.38, 0.08]}
          onPick={() => onSelect({ kind: "os" })}
          onHover={onHover}
          drag={drag}
        />
      ) : null}
      <Prop url={MODEL.laptop} position={[0.58, TABLE_TOP + 0.012, 0.02]} rotation={[0, -0.45, 0]} />
      <Prop url={MODEL.notebook} position={[0.18, TABLE_TOP, 0.22]} rotation={[0, 0.25, 0]} />
      <Prop url={MODEL.pen} position={[0.42, TABLE_TOP + 0.037, 0.24]} rotation={[0, 0.9, 0]} />
      <DeskBooks />
      <Cables />
      <DeskLamp />
      <Dust reduce={reduce} />

      <group position={[0.86, TABLE_TOP, 0.16]} rotation={[0, -0.4, 0]}>
        <RoundedBox args={[0.07, 0.012, 0.14]} radius={0.003} position={[0, 0.01, 0]} castShadow>
          <meshStandardMaterial color="#1a1816" roughness={0.45} metalness={0.2} />
        </RoundedBox>
        <RoundedBox args={[0.055, 0.018, 0.11]} radius={0.004} position={[0, 0.026, -0.01]} castShadow>
          <meshStandardMaterial color="#221e1a" roughness={0.4} />
        </RoundedBox>
        <mesh position={[0.03, 0.03, 0.02]} rotation={[0.5, 0, 0.4]} castShadow>
          <cylinderGeometry args={[0.006, 0.006, 0.07, 8]} />
          <meshStandardMaterial color="#2a2622" roughness={0.35} />
        </mesh>
      </group>
      <HitBox id="phone" position={[0.86, TABLE_TOP + 0.04, 0.16]} size={[0.18, 0.08, 0.22]} onPick={() => onSelect({ kind: "contact" })} onHover={onHover} drag={drag} />

      <group position={[-0.62, TABLE_TOP, 0.16]}>
        <mesh position={[0, 0.02, 0]}>
          <cylinderGeometry args={[0.028, 0.032, 0.012, 16]} />
          <meshStandardMaterial color="#8d7348" metalness={0.65} roughness={0.32} />
        </mesh>
        <mesh position={[0, 0.055, 0]}>
          <sphereGeometry args={[0.04, 24, 18]} />
          <meshStandardMaterial color="#e7c27a" emissive="#ffb703" emissiveIntensity={0.45} roughness={0.18} metalness={0.04} />
        </mesh>
      </group>
      <HitBox id="orb" position={[-0.62, TABLE_TOP + 0.06, 0.16]} size={[0.12, 0.12, 0.12]} onPick={onOpenAssistant} onHover={onHover} drag={drag} />
    </group>
  );
}

function Shelf({ onSelect, onHover, drag }: { onSelect: Props["onSelect"]; onHover: Props["onHover"]; drag: { current: boolean } }) {
  return (
    <group position={[1.12, 0, -1.88]}>
      <Prop url={MODEL.shelf} />
      <Prop url={MODEL.books} position={[-0.52, 0.36, -0.14]} />
      <Prop url={MODEL.books} position={[-0.36, 0.64, -0.14]} />
      <Prop url={MODEL.books} position={[-0.5, 0.93, -0.14]} />
      <HitBox id="shelf" position={[0, 1.05, 0.1]} size={[1.3, 2.05, 0.55]} onPick={() => onSelect({ kind: "skills" })} onHover={onHover} drag={drag} />
    </group>
  );
}

function WallFrames({ mats, onSelect, onHover, drag }: {
  mats: Maps;
  onSelect: Props["onSelect"];
  onHover: Props["onHover"];
  drag: { current: boolean };
}) {
  return (
    <group>
      {projects.map((project, index) => {
        const [x, y, z] = frameAt(index);
        return (
          <group key={project.id} position={[x, y, z]} rotation={[0, Math.PI / 2, 0]}>
            <RoundedBox args={[0.4, 0.52, 0.03]} radius={0.008} smoothness={2} castShadow>
              <meshStandardMaterial color="#3a2a1c" roughness={0.48} metalness={0.08} />
            </RoundedBox>
            <mesh position={[0, 0, 0.018]}>
              <planeGeometry args={[0.34, 0.44]} />
              <meshStandardMaterial map={mats.frames[project.id]} roughness={0.55} />
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
            drag={drag}
          />
        );
      })}
    </group>
  );
}

function RoomShell({ mats, city }: { mats: Maps; city: THREE.Texture }) {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow material={mats.planks}>
        <planeGeometry args={[5.2, 4.4]} />
      </mesh>
      <mesh position={[0, 2.7, 0]} rotation={[Math.PI / 2, 0, 0]} material={mats.wall}>
        <planeGeometry args={[5.2, 4.4]} />
      </mesh>
      <mesh position={[0, 1.35, -2.2]} receiveShadow material={mats.wall}>
        <planeGeometry args={[5.2, 2.7]} />
      </mesh>
      <mesh position={[-2.6, 1.35, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow material={mats.wall}>
        <planeGeometry args={[4.4, 2.7]} />
      </mesh>
      <mesh position={[2.6, 1.35, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow material={mats.wall}>
        <planeGeometry args={[4.4, 2.7]} />
      </mesh>
      <mesh position={[-1.35, 1.62, -2.175]}>
        <planeGeometry args={[1.58, 1.28]} />
        <meshStandardMaterial color="#16130f" roughness={0.8} />
      </mesh>
      <mesh position={[-1.35, 1.62, -2.16]}>
        <planeGeometry args={[1.42, 1.12]} />
        <meshStandardMaterial map={city} emissiveMap={city} emissive="#c5d4e6" emissiveIntensity={0.85} roughness={0.4} toneMapped={false} />
      </mesh>
      {[-1.9, -1.35, -0.8].map((x) => (
        <mesh key={x} position={[x, 1.62, -2.145]} castShadow>
          <boxGeometry args={[0.04, 1.12, 0.035]} />
          <meshStandardMaterial color="#3a3228" roughness={0.5} />
        </mesh>
      ))}
      {[-1.35].map((x) => (
        <mesh key={`rail-${x}`} position={[x, 1.62, -2.145]}>
          <boxGeometry args={[1.42, 0.04, 0.035]} />
          <meshStandardMaterial color="#3a3228" roughness={0.5} />
        </mesh>
      ))}
      <mesh rotation={[-Math.PI / 2, 0, 0.08]} position={[0.05, 0.012, 0.42]} receiveShadow material={mats.carpet}>
        <planeGeometry args={[2.2, 1.5]} />
      </mesh>
      <AccumulativeShadows temporal frames={48} alphaTest={0.65} scale={9} position={[0.1, 0.015, -0.15]} color="#140e0a" opacity={0.72} colorBlend={1.4}>
        <RandomizedLight amount={8} radius={3.2} ambient={0.45} intensity={1.1} position={[0.55, 2.3, -0.1]} bias={0.001} size={7} mapSize={1024} />
      </AccumulativeShadows>
    </group>
  );
}

function OfficeScene({
  lang,
  selection,
  onSelect,
  onHover,
  onOpenAssistant,
  drag,
}: Omit<Props, "onReady" | "onProgress"> & { drag: { current: boolean } }) {
  const mats = useMaps();
  const city = useMemo(() => cityLights(), []);
  const reduce = useMemo(() => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches, []);
  const interactive = selection.kind === "os";

  return (
    <>
      <Environment files="/textures/studio.hdr" environmentIntensity={0.18} />
      <hemisphereLight args={["#c5d4e4", "#3a2418", 0.18]} />
      <directionalLight position={[-2.6, 2.4, -1.2]} intensity={0.55} color="#9eb4cc" />
      <pointLight position={[-1.2, 1.5, -1.7]} color="#b7cbe0" intensity={3.2} distance={4.5} decay={2} />
      <pointLight position={[0.2, 0.55, -1.15]} color="#ffb07a" intensity={2.4} distance={3.2} decay={2} />
      <RoomShell mats={mats} city={city} />
      <Desk
        interactive={interactive}
        lang={lang}
        onLeave={() => onSelect({ kind: "room" })}
        onSelect={onSelect}
        onHover={onHover}
        onOpenAssistant={onOpenAssistant}
        drag={drag}
        reduce={reduce}
      />
      <Prop url={MODEL.chair} position={[0.02, 0, 0.78]} rotation={[0, Math.PI, 0]} />
      <Prop url={MODEL.plant} position={[-1.72, 0, -1.25]} rotation={[0, 0.6, 0]} />
      <Shelf onSelect={onSelect} onHover={onHover} drag={drag} />
      <WallFrames mats={mats} onSelect={onSelect} onHover={onHover} drag={drag} />
    </>
  );
}

function Grade({ intro, poseId }: { intro: { current: number }; poseId: string }) {
  const dof = useRef<DepthOfFieldEffect | null>(null);
  useFrame(() => {
    if (!dof.current) return;
    const t = intro.current;
    const introBlur = poseId === "room" ? Math.max(0, 1 - t) : 0;
    dof.current.bokehScale = introBlur * 1.7;
  });
  return (
    <EffectComposer multisampling={0} enableNormalPass={false}>
      <DepthOfField ref={dof} focusDistance={2.15} focalLength={0.9} bokehScale={1.4} />
      <SMAA />
      <Bloom intensity={0.32} luminanceThreshold={0.82} luminanceSmoothing={0.22} mipmapBlur />
      <Vignette eskil={false} offset={0.18} darkness={0.62} />
      <Noise opacity={0.018} />
    </EffectComposer>
  );
}

export default function OfficeCanvas({ lang, selection, onSelect, onHover, onOpenAssistant, onReady, onProgress }: Props) {
  const drag = useRef({ current: false });
  const intro = useRef({ current: 0 });
  const pose = poseFor(selection);

  return (
    <Canvas
      className="office-canvas"
      dpr={[1, 1.5]}
      shadows
      camera={{ position: INTRO.pos, fov: 32, near: 0.08, far: 24 }}
      gl={{ antialias: false, alpha: false, powerPreference: "high-performance", stencil: false }}
      onCreated={({ gl, scene }) => {
        gl.setClearColor("#070605");
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.02;
        gl.shadowMap.enabled = true;
        scene.environmentIntensity = 0.18;
        gl.domElement.style.cursor = "grab";
      }}
    >
      <LoadBridge onProgress={onProgress} onReady={onReady} />
      <CameraRig pose={pose} drag={drag.current} introOut={intro.current} />
      <Suspense fallback={null}>
        <OfficeScene
          lang={lang}
          selection={selection}
          onSelect={onSelect}
          onHover={onHover}
          onOpenAssistant={onOpenAssistant}
          drag={drag.current}
        />
      </Suspense>
      <Grade intro={intro.current} poseId={pose.id} />
    </Canvas>
  );
}

Object.values(MODEL).forEach((url) => {
  useGLTF.preload(url);
});
