/**
 * 3D Anatomical Heart Model & Dynamic Vessel Risk Shaders
 * Multimodal AI Hackathon 2026 - Track A: Cardiovascular Risk Visualization & Prediction
 */

import React, { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { usePatientStore } from '../../store/usePatientStore';

interface HeartModelProps {
  onHoverVessel?: (vesselName: string | null) => void;
}

export const HeartModel: React.FC<HeartModelProps> = ({ onHoverVessel }) => {
  const { analysis, activeVesselFocus, setVesselFocus } = usePatientStore();
  const groupRef = useRef<THREE.Group>(null);
  const [hoveredVessel, setHoveredVessel] = useState<string | null>(null);

  // Pre-allocated scratch color objects to eliminate runtime GC allocations
  const scratchColor = useMemo(() => new THREE.Color(), []);
  const pulseColor = useMemo(() => new THREE.Color(), []);

  // Material references for dynamic uniform updates
  const vesselMaterials = useRef<Record<string, THREE.MeshStandardMaterial>>({});

  // Load optimized glTF binary
  const { scene } = useGLTF('/models/heart_coronary_optimized.glb');

  // Clone scene on mount so materials are isolated per instance
  const clonedScene = useMemo(() => scene.clone(true), [scene]);

  useEffect(() => {
    vesselMaterials.current = {};

    clonedScene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const name = mesh.name;

        if (name === 'vessel_LAD' || name === 'vessel_LCX' || name === 'vessel_RCA') {
          // Create isolated PBR material with emissive support
          const mat = new THREE.MeshStandardMaterial({
            color: new THREE.Color('#10B981'),
            roughness: 0.35,
            metalness: 0.22,
            emissive: new THREE.Color('#000000'),
            emissiveIntensity: 1.0,
          });
          mesh.material = mat;
          vesselMaterials.current[name] = mat;
        } else if (name.includes('myocardium') || name.includes('ventricle')) {
          mesh.material = new THREE.MeshStandardMaterial({
            color: new THREE.Color('#881337'), // Deep cardiac burgundy
            roughness: 0.65,
            metalness: 0.12,
          });
        }
      }
    });

    return () => {
      // Complete Three.js memory disposal
      Object.values(vesselMaterials.current).forEach((mat) => mat.dispose());
    };
  }, [clonedScene]);

  // Dynamic frame loop: updates color uniforms and emissive ischemia pulses
  useFrame(({ clock }) => {
    const elapsed = clock.getElapsedTime();
    const predictions = analysis?.predictions?.vessels;

    if (!predictions) return;

    const vesselKeys: Record<string, 'lad' | 'lcx' | 'rca'> = {
      vessel_LAD: 'lad',
      vessel_LCX: 'lcx',
      vessel_RCA: 'rca',
    };

    for (const [nodeName, vesselKey] of Object.entries(vesselKeys)) {
      const mat = vesselMaterials.current[nodeName];
      const pred = predictions[vesselKey];

      if (mat && pred) {
        // 1. Dynamic base risk color update
        scratchColor.set(pred.color_hex);
        mat.color.lerp(scratchColor, 0.1);

        // 2. High-Risk / Ischemic Emissive Pulse Shader (P >= 0.75)
        if (pred.probability >= 0.75) {
          // Oscillate at resting heart rate frequency ~1.2 Hz (72 bpm)
          const pulse = (Math.sin(elapsed * 7.5) + 1.0) * 0.5; // [0, 1]
          pulseColor.setRGB(0.95 * pulse, 0.25 * pulse, 0.25 * pulse);
          mat.emissive.copy(pulseColor);
          mat.emissiveIntensity = 0.8 + 1.2 * pulse;
        } else if (activeVesselFocus === nodeName || hoveredVessel === nodeName) {
          // Subtle highlight on active/hovered vessel
          mat.emissive.set(scratchColor);
          mat.emissiveIntensity = 0.45;
        } else {
          mat.emissive.setRGB(0, 0, 0);
          mat.emissiveIntensity = 0.0;
        }
      }
    }
  });

  const handlePointerOver = (e: any) => {
    e.stopPropagation();
    const name = e.object.name;
    if (name === 'vessel_LAD' || name === 'vessel_LCX' || name === 'vessel_RCA') {
      document.body.style.cursor = 'pointer';
      setHoveredVessel(name);
      onHoverVessel?.(name);
    }
  };

  const handlePointerOut = (e: any) => {
    e.stopPropagation();
    document.body.style.cursor = 'auto';
    setHoveredVessel(null);
    onHoverVessel?.(null);
  };

  const handleClick = (e: any) => {
    e.stopPropagation();
    const name = e.object.name;
    if (name === 'vessel_LAD' || name === 'vessel_LCX' || name === 'vessel_RCA') {
      setVesselFocus(activeVesselFocus === name ? 'default' : name);
    }
  };

  return (
    <group ref={groupRef} position={[0, 0, 0]} scale={[1.15, 1.15, 1.15]}>
      <primitive
        object={clonedScene}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
      />
    </group>
  );
};

// Pre-load the glTF model
useGLTF.preload('/models/heart_coronary_optimized.glb');
