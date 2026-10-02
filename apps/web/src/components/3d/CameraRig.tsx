/**
 * 3D Camera Rig & Smooth Focal Interpolation (AuraCor Clinical DLS)
 * Multimodal AI Hackathon 2026 - Track A: Cardiovascular Risk Visualization & Prediction
 */

import React, { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { usePatientStore } from '../../store/usePatientStore';

// Camera presets calibrated for authentic medical 3D heart model (1.6 units tall, filling 70% viewport)
const CAMERA_PRESETS: Record<string, { position: [number, number, number]; target: [number, number, number] }> = {
  default: {
    position: [0.0, 0.0, 3.1],
    target: [0.0, 0.0, 0.0],
  },
  vessel_LAD: {
    position: [0.0, -0.2, 2.2],
    target: [-0.04, -0.25, 0.45],
  },
  vessel_LCX: {
    position: [2.2, 0.0, 0.2],
    target: [0.38, -0.05, -0.06],
  },
  vessel_RCA: {
    position: [-2.2, -0.05, 0.4],
    target: [-0.48, -0.15, 0.05],
  },
};

interface CameraRigProps {
  controlsRef: React.RefObject<any>;
}

export const CameraRig: React.FC<CameraRigProps> = ({ controlsRef }) => {
  const { camera } = useThree();
  const activeFocus = usePatientStore((s) => s.activeVesselFocus);
  const isInitialMount = useRef(true);

  // Cinematic Entry: Start slightly pulled back and smoothly dolly-in over the first 1.2s
  useEffect(() => {
    if (isInitialMount.current) {
      camera.position.set(0.0, 0.0, 3.9);
      isInitialMount.current = false;
    }
  }, [camera]);

  // Pre-allocated scratch vectors to prevent runtime GC pressure
  const targetPos = useRef(new THREE.Vector3());
  const targetLook = useRef(new THREE.Vector3());

  useFrame((_, delta) => {
    const preset = CAMERA_PRESETS[activeFocus] || CAMERA_PRESETS.default;
    targetPos.current.set(...preset.position);
    targetLook.current.set(...preset.target);

    // Smooth exponential damping (speed factor 3.2 for buttery cinematic ease)
    const lerpFactor = Math.min(1.0, delta * 3.2);

    camera.position.lerp(targetPos.current, lerpFactor);

    if (controlsRef.current) {
      controlsRef.current.target.lerp(targetLook.current, lerpFactor);
      controlsRef.current.update();
    }
  });

  return null;
};
