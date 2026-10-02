/**
 * 3D Anatomical Heart Model & Organic PBR Vascular Materials (AuraCor Clinical DLS)
 * Multimodal AI Hackathon 2026 - Track A: Cardiovascular Risk Visualization & Prediction
 *
 * Integrates an authentic pre-modeled 3D human heart digital twin with genuine
 * 3D vascular conduits extruded as smooth round cylindrical tubes (128 tubular segments,
 * 12 radial segments) with organic anatomical tapering (0.016 proximal -> 0.007 apex).
 *
 * Uses MeshPhysicalMaterial with wet clearcoat sheen (0.9), organic blood-red base
 * blending (#5A0A14), and micro-endothelial normal depth mapping.
 *
 * Provides smooth selective vessel isolation (focused: 1.0 opacity, 0.75 emissive;
 * unselected: 0.25 opacity, 0.0 emissive) and synchronized 1.2 Hz ischemia pulses.
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
  const baseBloodRed = useMemo(() => new THREE.Color('#5A0A14'), []);
  const dimColor = useMemo(() => new THREE.Color('#1E293B'), []);

  // Generate procedural endothelial micro-bump texture for organic tissue depth
  const vascularNormalMap = useMemo(() => {
    if (typeof document === 'undefined') return null;
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    const imgData = ctx.createImageData(128, 128);
    for (let y = 0; y < 128; y++) {
      for (let x = 0; x < 128; x++) {
        const idx = (y * 128 + x) * 4;
        // Longitudinal micro-striation along tubular vascular axis
        const striation = Math.sin(y * 0.4) * 0.12 + Math.sin(x * 0.08) * 0.06;
        const nx = 128 + Math.round(striation * 35);
        const ny = 128 + Math.round(Math.cos(y * 0.4) * 18);
        const nz = 255;
        imgData.data[idx] = Math.min(255, Math.max(0, nx));
        imgData.data[idx + 1] = Math.min(255, Math.max(0, ny));
        imgData.data[idx + 2] = nz;
        imgData.data[idx + 3] = 255;
      }
    }
    ctx.putImageData(imgData, 0, 0);
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(32, 2);
    return tex;
  }, []);

  // Dedicated organic PBR vascular materials with clearcoat sheen
  const vesselMaterials = useMemo(() => {
    const createVesselMat = (name: string) => {
      const mat = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color('#5A0A14'),
        roughness: 0.22,
        metalness: 0.08,
        clearcoat: 0.9,
        clearcoatRoughness: 0.1,
        normalMap: vascularNormalMap,
        normalScale: new THREE.Vector2(0.35, 0.35),
        transparent: true,
        opacity: 1.0,
        depthWrite: true,
        depthTest: true,
      });
      mat.name = name;
      return mat;
    };
    return {
      vessel_LAD: createVesselMat('mat_LAD'),
      vessel_LCX: createVesselMat('mat_LCX'),
      vessel_RCA: createVesselMat('mat_RCA'),
    };
  }, [vascularNormalMap]);

  // Load authentic medical 3D heart model with integrated 3D vascular conduits
  const { scene } = useGLTF('/models/heart_coronary_optimized.glb');

  // Clone scene and assign dedicated organic physical materials
  const clonedScene = useMemo(() => {
    const c = scene.clone(true);
    c.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        if (mesh.name === 'vessel_LAD') {
          mesh.material = vesselMaterials.vessel_LAD;
        } else if (mesh.name === 'vessel_LCX') {
          mesh.material = vesselMaterials.vessel_LCX;
        } else if (mesh.name === 'vessel_RCA') {
          mesh.material = vesselMaterials.vessel_RCA;
        } else {
          // Preserve 100% authentic photographic PBR texture on intact myocardium
          const mat = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
          if (mat) {
            const m = mat.clone() as THREE.MeshStandardMaterial;
            m.roughness = 0.35;
            m.metalness = 0.1;
            mesh.material = m;
          }
        }
      }
    });
    return c;
  }, [scene, vesselMaterials]);

  // Dynamic frame loop: updates organic color blending, emissive pulses, and focus dimming
  useFrame(({ clock }) => {
    const elapsed = clock.getElapsedTime();
    const predictions = analysis?.predictions?.vessels;

    // Resting heart rate frequency ~1.2 Hz (72 bpm)
    const pulse = (Math.sin(elapsed * 7.54) + 1.0) * 0.5;

    const vesselList: [string, any][] = [
      ['vessel_LAD', predictions?.lad],
      ['vessel_LCX', predictions?.lcx],
      ['vessel_RCA', predictions?.rca],
    ];

    const isGlobalFocus = activeVesselFocus === 'default';

    for (const [nodeName, pred] of vesselList) {
      const mat = (vesselMaterials as any)[nodeName] as THREE.MeshPhysicalMaterial;
      if (!mat) continue;

      const prob = pred?.probability ?? 0.15;
      const riskHex = pred?.color_hex ?? '#10B981';
      const isCritical = prob > 0.70;
      const isBorderline = prob > 0.40 && prob <= 0.70;

      const isThisFocused = activeVesselFocus === nodeName;
      const isThisHovered = hoveredVessel === nodeName;
      const isDimmed = !isGlobalFocus && !isThisFocused;

      // 1. Organic Color Blending: Blend risk color over deep blood-red base (#5A0A14)
      scratchColor.set(riskHex);
      let targetColor = baseBloodRed.clone();
      if (isCritical) {
        // Vivid arterial scarlet
        targetColor.lerp(scratchColor, 0.92);
      } else if (isBorderline) {
        // Deep glowing amber
        targetColor.lerp(scratchColor, 0.78);
      } else {
        // Emerald jade infused with organic blood-vessel depth
        targetColor.lerp(scratchColor, 0.70);
      }

      // 2. Focused vs Dimmed State Management
      if (isDimmed) {
        // Smoothly transition unselected vessels to dimmed, muted state
        mat.opacity = THREE.MathUtils.lerp(mat.opacity, 0.25, 0.15);
        mat.color.lerp(dimColor, 0.15);
        mat.emissive.setRGB(0, 0, 0);
        mat.emissiveIntensity = 0.0;
      } else {
        // Focused vessel or All Vessels mode
        mat.opacity = THREE.MathUtils.lerp(mat.opacity, 1.0, 0.15);
        mat.color.lerp(targetColor, 0.15);

        if (isThisFocused) {
          // Focused vessel maintains elevated emissive intensity (0.75)
          mat.emissive.set(riskHex);
          mat.emissiveIntensity = isCritical ? 0.75 + 0.35 * pulse : 0.75;
        } else if (isCritical) {
          // Critical vessels in All Vessels mode oscillate with 1.2 Hz pulse
          mat.emissive.set(riskHex);
          mat.emissiveIntensity = 0.65 + 0.45 * pulse;
        } else if (isThisHovered) {
          // Hover elevation
          mat.emissive.set(riskHex);
          mat.emissiveIntensity = 0.65;
        } else {
          // Standard baseline glow for patent vessel orientation
          mat.emissive.set(riskHex);
          mat.emissiveIntensity = isBorderline ? 0.42 : 0.30;
        }
      }
    }
  });

  const getIntersectedVessel = (e: any): string | null => {
    const name = e.object?.name;
    if (name === 'vessel_LAD' || name === 'vessel_LCX' || name === 'vessel_RCA') {
      return name;
    }
    return null;
  };

  const handlePointerOver = (e: any) => {
    e.stopPropagation();
    const vessel = getIntersectedVessel(e);
    if (vessel) {
      document.body.style.cursor = 'pointer';
      setHoveredVessel(vessel);
      onHoverVessel?.(vessel);
    } else {
      document.body.style.cursor = 'auto';
      setHoveredVessel(null);
      onHoverVessel?.(null);
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
    const vessel = getIntersectedVessel(e);
    if (vessel) {
      setVesselFocus(activeVesselFocus === vessel ? 'default' : vessel);
    } else {
      setVesselFocus('default');
    }
  };

  return (
    <group ref={groupRef} position={[0, 0, 0]} scale={[1.0, 1.0, 1.0]}>
      {/* Authentic Medical Human Heart with Native Integrated 3D Vascular Conduits */}
      <primitive
        object={clonedScene}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
      />
    </group>
  );
};

// Pre-load the authentic glTF model
useGLTF.preload('/models/heart_coronary_optimized.glb');
