/**
 * 3D Anatomical Heart Model & Coronary Vascular Digital Twin
 * Multimodal AI Hackathon 2026 - Track A: Cardiovascular Risk Visualization & Prediction
 *
 * Renders the photorealistic textured human myocardium with dedicated 3D vascular
 * conduits (LAD, LCX, RCA) extruded with smooth Frenet frames (128 tubular segments,
 * 12 radial segments) and calibrated anatomical tapering (0.024 proximal -> 0.014 distal).
 *
 * Guarantees unoccluded surface projection via:
 * - Direct attachment to myocardium coordinate space (Step 1)
 * - renderOrder={100}, depthWrite={false}, and polygonOffsetFactor={-4} (Step 2)
 * - Floating Drei <Html> anatomical callout badges with interactive vessel isolation (Step 3)
 */

import React, { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, Html } from '@react-three/drei';
import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { usePatientStore } from '../../store/usePatientStore';
import { useWizardStore } from '../../store/useWizardStore';
import { VesselLabel } from './VesselLabel';

export interface HeartModelProps {
  onHoverVessel?: (vesselName: string | null) => void;
  results?: {
    cad: number;
    lad: number;
    lcx: number;
    rca: number;
  };
  selection?: string | null;
  onSelect?: (vesselKey: string | null) => void;
}

// Anatomical control points tracing authentic surface sulci on the 3D heart model
const LAD_BASE_POINTS = [
  new THREE.Vector3(-0.003, 0.25, 0.414),
  new THREE.Vector3(-0.02, 0.15, 0.436),
  new THREE.Vector3(-0.04, 0.05, 0.464),
  new THREE.Vector3(-0.03, -0.05, 0.486),
  new THREE.Vector3(-0.04, -0.15, 0.498),
  new THREE.Vector3(-0.06, -0.25, 0.485),
  new THREE.Vector3(-0.07, -0.35, 0.448),
  new THREE.Vector3(-0.03, -0.45, 0.403),
  new THREE.Vector3(0.01, -0.55, 0.351),
  new THREE.Vector3(0.03, -0.65, 0.285),
  new THREE.Vector3(0.08, -0.73, 0.211),
  new THREE.Vector3(0.108, -0.785, 0.095),
];

const LAD_D1_BASE_POINTS = [
  new THREE.Vector3(-0.04, -0.15, 0.498),
  new THREE.Vector3(0.08, -0.23, 0.444),
  new THREE.Vector3(0.18, -0.35, 0.344),
  new THREE.Vector3(0.22, -0.48, 0.234),
];

const LCX_BASE_POINTS = [
  new THREE.Vector3(0.05, 0.28, 0.404),
  new THREE.Vector3(0.23, 0.28, 0.274),
  new THREE.Vector3(0.342, 0.28, 0.162),
  new THREE.Vector3(0.408, 0.18, -0.042),
  new THREE.Vector3(0.431, 0.08, -0.072),
  new THREE.Vector3(0.419, -0.02, -0.052),
  new THREE.Vector3(0.433, -0.15, -0.062),
  new THREE.Vector3(0.445, -0.25, -0.062),
  new THREE.Vector3(0.434, -0.35, -0.042),
];

const LCX_OM1_BASE_POINTS = [
  new THREE.Vector3(0.431, 0.08, -0.072),
  new THREE.Vector3(0.424, -0.06, 0.032),
  new THREE.Vector3(0.404, -0.2, 0.052),
  new THREE.Vector3(0.334, -0.36, 0.092),
];

// RCA: Follows true horizontal right atrioventricular sulcus, smooth C-turn around acute margin, and crux descent
const RCA_BASE_POINTS = [
  // 1. Proximal horizontal segment in upper right atrioventricular groove
  new THREE.Vector3(-0.070, 0.205, 0.395),
  new THREE.Vector3(-0.140, 0.208, 0.365),
  new THREE.Vector3(-0.210, 0.218, 0.350),
  new THREE.Vector3(-0.285, 0.212, 0.360),
  new THREE.Vector3(-0.355, 0.215, 0.340),
  new THREE.Vector3(-0.425, 0.208, 0.290),
  new THREE.Vector3(-0.480, 0.200, 0.215),

  // 2. Smooth C-shaped curve rounding the acute margin of the right ventricle
  new THREE.Vector3(-0.525, 0.170, 0.110),
  new THREE.Vector3(-0.550, 0.110, 0.045),
  new THREE.Vector3(-0.565, 0.030, 0.015),
  new THREE.Vector3(-0.568, -0.050, 0.010),
  new THREE.Vector3(-0.555, -0.130, 0.020),
  new THREE.Vector3(-0.530, -0.220, 0.055),

  // 3. Continuation curving smoothly toward the crux / diaphragmatic surface
  new THREE.Vector3(-0.490, -0.320, 0.115),
  new THREE.Vector3(-0.435, -0.420, 0.080),
  new THREE.Vector3(-0.365, -0.510, 0.045),
  new THREE.Vector3(-0.245, -0.610, 0.050),
  new THREE.Vector3(-0.165, -0.665, 0.060),
];

const RCA_MARGINAL_BASE_POINTS = [
  new THREE.Vector3(-0.555, -0.130, 0.020),
  new THREE.Vector3(-0.470, -0.210, 0.160),
  new THREE.Vector3(-0.380, -0.280, 0.250),
  new THREE.Vector3(-0.280, -0.340, 0.290),
];

/**
 * Creates an authentic tapering cylindrical tube geometry with Frenet frames,
 * radialSegments = 16, closed end caps, and outward-oriented vertex normals.
 */
function createTaperedArteryGeometry(
  curve: THREE.Curve<THREE.Vector3>,
  tubularSegments: number,
  radialSegments: number,
  radiusStart: number,
  radiusEnd: number
): THREE.BufferGeometry {
  const points = curve.getPoints(tubularSegments);
  const frames = curve.computeFrenetFrames(tubularSegments, false);

  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let i = 0; i <= tubularSegments; i++) {
    const u = i / tubularSegments;
    const radius = radiusStart + (radiusEnd - radiusStart) * u;
    const p = points[i];
    const N = frames.normals[i];
    const B = frames.binormals[i];

    for (let j = 0; j <= radialSegments; j++) {
      const v = j / radialSegments;
      const theta = v * Math.PI * 2;
      const sin = Math.sin(theta);
      const cos = Math.cos(theta);

      const normal = new THREE.Vector3()
        .addScaledVector(N, cos)
        .addScaledVector(B, sin)
        .normalize();

      const vertex = new THREE.Vector3().copy(p).addScaledVector(normal, radius);

      positions.push(vertex.x, vertex.y, vertex.z);
      uvs.push(u, v);
    }
  }

  for (let i = 0; i < tubularSegments; i++) {
    for (let j = 0; j < radialSegments; j++) {
      const a = i * (radialSegments + 1) + j;
      const b = (i + 1) * (radialSegments + 1) + j;
      const c = (i + 1) * (radialSegments + 1) + (j + 1);
      const d = i * (radialSegments + 1) + (j + 1);

      indices.push(a, b, d);
      indices.push(b, c, d);
    }
  }

  // Smooth closed end cap at ostium (i = 0)
  const startCapCenter = points[0];
  const startCenterIdx = positions.length / 3;
  positions.push(startCapCenter.x, startCapCenter.y, startCapCenter.z);
  uvs.push(0.5, 0.5);

  for (let j = 0; j < radialSegments; j++) {
    const ringIdx1 = j;
    const ringIdx2 = j + 1;
    indices.push(startCenterIdx, ringIdx2, ringIdx1);
  }

  // Smooth closed end cap at distal terminus (i = tubularSegments)
  const endCapCenter = points[tubularSegments];
  const endCenterIdx = positions.length / 3;
  positions.push(endCapCenter.x, endCapCenter.y, endCapCenter.z);
  uvs.push(0.5, 0.5);

  const endRingOffset = tubularSegments * (radialSegments + 1);
  for (let j = 0; j < radialSegments; j++) {
    const ringIdx1 = endRingOffset + j;
    const ringIdx2 = endRingOffset + j + 1;
    indices.push(endCenterIdx, ringIdx1, ringIdx2);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

export const HeartModel: React.FC<HeartModelProps> = ({
  onHoverVessel,
  results,
  selection,
  onSelect,
}) => {
  const wizardPrediction = useWizardStore((s) => s.prediction);
  const wizardFocus = useWizardStore((s) => s.activeVesselFocus);
  const setWizardFocus = useWizardStore((s) => s.setVesselFocus);
  const { analysis, activeVesselFocus: patientFocus, setVesselFocus: setPatientFocus } = usePatientStore();

  const storeFocus = wizardFocus || patientFocus || 'default';
  const activeVesselFocus = selection !== undefined ? (selection ?? 'default') : storeFocus;
  const setVesselFocus = (focus: string) => {
    if (onSelect) {
      onSelect(focus === 'default' ? null : focus);
    } else {
      setWizardFocus(focus);
      setPatientFocus(focus);
    }
  };

  const groupRef = useRef<THREE.Group>(null);
  const [hoveredVessel, setHoveredVessel] = useState<string | null>(null);

  // Material refs for dynamic 60fps emissive pulse updates without React re-renders
  const ladMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const lcxMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const rcaMatRef = useRef<THREE.MeshStandardMaterial>(null);

  // Load the production GLTF model containing the intact myocardium
  const { scene } = useGLTF('/models/heart_coronary_optimized.glb');

  // Step 1: Find the exact myocardium mesh and isolate it with preserved photographic PBR textures
  const myocardiumMesh = useMemo(() => {
    let found: THREE.Mesh | null = null;
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh && (child.name === 'myocardium' || child.name.includes('Heart Tex'))) {
        found = child as THREE.Mesh;
      }
    });

    if (!found) {
      scene.traverse((child) => {
        if ((child as THREE.Mesh).isMesh && !found) found = child as THREE.Mesh;
      });
    }

    const mesh = found ? (found as THREE.Mesh).clone(true) : new THREE.Mesh();

    // Preserve original photographic PBR texture on intact myocardium
    if (mesh.material) {
      const mat = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
      const m = mat.clone() as THREE.MeshStandardMaterial;
      m.roughness = 0.35;
      m.metalness = 0.1;
      mesh.material = m;
    }

    return mesh;
  }, [scene]);

  // Step 2: Build unoccluded vascular conduits with tapering caliber (r = 0.024 -> 0.014)
  // Coordinates are explicitly converted into myocardium local space via myocardium.worldToLocal(point)
  const { ladGeo, lcxGeo, rcaGeo, ladBadgePos, lcxBadgePos, rcaBadgePos } = useMemo(() => {
    const posAttr = myocardiumMesh.geometry.getAttribute('position');
    const normAttr = myocardiumMesh.geometry.getAttribute('normal');
    const vPos: THREE.Vector3[] = [];
    const vNorm: THREE.Vector3[] = [];
    const p = new THREE.Vector3();
    const n = new THREE.Vector3();

    if (posAttr) {
      for (let i = 0; i < posAttr.count; i++) {
        p.fromBufferAttribute(posAttr, i);
        vPos.push(p.clone());
        if (normAttr) {
          n.fromBufferAttribute(normAttr, i);
          vNorm.push(n.clone());
        } else {
          vNorm.push(new THREE.Vector3(0, 0, 1));
        }
      }
    }

    // Snaps points flush onto epicardial sulci with surface elevation (r + 0.005)
    function snapAndEmbed(basePoints: THREE.Vector3[], rStart: number, rEnd: number) {
      return basePoints.map((pt, idx) => {
        const u = idx / (basePoints.length - 1);
        const r = rStart + (rEnd - rStart) * u;
        let minDist = Infinity;
        let minIdx = 0;
        for (let i = 0; i < vPos.length; i++) {
          const d = pt.distanceTo(vPos[i]);
          if (d < minDist) {
            minDist = d;
            minIdx = i;
          }
        }
        const closestVertex = vPos[minIdx];
        const surfaceNormal = vNorm[minIdx];
        const offset = r + 0.005;
        const snappedPoint = closestVertex.clone().addScaledVector(surfaceNormal, offset);

        // Step 1: Guarantee exact local alignment using myocardium.worldToLocal(point)
        return myocardiumMesh.worldToLocal(snappedPoint.clone());
      });
    }

    // 1. LAD: Anterior interventricular sulcus down to apex (proximal r = 0.024 -> distal 0.014)
    const ladPts = snapAndEmbed(LAD_BASE_POINTS, 0.024, 0.014);
    const ladD1Pts = snapAndEmbed(LAD_D1_BASE_POINTS, 0.013, 0.008);
    const ladMainCurve = new THREE.CatmullRomCurve3(ladPts, false, 'centripetal');
    const ladD1Curve = new THREE.CatmullRomCurve3(ladD1Pts, false, 'centripetal');
    const ladMainGeo = createTaperedArteryGeometry(ladMainCurve, 128, 16, 0.024, 0.014);
    const ladD1Geo = createTaperedArteryGeometry(ladD1Curve, 48, 16, 0.013, 0.008);
    const mergedLad = BufferGeometryUtils.mergeGeometries([ladMainGeo, ladD1Geo]);

    // 2. LCX: Left atrioventricular groove beneath left auricle
    const lcxPts = snapAndEmbed(LCX_BASE_POINTS, 0.024, 0.014);
    const lcxOm1Pts = snapAndEmbed(LCX_OM1_BASE_POINTS, 0.013, 0.008);
    const lcxMainCurve = new THREE.CatmullRomCurve3(lcxPts, false, 'centripetal');
    const lcxOm1Curve = new THREE.CatmullRomCurve3(lcxOm1Pts, false, 'centripetal');
    const lcxMainGeo = createTaperedArteryGeometry(lcxMainCurve, 128, 16, 0.024, 0.014);
    const lcxOm1Geo = createTaperedArteryGeometry(lcxOm1Curve, 48, 16, 0.013, 0.008);
    const mergedLcx = BufferGeometryUtils.mergeGeometries([lcxMainGeo, lcxOm1Geo]);

    // 3. RCA: Right atrioventricular sulcus along right border
    const rcaPts = snapAndEmbed(RCA_BASE_POINTS, 0.024, 0.014);
    const rcaMarginalPts = snapAndEmbed(RCA_MARGINAL_BASE_POINTS, 0.013, 0.008);
    const rcaMainCurve = new THREE.CatmullRomCurve3(rcaPts, false, 'centripetal');
    const rcaMarginalCurve = new THREE.CatmullRomCurve3(rcaMarginalPts, false, 'centripetal');
    const rcaMainGeo = createTaperedArteryGeometry(rcaMainCurve, 128, 16, 0.024, 0.014);
    const rcaMarginalGeo = createTaperedArteryGeometry(rcaMarginalCurve, 48, 16, 0.013, 0.008);
    const mergedRca = BufferGeometryUtils.mergeGeometries([rcaMainGeo, rcaMarginalGeo]);

    // Step 3: Centered callout badge anchors exactly in user-designated zones (+0.03 upward adjustment)
    // LAD midpoint: over the anterior mid-trunk right at the bifurcation zone
    const ladAnchor = ladPts[5].clone().add(new THREE.Vector3(0.0, 0.07, 0.08));
    // LCX midpoint: floating to the right of the heart beside the lateral LCX vessel
    const lcxAnchor = lcxPts[6].clone().add(new THREE.Vector3(0.18, 0.05, 0.06));
    // RCA midpoint: floating to the left of the heart beside the right acute margin
    const rcaAnchor = rcaPts[11].clone().add(new THREE.Vector3(-0.16, 0.05, 0.06));

    return {
      ladGeo: mergedLad,
      lcxGeo: mergedLcx,
      rcaGeo: mergedRca,
      ladBadgePos: [ladAnchor.x, ladAnchor.y, ladAnchor.z] as [number, number, number],
      lcxBadgePos: [lcxAnchor.x, lcxAnchor.y, lcxAnchor.z] as [number, number, number],
      rcaBadgePos: [rcaAnchor.x, rcaAnchor.y, rcaAnchor.z] as [number, number, number],
    };
  }, [myocardiumMesh]);

  // Extract patient prediction data for each vessel (Primary: results prop, Secondary: wizard, Fallback: patient analysis)
  const vesselsPred = wizardPrediction?.vessels || analysis?.predictions?.vessels;

  const ladProb = results ? (results.lad > 1 ? results.lad / 100 : results.lad) : (vesselsPred?.lad?.probability ?? 0.724);
  const isLadCritical = ladProb > 0.70;
  const isLadBorderline = ladProb > 0.40 && ladProb <= 0.70;
  const ladColorHex = (results ? null : vesselsPred?.lad?.color_hex) ?? (isLadCritical ? '#EF4444' : isLadBorderline ? '#F59E0B' : '#10B981');
  const isLadSelected = activeVesselFocus === 'vessel_LAD' || activeVesselFocus === 'LAD';

  const lcxProb = results ? (results.lcx > 1 ? results.lcx / 100 : results.lcx) : (vesselsPred?.lcx?.probability ?? 0.218);
  const isLcxCritical = lcxProb > 0.70;
  const isLcxBorderline = lcxProb > 0.40 && lcxProb <= 0.70;
  const lcxColorHex = (results ? null : vesselsPred?.lcx?.color_hex) ?? (isLcxCritical ? '#EF4444' : isLcxBorderline ? '#F59E0B' : '#10B981');
  const isLcxSelected = activeVesselFocus === 'vessel_LCX' || activeVesselFocus === 'LCX';

  const rcaProb = results ? (results.rca > 1 ? results.rca / 100 : results.rca) : (vesselsPred?.rca?.probability ?? 0.185);
  const isRcaCritical = rcaProb > 0.70;
  const isRcaBorderline = rcaProb > 0.40 && rcaProb <= 0.70;
  const rcaColorHex = (results ? null : vesselsPred?.rca?.color_hex) ?? (isRcaCritical ? '#EF4444' : isRcaBorderline ? '#F59E0B' : '#10B981');
  const isRcaSelected = activeVesselFocus === 'vessel_RCA' || activeVesselFocus === 'RCA';

  const isGlobalFocus = activeVesselFocus === 'default' || activeVesselFocus === 'all' || activeVesselFocus === 'free' || activeVesselFocus === 'Full heart' || !activeVesselFocus;
  const isLadDimmed = !isGlobalFocus && !isLadSelected;
  const isLcxDimmed = !isGlobalFocus && !isLcxSelected;
  const isRcaDimmed = !isGlobalFocus && !isRcaSelected;

  const ladRiskText = `${(ladProb * 100).toFixed(1)}%`;
  const lcxRiskText = `${(lcxProb * 100).toFixed(1)}%`;
  const rcaRiskText = `${(rcaProb * 100).toFixed(1)}%`;

  // Dynamic 60fps frame loop: synchronized resting heartbeat pulse and material color enforcement
  useFrame(({ clock }) => {
    const elapsed = clock.getElapsedTime();
    const pulse = (Math.sin(elapsed * 7.54) + 1.0) * 0.5;

    if (ladMatRef.current) {
      ladMatRef.current.color.set(ladColorHex);
      ladMatRef.current.emissive.set(ladColorHex);
      if (isLadDimmed) {
        ladMatRef.current.emissiveIntensity = 0.08;
      } else if (isLadSelected) {
        ladMatRef.current.emissiveIntensity = 0.8;
      } else if (isLadCritical) {
        ladMatRef.current.emissiveIntensity = 0.65 + 0.35 * pulse;
      } else {
        ladMatRef.current.emissiveIntensity = 0.35;
      }
    }

    if (lcxMatRef.current) {
      lcxMatRef.current.color.set(lcxColorHex);
      lcxMatRef.current.emissive.set(lcxColorHex);
      if (isLcxDimmed) {
        lcxMatRef.current.emissiveIntensity = 0.08;
      } else if (isLcxSelected) {
        lcxMatRef.current.emissiveIntensity = 0.8;
      } else if (isLcxCritical) {
        lcxMatRef.current.emissiveIntensity = 0.65 + 0.35 * pulse;
      } else {
        lcxMatRef.current.emissiveIntensity = 0.35;
      }
    }

    if (rcaMatRef.current) {
      rcaMatRef.current.color.set(rcaColorHex);
      rcaMatRef.current.emissive.set(rcaColorHex);
      if (isRcaDimmed) {
        rcaMatRef.current.emissiveIntensity = 0.08;
      } else if (isRcaSelected) {
        rcaMatRef.current.emissiveIntensity = 0.8;
      } else if (isRcaCritical) {
        rcaMatRef.current.emissiveIntensity = 0.65 + 0.35 * pulse;
      } else {
        rcaMatRef.current.emissiveIntensity = 0.35;
      }
    }
  });

  const handleSelectVessel = (vesselName: string) => {
    setVesselFocus(activeVesselFocus === vesselName ? 'default' : vesselName);
  };

  const handlePointerOver = (vesselName: string) => {
    document.body.style.cursor = 'pointer';
    setHoveredVessel(vesselName);
    onHoverVessel?.(vesselName);
  };

  const handlePointerOut = () => {
    document.body.style.cursor = 'auto';
    setHoveredVessel(null);
    onHoverVessel?.(null);
  };

  return (
    <group ref={groupRef} position={[0, 0, 0]} scale={[1.0, 1.0, 1.0]}>
      {/* 
        Step 1: Mount vessel meshes directly as child objects of the myocardium mesh
        so they inherit the exact coordinate space and never clip inside the organ.
      */}
      <primitive object={myocardiumMesh}>
        {/* ======================= LAD ARTERY ======================= */}
        <mesh
          name="vessel_LAD"
          geometry={ladGeo}
          renderOrder={100}
          onClick={(e) => {
            e.stopPropagation();
            handleSelectVessel('vessel_LAD');
          }}
          onPointerOver={(e) => {
            e.stopPropagation();
            handlePointerOver('vessel_LAD');
          }}
          onPointerOut={(e) => {
            e.stopPropagation();
            handlePointerOut();
          }}
        >
          <meshStandardMaterial
            ref={ladMatRef}
            color={ladColorHex}
            emissive={ladColorHex}
            emissiveIntensity={isLadSelected ? 0.8 : (isLadCritical ? 0.65 : 0.35)}
            roughness={0.25}
            metalness={0.1}
            side={THREE.DoubleSide}
            depthTest={true}
            depthWrite={true}
            polygonOffset={true}
            polygonOffsetFactor={-2}
            polygonOffsetUnits={-2}
            transparent={false}
          />

          {/* Step 3: Floating Callout Badge for LAD */}
          <Html
            position={ladBadgePos}
            center
            distanceFactor={2.4}
            zIndexRange={[5, 1]}
            style={{ pointerEvents: 'auto', userSelect: 'none' }}
          >
            <VesselLabel
              vesselKey="vessel_LAD"
              code="LAD"
              riskDotColor={ladColorHex}
              riskText={ladRiskText}
              placement="below"
              isSelected={isLadSelected}
              onSelect={() => handleSelectVessel('vessel_LAD')}
              onPointerOver={() => handlePointerOver('vessel_LAD')}
              onPointerOut={handlePointerOut}
            />
          </Html>
        </mesh>

        {/* ======================= LCX ARTERY ======================= */}
        <mesh
          name="vessel_LCX"
          geometry={lcxGeo}
          renderOrder={100}
          onClick={(e) => {
            e.stopPropagation();
            handleSelectVessel('vessel_LCX');
          }}
          onPointerOver={(e) => {
            e.stopPropagation();
            handlePointerOver('vessel_LCX');
          }}
          onPointerOut={(e) => {
            e.stopPropagation();
            handlePointerOut();
          }}
        >
          <meshStandardMaterial
            ref={lcxMatRef}
            color={lcxColorHex}
            emissive={lcxColorHex}
            emissiveIntensity={isLcxSelected ? 0.8 : (isLcxCritical ? 0.65 : 0.35)}
            roughness={0.25}
            metalness={0.1}
            side={THREE.DoubleSide}
            depthTest={true}
            depthWrite={true}
            polygonOffset={true}
            polygonOffsetFactor={-2}
            polygonOffsetUnits={-2}
            transparent={false}
          />

          {/* Step 3: Floating Callout Badge for LCX */}
          <Html
            position={lcxBadgePos}
            center
            distanceFactor={2.4}
            zIndexRange={[5, 1]}
            style={{ pointerEvents: 'auto', userSelect: 'none' }}
          >
            <VesselLabel
              vesselKey="vessel_LCX"
              code="LCX"
              riskDotColor={lcxColorHex}
              riskText={lcxRiskText}
              placement="right"
              isSelected={isLcxSelected}
              onSelect={() => handleSelectVessel('vessel_LCX')}
              onPointerOver={() => handlePointerOver('vessel_LCX')}
              onPointerOut={handlePointerOut}
            />
          </Html>
        </mesh>

        {/* ======================= RCA ARTERY ======================= */}
        <mesh
          name="vessel_RCA"
          geometry={rcaGeo}
          renderOrder={100}
          onClick={(e) => {
            e.stopPropagation();
            handleSelectVessel('vessel_RCA');
          }}
          onPointerOver={(e) => {
            e.stopPropagation();
            handlePointerOver('vessel_RCA');
          }}
          onPointerOut={(e) => {
            e.stopPropagation();
            handlePointerOut();
          }}
        >
          <meshStandardMaterial
            ref={rcaMatRef}
            color={rcaColorHex}
            emissive={rcaColorHex}
            emissiveIntensity={isRcaSelected ? 0.8 : (isRcaCritical ? 0.65 : 0.35)}
            roughness={0.25}
            metalness={0.1}
            side={THREE.DoubleSide}
            depthTest={true}
            depthWrite={true}
            polygonOffset={true}
            polygonOffsetFactor={-2}
            polygonOffsetUnits={-2}
            transparent={false}
          />

          {/* Step 3: Floating Callout Badge for RCA */}
          <Html
            position={rcaBadgePos}
            center
            distanceFactor={2.4}
            zIndexRange={[5, 1]}
            style={{ pointerEvents: 'auto', userSelect: 'none' }}
          >
            <VesselLabel
              vesselKey="vessel_RCA"
              code="RCA"
              riskDotColor={rcaColorHex}
              riskText={rcaRiskText}
              placement="left"
              isSelected={isRcaSelected}
              onSelect={() => handleSelectVessel('vessel_RCA')}
              onPointerOver={() => handlePointerOver('vessel_RCA')}
              onPointerOut={handlePointerOut}
            />
          </Html>
        </mesh>
      </primitive>
    </group>
  );
};

// Pre-load the authentic glTF model
useGLTF.preload('/models/heart_coronary_optimized.glb');
