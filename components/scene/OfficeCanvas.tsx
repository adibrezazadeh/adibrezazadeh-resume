"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, Environment, Html, RoundedBox, useProgress, useTexture } from "@react-three/drei";
import { Bloom, EffectComposer, Noise, SMAA, Vignette } from "@react-three/postprocessing";
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

const HOME: Pose = { id: "room", pos: [0.18, 1.26, 1.58], look: [-0.02, 1.02, -0.28] };
const INTRO: Pose = { id: "intro", pos: [0.72, 1.62, 2.48], look: [0.02, 0.98, -0.4] };

const SCREEN = {
  x: -0.06,
  y: 1.22,
  z: -0.15,
};

function frameAt(index: number): [number, number, number] {
  const col = index % 5;
  const row = Math.floor(index / 5);
  return [-2.3, row === 0 ? 1.58 : 0.98, -1.5 + col * 0.46];
}

function poseFor(selection: Selection): Pose {
  if (selection.kind === "os") return { id: "os", pos: [SCREEN.x, SCREEN.y, 0.86], look: [SCREEN.x, SCREEN.y, SCREEN.z] };
  if (selection.kind === "skills") return { id: "skills", pos: [0.85, 1.32, -0.15], look: [1.85, 1.2, -1.55] };
  if (selection.kind === "contact") return { id: "contact", pos: [0.22, 1.12, 0.72], look: [0.52, 0.84, 0.02] };
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

function CameraRig({ pose, drag }: { pose: Pose; drag: { current: boolean } }) {
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
  wood: THREE.MeshStandardMaterial;
  wall: THREE.MeshStandardMaterial;
  leather: THREE.MeshStandardMaterial;
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
    woodDiff: "/textures/wood_diff.jpg",
    woodNor: "/textures/wood_nor.jpg",
    woodRough: "/textures/wood_rough.jpg",
    wallDiff: "/textures/wall_diff.jpg",
    wallNor: "/textures/wall_nor.jpg",
    wallRough: "/textures/wall_rough.jpg",
    leatherDiff: "/textures/leather_diff.jpg",
    leatherNor: "/textures/leather_nor.jpg",
    leatherRough: "/textures/leather_rough.jpg",
    planksDiff: "/textures/planks_diff.jpg",
    planksNor: "/textures/planks_nor.jpg",
    planksRough: "/textures/planks_rough.jpg",
    carpetDiff: "/textures/carpet_diff.jpg",
    carpetNor: "/textures/carpet_nor.jpg",
    carpetRough: "/textures/carpet_rough.jpg",
  });
  const posters = useTexture(FRAME_IDS.map((id) => `/frames/${id}.jpg`));
  return useMemo(() => {
    prepare(tex.woodDiff, true);
    prepare(tex.wallDiff, true);
    prepare(tex.leatherDiff, true);
    prepare(tex.planksDiff, true);
    prepare(tex.carpetDiff, true);
    posters.forEach((poster) => {
      poster.colorSpace = THREE.SRGBColorSpace;
      poster.anisotropy = 8;
    });
    return {
      wood: material(tex.woodDiff, tex.woodNor, tex.woodRough, [1.4, 0.7], { roughness: 0.62 }),
      wall: material(tex.wallDiff, tex.wallNor, tex.wallRough, [2.2, 1.4], { color: "#8a8178", roughness: 0.92 }),
      leather: material(tex.leatherDiff, tex.leatherNor, tex.leatherRough, [1.2, 1.2], { color: "#4a3428", roughness: 0.72 }),
      planks: material(tex.planksDiff, tex.planksNor, tex.planksRough, [3.2, 2.6], { color: "#6a5040", roughness: 0.86 }),
      carpet: material(tex.carpetDiff, tex.carpetNor, tex.carpetRough, [1.6, 1.3], { color: "#5c3a32", roughness: 0.95 }),
      frames: Object.fromEntries(FRAME_IDS.map((id, index) => [id, posters[index]])),
    };
    // Textures are stable once useTexture resolves.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tex.woodDiff, tex.wallDiff, tex.leatherDiff, tex.planksDiff, tex.carpetDiff, posters]);
}

function leafMap() {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new THREE.CanvasTexture(canvas);
  ctx.clearRect(0, 0, 128, 256);
  ctx.fillStyle = "#1c4630";
  ctx.beginPath();
  ctx.ellipse(64, 150, 34, 96, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#2d6a46";
  ctx.beginPath();
  ctx.ellipse(64, 140, 18, 64, 0, 0, Math.PI * 2);
  ctx.fill();
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function Dust({ reduce }: { reduce: boolean }) {
  const ref = useRef<THREE.Points>(null);
  const count = 160;
  const positions = useMemo(() => {
    const data = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      data[i * 3] = (Math.random() - 0.5) * 0.7;
      data[i * 3 + 1] = Math.random() * 0.85;
      data[i * 3 + 2] = (Math.random() - 0.45) * 0.7;
    }
    return data;
  }, []);
  useFrame((_, dt) => {
    if (reduce || !ref.current) return;
    const attr = ref.current.geometry.getAttribute("position");
    const array = attr.array as Float32Array;
    for (let i = 0; i < count; i += 1) {
      array[i * 3 + 1] += dt * 0.035;
      array[i * 3] += Math.sin(array[i * 3 + 1] * 8) * dt * 0.01;
      if (array[i * 3 + 1] > 0.9) array[i * 3 + 1] = 0;
    }
    attr.needsUpdate = true;
  });
  return (
    <points ref={ref} position={[0.58, 1.15, -0.18]}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#ffd7a8" size={0.008} transparent opacity={0.55} depthWrite={false} sizeAttenuation />
    </points>
  );
}

function Steam({ reduce }: { reduce: boolean }) {
  const ref = useRef<THREE.Points>(null);
  const count = 18;
  const seeds = useMemo(() => Array.from({ length: count }, () => Math.random() * 10), []);
  const positions = useMemo(() => new Float32Array(count * 3), []);
  useFrame((state) => {
    if (!ref.current) return;
    const attr = ref.current.geometry.getAttribute("position");
    const array = attr.array as Float32Array;
    const t = state.clock.elapsedTime;
    for (let i = 0; i < count; i += 1) {
      const life = reduce ? 0.2 : (t * 0.25 + seeds[i]) % 1;
      array[i * 3] = Math.sin(t + seeds[i]) * 0.012 * life;
      array[i * 3 + 1] = life * 0.16;
      array[i * 3 + 2] = Math.cos(t * 0.8 + seeds[i]) * 0.01 * life;
    }
    attr.needsUpdate = true;
  });
  return (
    <points ref={ref} position={[-0.62, 0.86, 0.02]}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#f4efe8" size={0.018} transparent opacity={0.28} depthWrite={false} />
    </points>
  );
}

function LampLight() {
  const light = useRef<THREE.SpotLight>(null);
  const target = useRef<THREE.Object3D>(null);
  useEffect(() => {
    if (light.current && target.current) light.current.target = target.current;
  }, []);
  return (
    <>
      <object3D ref={target} position={[0.02, 0.78, -0.08]} />
      <spotLight
        ref={light}
        position={[0.62, 1.48, -0.22]}
        angle={0.78}
        penumbra={0.88}
        intensity={46}
        color="#ffb15a"
        distance={5.5}
        decay={2}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0006}
        shadow-normalBias={0.03}
      />
      <pointLight position={[0.58, 1.28, -0.16]} color="#ffc48a" intensity={6} distance={2.2} decay={2} />
      <directionalLight position={[-2.2, 2.1, -1.4]} intensity={0.45} color="#8ea4b8" />
    </>
  );
}

function Monitor({
  interactive,
  lang,
  onLeave,
}: {
  interactive: boolean;
  lang: Lang;
  onLeave: () => void;
}) {
  return (
    <group position={[-0.06, 0.775, -0.34]}>
      <RoundedBox args={[0.8, 0.64, 0.48]} radius={0.045} smoothness={4} position={[0, 0.46, -0.08]} castShadow>
        <meshStandardMaterial color="#161412" roughness={0.42} metalness={0.12} />
      </RoundedBox>
      <mesh position={[0, 0.48, 0.155]}>
        <planeGeometry args={[0.66, 0.5]} />
        <meshStandardMaterial color="#050505" roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.48, 0.162]}>
        <planeGeometry args={[0.58, 0.42]} />
        <meshStandardMaterial color="#ffd2a6" emissive="#ffb066" emissiveIntensity={0.55} toneMapped={false} />
      </mesh>
      <Html
        transform
        distanceFactor={0.258}
        position={[0, 0.48, 0.17]}
        zIndexRange={[20, 0]}
        style={{ pointerEvents: "none" }}
      >
        <div className="crt-screen" style={{ width: 900, height: 640, pointerEvents: interactive ? "auto" : "none" }}>
          <ShahrokhOS lang={lang} embedded onLeave={onLeave} />
          <div className="crt-scan" />
        </div>
      </Html>
      <mesh position={[0, 0.12, 0.02]} castShadow>
        <cylinderGeometry args={[0.045, 0.06, 0.22, 16]} />
        <meshStandardMaterial color="#2a2622" metalness={0.45} roughness={0.35} />
      </mesh>
      <RoundedBox args={[0.34, 0.035, 0.24]} radius={0.01} smoothness={2} position={[0, 0.02, 0.04]} castShadow>
        <meshStandardMaterial color="#1a1816" metalness={0.35} roughness={0.4} />
      </RoundedBox>
    </group>
  );
}

function DeskSet({ mats, interactive, lang, onLeave, onSelect, onHover, onOpenAssistant, drag, reduce }: {
  mats: Maps;
  interactive: boolean;
  lang: Lang;
  onLeave: () => void;
  onSelect: Props["onSelect"];
  onHover: Props["onHover"];
  onOpenAssistant: () => void;
  drag: { current: boolean };
  reduce: boolean;
}) {
  const shade = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!shade.current) return;
    const mat = shade.current.material;
    if (mat instanceof THREE.MeshStandardMaterial) {
      mat.emissiveIntensity = 1.15 + Math.sin(state.clock.elapsedTime * 2.4) * 0.06;
    }
  });

  const keys = useMemo(() => {
    const list: [number, number, number][] = [];
    for (let row = 0; row < 4; row += 1) {
      for (let col = 0; col < 12; col += 1) {
        list.push([-0.22 + col * 0.034, 0.8, -0.02 + row * 0.032]);
      }
    }
    return list;
  }, []);

  return (
    <group>
      <RoundedBox args={[1.78, 0.055, 0.88]} radius={0.012} smoothness={3} position={[0.04, 0.752, -0.1]} castShadow receiveShadow material={mats.wood} />
      {[
        [-0.74, -0.42],
        [0.78, -0.42],
        [-0.74, 0.22],
        [0.78, 0.22],
      ].map(([x, z]) => (
        <mesh key={`${x}${z}`} position={[x, 0.36, z]} castShadow material={mats.wood}>
          <cylinderGeometry args={[0.035, 0.04, 0.72, 12]} />
        </mesh>
      ))}

      <Monitor interactive={interactive} lang={lang} onLeave={onLeave} />
      {!interactive ? (
        <HitBox
          id="monitor"
          position={[SCREEN.x, SCREEN.y, SCREEN.z]}
          size={[0.72, 0.56, 0.12]}
          onPick={() => onSelect({ kind: "os" })}
          onHover={onHover}
          drag={drag}
        />
      ) : null}

      <group position={[-0.02, 0.79, -0.0]}>
        <RoundedBox args={[0.48, 0.018, 0.16]} radius={0.004} smoothness={2} receiveShadow>
          <meshStandardMaterial color="#1c1916" roughness={0.55} />
        </RoundedBox>
        {keys.map(([x, y, z]) => (
          <mesh key={`${x}${z}`} position={[x, y - 0.782, z]} castShadow>
            <boxGeometry args={[0.026, 0.012, 0.024]} />
            <meshStandardMaterial color="#2a2724" roughness={0.4} />
          </mesh>
        ))}
      </group>
      <mesh position={[0.42, 0.8, 0.02]} castShadow>
        <sphereGeometry args={[0.028, 16, 12]} />
        <meshStandardMaterial color="#1a1816" roughness={0.35} />
      </mesh>

      <group position={[-0.62, 0.78, 0.02]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.045, 0.038, 0.07, 24]} />
          <meshStandardMaterial color="#f3eee6" roughness={0.28} metalness={0.02} />
        </mesh>
        <mesh position={[0, 0.03, 0]}>
          <circleGeometry args={[0.038, 24]} />
          <meshStandardMaterial color="#3a2418" roughness={0.4} />
        </mesh>
        <mesh position={[0.05, 0.01, 0]} rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[0.028, 0.008, 8, 16, Math.PI]} />
          <meshStandardMaterial color="#f3eee6" roughness={0.28} />
        </mesh>
      </group>
      <Steam reduce={reduce} />

      <group position={[0.52, 0.78, 0.08]}>
        <RoundedBox args={[0.16, 0.028, 0.26]} radius={0.006} smoothness={2} castShadow>
          <meshStandardMaterial color="#1a1814" roughness={0.45} metalness={0.15} />
        </RoundedBox>
        <mesh position={[0, 0.04, -0.02]} castShadow>
          <boxGeometry args={[0.05, 0.035, 0.11]} />
          <meshStandardMaterial color="#24201c" roughness={0.4} />
        </mesh>
        <mesh position={[0.045, 0.045, 0.02]} rotation={[0.4, 0, 0.2]}>
          <cylinderGeometry args={[0.012, 0.012, 0.12, 8]} />
          <meshStandardMaterial color="#2c2824" roughness={0.35} />
        </mesh>
      </group>
      <HitBox
        id="phone"
        position={[0.52, 0.84, 0.08]}
        size={[0.28, 0.12, 0.36]}
        onPick={() => onSelect({ kind: "contact" })}
        onHover={onHover}
        drag={drag}
      />

      <group position={[0.62, 0, -0.28]}>
        <mesh position={[0, 0.8, 0]} castShadow>
          <cylinderGeometry args={[0.09, 0.11, 0.03, 20]} />
          <meshStandardMaterial color="#b08a4e" metalness={0.72} roughness={0.28} />
        </mesh>
        <mesh position={[0.02, 1.05, 0.02]} rotation={[0.15, 0, -0.2]} castShadow>
          <cylinderGeometry args={[0.012, 0.012, 0.42, 10]} />
          <meshStandardMaterial color="#c6a15b" metalness={0.7} roughness={0.26} />
        </mesh>
        <mesh ref={shade} position={[0.08, 1.28, 0.08]} rotation={[0.55, 0.2, 0.35]} castShadow>
          <coneGeometry args={[0.16, 0.16, 24, 1, true]} />
          <meshStandardMaterial color="#f0d7b0" emissive="#ff9a3c" emissiveIntensity={1.2} side={THREE.DoubleSide} roughness={0.45} metalness={0.15} />
        </mesh>
        <mesh position={[0.06, 1.22, 0.06]}>
          <sphereGeometry args={[0.028, 16, 12]} />
          <meshStandardMaterial color="#fff1d2" emissive="#ffd39a" emissiveIntensity={3} toneMapped={false} />
        </mesh>
      </group>
      <Dust reduce={reduce} />

      <group position={[-0.48, 0.8, -0.28]}>
        <mesh>
          <cylinderGeometry args={[0.045, 0.05, 0.02, 16]} />
          <meshStandardMaterial color="#8a7048" metalness={0.55} roughness={0.35} />
        </mesh>
        <mesh position={[0, 0.045, 0]}>
          <sphereGeometry args={[0.055, 20, 16]} />
          <meshStandardMaterial color="#e7c27a" emissive="#ffb703" emissiveIntensity={0.35} roughness={0.18} metalness={0.05} transparent opacity={0.92} />
        </mesh>
      </group>
      <HitBox
        id="orb"
        position={[-0.48, 0.86, -0.28]}
        size={[0.16, 0.16, 0.16]}
        onPick={onOpenAssistant}
        onHover={onHover}
        drag={drag}
      />
    </group>
  );
}

function Chair({ mats }: { mats: Maps }) {
  return (
    <group position={[0.02, 0, 0.62]} rotation={[0, 0.12, 0]}>
      <RoundedBox args={[0.48, 0.08, 0.48]} radius={0.03} smoothness={3} position={[0, 0.48, 0]} castShadow material={mats.leather} />
      <RoundedBox args={[0.48, 0.5, 0.08]} radius={0.03} smoothness={3} position={[0, 0.82, -0.2]} castShadow material={mats.leather} />
      {[
        [-0.18, -0.18],
        [0.18, -0.18],
        [-0.18, 0.18],
        [0.18, 0.18],
      ].map(([x, z]) => (
        <mesh key={`${x}${z}`} position={[x, 0.24, z]} castShadow>
          <cylinderGeometry args={[0.02, 0.02, 0.46, 8]} />
          <meshStandardMaterial color="#1c1916" metalness={0.4} roughness={0.4} />
        </mesh>
      ))}
    </group>
  );
}

function Plant({ leaf }: { leaf: THREE.Texture }) {
  return (
    <group position={[-1.55, 0, -1.55]}>
      <mesh position={[0, 0.16, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.1, 0.22, 16]} />
        <meshStandardMaterial color="#6d3b2a" roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.28, 0]}>
        <cylinderGeometry args={[0.14, 0.12, 0.05, 16]} />
        <meshStandardMaterial color="#5a321f" roughness={0.65} />
      </mesh>
      {Array.from({ length: 7 }, (_, index) => {
        const angle = (index / 7) * Math.PI * 2;
        return (
          <mesh key={angle} position={[Math.cos(angle) * 0.05, 0.55, Math.sin(angle) * 0.05]} rotation={[0.4, angle, 0.2]} castShadow>
            <planeGeometry args={[0.16, 0.36]} />
            <meshStandardMaterial map={leaf} transparent alphaTest={0.4} side={THREE.DoubleSide} roughness={0.7} />
          </mesh>
        );
      })}
    </group>
  );
}

function Bookcase({ mats, onSelect, onHover, drag }: {
  mats: Maps;
  onSelect: Props["onSelect"];
  onHover: Props["onHover"];
  drag: { current: boolean };
}) {
  const books = useMemo(() => {
    const colors = ["#6e2d2d", "#1d4a46", "#c4892a", "#243056", "#d8c7a4", "#5a3150", "#8a4b28", "#2f4d6a", "#3e2a22", "#7a1f2b"];
    const list: { y: number; z: number; h: number; w: number; color: string }[] = [];
    [0.42, 0.86, 1.3, 1.74].forEach((shelf, shelfIndex) => {
      let z = -1.95;
      let i = 0;
      while (z < -1.15) {
        const w = 0.045 + ((i * 3 + shelfIndex) % 4) * 0.008;
        const h = 0.26 + ((i + shelfIndex) % 5) * 0.018;
        list.push({ y: shelf + h / 2, z: z + w / 2, h, w, color: colors[(i + shelfIndex) % colors.length] });
        z += w + 0.006;
        i += 1;
      }
    });
    return list;
  }, []);

  return (
    <group>
      <mesh position={[2.22, 1.15, -1.55]} receiveShadow material={mats.wood}>
        <boxGeometry args={[0.34, 2.15, 1.15]} />
      </mesh>
      {[0.38, 0.82, 1.26, 1.7, 2.12].map((y) => (
        <mesh key={y} position={[2.08, y, -1.55]} receiveShadow material={mats.wood}>
          <boxGeometry args={[0.3, 0.025, 1.05]} />
        </mesh>
      ))}
      {books.map((book, index) => (
        <mesh key={index} position={[2.02, book.y, book.z]} castShadow>
          <boxGeometry args={[0.16, book.h, book.w]} />
          <meshStandardMaterial color={book.color} roughness={0.62} />
        </mesh>
      ))}
      <HitBox
        id="shelf"
        position={[2.05, 1.2, -1.55]}
        size={[0.5, 2.2, 1.2]}
        onPick={() => onSelect({ kind: "skills" })}
        onHover={onHover}
        drag={drag}
      />
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

function RoomShell({ mats }: { mats: Maps }) {
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
      <mesh position={[-1.15, 1.7, -2.18]}>
        <planeGeometry args={[1.15, 1.05]} />
        <meshStandardMaterial color="#0c1218" emissive="#1a2a3a" emissiveIntensity={0.35} roughness={0.2} />
      </mesh>
      {[-1.55, -1.15, -0.75].map((x) => (
        <mesh key={x} position={[x, 1.7, -2.16]}>
          <boxGeometry args={[0.03, 1.05, 0.02]} />
          <meshStandardMaterial color="#2a241c" roughness={0.6} />
        </mesh>
      ))}
      <mesh rotation={[-Math.PI / 2, 0, 0.1]} position={[0.05, 0.012, 0.35]} receiveShadow material={mats.carpet}>
        <planeGeometry args={[2.1, 1.45]} />
      </mesh>
      <ContactShadows position={[0.05, 0.011, -0.05]} opacity={0.45} scale={4.2} blur={2.4} far={1.6} color="#000" />
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
  const leaf = useMemo(() => leafMap(), []);
  const reduce = useMemo(() => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches, []);
  const interactive = selection.kind === "os";

  return (
    <>
      <Environment files="/textures/studio.hdr" environmentIntensity={0.16} />
      <hemisphereLight args={["#1c2430", "#2a1a12", 0.08]} />
      <LampLight />
      <RoomShell mats={mats} />
      <DeskSet
        mats={mats}
        interactive={interactive}
        lang={lang}
        onLeave={() => onSelect({ kind: "room" })}
        onSelect={onSelect}
        onHover={onHover}
        onOpenAssistant={onOpenAssistant}
        drag={drag}
        reduce={reduce}
      />
      <Chair mats={mats} />
      <Plant leaf={leaf} />
      <Bookcase mats={mats} onSelect={onSelect} onHover={onHover} drag={drag} />
      <WallFrames mats={mats} onSelect={onSelect} onHover={onHover} drag={drag} />
    </>
  );
}

export default function OfficeCanvas({ lang, selection, onSelect, onHover, onOpenAssistant, onReady, onProgress }: Props) {
  const drag = useRef({ current: false });
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
        gl.toneMappingExposure = 1.05;
        gl.shadowMap.enabled = true;
        scene.environmentIntensity = 0.16;
        gl.domElement.style.cursor = "grab";
      }}
    >
      <LoadBridge onProgress={onProgress} onReady={onReady} />
      <CameraRig pose={pose} drag={drag.current} />
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
      <EffectComposer multisampling={0} enableNormalPass={false}>
        <SMAA />
        <Bloom intensity={0.28} luminanceThreshold={0.86} luminanceSmoothing={0.2} mipmapBlur />
        <Vignette eskil={false} offset={0.22} darkness={0.68} />
        <Noise opacity={0.02} />
      </EffectComposer>
    </Canvas>
  );
}
