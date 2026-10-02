/**
 * 3D Camera Rig & Smooth Focal Interpolation (AuraCor Clinical DLS)
 * Multimodal AI Hackathon 2026 - Track A: Cardiovascular Risk Visualization & Prediction
 */

import React, { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { usePatientStore } from '../../store/usePatientStore';

// Camera presets calibrated for the authentic medical 3D heart model
const CAMERA_PRESETS: Record<string, { position: [number, number, number]; target: [number, number, number] }> = {
  default: {
    position: [0.0, 0.2, 5.8],
    target: [0.0, 0.0, 0.0],
  },
  vessel_LAD: {
    position: [0.3, -0.3, 4.2],
    target: [0.08, -0.55, 0.6],
  },
  vessel_LCX: {
    position: [4.4, 0.0, 0.8],
    target: [0.75, -0.25, -0.15],
  },
  vessel_RCA: {
    position: [-4.4, 0.0, 1.8],
    target: [-0.85, -0.35, 0.15],
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
