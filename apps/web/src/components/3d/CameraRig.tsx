/**
 * 3D Camera Rig & Smooth Focal Interpolation (Perfusion3D Clinical DLS)
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
  all: {
    position: [0.0, 0.0, 3.1],
    target: [0.0, 0.0, 0.0],
  },
  vessel_LAD: {
    position: [0.08, -0.15, 2.2],
    target: [0.055, -0.20, 0.46],
  },
  vessel_LCX: {
    position: [2.2, 0.0, 0.2],
    target: [0.38, -0.05, -0.06],
  },
  vessel_RCA: {
    position: [-2.2, 0.05, 0.5],
    target: [-0.40, -0.05, 0.18],
  },
};

interface CameraRigProps {
  controlsRef: React.RefObject<any>;
  isUserInteracting?: boolean;
}

export const CameraRig: React.FC<CameraRigProps> = ({ controlsRef, isUserInteracting = false }) => {
  const { camera } = useThree();
  const activeFocus = usePatientStore((s) => s.activeVesselFocus);
  const isInitialMount = useRef(true);
  const isTransitioning = useRef(true);
  const prevFocus = useRef(activeFocus);

  // Cinematic Entry: Start slightly pulled back and smoothly dolly-in over the first 1.2s
  useEffect(() => {
    if (isInitialMount.current) {
      camera.position.set(0.0, 0.0, 3.9);
      isInitialMount.current = false;
      isTransitioning.current = true;
    }
  }, [camera]);

  // When activeFocus changes explicitly (and user is not dragging), initiate smooth one-shot lerp
  useEffect(() => {
    if (activeFocus !== prevFocus.current) {
      prevFocus.current = activeFocus;
      // Only initiate lerp if user is NOT currently interacting
      if (!isUserInteracting) {
        isTransitioning.current = true;
      } else {
        isTransitioning.current = false;
      }
    }
  }, [activeFocus, isUserInteracting]);

  // If user starts interacting, cancel any active transition immediately
  useEffect(() => {
    if (isUserInteracting) {
      isTransitioning.current = false;
    }
  }, [isUserInteracting]);

  // Pre-allocated scratch vectors to prevent runtime GC pressure
  const targetPos = useRef(new THREE.Vector3());
  const targetLook = useRef(new THREE.Vector3());

  useFrame((_, delta) => {
    // Disable lerping during user interaction or after arrival at target
    if (isUserInteracting || !isTransitioning.current) {
      return;
    }

    const preset = CAMERA_PRESETS[activeFocus] || CAMERA_PRESETS.default;
    targetPos.current.set(...preset.position);
    targetLook.current.set(...preset.target);

    // Smooth exponential damping (speed factor 3.2 for buttery cinematic ease)
    const lerpFactor = Math.min(1.0, delta * 3.2);

    camera.position.lerp(targetPos.current, lerpFactor);

    if (controlsRef.current) {
      controlsRef.current.target.lerp(targetLook.current, lerpFactor);
      controlsRef.current.update();

      const distPos = camera.position.distanceTo(targetPos.current);
      const distTarget = controlsRef.current.target.distanceTo(targetLook.current);

      // Once arrived within 0.01 tolerance, disable lerping to give immediate orbital control
      if (distPos < 0.01 && distTarget < 0.01) {
        isTransitioning.current = false;
      }
    }
  });

  return null;
};
