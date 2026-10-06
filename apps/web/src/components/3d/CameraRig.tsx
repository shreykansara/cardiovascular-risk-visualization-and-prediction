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
    position: [0.0, 0.0, 3.1],
    target: [0.0, 0.0, 0.0],
  },
  vessel_LCX: {
    position: [1.99, 0.0, 2.37],
    target: [0.15, -0.05, 0.0],
  },
  vessel_RCA: {
    position: [-1.99, 0.05, 2.37],
    target: [-0.15, -0.05, 0.0],
  },
};

interface CameraRigProps {
  controlsRef: React.RefObject<any>;
  isUserInteracting?: boolean;
  focus?: string;
  enableIntroSway?: boolean;
}

export const CameraRig: React.FC<CameraRigProps> = ({
  controlsRef,
  isUserInteracting = false,
  focus,
  enableIntroSway = false,
}) => {
  const { camera } = useThree();
  const storeFocus = usePatientStore((s) => s.activeVesselFocus);
  const activeFocus = focus !== undefined ? focus : storeFocus;
  const isInitialMount = useRef(true);
  const isTransitioning = useRef(true);
  const prevFocus = useRef(activeFocus);

  // Intro sway tracking (+10 deg, -10 deg, back to 0 over 2400ms, once per session)
  const swayElapsed = useRef<number | null>(null);
  const isSwayActive = useRef(false);

  // Cinematic Entry / Initial placement
  useEffect(() => {
    if (isInitialMount.current) {
      const prefersReducedMotion =
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      if (prefersReducedMotion) {
        camera.position.set(0.0, 0.0, 3.1);
        isInitialMount.current = false;
        isTransitioning.current = false;
        return;
      }

      camera.position.set(0.0, 0.0, 3.1);
      isInitialMount.current = false;
      isTransitioning.current = false;

      // Check session storage for intro sway
      if (enableIntroSway && typeof window !== 'undefined') {
        const hasSwayed = sessionStorage.getItem('perfusion3d_intro_swayed');
        if (!hasSwayed) {
          isSwayActive.current = true;
          swayElapsed.current = 0;
          sessionStorage.setItem('perfusion3d_intro_swayed', '1');
        }
      }
    }
  }, [camera, enableIntroSway]);

  // When activeFocus changes explicitly (and user is not dragging), initiate smooth lerp
  useEffect(() => {
    if (activeFocus !== prevFocus.current) {
      prevFocus.current = activeFocus;
      // Stop sway on selection
      isSwayActive.current = false;

      const prefersReducedMotion =
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      const preset = CAMERA_PRESETS[activeFocus] || CAMERA_PRESETS.default;

      if (prefersReducedMotion) {
        camera.position.set(...preset.position);
        if (controlsRef.current) {
          controlsRef.current.target.set(...preset.target);
          controlsRef.current.update();
        }
        isTransitioning.current = false;
        return;
      }

      if (!isUserInteracting) {
        isTransitioning.current = true;
      } else {
        isTransitioning.current = false;
      }
    }
  }, [activeFocus, isUserInteracting, camera, controlsRef]);

  // If user starts interacting, cancel any active transition or sway immediately
  useEffect(() => {
    if (isUserInteracting) {
      isTransitioning.current = false;
      isSwayActive.current = false;
    }
  }, [isUserInteracting]);

  // Pre-allocated scratch vectors
  const targetPos = useRef(new THREE.Vector3());
  const targetLook = useRef(new THREE.Vector3());

  useFrame((_, delta) => {
    // 1. One-shot intro sway (2400ms duration, +10 deg -> -10 deg -> 0)
    if (isSwayActive.current && !isUserInteracting && swayElapsed.current !== null) {
      swayElapsed.current += delta;
      const t = swayElapsed.current / 2.4; // 0 to 1
      if (t >= 1.0) {
        isSwayActive.current = false;
        camera.position.set(0.0, 0.0, 3.1);
        if (controlsRef.current) {
          controlsRef.current.target.set(0, 0, 0);
          controlsRef.current.update();
        }
      } else {
        // Smooth sine oscillation: +10 deg, -10 deg, back to 0
        const angle = Math.sin(t * Math.PI * 2) * (10.0 * (Math.PI / 180.0));
        const dist = 3.1;
        camera.position.x = Math.sin(angle) * dist;
        camera.position.z = Math.cos(angle) * dist;
        camera.position.y = 0.0;
        if (controlsRef.current) {
          controlsRef.current.target.set(0, 0, 0);
          controlsRef.current.update();
        }
        return;
      }
    }

    // 2. Focal transition lerp
    if (isUserInteracting || !isTransitioning.current) {
      return;
    }

    const preset = CAMERA_PRESETS[activeFocus] || CAMERA_PRESETS.default;
    targetPos.current.set(...preset.position);
    targetLook.current.set(...preset.target);

    // Speed factor ~5.0 for ~500ms duration
    const lerpFactor = Math.min(1.0, delta * 5.0);

    camera.position.lerp(targetPos.current, lerpFactor);

    if (controlsRef.current) {
      controlsRef.current.target.lerp(targetLook.current, lerpFactor);
      controlsRef.current.update();

      const distPos = camera.position.distanceTo(targetPos.current);
      const distTarget = controlsRef.current.target.distanceTo(targetLook.current);

      if (distPos < 0.01 && distTarget < 0.01) {
        isTransitioning.current = false;
      }
    }
  });

  return null;
};
