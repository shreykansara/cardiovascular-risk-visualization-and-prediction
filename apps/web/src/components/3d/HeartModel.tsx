/**
 * 3D Anatomical Heart Model & Dynamic Vessel Risk Shaders (AuraCor Clinical DLS)
 * Multimodal AI Hackathon 2026 - Track A: Cardiovascular Risk Visualization & Prediction
 *
 * Integrates an authentic pre-modeled, production-grade 3D human heart digital twin
 * with flush coronary artery vascular conduits (1.5 - 2.5 mm scale) directly mapped
 * to the surface of the ventricles along the anatomical sulci.
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

  // Build delicate, flush coronary artery geometries mapped directly to world surface vertices
  const { ladGeo, lcxGeo, rcaGeo } = useMemo(() => {
    // 1. LAD (Left Anterior Descending Artery) - runs down anterior interventricular sulcus to apex
    const ladMainCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.003, 0.22, 0.415),
      new THREE.Vector3(-0.025, 0.12, 0.432),
      new THREE.Vector3(-0.097, 0.035, 0.463),
      new THREE.Vector3(-0.01, -0.083, 0.482),
      new THREE.Vector3(-0.046, -0.15, 0.487),
      new THREE.Vector3(-0.077, -0.221, 0.48),
      new THREE.Vector3(-0.082, -0.321, 0.451),
      new THREE.Vector3(-0.021, -0.42, 0.407),
      new THREE.Vector3(0.017, -0.511, 0.364),
      new THREE.Vector3(0.034, -0.611, 0.303),
      new THREE.Vector3(0.082, -0.713, 0.22),
      new THREE.Vector3(0.108, -0.785, 0.08),
    ]);
    const ladMain = new THREE.TubeGeometry(ladMainCurve, 64, 0.014, 12, false);

    const ladD1Curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.046, -0.15, 0.487),
      new THREE.Vector3(0.12, -0.25, 0.42),
      new THREE.Vector3(0.22, -0.4, 0.32),
      new THREE.Vector3(0.28, -0.55, 0.2),
    ]);
    const ladD1 = new THREE.TubeGeometry(ladD1Curve, 32, 0.01, 10, false);
    const ladGeo = BufferGeometryUtils.mergeGeometries([ladMain, ladD1]);

    // 2. LCX (Left Circumflex Artery) - runs in left atrioventricular groove around obtuse margin
    const lcxMainCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.0, 0.25, 0.38),
      new THREE.Vector3(0.22, 0.26, 0.24),
      new THREE.Vector3(0.454, 0.289, 0.068),
      new THREE.Vector3(0.414, 0.111, -0.102),
      new THREE.Vector3(0.417, 0.078, -0.076),
      new THREE.Vector3(0.406, -0.018, -0.037),
      new THREE.Vector3(0.426, -0.185, -0.068),
      new THREE.Vector3(0.431, -0.233, -0.073),
      new THREE.Vector3(0.426, -0.313, -0.05),
    ]);
    const lcxMain = new THREE.TubeGeometry(lcxMainCurve, 64, 0.013, 12, false);

    const lcxOm1Curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.417, 0.078, -0.076),
      new THREE.Vector3(0.44, -0.08, 0.02),
      new THREE.Vector3(0.42, -0.28, 0.04),
      new THREE.Vector3(0.36, -0.45, 0.08),
    ]);
    const lcxOm1 = new THREE.TubeGeometry(lcxOm1Curve, 32, 0.01, 10, false);
    const lcxGeo = BufferGeometryUtils.mergeGeometries([lcxMain, lcxOm1]);

    // 3. RCA (Right Coronary Artery) - runs in right atrioventricular groove along acute margin
    const rcaMainCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.08, 0.25, 0.35),
      new THREE.Vector3(-0.28, 0.23, 0.2),
      new THREE.Vector3(-0.519, 0.211, 0.005),
      new THREE.Vector3(-0.549, 0.113, -0.03),
      new THREE.Vector3(-0.573, 0.012, 0.032),
      new THREE.Vector3(-0.578, -0.041, 0.002),
      new THREE.Vector3(-0.566, -0.112, -0.021),
      new THREE.Vector3(-0.539, -0.215, 0.018),
      new THREE.Vector3(-0.503, -0.311, 0.117),
      new THREE.Vector3(-0.444, -0.412, 0.056),
      new THREE.Vector3(-0.371, -0.51, 0.016),
      new THREE.Vector3(-0.2, -0.65, 0.03),
    ]);
    const rcaMain = new THREE.TubeGeometry(rcaMainCurve, 64, 0.014, 12, false);

    const rcaMarginalCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.578, -0.041, 0.002),
      new THREE.Vector3(-0.52, -0.22, 0.15),
      new THREE.Vector3(-0.4, -0.4, 0.18),
    ]);
    const rcaMarginal = new THREE.TubeGeometry(rcaMarginalCurve, 28, 0.01, 10, false);
    const rcaGeo = BufferGeometryUtils.mergeGeometries([rcaMain, rcaMarginal]);

    return { ladGeo, lcxGeo, rcaGeo };
  }, []);

  useEffect(() => {
    // Preserve authentic photographic PBR texturing with wet anatomical sheen
    clonedScene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        if (mesh.material) {
          const mat = mesh.material as THREE.MeshStandardMaterial;
          mat.color = new THREE.Color('#ffffff'); // Retain full brightness of the authentic medical texture
          mat.roughness = 0.35;
          mat.metalness = 0.1;
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
        metalness: 0.2,
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
          mat.color.lerp(scratchColor, 0.15);
          mat.opacity = THREE.MathUtils.lerp(mat.opacity, 1.0, 0.15);
        } else {
          // Dim unselected vessels to 35% opacity to focus clinician visual attention
          mat.color.lerp(dimColor, 0.15);
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
      {/* 1. Authentic Medical Human Heart Digital Twin */}
      <primitive object={clonedScene} />

      {/* 2. Flush Anatomical Coronary Conduit: LAD (Anterior Interventricular Sulcus) */}
      <mesh
        name="vessel_LAD"
        geometry={ladGeo}
        material={arteryMaterials.vessel_LAD}
        onPointerOver={(e) => handlePointerOver('vessel_LAD', e)}
        onPointerOut={handlePointerOut}
        onClick={(e) => handleClick('vessel_LAD', e)}
      />

      {/* 3. Flush Anatomical Coronary Conduit: LCX (Left Circumflex Artery) */}
      <mesh
        name="vessel_LCX"
        geometry={lcxGeo}
        material={arteryMaterials.vessel_LCX}
        onPointerOver={(e) => handlePointerOver('vessel_LCX', e)}
        onPointerOut={handlePointerOut}
        onClick={(e) => handleClick('vessel_LCX', e)}
      />

      {/* 4. Flush Anatomical Coronary Conduit: RCA (Right Coronary Artery) */}
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
