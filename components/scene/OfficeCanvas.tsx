"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { projects } from "@/lib/profile";
import type { Selection } from "@/lib/types";

type Pose = { id: string; pos: [number, number, number]; look: [number, number, number] };

type Props = {
  selection: Selection;
  onSelect: (selection: Selection) => void;
  onHover: (id: string | null) => void;
  onOpenAssistant: () => void;
  onReady: () => void;
};

const ROOM_POSE: Pose = { id: "room", pos: [0.28, 1.62, 3.42], look: [0.02, 1.18, -0.85] };

function frameAt(index: number): [number, number, number] {
  const col = index % 5;
  const row = Math.floor(index / 5);
  return [-5.64, row === 0 ? 1.96 : 1.16, -3.2 + col * 1.15];
}

function poseFor(selection: Selection): Pose {
  if (selection.kind === "os") return { id: "os", pos: [0.02, 1.3, 0.18], look: [0.02, 1.28, -1.24] };
  if (selection.kind === "skills") return { id: "skills", pos: [3.05, 1.5, -1.2], look: [5.5, 1.42, -1.5] };
  if (selection.kind === "contact") return { id: "contact", pos: [0.72, 1.38, 0.78], look: [1.16, 0.9, -0.4] };
  if (selection.kind === "project") {
    const index = Math.max(0, projects.findIndex((project) => project.id === selection.id));
    const frame = frameAt(index);
    return { id: selection.id, pos: [frame[0] + 1.9, frame[1], frame[2]], look: frame };
  }
  return ROOM_POSE;
}

const BOOK_COLORS = ["#8d2f2f", "#1e6d68", "#e6a21a", "#243056", "#f4ecdc", "#6b3a5d", "#c4622d", "#355c7d"];

const BOOKS = (() => {
  const shelves = [0.4, 0.84, 1.28, 1.72, 2.16];
  const list: { x: number; y: number; z: number; w: number; h: number; d: number; color: string }[] = [];
  shelves.forEach((top, shelf) => {
    let z = -2.5;
    let i = 0;
    while (z < -0.62) {
      const w = 0.075 + ((i * 5 + shelf) % 4) * 0.012;
      const h = 0.28 + ((i + shelf * 2) % 5) * 0.03;
      list.push({
        x: 5.4,
        y: top + h / 2,
        z: z + w / 2,
        w,
        h,
        d: 0.24,
        color: BOOK_COLORS[(i + shelf) % BOOK_COLORS.length],
      });
      z += w + 0.01;
      i += 1;
    }
  });
  return list;
})();

function useCanvasTexture(draw: (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => void, key: string) {
  return useMemo(() => {
    const canvas = document.createElement("canvas");
    draw(canvas.getContext("2d")!, canvas);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 4;
    texture.needsUpdate = true;
    return texture;
    // The draw callback is stable per texture kind.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
}

function WoodFloor() {
  const texture = useCanvasTexture((ctx, canvas) => {
    canvas.width = 256;
    canvas.height = 256;
    ctx.fillStyle = "#6b4428";
    ctx.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 8; i += 1) {
      ctx.fillStyle = i % 2 === 0 ? "#73492c" : "#5a381f";
      ctx.fillRect(0, i * 32, 256, 31);
      ctx.strokeStyle = "rgba(30,16,8,0.35)";
      ctx.beginPath();
      ctx.moveTo(20 + ((i * 47) % 180), i * 32 + 8);
      ctx.lineTo(80 + ((i * 47) % 140), i * 32 + 22);
      ctx.stroke();
    }
  }, "wood");

  useEffect(() => {
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(3, 4);
  }, [texture]);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
      <planeGeometry args={[12.4, 10.2]} />
      <meshStandardMaterial map={texture} roughness={0.86} metalness={0.02} />
    </mesh>
  );
}

function Rug() {
  const texture = useCanvasTexture((ctx, canvas) => {
    canvas.width = 256;
    canvas.height = 256;
    ctx.fillStyle = "#6e2e2a";
    ctx.fillRect(0, 0, 256, 256);
    ctx.strokeStyle = "#e6a21a";
    ctx.lineWidth = 10;
    ctx.strokeRect(16, 16, 224, 224);
    ctx.strokeStyle = "#1e6d68";
    ctx.lineWidth = 4;
    ctx.strokeRect(32, 32, 192, 192);
    ctx.fillStyle = "#e6a21a";
    ctx.beginPath();
    ctx.moveTo(128, 58);
    ctx.lineTo(198, 128);
    ctx.lineTo(128, 198);
    ctx.lineTo(58, 128);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#1e6d68";
    ctx.fillRect(112, 112, 32, 32);
  }, "rug");

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.15, 0.012, -0.15]}>
      <planeGeometry args={[3.1, 2.5]} />
      <meshStandardMaterial map={texture} roughness={0.95} />
    </mesh>
  );
}

function DuskWindow() {
  return (
    <mesh position={[-1.15, 1.78, -4.9]}>
      <planeGeometry args={[2.55, 1.5]} />
      <shaderMaterial
        vertexShader={`
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          varying vec2 vUv;
          void main() {
            vec3 top = vec3(0.08, 0.12, 0.26);
            vec3 mid = vec3(0.75, 0.34, 0.2);
            vec3 bot = vec3(0.95, 0.66, 0.34);
            vec3 col = mix(bot, mid, smoothstep(0.0, 0.5, vUv.y));
            col = mix(col, top, smoothstep(0.4, 1.0, vUv.y));
            float skyline = 0.2 + 0.07 * sin(vUv.x * 30.0) + 0.045 * sin(vUv.x * 12.0 + 1.4);
            float building = step(vUv.y, skyline);
            col = mix(col, vec3(0.045, 0.03, 0.025), building);
            float wx = step(0.55, fract(vUv.x * 16.0));
            float wy = step(0.45, fract(vUv.y * 18.0));
            col = mix(col, vec3(1.0, 0.8, 0.45), wx * wy * building * step(0.06, vUv.y));
            gl_FragColor = vec4(col, 1.0);
          }
        `}
      />
    </mesh>
  );
}

function Books() {
  const ref = useRef<THREE.InstancedMesh>(null);
  useEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const dummy = new THREE.Object3D();
    const color = new THREE.Color();
    BOOKS.forEach((book, index) => {
      dummy.position.set(book.x, book.y, book.z);
      dummy.scale.set(book.d, book.h, book.w);
      dummy.updateMatrix();
      mesh.setMatrixAt(index, dummy.matrix);
      mesh.setColorAt(index, color.set(book.color));
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, []);

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, BOOKS.length]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial roughness={0.72} vertexColors />
    </instancedMesh>
  );
}

function CameraRig({ pose, drag }: { pose: Pose; drag: { current: boolean } }) {
  const { camera, gl } = useThree();
  const currentPos = useRef(new THREE.Vector3(...ROOM_POSE.pos));
  const currentLook = useRef(new THREE.Vector3(...ROOM_POSE.look));
  const targetPos = useRef(new THREE.Vector3());
  const targetLook = useRef(new THREE.Vector3());
  const yaw = useRef(0);
  const pitch = useRef(0);
  const reduce = useRef(false);

  useEffect(() => {
    reduce.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
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
      if (!down) return;
      const dx = event.clientX - lastX;
      const dy = event.clientY - lastY;
      if (Math.abs(dx) + Math.abs(dy) > 4) drag.current = true;
      lastX = event.clientX;
      lastY = event.clientY;
      if (pose.id !== "room") return;
      yaw.current = THREE.MathUtils.clamp(yaw.current - dx * 0.0022, -0.42, 0.42);
      pitch.current = THREE.MathUtils.clamp(pitch.current + dy * 0.0015, -0.2, 0.18);
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

  useFrame((state, dt) => {
    const sway = pose.id === "room" ? Math.sin(state.clock.elapsedTime * 0.28) * 0.045 : 0;
    targetPos.current.set(pose.pos[0], pose.pos[1], pose.pos[2]);
    targetLook.current.set(
      pose.look[0] + (pose.id === "room" ? yaw.current + sway : 0),
      pose.look[1] + (pose.id === "room" ? pitch.current : 0),
      pose.look[2],
    );
    const k = reduce.current ? 1 : 1 - Math.exp(-3.1 * dt);
    currentPos.current.lerp(targetPos.current, k);
    currentLook.current.lerp(targetLook.current, k);
    camera.position.copy(currentPos.current);
    camera.lookAt(currentLook.current);
  });

  return null;
}

function HitBox({
  id,
  position,
  size,
  rotation,
  onPick,
  onHover,
  drag,
}: {
  id: string;
  position: [number, number, number];
  size: [number, number, number];
  rotation?: [number, number, number];
  onPick: () => void;
  onHover: (id: string | null) => void;
  drag: { current: boolean };
}) {
  const { gl } = useThree();
  return (
    <mesh
      position={position}
      rotation={rotation}
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

function Office({
  onSelect,
  onHover,
  onOpenAssistant,
  drag,
}: Omit<Props, "selection" | "onReady"> & { drag: { current: boolean } }) {
  const screen = useCanvasTexture((ctx, canvas) => {
    canvas.width = 640;
    canvas.height = 400;
    ctx.fillStyle = "#160f08";
    ctx.fillRect(0, 0, 640, 400);
    ctx.fillStyle = "#3a2914";
    ctx.fillRect(0, 0, 640, 42);
    ctx.fillStyle = "#e6a21a";
    ctx.font = "600 24px sans-serif";
    ctx.fillText("ShahrokhOS", 18, 28);
    ["Hubly", "Glonova", "Stogite", "Resume"].forEach((label, index) => {
      const x = 48 + (index % 2) * 220;
      const y = 78 + Math.floor(index / 2) * 130;
      ctx.fillStyle = "#e6a21a";
      ctx.fillRect(x, y, 64, 46);
      ctx.fillStyle = "#f4ecdc";
      ctx.font = "18px sans-serif";
      ctx.fillText(label, x, y + 72);
    });
  }, "screen");

  const plate = useCanvasTexture((ctx, canvas) => {
    canvas.width = 512;
    canvas.height = 128;
    ctx.fillStyle = "#1a1410";
    ctx.fillRect(0, 0, 512, 128);
    ctx.strokeStyle = "#e6a21a";
    ctx.lineWidth = 6;
    ctx.strokeRect(8, 8, 496, 112);
    ctx.fillStyle = "#f4ecdc";
    ctx.font = "700 64px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("SHAHROKH", 256, 66);
  }, "plate");

  const hand = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!hand.current) return;
    const date = new Date();
    const minutes = date.getMinutes() + date.getSeconds() / 60;
    hand.current.rotation.z = -minutes * (Math.PI / 30);
    const pulse = 0.65 + Math.sin(state.clock.elapsedTime * 2.2) * 0.08;
    const lamp = state.scene.getObjectByName("lamp-glow");
    if (lamp && lamp instanceof THREE.Mesh && lamp.material instanceof THREE.MeshStandardMaterial) {
      lamp.material.emissiveIntensity = pulse;
    }
  });

  return (
    <group>
      <WoodFloor />
      <Rug />
      <mesh position={[0.2, 0.008, -0.2]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[2.15, 28]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.16} />
      </mesh>

      <mesh position={[0, 3.12, 0]}>
        <boxGeometry args={[12.4, 0.12, 10.2]} />
        <meshStandardMaterial color="#241c16" roughness={0.95} />
      </mesh>
      <mesh position={[-6.09, 1.56, 0]}>
        <boxGeometry args={[0.18, 3.12, 10.2]} />
        <meshStandardMaterial color="#3c342c" roughness={0.92} />
      </mesh>
      <mesh position={[6.09, 1.56, 0]}>
        <boxGeometry args={[0.18, 3.12, 10.2]} />
        <meshStandardMaterial color="#342c26" roughness={0.92} />
      </mesh>
      <mesh position={[0, 1.56, -5.09]}>
        <boxGeometry args={[12.2, 3.12, 0.18]} />
        <meshStandardMaterial color="#463c34" roughness={0.9} />
      </mesh>

      {([
        [-6.0, 0.08, 0, 0.08, 0.16, 10],
        [6.0, 0.08, 0, 0.08, 0.16, 10],
        [0, 0.08, -4.98, 12, 0.16, 0.08],
      ] as const).map((item) => (
        <mesh key={item.join(",")} position={[item[0], item[1], item[2]]}>
          <boxGeometry args={[item[3], item[4], item[5]]} />
          <meshStandardMaterial color="#2a2118" roughness={0.8} />
        </mesh>
      ))}

      <DuskWindow />
      {(
        [
          [-1.15, 2.6, -4.86, 2.75, 0.08, 0.08],
          [-1.15, 0.96, -4.86, 2.75, 0.08, 0.08],
          [-2.48, 1.78, -4.86, 0.08, 1.66, 0.08],
          [0.18, 1.78, -4.86, 0.08, 1.66, 0.08],
        ] as const
      ).map((item) => (
        <mesh key={item.join(",")} position={[item[0], item[1], item[2]]}>
          <boxGeometry args={[item[3], item[4], item[5]]} />
          <meshStandardMaterial color="#4a3422" roughness={0.6} />
        </mesh>
      ))}

      <mesh position={[2.35, 2.15, -4.92]}>
        <cylinderGeometry args={[0.16, 0.16, 0.04, 16]} />
        <meshStandardMaterial color="#e6d3b0" roughness={0.45} />
      </mesh>
      <mesh ref={hand} position={[2.35, 2.15, -4.88]}>
        <boxGeometry args={[0.018, 0.11, 0.01]} />
        <meshStandardMaterial color="#1a1410" />
      </mesh>

      <group position={[-4.55, 0, -4.35]}>
        <mesh position={[0, 0.14, 0]}>
          <cylinderGeometry args={[0.12, 0.15, 0.28, 6]} />
          <meshStandardMaterial color="#6b3a2a" roughness={0.8} />
        </mesh>
        {[0, 1.2, 2.4, 3.7, 5].map((angle, index) => (
          <mesh key={angle} position={[Math.cos(angle) * 0.06, 0.4, Math.sin(angle) * 0.06]} rotation={[0.25, angle, 0.15]}>
            <coneGeometry args={[0.09, 0.32, 5]} />
            <meshStandardMaterial color={index % 2 ? "#1e6d68" : "#2f8a55"} roughness={0.7} />
          </mesh>
        ))}
      </group>

      <mesh position={[0.15, 0.76, -0.95]}>
        <boxGeometry args={[2.55, 0.08, 1.2]} />
        <meshStandardMaterial color="#8d5a32" roughness={0.58} />
      </mesh>
      <mesh position={[-0.85, 0.36, -1.2]}>
        <boxGeometry args={[0.12, 0.72, 0.7]} />
        <meshStandardMaterial color="#5c3a22" roughness={0.7} />
      </mesh>
      <mesh position={[1.05, 0.36, -1.2]}>
        <boxGeometry args={[0.12, 0.72, 0.7]} />
        <meshStandardMaterial color="#5c3a22" roughness={0.7} />
      </mesh>

      <mesh position={[0.02, 0.98, -1.28]}>
        <boxGeometry args={[0.08, 0.28, 0.08]} />
        <meshStandardMaterial color="#1c1c1c" />
      </mesh>
      <mesh position={[0.02, 0.86, -1.18]}>
        <boxGeometry args={[0.28, 0.04, 0.16]} />
        <meshStandardMaterial color="#1c1c1c" />
      </mesh>
      <mesh position={[0.02, 1.28, -1.32]}>
        <boxGeometry args={[1.22, 0.76, 0.06]} />
        <meshStandardMaterial color="#141414" roughness={0.4} metalness={0.2} />
      </mesh>
      <mesh position={[0.02, 1.28, -1.285]}>
        <planeGeometry args={[1.08, 0.64]} />
        <meshStandardMaterial map={screen} emissive="#ffb15a" emissiveIntensity={0.18} roughness={0.35} />
      </mesh>
      <HitBox
        id="monitor"
        position={[0.02, 1.28, -1.24]}
        size={[1.2, 0.76, 0.12]}
        onPick={() => onSelect({ kind: "os" })}
        onHover={onHover}
        drag={drag}
      />

      <mesh position={[0.05, 0.82, -0.62]}>
        <boxGeometry args={[0.72, 0.03, 0.24]} />
        <meshStandardMaterial color="#2a241c" roughness={0.5} />
      </mesh>
      <mesh position={[0.55, 0.83, -0.58]} scale={[1, 0.55, 1.25]}>
        <sphereGeometry args={[0.045, 10, 8]} />
        <meshStandardMaterial color="#1a1410" roughness={0.4} />
      </mesh>

      <mesh position={[1.16, 0.84, -0.48]}>
        <boxGeometry args={[0.2, 0.04, 0.28]} />
        <meshStandardMaterial color="#1f1a16" roughness={0.45} />
      </mesh>
      <mesh position={[1.16, 0.9, -0.48]}>
        <boxGeometry args={[0.16, 0.05, 0.22]} />
        <meshStandardMaterial color="#2c241c" roughness={0.4} />
      </mesh>
      <HitBox
        id="phone"
        position={[1.16, 0.9, -0.48]}
        size={[0.32, 0.16, 0.4]}
        onPick={() => onSelect({ kind: "contact" })}
        onHover={onHover}
        drag={drag}
      />

      <mesh position={[-0.85, 0.9, -0.58]}>
        <cylinderGeometry args={[0.07, 0.06, 0.12, 8]} />
        <meshStandardMaterial color="#f4ecdc" roughness={0.4} />
      </mesh>
      <mesh position={[-0.78, 0.9, -0.58]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.045, 0.012, 6, 10]} />
        <meshStandardMaterial color="#f4ecdc" roughness={0.4} />
      </mesh>

      <mesh position={[-0.95, 0.875, -1.12]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.62, 0.2]} />
        <meshStandardMaterial map={plate} roughness={0.5} />
      </mesh>

      <group position={[0.98, 0, -1.28]}>
        <mesh position={[0, 0.82, 0]}>
          <cylinderGeometry args={[0.08, 0.1, 0.04, 8]} />
          <meshStandardMaterial color="#c9a36a" metalness={0.45} roughness={0.35} />
        </mesh>
        <mesh position={[0, 1.05, 0]}>
          <cylinderGeometry args={[0.015, 0.015, 0.42, 6]} />
          <meshStandardMaterial color="#b08a4e" metalness={0.5} roughness={0.3} />
        </mesh>
        <mesh name="lamp-glow" position={[0.02, 1.28, 0.04]} rotation={[0.5, 0, 0.2]}>
          <coneGeometry args={[0.16, 0.18, 6, 1, true]} />
          <meshStandardMaterial color="#f3d7a2" emissive="#ffb15a" emissiveIntensity={0.7} side={THREE.DoubleSide} roughness={0.45} />
        </mesh>
        <pointLight position={[0, 1.22, 0.1]} color="#ffc27a" intensity={28} distance={5.5} decay={2} />
      </group>

      <mesh position={[-0.72, 0.86, -1.22]}>
        <cylinderGeometry args={[0.05, 0.06, 0.03, 8]} />
        <meshStandardMaterial color="#2a2118" />
      </mesh>
      <mesh position={[-0.72, 0.96, -1.22]}>
        <sphereGeometry args={[0.075, 14, 12]} />
        <meshStandardMaterial color="#e6a21a" emissive="#ffb703" emissiveIntensity={0.85} roughness={0.25} />
      </mesh>
      <HitBox
        id="orb"
        position={[-0.72, 0.96, -1.22]}
        size={[0.22, 0.22, 0.22]}
        onPick={onOpenAssistant}
        onHover={onHover}
        drag={drag}
      />

      <group position={[-0.95, 0, 0.95]}>
        <mesh position={[0, 0.48, 0]}>
          <boxGeometry args={[0.52, 0.08, 0.52]} />
          <meshStandardMaterial color="#6b3a22" roughness={0.7} />
        </mesh>
        <mesh position={[0, 0.86, 0.22]}>
          <boxGeometry args={[0.52, 0.62, 0.07]} />
          <meshStandardMaterial color="#5a321c" roughness={0.72} />
        </mesh>
        {[
          [-0.2, -0.2],
          [0.2, -0.2],
          [-0.2, 0.2],
          [0.2, 0.2],
        ].map(([x, z]) => (
          <mesh key={`${x}${z}`} position={[x, 0.22, z]}>
            <cylinderGeometry args={[0.03, 0.03, 0.44, 6]} />
            <meshStandardMaterial color="#3a2618" />
          </mesh>
        ))}
      </group>

      {projects.map((project, index) => {
        const [x, y, z] = frameAt(index);
        return (
          <group key={project.id} position={[x, y, z]}>
            <mesh>
              <boxGeometry args={[0.06, 0.7, 0.96]} />
              <meshStandardMaterial color="#4a3018" roughness={0.55} />
            </mesh>
            <mesh position={[0.03, 0, 0]}>
              <boxGeometry args={[0.02, 0.56, 0.8]} />
              <meshStandardMaterial color="#f4ecdc" roughness={0.8} />
            </mesh>
            <mesh position={[0.045, 0, 0]}>
              <boxGeometry args={[0.015, 0.4, 0.58]} />
              <meshStandardMaterial color={project.mat} roughness={0.6} />
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
            position={[x + 0.08, y, z]}
            size={[0.12, 0.74, 1]}
            onPick={() => onSelect({ kind: "project", id: project.id })}
            onHover={onHover}
            drag={drag}
          />
        );
      })}

      <mesh position={[5.62, 1.35, -1.52]}>
        <boxGeometry args={[0.08, 2.35, 2.25]} />
        <meshStandardMaterial color="#5c3d28" roughness={0.7} />
      </mesh>
      {[0.36, 0.8, 1.24, 1.68, 2.12, 2.46].map((y) => (
        <mesh key={y} position={[5.46, y, -1.52]}>
          <boxGeometry args={[0.28, 0.045, 2.15]} />
          <meshStandardMaterial color="#6b4a30" roughness={0.65} />
        </mesh>
      ))}
      <Books />
      <HitBox
        id="shelf"
        position={[5.15, 1.4, -1.52]}
        size={[0.7, 2.4, 2.3]}
        onPick={() => onSelect({ kind: "skills" })}
        onHover={onHover}
        drag={drag}
      />
    </group>
  );
}

export default function OfficeCanvas({ selection, onSelect, onHover, onOpenAssistant, onReady }: Props) {
  const drag = useRef({ current: false });
  const pose = poseFor(selection);

  useEffect(() => {
    onReady();
  }, [onReady]);

  return (
    <Canvas
      className="office-canvas"
      dpr={[1, 1.5]}
      camera={{ position: ROOM_POSE.pos, fov: 40, near: 0.08, far: 30 }}
      gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
      onCreated={({ gl }) => {
        gl.setClearColor("#14110e");
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.08;
        gl.domElement.style.cursor = "grab";
      }}
    >
      <ambientLight intensity={0.48} color="#ffe8d0" />
      <hemisphereLight args={["#d5e2f2", "#6a452c", 0.55]} />
      <directionalLight position={[-2.5, 3.2, -1.5]} intensity={2.6} color="#ffd2a8" />
      <CameraRig pose={pose} drag={drag.current} />
      <Office onSelect={onSelect} onHover={onHover} onOpenAssistant={onOpenAssistant} drag={drag.current} />
    </Canvas>
  );
}
