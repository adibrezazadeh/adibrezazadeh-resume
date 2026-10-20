"use client";

import { useFrame } from "@react-three/fiber";
import { RoundedBox, useTexture } from "@react-three/drei";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { desk } from "@/lib/desk-bus";

// Modern pieces modeled for this room. Poly Haven's CC0 library has almost no contemporary
// office furniture, so these are built from primitives with physically based materials.

type V3 = [number, number, number];

function damp(current: number, target: number, rate: number, dt: number) {
  return THREE.MathUtils.lerp(current, target, 1 - Math.exp(-rate * dt));
}

/** 0..1 typing activity, rises quickly on a keypress and settles over a second. */
function useTyping() {
  const level = useRef(0);
  useFrame((_, dt) => {
    const active = performance.now() - desk.lastAny < 450 ? 1 : 0;
    level.current = damp(level.current, active, active ? 12 : 1.4, dt);
  });
  return level;
}

const MAT = {
  black: () => new THREE.MeshStandardMaterial({ color: "#1c1d1f", roughness: 0.5, metalness: 0.55 }),
  graphite: () => new THREE.MeshStandardMaterial({ color: "#2a2c30", roughness: 0.85, metalness: 0.05 }),
  aluminium: () => new THREE.MeshStandardMaterial({ color: "#c9ccd1", roughness: 0.28, metalness: 0.9 }),
  ceramic: (color: string) => new THREE.MeshStandardMaterial({ color, roughness: 0.28, metalness: 0 }),
  felt: (color: string) => new THREE.MeshStandardMaterial({ color, roughness: 1 }),
};

/* ---------- Wood slat acoustic wall with a warm LED backlight ---------- */

export function SlatWall({ oak, from, to, height, z, glowAt, night }: {
  oak: THREE.MeshStandardMaterial;
  from: number;
  to: number;
  height: number;
  z: number;
  glowAt: V3;
  night: boolean;
}) {
  const pitch = 0.042;
  const slatW = 0.026;
  const count = Math.floor((to - from) / pitch);
  const slats = useRef<THREE.InstancedMesh>(null);
  const slatMat = useMemo(() => {
    const mat = oak.clone();
    if (mat.map) {
      mat.map = mat.map.clone();
      mat.map.rotation = 0;
      mat.map.repeat.set(0.08, 1.6);
      mat.map.needsUpdate = true;
    }
    return mat;
  }, [oak]);
  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    for (let i = 0; i < count; i += 1) {
      m.makeTranslation(from + pitch / 2 + i * pitch, height / 2, 0);
      slats.current?.setMatrixAt(i, m);
    }
    if (slats.current) slats.current.instanceMatrix.needsUpdate = true;
  }, [count, from, height]);

  const glowTex = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 256;
    const ctx = c.getContext("2d")!;
    const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.35, "rgba(255,255,255,0.45)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 256);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, []);
  const glow = useRef<THREE.MeshBasicMaterial>(null);
  const typing = useTyping();
  const color = night ? "#ffb070" : "#ffd9b0";
  useFrame((state) => {
    const breathe = 0.85 + 0.15 * Math.sin(state.clock.elapsedTime * 0.7);
    const k = desk.screen * (breathe + typing.current * 0.5);
    if (glow.current) glow.current.opacity = (night ? 0.75 : 0.4) * k;
  });

  return (
    <group position={[0, 0, z]}>
      <mesh position={[(from + to) / 2, height / 2, -0.012]} receiveShadow>
        <planeGeometry args={[to - from, height]} />
        <meshStandardMaterial color="#1b1a19" roughness={1} />
      </mesh>
      <mesh position={[glowAt[0], glowAt[1], -0.008]}>
        <planeGeometry args={[1.9, 1.15]} />
        <meshBasicMaterial ref={glow} map={glowTex} color={color} transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
      </mesh>
      <instancedMesh ref={slats} args={[undefined, slatMat, count]} castShadow receiveShadow>
        <boxGeometry args={[slatW, height, 0.022]} />
      </instancedMesh>
    </group>
  );
}

/* ---------- Neon "</>" that flickers on ---------- */

export function NeonSign({ position, started }: { position: V3; started: boolean }) {
  const geometry = useMemo(() => {
    const strokes: V3[][] = [
      [[-0.17, 0.09, 0], [-0.27, 0, 0], [-0.17, -0.09, 0]],
      [[0.05, 0.12, 0], [-0.05, -0.12, 0]],
      [[0.17, 0.09, 0], [0.27, 0, 0], [0.17, -0.09, 0]],
    ];
    return strokes.map((points) => {
      const path = new THREE.CurvePath<THREE.Vector3>();
      for (let i = 0; i < points.length - 1; i += 1) path.add(new THREE.LineCurve3(new THREE.Vector3(...points[i]), new THREE.Vector3(...points[i + 1])));
      return new THREE.TubeGeometry(path, 24, 0.0075, 10, false);
    });
  }, []);
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#fff1dc", emissive: "#ffc98a", emissiveIntensity: 0.1, toneMapped: false }), []);
  const at = useRef<number | null>(null);
  useFrame((state) => {
    const now = state.clock.elapsedTime;
    if (!started) {
      at.current = null;
    } else if (at.current === null) {
      at.current = now;
    }
    const t = at.current === null ? -1 : now - at.current - 1.1;
    // Neon tubes stutter before they catch.
    const on = t < 0 ? 0 : t < 0.08 ? 1 : t < 0.2 ? 0.1 : t < 0.26 ? 0.9 : t < 0.4 ? 0.2 : Math.min(1, 0.5 + (t - 0.4) * 2);
    mat.emissiveIntensity = 0.1 + on * 3.2;
  });
  return (
    <group position={position}>
      {geometry.map((geo, i) => (
        <mesh key={i} geometry={geo} material={mat} />
      ))}
    </group>
  );
}

/* ---------- Monitor light bar: the desk's task light ---------- */

export function LightBar({ position, lamp }: { position: V3; lamp: { current: number } }) {
  const strip = useRef<THREE.MeshBasicMaterial>(null);
  const spot = useRef<THREE.SpotLight>(null);
  const target = useRef<THREE.Object3D>(null);
  const body = useMemo(() => MAT.black(), []);
  useEffect(() => {
    if (spot.current && target.current) spot.current.target = target.current;
  }, []);
  useFrame(() => {
    const p = lamp.current;
    if (strip.current) strip.current.color.setScalar(0.25 + p * 2.4);
    if (spot.current) spot.current.intensity = 9 * p;
  });
  return (
    <group position={position}>
      {/* Counterweight clip over the monitor's top edge */}
      <mesh position={[0, 0.012, -0.012]} material={body} castShadow>
        <boxGeometry args={[0.05, 0.03, 0.034]} />
      </mesh>
      <mesh position={[0, 0.032, 0.02]} rotation={[0, 0, Math.PI / 2]} material={body} castShadow>
        <cylinderGeometry args={[0.011, 0.011, 0.46, 24]} />
      </mesh>
      <mesh position={[0, 0.021, 0.024]} rotation={[-Math.PI / 2 - 0.35, 0, 0]}>
        <planeGeometry args={[0.43, 0.008]} />
        <meshBasicMaterial ref={strip} color="#fff4e6" toneMapped={false} />
      </mesh>
      <object3D ref={target} position={[0, -0.6, 0.55]} />
      <spotLight
        ref={spot}
        position={[0, 0.02, 0.03]}
        angle={0.95}
        penumbra={0.9}
        intensity={0}
        color="#fff1df"
        distance={2.2}
        decay={2}
      />
    </group>
  );
}

/* ---------- Ergonomic mesh chair ---------- */

function meshTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, 64, 64);
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 5;
  for (let i = 0; i <= 64; i += 8) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, 64);
    ctx.moveTo(0, i);
    ctx.lineTo(64, i);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(14, 14);
  return tex;
}

export function ErgoChair({ position, rotation = 0 }: { position: V3; rotation?: number }) {
  const mats = useMemo(() => {
    const frame = MAT.black();
    const fabric = new THREE.MeshStandardMaterial({ color: "#26282c", roughness: 0.95 });
    const mesh = new THREE.MeshStandardMaterial({
      color: "#25272b",
      roughness: 0.9,
      alphaMap: meshTexture(),
      alphaTest: 0.35,
      side: THREE.DoubleSide,
    });
    const chrome = MAT.aluminium();
    return { frame, fabric, mesh, chrome };
  }, []);
  // The back is a mesh panel cut to the frame's outline and bowed to fit a spine.
  const outlinePts = useMemo(
    () => [
      new THREE.Vector2(-0.22, 0),
      new THREE.Vector2(-0.235, 0.26),
      new THREE.Vector2(-0.21, 0.48),
      new THREE.Vector2(-0.12, 0.55),
      new THREE.Vector2(0, 0.56),
      new THREE.Vector2(0.12, 0.55),
      new THREE.Vector2(0.21, 0.48),
      new THREE.Vector2(0.235, 0.26),
      new THREE.Vector2(0.22, 0),
      new THREE.Vector2(0, -0.02),
    ],
    [],
  );
  const bow = (x: number) => -0.12 * (x / 0.24) ** 2;
  const back = useMemo(() => {
    const curve = new THREE.SplineCurve([...outlinePts, outlinePts[0]]);
    const geo = new THREE.ShapeGeometry(new THREE.Shape(curve.getPoints(80)), 12);
    const pos = geo.getAttribute("position");
    for (let i = 0; i < pos.count; i += 1) pos.setZ(i, bow(pos.getX(i)));
    geo.computeVertexNormals();
    const uv = geo.getAttribute("uv");
    for (let i = 0; i < uv.count; i += 1) uv.setXY(i, pos.getX(i) * 2, pos.getY(i) * 2);
    return geo;
  }, [outlinePts]);
  const outline = useMemo(() => {
    const pts = outlinePts.map((p) => new THREE.Vector3(p.x, p.y, bow(p.x)));
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true, "centripetal"), 90, 0.012, 10, true);
  }, [outlinePts]);
  const legs = [0, 1, 2, 3, 4].map((i) => (i / 5) * Math.PI * 2);

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Five-star base on casters */}
      {legs.map((a) => (
        <group key={a} rotation={[0, a, 0]}>
          <mesh position={[0, 0.075, 0.16]} rotation={[0.08, 0, 0]} material={mats.chrome} castShadow>
            <boxGeometry args={[0.045, 0.028, 0.32]} />
          </mesh>
          <mesh position={[0, 0.028, 0.31]} rotation={[0, 0, Math.PI / 2]} material={mats.frame} castShadow>
            <cylinderGeometry args={[0.026, 0.026, 0.03, 18]} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 0.09, 0]} material={mats.chrome} castShadow>
        <cylinderGeometry args={[0.05, 0.06, 0.05, 24]} />
      </mesh>
      <mesh position={[0, 0.22, 0]} material={mats.frame} castShadow>
        <cylinderGeometry args={[0.032, 0.032, 0.24, 20]} />
      </mesh>
      <mesh position={[0, 0.37, 0]} material={mats.chrome}>
        <cylinderGeometry args={[0.022, 0.022, 0.08, 16]} />
      </mesh>
      {/* Seat */}
      <mesh position={[0, 0.41, 0]} material={mats.frame} castShadow>
        <boxGeometry args={[0.32, 0.025, 0.3]} />
      </mesh>
      <RoundedBox args={[0.5, 0.075, 0.48]} radius={0.03} smoothness={4} position={[0, 0.46, -0.01]} material={mats.fabric} castShadow receiveShadow />
      {/* Armrests */}
      {[-1, 1].map((side) => (
        <group key={side} position={[side * 0.27, 0, 0.02]}>
          <mesh position={[0, 0.54, 0.02]} material={mats.frame} castShadow>
            <boxGeometry args={[0.03, 0.2, 0.05]} />
          </mesh>
          <RoundedBox args={[0.07, 0.03, 0.24]} radius={0.012} smoothness={3} position={[0, 0.655, -0.03]} material={mats.fabric} castShadow />
        </group>
      ))}
      {/* Spine and mesh back */}
      <mesh position={[0, 0.5, 0.25]} rotation={[0.35, 0, 0]} material={mats.frame} castShadow>
        <boxGeometry args={[0.06, 0.2, 0.025]} />
      </mesh>
      <group position={[0, 0.56, 0.27]} rotation={[-0.16, 0, 0]}>
        <mesh geometry={outline} material={mats.frame} castShadow />
        <mesh geometry={back} material={mats.mesh} />
        <RoundedBox args={[0.3, 0.05, 0.03]} radius={0.012} smoothness={3} position={[0, 0.16, -0.01]} material={mats.fabric} />
      </group>
    </group>
  );
}

/* ---------- Desk accessories ---------- */

export function Headphones({ position, rotation = 0 }: { position: V3; rotation?: number }) {
  const mats = useMemo(() => ({ stand: MAT.aluminium(), dark: MAT.graphite(), pad: MAT.felt("#d8d0c4"), band: MAT.black() }), []);
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0, 0.006, 0]} material={mats.stand} castShadow receiveShadow>
        <cylinderGeometry args={[0.055, 0.06, 0.012, 32]} />
      </mesh>
      <mesh position={[0, 0.13, 0]} material={mats.stand} castShadow>
        <cylinderGeometry args={[0.007, 0.007, 0.25, 16]} />
      </mesh>
      <mesh position={[0, 0.255, 0]} rotation={[Math.PI / 2, 0, 0]} material={mats.stand} castShadow>
        <cylinderGeometry args={[0.012, 0.012, 0.06, 16]} />
      </mesh>
      <group position={[0, 0.17, 0]}>
        <mesh rotation={[0, 0, 0]} material={mats.band} castShadow>
          <torusGeometry args={[0.09, 0.011, 12, 48, Math.PI]} />
        </mesh>
        <mesh position={[0, 0.0, 0]} rotation={[0, 0, 0]} material={mats.pad}>
          <torusGeometry args={[0.083, 0.008, 10, 40, Math.PI]} />
        </mesh>
        {[-1, 1].map((side) => (
          <group key={side} position={[side * 0.092, -0.02, 0]}>
            <mesh rotation={[0, 0, Math.PI / 2]} material={mats.dark} castShadow>
              <cylinderGeometry args={[0.045, 0.048, 0.034, 32]} />
            </mesh>
            <mesh position={[-side * 0.019, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={mats.pad}>
              <cylinderGeometry args={[0.04, 0.04, 0.008, 28]} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}

export function Mug({ position, rotation = 0, color = "#efe9df" }: { position: V3; rotation?: number; color?: string }) {
  const mat = useMemo(() => MAT.ceramic(color), [color]);
  const body = useMemo(() => {
    const pts = [
      new THREE.Vector2(0, 0),
      new THREE.Vector2(0.034, 0),
      new THREE.Vector2(0.037, 0.004),
      new THREE.Vector2(0.038, 0.09),
      new THREE.Vector2(0.034, 0.09),
      new THREE.Vector2(0.033, 0.01),
      new THREE.Vector2(0, 0.01),
    ];
    return new THREE.LatheGeometry(pts, 40);
  }, []);
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh geometry={body} material={mat} castShadow receiveShadow />
      <mesh position={[0.04, 0.047, 0]} material={mat} castShadow>
        <torusGeometry args={[0.022, 0.0055, 12, 24, Math.PI * 1.25]} />
      </mesh>
      <mesh position={[0, 0.075, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.033, 32]} />
        <meshStandardMaterial color="#3a2516" roughness={0.15} />
      </mesh>
    </group>
  );
}

export function Notebook({ position, rotation = 0 }: { position: V3; rotation?: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <RoundedBox args={[0.15, 0.016, 0.21]} radius={0.004} smoothness={3} position={[0, 0.008, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#2c3a33" roughness={0.75} />
      </RoundedBox>
      <mesh position={[0.06, 0.0165, 0]}>
        <boxGeometry args={[0.006, 0.002, 0.212]} />
        <meshStandardMaterial color="#c58b5a" roughness={0.6} />
      </mesh>
      <mesh position={[-0.02, 0.02, 0.02]} rotation={[0, 0.5, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.0045, 0.0045, 0.14, 16]} />
        <meshStandardMaterial color="#d6d9de" metalness={0.85} roughness={0.25} />
      </mesh>
    </group>
  );
}

export function DeskMat({ position, size }: { position: V3; size: [number, number] }) {
  return (
    <RoundedBox args={[size[0], 0.004, size[1]]} radius={0.002} smoothness={2} position={position} receiveShadow>
      <meshStandardMaterial color="#4a4744" roughness={1} />
    </RoundedBox>
  );
}

/* ---------- Books, shelves, sideboard ---------- */

const BOOK_COLORS = ["#9aa98f", "#c47a5a", "#ece4d4", "#2f3033", "#34445c", "#d2a24c", "#b9b2a6", "#6d7f8d"];

export function Books({ position, count, rotation = 0, seed = 1, lying = false }: { position: V3; count: number; rotation?: number; seed?: number; lying?: boolean }) {
  const books = useMemo(() => {
    let s = seed * 9301;
    const rand = () => {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    };
    let x = 0;
    return Array.from({ length: count }, (_, i) => {
      const t = 0.022 + rand() * 0.02;
      const h = lying ? 0.16 + rand() * 0.05 : 0.18 + rand() * 0.07;
      const d = 0.13 + rand() * 0.04;
      const book = { x: x + t / 2, t, h, d, color: BOOK_COLORS[(i * 3 + seed) % BOOK_COLORS.length], lean: !lying && i === count - 1 ? 0.18 : 0 };
      x += t + 0.002;
      return book;
    });
  }, [count, seed, lying]);
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {books.map((b, i) =>
        lying ? (
          <RoundedBox key={i} args={[b.h, b.t, b.d]} radius={0.003} smoothness={2} position={[0, b.x, 0]} rotation={[0, (i % 2) * 0.08, 0]} castShadow receiveShadow>
            <meshStandardMaterial color={b.color} roughness={0.7} />
          </RoundedBox>
        ) : (
          <RoundedBox key={i} args={[b.t, b.h, b.d]} radius={0.003} smoothness={2} position={[b.x + b.lean * 0.1, b.h / 2, 0]} rotation={[0, 0, -b.lean]} castShadow receiveShadow>
            <meshStandardMaterial color={b.color} roughness={0.7} />
          </RoundedBox>
        ),
      )}
    </group>
  );
}

export function FloatingShelf({ oak, position, width, depth = 0.24 }: { oak: THREE.MeshStandardMaterial; position: V3; width: number; depth?: number }) {
  return <RoundedBox args={[width, 0.035, depth]} radius={0.005} smoothness={2} position={position} material={oak} castShadow receiveShadow />;
}

export function Sideboard({ oak, position, width, height = 0.58, depth = 0.44 }: { oak: THREE.MeshStandardMaterial; position: V3; width: number; height?: number; depth?: number }) {
  const legs = useMemo(() => MAT.black(), []);
  const fluteCount = Math.floor((width - 0.04) / 0.026);
  const flutes = useRef<THREE.InstancedMesh>(null);
  const body = height - 0.12;
  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    const start = -width / 2 + 0.02 + 0.013;
    for (let i = 0; i < fluteCount; i += 1) {
      m.makeTranslation(start + i * 0.026, 0, 0);
      flutes.current?.setMatrixAt(i, m);
    }
    if (flutes.current) flutes.current.instanceMatrix.needsUpdate = true;
  }, [fluteCount, width]);
  return (
    <group position={position}>
      <RoundedBox args={[width, body, depth]} radius={0.01} smoothness={3} position={[0, 0.12 + body / 2, 0]} material={oak} castShadow receiveShadow />
      <group position={[0, 0.12 + body / 2, depth / 2]}>
        <instancedMesh ref={flutes} args={[undefined, oak, fluteCount]} castShadow>
          <cylinderGeometry args={[0.012, 0.012, body - 0.05, 12, 1, false, -Math.PI / 2, Math.PI]} />
        </instancedMesh>
      </group>
      <mesh position={[0, 0.12 + body / 2, depth / 2 + 0.013]}>
        <boxGeometry args={[0.004, body - 0.05, 0.004]} />
        <meshStandardMaterial color="#1b1a19" />
      </mesh>
      {[-1, 1].map((sx) =>
        [-1, 1].map((sz) => (
          <mesh key={`${sx}${sz}`} position={[sx * (width / 2 - 0.06), 0.06, sz * (depth / 2 - 0.06)]} material={legs} castShadow>
            <cylinderGeometry args={[0.012, 0.009, 0.12, 12]} />
          </mesh>
        )),
      )}
    </group>
  );
}

export function SmartSpeaker({ position }: { position: V3 }) {
  const ring = useRef<THREE.MeshBasicMaterial>(null);
  const typing = useTyping();
  useFrame((state) => {
    if (!ring.current) return;
    const idle = 0.25 + 0.15 * Math.sin(state.clock.elapsedTime * 1.2);
    ring.current.color.setRGB(0.35 + typing.current * 0.6, 0.75 + typing.current * 0.4, 1.2 + typing.current * 0.8).multiplyScalar(desk.screen * (idle + typing.current));
  });
  return (
    <group position={position}>
      <mesh position={[0, 0.075, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.055, 0.055, 0.15, 40]} />
        <meshStandardMaterial color="#cfccc6" roughness={1} />
      </mesh>
      <mesh position={[0, 0.151, 0]}>
        <cylinderGeometry args={[0.052, 0.052, 0.003, 40]} />
        <meshStandardMaterial color="#2a2b2e" roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.153, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.038, 0.044, 48]} />
        <meshBasicMaterial ref={ring} color="#000" toneMapped={false} />
      </mesh>
    </group>
  );
}

/** A small standing oak frame with the owner's portrait. */
export function PhotoFrame({ url, oak, position, rotation = 0 }: { url: string; oak: THREE.MeshStandardMaterial; position: V3; rotation?: number }) {
  const photo = useTexture(url);
  useMemo(() => {
    photo.colorSpace = THREE.SRGBColorSpace;
    photo.anisotropy = 8;
  }, [photo]);
  const s = 0.15;
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <group position={[0, s / 2 + 0.012, 0]} rotation={[-0.12, 0, 0]}>
        <RoundedBox args={[s + 0.024, s + 0.024, 0.014]} radius={0.003} smoothness={2} material={oak} castShadow />
        <mesh position={[0, 0, 0.0075]}>
          <planeGeometry args={[s + 0.006, s + 0.006]} />
          <meshStandardMaterial color="#fbf8f2" roughness={0.9} />
        </mesh>
        <mesh position={[0, 0, 0.008]}>
          <planeGeometry args={[s - 0.012, s - 0.012]} />
          <meshStandardMaterial map={photo} roughness={0.45} />
        </mesh>
      </group>
      <mesh position={[0, 0.05, -0.04]} rotation={[0.45, 0, 0]} material={oak}>
        <boxGeometry args={[0.03, 0.11, 0.006]} />
      </mesh>
    </group>
  );
}

export function Vase({ position, color = "#e9e3d9", scale = 1 }: { position: V3; color?: string; scale?: number }) {
  const mat = useMemo(() => MAT.ceramic(color), [color]);
  const geo = useMemo(() => {
    const pts = [0, 0.04, 0.06, 0.065, 0.055, 0.03, 0.022, 0.026].map((r, i) => new THREE.Vector2(r, i * 0.03));
    return new THREE.LatheGeometry(pts, 40);
  }, []);
  return <mesh geometry={geo} material={mat} position={position} scale={scale} castShadow receiveShadow />;
}

export function Stem({ position }: { position: V3 }) {
  // A dried pampas stem: a thin stalk with a soft plume.
  const plume = useMemo(() => new THREE.MeshStandardMaterial({ color: "#e8dcc6", roughness: 1, transparent: true, opacity: 0.92 }), []);
  return (
    <group position={position}>
      <mesh position={[0, 0.17, 0]} rotation={[0, 0, 0.06]}>
        <cylinderGeometry args={[0.0025, 0.003, 0.34, 6]} />
        <meshStandardMaterial color="#b9a888" roughness={1} />
      </mesh>
      <mesh position={[0.012, 0.4, 0]} scale={[0.7, 1.8, 0.7]} material={plume} castShadow>
        <sphereGeometry args={[0.04, 16, 12]} />
      </mesh>
    </group>
  );
}
