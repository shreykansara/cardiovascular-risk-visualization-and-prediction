/**
 * 3D Anatomical Heart Model & Dynamic Vessel Risk Shaders (AuraCor Clinical DLS)
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

  // Pre-allocated scratch color objects to eliminate runtime GC pressure
  const scratchColor = useMemo(() => new THREE.Color(), []);
  const pulseColor = useMemo(() => new THREE.Color(), []);
  const dimColor = useMemo(() => new THREE.Color('#334155'), []);

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
          // Dedicated PBR material for coronary conduit with emissive & alpha support
          const mat = new THREE.MeshStandardMaterial({
            color: new THREE.Color('#10B981'),
            roughness: 0.28,
            metalness: 0.22,
            emissive: new THREE.Color('#000000'),
            emissiveIntensity: 0.2,
            transparent: true,
            opacity: 1.0,
            depthWrite: true,
          });
          mesh.material = mat;
          vesselMaterials.current[name] = mat;
        } else if (name === 'ventricles_mesh') {
          mesh.material = new THREE.MeshStandardMaterial({
            color: new THREE.Color('#4a0e17'), // Deep rich myocardium organ burgundy
            roughness: 0.45,
            metalness: 0.08,
          });
        } else if (name.startsWith('aorta')) {
          mesh.material = new THREE.MeshStandardMaterial({
            color: new THREE.Color('#881337'), // Arterial crimson
            roughness: 0.35,
            metalness: 0.14,
          });
        } else if (name === 'pulmonary_mesh') {
          mesh.material = new THREE.MeshStandardMaterial({
            color: new THREE.Color('#1d4ed8'), // Pulmonary trunk venous blue
            roughness: 0.4,
            metalness: 0.12,
          });
        } else if (name === 'ra_mesh' || name === 'la_mesh' || name.includes('auricle')) {
          mesh.material = new THREE.MeshStandardMaterial({
            color: new THREE.Color('#3d0c15'), // Atrial tone
            roughness: 0.48,
            metalness: 0.06,
          });
        } else if (name === 'venae_cavae_mesh') {
          mesh.material = new THREE.MeshStandardMaterial({
            color: new THREE.Color('#1e293b'), // Venous systemic navy
            roughness: 0.45,
            metalness: 0.1,
          });
        }
      }
    });

    return () => {
      // Memory cleanup on unmount
      Object.values(vesselMaterials.current).forEach((mat) => mat.dispose());
    };
  }, [clonedScene]);

  // Dynamic frame loop: updates color uniforms, dimming, and emissive ischemia pulses
  useFrame(({ clock }) => {
    const elapsed = clock.getElapsedTime();
    const predictions = analysis?.predictions?.vessels;

    if (!predictions) return;

    const vesselKeys: Record<string, 'lad' | 'lcx' | 'rca'> = {
      vessel_LAD: 'lad',
      vessel_LCX: 'lcx',
      vessel_RCA: 'rca',
    };

    const isGlobalFocus = activeVesselFocus === 'default';

    for (const [nodeName, vesselKey] of Object.entries(vesselKeys)) {
      const mat = vesselMaterials.current[nodeName];
      const pred = predictions[vesselKey];

      if (mat && pred) {
        const isThisSelected = activeVesselFocus === nodeName;
        const isThisHovered = hoveredVessel === nodeName;

        // 1. Target color calculation & opacity dimming
        scratchColor.set(pred.color_hex);

        if (isGlobalFocus || isThisSelected) {
          // Full visibility and vibrant calibrated risk color
          mat.color.lerp(scratchColor, 0.12);
          mat.opacity = THREE.MathUtils.lerp(mat.opacity, 1.0, 0.15);
        } else {
          // Dim unselected vessels to 35% opacity to focus clinician visual attention
          mat.color.lerp(dimColor, 0.12);
          mat.opacity = THREE.MathUtils.lerp(mat.opacity, 0.35, 0.15);
        }

        // 2. High-Risk / Ischemic Emissive Pulse Shader (P >= 0.75)
        if (pred.probability >= 0.75 && (isGlobalFocus || isThisSelected)) {
          // Oscillate at resting heart rate frequency ~1.2 Hz (72 bpm)
          const pulse = (Math.sin(elapsed * 7.5) + 1.0) * 0.5; // [0, 1]
          pulseColor.setRGB(0.95 * pulse, 0.22 * pulse, 0.22 * pulse);
          mat.emissive.copy(pulseColor);
          mat.emissiveIntensity = 0.8 + 1.2 * pulse;
        } else if (isThisSelected || isThisHovered) {
          // Highlighting active or hovered vessel
          mat.emissive.set(scratchColor);
          mat.emissiveIntensity = 0.85;
        } else if (isGlobalFocus) {
          // Subtle baseline glow for orientation
          mat.emissive.set(scratchColor);
          mat.emissiveIntensity = 0.25;
        } else {
          // Dimmed vessel has zero emissive
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
    <group ref={groupRef} position={[0, 0, 0]} scale={[1.0, 1.0, 1.0]}>
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
