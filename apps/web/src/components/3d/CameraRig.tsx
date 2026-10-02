/**
 * 3D Camera Rig & Smooth Focal Interpolation (AuraCor Clinical DLS)
 * Multimodal AI Hackathon 2026 - Track A: Cardiovascular Risk Visualization & Prediction
 */

import React, { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { usePatientStore } from '../../store/usePatientStore';

// Calibrated camera positions and focal targets matching normalized heart geometry
const CAMERA_PRESETS: Record<string, { position: [number, number, number]; target: [number, number, number] }> = {
  default: {
    position: [0.0, 0.3, 5.2],
    target: [0.0, 0.0, 0.0],
  },
  vessel_LAD: {
    position: [0.4, -0.2, 3.8],
    target: [0.2, -0.45, 0.35],
  },
  vessel_LCX: {
    position: [3.8, 0.2, 0.5],
    target: [0.43, -0.24, -0.1],
  },
  vessel_RCA: {
    position: [-3.6, 0.1, 1.8],
    target: [-0.34, -0.4, 0.05],
  },
};

interface CameraRigProps {
  controlsRef: React.RefObject<any>;
}

export const CameraRig: React.FC<CameraRigProps> = ({ controlsRef }) => {
  const { camera } = useThree();
  const activeFocus = usePatientStore((s) => s.activeVesselFocus);

  // Pre-allocated scratch vectors to prevent runtime GC pressure
  const targetPos = useRef(new THREE.Vector3());
  const targetLook = useRef(new THREE.Vector3());

  useFrame((_, delta) => {
    const preset = CAMERA_PRESETS[activeFocus] || CAMERA_PRESETS.default;
    targetPos.current.set(...preset.position);
    targetLook.current.set(...preset.target);

    // Smooth exponential damping (speed factor 4.0)
    const lerpFactor = Math.min(1.0, delta * 4.0);

    camera.position.lerp(targetPos.current, lerpFactor);

    if (controlsRef.current) {
      controlsRef.current.target.lerp(targetLook.current, lerpFactor);
      controlsRef.current.update();
    }
  });

  return null;
};
