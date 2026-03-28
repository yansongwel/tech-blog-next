"use client";

import { useRef, useState, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";
import * as THREE from "three";

// Demo photos - will be replaced with real data
const photos = Array.from({ length: 24 }, (_, i) => ({
  id: `photo-${i}`,
  color: `hsl(${(i * 15) % 360}, 70%, 50%)`,
  label: `Photo ${i + 1}`,
}));

type Layout = "sphere" | "spiral" | "grid" | "heart";

function PhotoCard({
  position,
  color,
  index,
}: {
  position: [number, number, number];
  color: string;
  index: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5 + index * 0.3) * 0.1;
    if (hovered) {
      meshRef.current.scale.lerp(new THREE.Vector3(1.2, 1.2, 1.2), 0.1);
    } else {
      meshRef.current.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1);
    }
  });

  return (
    <mesh
      ref={meshRef}
      position={position}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <boxGeometry args={[1.2, 0.9, 0.05]} />
      <meshStandardMaterial
        color={hovered ? "#ffffff" : color}
        emissive={color}
        emissiveIntensity={hovered ? 0.5 : 0.2}
        metalness={0.3}
        roughness={0.4}
      />
    </mesh>
  );
}

function PlasmaRing({ radius, speed, color }: { radius: number; speed: number; color: string }) {
  const ref = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.x = state.clock.elapsedTime * speed;
    ref.current.rotation.z = state.clock.elapsedTime * speed * 0.7;
  });

  return (
    <mesh ref={ref}>
      <torusGeometry args={[radius, 0.02, 16, 100]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.8}
        transparent
        opacity={0.6}
      />
    </mesh>
  );
}

function Scene({ layout }: { layout: Layout }) {
  const groupRef = useRef<THREE.Group>(null);

  const positions = useMemo(() => {
    return photos.map((_, i) => {
      const t = i / photos.length;
      switch (layout) {
        case "sphere": {
          const phi = Math.acos(-1 + (2 * i) / photos.length);
          const theta = Math.sqrt(photos.length * Math.PI) * phi;
          const r = 5;
          return [
            r * Math.cos(theta) * Math.sin(phi),
            r * Math.sin(theta) * Math.sin(phi),
            r * Math.cos(phi),
          ] as [number, number, number];
        }
        case "spiral": {
          const angle = t * Math.PI * 6;
          const r = 1 + t * 4;
          return [
            r * Math.cos(angle),
            (t - 0.5) * 8,
            r * Math.sin(angle),
          ] as [number, number, number];
        }
        case "grid": {
          const cols = 6;
          const row = Math.floor(i / cols);
          const col = i % cols;
          return [
            (col - cols / 2) * 1.8,
            (row - Math.floor(photos.length / cols) / 2) * 1.4,
            0,
          ] as [number, number, number];
        }
        case "heart": {
          const angle = t * Math.PI * 2;
          const scale = 3;
          const x = scale * 16 * Math.pow(Math.sin(angle), 3) * 0.15;
          const y =
            scale *
            (13 * Math.cos(angle) -
              5 * Math.cos(2 * angle) -
              2 * Math.cos(3 * angle) -
              Math.cos(4 * angle)) *
            0.15;
          return [x, y, (Math.random() - 0.5) * 2] as [number, number, number];
        }
      }
    });
  }, [layout]);

  useFrame((state) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y = state.clock.elapsedTime * 0.05;
  });

  return (
    <group ref={groupRef}>
      {/* Plasma energy rings */}
      <PlasmaRing radius={6} speed={0.3} color="#6366f1" />
      <PlasmaRing radius={6.5} speed={-0.2} color="#06b6d4" />
      <PlasmaRing radius={7} speed={0.15} color="#8b5cf6" />

      {/* Photo cards */}
      {photos.map((photo, i) => (
        <PhotoCard
          key={photo.id}
          position={positions[i]}
          color={photo.color}
          index={i}
        />
      ))}

      {/* Central glow */}
      <pointLight position={[0, 0, 0]} intensity={2} color="#6366f1" distance={10} />
    </group>
  );
}

export default function AlbumPage() {
  const [layout, setLayout] = useState<Layout>("sphere");

  const layouts: { key: Layout; label: string }[] = [
    { key: "sphere", label: "球形" },
    { key: "spiral", label: "螺旋" },
    { key: "grid", label: "网格" },
    { key: "heart", label: "心形" },
  ];

  return (
    <div className="min-h-screen">
      {/* Controls */}
      <div className="fixed top-20 left-1/2 -translate-x-1/2 z-20 flex gap-2">
        {layouts.map((l) => (
          <button
            key={l.key}
            onClick={() => setLayout(l.key)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all cursor-pointer ${
              layout === l.key
                ? "bg-primary text-white"
                : "glass text-foreground/70 hover:text-foreground"
            }`}
          >
            {l.label}
          </button>
        ))}
      </div>

      {/* 3D Canvas */}
      <div className="w-full h-screen">
        <Canvas camera={{ position: [0, 0, 12], fov: 60 }}>
          <ambientLight intensity={0.3} />
          <directionalLight position={[5, 5, 5]} intensity={0.5} />
          <Scene layout={layout} />
          <OrbitControls
            enableZoom={true}
            enablePan={false}
            minDistance={5}
            maxDistance={20}
            autoRotate
            autoRotateSpeed={0.5}
          />
        </Canvas>
      </div>

      {/* Page title */}
      <div className="absolute top-28 left-1/2 -translate-x-1/2 text-center pointer-events-none">
        <h1 className="text-3xl font-bold gradient-text mb-2">个人相册</h1>
        <p className="text-muted text-sm">拖拽旋转 | 滚轮缩放 | 悬停查看</p>
      </div>
    </div>
  );
}
