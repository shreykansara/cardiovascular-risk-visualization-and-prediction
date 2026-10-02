/**
 * 3D Anatomical Heart Model & Dynamic Vessel Risk Shaders (AuraCor Clinical DLS)
 * Multimodal AI Hackathon 2026 - Track A: Cardiovascular Risk Visualization & Prediction
 *
 * Integrates an authentic pre-modeled, production-grade 3D human heart digital twin
 * with dynamic PBR surface texturing and responsive coronary artery risk shaders.
 */

import React, { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
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

  // Load authentic medical 3D heart model
  const { scene } = useGLTF('/models/heart_coronary_optimized.glb');

  // Clone scene on mount so materials are isolated per instance
  const clonedScene = useMemo(() => scene.clone(true), [scene]);

  // Build high-resolution coronary arterial geometries mapped to the real heart surface
  const { ladGeo, lcxGeo, rcaGeo } = useMemo(() => {
    // 1. LAD (Left Anterior Descending) + Diagonal branch D1
    const ladMainCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.02, 0.45, 0.86),
      new THREE.Vector3(0.04, 0.2, 0.9),
      new THREE.Vector3(0.01, -0.12, 1.0),
      new THREE.Vector3(0.03, -0.45, 0.96),
      new THREE.Vector3(0.05, -0.78, 0.87),
      new THREE.Vector3(0.05, -1.06, 0.75),
      new THREE.Vector3(0.09, -1.27, 0.62),
      new THREE.Vector3(0.18, -1.56, 0.18),
    ]);
    const ladMain = new THREE.TubeGeometry(ladMainCurve, 64, 0.048, 16, false);

    const ladD1Curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.01, -0.12, 1.0),
      new THREE.Vector3(0.26, -0.48, 0.88),
      new THREE.Vector3(0.46, -0.78, 0.68),
      new THREE.Vector3(0.55, -1.08, 0.48),
    ]);
    const ladD1 = new THREE.TubeGeometry(ladD1Curve, 32, 0.036, 14, false);
    const ladGeo = BufferGeometryUtils.mergeGeometries([ladMain, ladD1]);

    // 2. LCX (Left Circumflex Artery) + Obtuse Marginal OM1
    const lcxMainCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.05, 0.45, 0.8),
      new THREE.Vector3(0.35, 0.42, 0.5),
      new THREE.Vector3(0.65, 0.38, 0.12),
      new THREE.Vector3(0.84, 0.35, -0.18),
      new THREE.Vector3(0.88, 0.15, -0.2),
      new THREE.Vector3(0.86, -0.22, -0.18),
      new THREE.Vector3(0.8, -0.55, -0.24),
      new THREE.Vector3(0.6, -0.8, -0.28),
    ]);
    const lcxMain = new THREE.TubeGeometry(lcxMainCurve, 64, 0.046, 16, false);

    const lcxOm1Curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.88, 0.15, -0.2),
      new THREE.Vector3(0.9, -0.18, -0.02),
      new THREE.Vector3(0.86, -0.55, 0.08),
      new THREE.Vector3(0.74, -0.85, 0.18),
    ]);
    const lcxOm1 = new THREE.TubeGeometry(lcxOm1Curve, 32, 0.035, 14, false);
    const lcxGeo = BufferGeometryUtils.mergeGeometries([lcxMain, lcxOm1]);

    // 3. RCA (Right Coronary Artery) + Acute Marginal
    const rcaMainCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.15, 0.45, 0.74),
      new THREE.Vector3(-0.45, 0.42, 0.6),
      new THREE.Vector3(-0.75, 0.38, 0.4),
      new THREE.Vector3(-1.08, 0.32, -0.03),
      new THREE.Vector3(-1.16, 0.15, 0.08),
      new THREE.Vector3(-1.18, -0.18, 0.14),
      new THREE.Vector3(-1.12, -0.45, 0.06),
      new THREE.Vector3(-0.98, -0.75, 0.18),
      new THREE.Vector3(-0.8, -1.0, 0.14),
      new THREE.Vector3(-0.45, -1.26, 0.08),
      new THREE.Vector3(0.02, -1.48, 0.14),
    ]);
    const rcaMain = new THREE.TubeGeometry(rcaMainCurve, 64, 0.046, 16, false);

    const rcaMarginalCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-1.18, -0.18, 0.14),
      new THREE.Vector3(-1.04, -0.45, 0.32),
      new THREE.Vector3(-0.8, -0.8, 0.38),
    ]);
    const rcaMarginal = new THREE.TubeGeometry(rcaMarginalCurve, 28, 0.034, 14, false);
    const rcaGeo = BufferGeometryUtils.mergeGeometries([rcaMain, rcaMarginal]);

    return { ladGeo, lcxGeo, rcaGeo };
  }, []);

  useEffect(() => {
    // Configure authentic PBR texturing on real myocardium mesh
    clonedScene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        if (mesh.material) {
          const mat = mesh.material as THREE.MeshStandardMaterial;
          // Apply institutional clinical carmine tissue tone while preserving normal & albedo maps
          mat.color = new THREE.Color('#942b3b');
          mat.roughness = 0.35;
          mat.metalness = 0.15;
          mat.needsUpdate = true;
        }
      }
    });
  }, [clonedScene]);

  // Create isolated materials for the 3 coronary arteries
  const arteryMaterials = useMemo(() => {
    const createMat = () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color('#10B981'),
        roughness: 0.25,
        metalness: 0.22,
        emissive: new THREE.Color('#000000'),
        emissiveIntensity: 0.2,
        transparent: true,
        opacity: 1.0,
      });

    const mats = {
      vessel_LAD: createMat(),
      vessel_LCX: createMat(),
      vessel_RCA: createMat(),
    };
    vesselMaterials.current = mats;
    return mats;
  }, []);

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

        // 1. Dynamic base risk color update
        scratchColor.set(pred.color_hex);

        if (isGlobalFocus || isThisSelected) {
          // Full visibility and vibrant risk color
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
          // Highlight active or hovered vessel
          mat.emissive.set(scratchColor);
          mat.emissiveIntensity = 0.85;
        } else if (isGlobalFocus) {
          // Subtle baseline glow for anatomical orientation
          mat.emissive.set(scratchColor);
          mat.emissiveIntensity = 0.25;
        } else {
          // Dimmed unselected vessel has zero emissive
          mat.emissive.setRGB(0, 0, 0);
          mat.emissiveIntensity = 0.0;
        }
      }
    }
  });

  const handlePointerOver = (name: string, e: any) => {
    e.stopPropagation();
    document.body.style.cursor = 'pointer';
    setHoveredVessel(name);
    onHoverVessel?.(name);
  };

  const handlePointerOut = (e: any) => {
    e.stopPropagation();
    document.body.style.cursor = 'auto';
    setHoveredVessel(null);
    onHoverVessel?.(null);
  };

  const handleClick = (name: string, e: any) => {
    e.stopPropagation();
    setVesselFocus(activeVesselFocus === name ? 'default' : name);
  };

  return (
    <group ref={groupRef} position={[0, 0, 0]} scale={[1.0, 1.0, 1.0]}>
      {/* 1. Authentic Medical Heart Myocardium Digital Twin */}
      <primitive object={clonedScene} />

      {/* 2. Distinct Elevated Coronary Conduit: LAD (Anterior Descending) */}
      <mesh
        name="vessel_LAD"
        geometry={ladGeo}
        material={arteryMaterials.vessel_LAD}
        onPointerOver={(e) => handlePointerOver('vessel_LAD', e)}
        onPointerOut={handlePointerOut}
        onClick={(e) => handleClick('vessel_LAD', e)}
      />

      {/* 3. Distinct Elevated Coronary Conduit: LCX (Left Circumflex) */}
      <mesh
        name="vessel_LCX"
        geometry={lcxGeo}
        material={arteryMaterials.vessel_LCX}
        onPointerOver={(e) => handlePointerOver('vessel_LCX', e)}
        onPointerOut={handlePointerOut}
        onClick={(e) => handleClick('vessel_LCX', e)}
      />

      {/* 4. Distinct Elevated Coronary Conduit: RCA (Right Coronary Artery) */}
      <mesh
        name="vessel_RCA"
        geometry={rcaGeo}
        material={arteryMaterials.vessel_RCA}
        onPointerOver={(e) => handlePointerOver('vessel_RCA', e)}
        onPointerOut={handlePointerOut}
        onClick={(e) => handleClick('vessel_RCA', e)}
      />
    </group>
  );
};

// Pre-load the authentic glTF model
useGLTF.preload('/models/heart_coronary_optimized.glb');
