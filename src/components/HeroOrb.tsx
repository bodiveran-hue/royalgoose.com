import { Canvas, useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Mesh } from "three";

function Orb() {
  const ref = useRef<Mesh>(null);
  useFrame((_, d) => {
    if (!ref.current) return;
    ref.current.rotation.y += d * 0.35;
    ref.current.rotation.x += d * 0.08;
  });
  return (
    <mesh ref={ref}>
      <icosahedronGeometry args={[1.15, 1]} />
      <meshStandardMaterial color="#16a34a" wireframe emissive="#14532d" />
    </mesh>
  );
}

export function HeroOrb() {
  return (
    <div className="h-28 w-28">
      <Canvas camera={{ position: [0, 0, 3] }}>
        <ambientLight intensity={0.8} />
        <pointLight position={[2, 2, 2]} />
        <Orb />
      </Canvas>
    </div>
  );
}
