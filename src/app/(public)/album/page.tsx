"use client";

import { useRef, useState, useMemo, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";

// Fallback images when media library is empty
const fallbackPhotos = Array.from({ length: 30 }, (_, i) => ({
  id: `photo-${i}`,
  url: `https://picsum.photos/seed/techblog${i}/400/300`,
  label: `Photo ${i + 1}`,
}));

type Layout = "sphere" | "spiral" | "grid" | "heart" | "helix";

function PhotoCard({
  position,
  index,
  url,
}: {
  position: [number, number, number];
  index: number;
  url: string;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const texture = useMemo(() => {
    const loader = new THREE.TextureLoader();
    return loader.load(url);
  }, [url]);

  useFrame((state) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.y =
      Math.sin(state.clock.elapsedTime * 0.3 + index * 0.4) * 0.15;
    const target = hovered ? 1.3 : 1;
    meshRef.current.scale.lerp(
      new THREE.Vector3(target, target, target),
      0.1
    );
  });

  return (
    <mesh
      ref={meshRef}
      position={position}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <planeGeometry args={[1.6, 1.2]} />
      <meshStandardMaterial
        map={texture}
        emissive={hovered ? "#6366f1" : "#000000"}
        emissiveIntensity={hovered ? 0.3 : 0}
        metalness={0.1}
        roughness={0.8}
        transparent
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

function EnergyRing({
  radius,
  speed,
  color,
  thickness = 0.015,
}: {
  radius: number;
  speed: number;
  color: string;
  thickness?: number;
}) {
  const ref = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.x = state.clock.elapsedTime * speed;
    ref.current.rotation.z = state.clock.elapsedTime * speed * 0.7;
  });

  return (
    <mesh ref={ref}>
      <torusGeometry args={[radius, thickness, 16, 100]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={1}
        transparent
        opacity={0.5}
      />
    </mesh>
  );
}

function Scene({ layout, photos }: { layout: Layout; photos: { id: string; url: string; label: string }[] }) {
  const groupRef = useRef<THREE.Group>(null);

  const positions = useMemo(() => {
    return photos.map((_, i) => {
      const t = i / photos.length;
      switch (layout) {
        case "sphere": {
          const phi = Math.acos(-1 + (2 * i) / photos.length);
          const theta = Math.sqrt(photos.length * Math.PI) * phi;
          const r = 6;
          return [
            r * Math.cos(theta) * Math.sin(phi),
            r * Math.sin(theta) * Math.sin(phi),
            r * Math.cos(phi),
          ] as [number, number, number];
        }
        case "spiral": {
          const angle = t * Math.PI * 8;
          const r = 1.5 + t * 4;
          return [
            r * Math.cos(angle),
            (t - 0.5) * 10,
            r * Math.sin(angle),
          ] as [number, number, number];
        }
        case "grid": {
          const cols = 6;
          const row = Math.floor(i / cols);
          const col = i % cols;
          return [
            (col - cols / 2) * 2.2 + 1.1,
            -(row - Math.floor(photos.length / cols) / 2) * 1.7,
            0,
          ] as [number, number, number];
        }
        case "heart": {
          const angle = t * Math.PI * 2;
          const s = 3.5;
          const x = s * 16 * Math.pow(Math.sin(angle), 3) * 0.12;
          const y =
            s *
            (13 * Math.cos(angle) -
              5 * Math.cos(2 * angle) -
              2 * Math.cos(3 * angle) -
              Math.cos(4 * angle)) *
            0.12;
          return [x, y, ((i * 0.618) % 1 - 0.5) * 2] as [number, number, number];
        }
        case "helix": {
          const angle = t * Math.PI * 6;
          const r = 4;
          return [
            r * Math.cos(angle),
            (t - 0.5) * 12,
            r * Math.sin(angle),
          ] as [number, number, number];
        }
      }
    });
  }, [layout, photos]);

  useFrame((state) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y = state.clock.elapsedTime * 0.04;
  });

  return (
    <group ref={groupRef}>
      {/* Energy rings */}
      <EnergyRing radius={7} speed={0.2} color="#6366f1" />
      <EnergyRing radius={7.5} speed={-0.15} color="#06b6d4" />
      <EnergyRing radius={8} speed={0.1} color="#8b5cf6" thickness={0.01} />
      <EnergyRing radius={8.5} speed={-0.08} color="#ec4899" thickness={0.008} />

      {/* Photo cards with real images */}
      {photos.map((photo, i) => (
        <PhotoCard
          key={photo.id}
          position={positions[i]}
          index={i}
          url={photo.url}
        />
      ))}

      {/* Central energy */}
      <pointLight position={[0, 0, 0]} intensity={3} color="#6366f1" distance={12} />
      <pointLight position={[0, 3, 0]} intensity={1} color="#06b6d4" distance={8} />
      <pointLight position={[0, -3, 0]} intensity={1} color="#8b5cf6" distance={8} />
    </group>
  );
}

export default function AlbumPage() {
  const [layout, setLayout] = useState<Layout>("sphere");
  const [photos, setPhotos] = useState(fallbackPhotos);

  // Load images from media library, fallback to picsum
  useEffect(() => {
    fetch("/api/admin/media")
      .then((r) => r.json())
      .then((data) => {
        const mediaItems = data.media || [];
        if (mediaItems.length >= 6) {
          // Use media library images (pad to 30 if needed)
          const mapped = mediaItems.map((m: { id: string; url: string; filename: string }) => ({
            id: m.id,
            url: m.url,
            label: m.filename,
          }));
          // Repeat to fill 30 slots for better 3D effect
          const filled = [];
          for (let i = 0; i < 30; i++) filled.push(mapped[i % mapped.length]);
          setPhotos(filled);
        }
      })
      .catch(() => {}); // Keep fallback
  }, []);

  const layouts: { key: Layout; label: string }[] = [
    { key: "sphere", label: "星球" },
    { key: "helix", label: "DNA" },
    { key: "spiral", label: "漩涡" },
    { key: "grid", label: "矩阵" },
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
                ? "bg-primary text-white shadow-[0_0_20px_rgba(99,102,241,0.4)]"
                : "glass text-foreground/70 hover:text-foreground"
            }`}
          >
            {l.label}
          </button>
        ))}
      </div>

      {/* 3D Canvas */}
      <div className="w-full h-screen">
        <Canvas camera={{ position: [0, 0, 14], fov: 60 }}>
          <ambientLight intensity={0.4} />
          <directionalLight position={[5, 5, 5]} intensity={0.6} />
          <fog attach="fog" args={["#0a0a0f", 15, 30]} />
          <Scene layout={layout} photos={photos} />
          <OrbitControls
            enableZoom={true}
            enablePan={false}
            minDistance={5}
            maxDistance={25}
            autoRotate
            autoRotateSpeed={0.3}
          />
        </Canvas>
      </div>

      {/* Page title */}
      <div className="absolute top-28 left-1/2 -translate-x-1/2 text-center pointer-events-none">
        <h1 className="text-3xl font-bold gradient-text mb-2">Cyber Gallery</h1>
        <p className="text-muted text-sm font-mono">Drag to rotate | Scroll to zoom | Hover to focus</p>
      </div>
    </div>
  );
}
