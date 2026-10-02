/**
 * 3D Camera Rig & Smooth Focal Interpolation
 * Multimodal AI Hackathon 2026 - Track A: Cardiovascular Risk Visualization & Prediction
 */

import React, { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { usePatientStore } from '../../store/usePatientStore';

const CAMERA_PRESETS: Record<string, { position: [number, number, number]; target: [number, number, number] }> = {
  default: {
    position: [0.0, 0.5, 4.2],
    target: [0.0, 0.0, 0.0],
  },
  vessel_LAD: {
    position: [0.35, -0.2, 2.6],
    target: [0.18, -0.5, 0.5],
  },
  vessel_LCX: {
    position: [2.8, -0.2, -0.5],
    target: [0.65, -0.3, -0.3],
  },
  vessel_RCA: {
    position: [-2.6, -0.2, 1.2],
    target: [-0.55, -0.4, 0.1],
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

    // Smooth cubic exponential easing (speed: 4.5 * delta)
    const lerpFactor = Math.min(1.0, delta * 4.5);

    camera.position.lerp(targetPos.current, lerpFactor);

    if (controlsRef.current) {
      controlsRef.current.target.lerp(targetLook.current, lerpFactor);
      controlsRef.current.update();
    }
  });

  return null;
};
