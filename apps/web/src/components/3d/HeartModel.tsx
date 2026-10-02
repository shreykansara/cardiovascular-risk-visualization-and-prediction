/**
 * 3D Anatomical Heart Model & Native Coronary Material Shaders (AuraCor Clinical DLS)
 * Multimodal AI Hackathon 2026 - Track A: Cardiovascular Risk Visualization & Prediction
 *
 * Integrates an authentic pre-modeled, production-grade 3D human heart digital twin
 * with coronary arteries (vessel_LAD, vessel_LCX, vessel_RCA) partitioned directly
 * into the native mesh geometry and material slots.
 *
 * Completely eliminates detached tubes/splines. Retains authentic normal maps,
 * specular highlights, and surface curvature with zero floating gaps or occlusion artifacts.
 */

import React, { useRef, useMemo, useState } from 'react';
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
  const dimColor = useMemo(() => new THREE.Color('#334155'), []);

  // Load authentic medical 3D heart model with segmented coronary sub-meshes
  const { scene } = useGLTF('/models/heart_coronary_optimized.glb');

  // Clone scene and deeply clone materials on mount so instances are isolated
  const clonedScene = useMemo(() => {
    const c = scene.clone(true);
    c.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        if (Array.isArray(mesh.material)) {
          mesh.material = mesh.material.map((m) => m.clone());
        } else if (mesh.material) {
          mesh.material = mesh.material.clone();
        }
      }
    });
    return c;
  }, [scene]);

  // Dynamic frame loop: updates native sub-mesh material colors, emissive pulses, and focus dimming
  useFrame(({ clock }) => {
    const elapsed = clock.getElapsedTime();
    const predictions = analysis?.predictions?.vessels;

    const ladColorHex = predictions?.lad?.color_hex ?? '#10B981';
    const lcxColorHex = predictions?.lcx?.color_hex ?? '#10B981';
    const rcaColorHex = predictions?.rca?.color_hex ?? '#10B981';

    const isLadCritical = (predictions?.lad?.probability ?? 0) > 0.70;
    const isLcxCritical = (predictions?.lcx?.probability ?? 0) > 0.70;
    const isRcaCritical = (predictions?.rca?.probability ?? 0) > 0.70;

    // Resting heart rate frequency ~1.2 Hz (72 bpm)
    const pulse = (Math.sin(elapsed * 7.5) + 1.0) * 0.5;

    clonedScene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const mat = mesh.material as THREE.MeshStandardMaterial;
        if (!mat) return;

        // 1. LAD Artery (Left Anterior Descending)
        if (mesh.name === 'vessel_LAD' || mat.name === 'mat_LAD') {
          const isSelected = activeVesselFocus === 'vessel_LAD';
          const isHovered = hoveredVessel === 'vessel_LAD';
          const isDimmed = activeVesselFocus !== 'default' && !isSelected;

          if (isDimmed) {
            mat.color.lerp(dimColor, 0.15);
            mat.emissive.set('#000000');
            mat.emissiveIntensity = 0.0;
          } else {
            scratchColor.set(ladColorHex);
            mat.color.lerp(scratchColor, 0.15);
            mat.roughness = 0.25;
            mat.metalness = 0.1;
            if (isLadCritical) {
              mat.emissive.set(ladColorHex);
              mat.emissiveIntensity = 0.6 + 0.6 * pulse;
            } else if (isSelected || isHovered) {
              mat.emissive.set(ladColorHex);
              mat.emissiveIntensity = 0.6;
            } else {
              mat.emissive.set(ladColorHex);
              mat.emissiveIntensity = 0.25;
            }
          }
        }
        // 2. LCX Artery (Left Circumflex)
        else if (mesh.name === 'vessel_LCX' || mat.name === 'mat_LCX') {
          const isSelected = activeVesselFocus === 'vessel_LCX';
          const isHovered = hoveredVessel === 'vessel_LCX';
          const isDimmed = activeVesselFocus !== 'default' && !isSelected;

          if (isDimmed) {
            mat.color.lerp(dimColor, 0.15);
            mat.emissive.set('#000000');
            mat.emissiveIntensity = 0.0;
          } else {
            scratchColor.set(lcxColorHex);
            mat.color.lerp(scratchColor, 0.15);
            mat.roughness = 0.25;
            mat.metalness = 0.1;
            if (isLcxCritical) {
              mat.emissive.set(lcxColorHex);
              mat.emissiveIntensity = 0.6 + 0.6 * pulse;
            } else if (isSelected || isHovered) {
              mat.emissive.set(lcxColorHex);
              mat.emissiveIntensity = 0.6;
            } else {
              mat.emissive.set(lcxColorHex);
              mat.emissiveIntensity = 0.25;
            }
          }
        }
        // 3. RCA Artery (Right Coronary Artery)
        else if (mesh.name === 'vessel_RCA' || mat.name === 'mat_RCA') {
          const isSelected = activeVesselFocus === 'vessel_RCA';
          const isHovered = hoveredVessel === 'vessel_RCA';
          const isDimmed = activeVesselFocus !== 'default' && !isSelected;

          if (isDimmed) {
            mat.color.lerp(dimColor, 0.15);
            mat.emissive.set('#000000');
            mat.emissiveIntensity = 0.0;
          } else {
            scratchColor.set(rcaColorHex);
            mat.color.lerp(scratchColor, 0.15);
            mat.roughness = 0.25;
            mat.metalness = 0.1;
            if (isRcaCritical) {
              mat.emissive.set(rcaColorHex);
              mat.emissiveIntensity = 0.6 + 0.6 * pulse;
            } else if (isSelected || isHovered) {
              mat.emissive.set(rcaColorHex);
              mat.emissiveIntensity = 0.6;
            } else {
              mat.emissive.set(rcaColorHex);
              mat.emissiveIntensity = 0.25;
            }
          }
        }
        // 4. Muscular Myocardium (Preserves natural living tissue PBR texture)
        else {
          mat.color.set('#ffffff');
          mat.roughness = 0.35;
          mat.metalness = 0.1;
          mat.emissive.set('#000000');
          mat.emissiveIntensity = 0.0;
        }
      }
    });
  });

  const getIntersectedVessel = (e: any): string | null => {
    const name = e.object?.name;
    const matName = e.object?.material?.name;
    if (name === 'vessel_LAD' || matName === 'mat_LAD') return 'vessel_LAD';
    if (name === 'vessel_LCX' || matName === 'mat_LCX') return 'vessel_LCX';
    if (name === 'vessel_RCA' || matName === 'mat_RCA') return 'vessel_RCA';
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
      {/* Authentic Medical Human Heart with Native Integrated Coronary Arteries */}
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
