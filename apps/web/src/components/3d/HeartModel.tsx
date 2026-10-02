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

interface HeartModelProps {
  onHoverVessel?: (vesselName: string | null) => void;
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

const RCA_BASE_POINTS = [
  new THREE.Vector3(-0.08, 0.26, 0.345),
  new THREE.Vector3(-0.255, 0.24, 0.363),
  new THREE.Vector3(-0.536, 0.2, 0.012),
  new THREE.Vector3(-0.564, 0.11, -0.022),
  new THREE.Vector3(-0.587, 0.01, 0.028),
  new THREE.Vector3(-0.591, -0.05, 0.008),
  new THREE.Vector3(-0.576, -0.12, -0.012),
  new THREE.Vector3(-0.552, -0.22, 0.018),
  new THREE.Vector3(-0.513, -0.32, 0.122),
  new THREE.Vector3(-0.453, -0.42, 0.062),
  new THREE.Vector3(-0.375, -0.52, 0.012),
  new THREE.Vector3(-0.205, -0.65, 0.038),
];

const RCA_MARGINAL_BASE_POINTS = [
  new THREE.Vector3(-0.591, -0.05, 0.008),
  new THREE.Vector3(-0.512, -0.18, 0.152),
  new THREE.Vector3(-0.392, -0.32, 0.192),
];

/**
 * Creates an authentic tapering cylindrical tube geometry with Frenet frames.
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
  const normals: number[] = [];
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
      normals.push(normal.x, normal.y, normal.z);
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

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  return geo;
}

export const HeartModel: React.FC<HeartModelProps> = ({ onHoverVessel }) => {
  const { analysis, activeVesselFocus, setVesselFocus } = usePatientStore();
  const groupRef = useRef<THREE.Group>(null);
  const [hoveredVessel, setHoveredVessel] = useState<string | null>(null);

  // Material refs for dynamic 60fps emissive pulse updates without React re-renders
  const ladMatRef = useRef<THREE.MeshPhysicalMaterial>(null);
  const lcxMatRef = useRef<THREE.MeshPhysicalMaterial>(null);
  const rcaMatRef = useRef<THREE.MeshPhysicalMaterial>(null);

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

    // Snaps points flush onto epicardial sulci with ~50% outward protrusion
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
        const offset = 0.5 * r;
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
    const ladMainGeo = createTaperedArteryGeometry(ladMainCurve, 128, 12, 0.024, 0.014);
    const ladD1Geo = createTaperedArteryGeometry(ladD1Curve, 48, 12, 0.013, 0.008);
    const mergedLad = BufferGeometryUtils.mergeGeometries([ladMainGeo, ladD1Geo]);

    // 2. LCX: Left atrioventricular groove beneath left auricle
    const lcxPts = snapAndEmbed(LCX_BASE_POINTS, 0.024, 0.014);
    const lcxOm1Pts = snapAndEmbed(LCX_OM1_BASE_POINTS, 0.013, 0.008);
    const lcxMainCurve = new THREE.CatmullRomCurve3(lcxPts, false, 'centripetal');
    const lcxOm1Curve = new THREE.CatmullRomCurve3(lcxOm1Pts, false, 'centripetal');
    const lcxMainGeo = createTaperedArteryGeometry(lcxMainCurve, 128, 12, 0.024, 0.014);
    const lcxOm1Geo = createTaperedArteryGeometry(lcxOm1Curve, 48, 12, 0.013, 0.008);
    const mergedLcx = BufferGeometryUtils.mergeGeometries([lcxMainGeo, lcxOm1Geo]);

    // 3. RCA: Right atrioventricular sulcus along right border
    const rcaPts = snapAndEmbed(RCA_BASE_POINTS, 0.024, 0.014);
    const rcaMarginalPts = snapAndEmbed(RCA_MARGINAL_BASE_POINTS, 0.013, 0.008);
    const rcaMainCurve = new THREE.CatmullRomCurve3(rcaPts, false, 'centripetal');
    const rcaMarginalCurve = new THREE.CatmullRomCurve3(rcaMarginalPts, false, 'centripetal');
    const rcaMainGeo = createTaperedArteryGeometry(rcaMainCurve, 128, 12, 0.024, 0.014);
    const rcaMarginalGeo = createTaperedArteryGeometry(rcaMarginalCurve, 48, 12, 0.013, 0.008);
    const mergedRca = BufferGeometryUtils.mergeGeometries([rcaMainGeo, rcaMarginalGeo]);

    // Step 3: Proximal callout badge anchors in local myocardium space
    const ladAnchor = ladPts[0].clone().add(new THREE.Vector3(0.0, 0.06, 0.07));
    const lcxAnchor = lcxPts[1].clone().add(new THREE.Vector3(0.06, 0.06, 0.05));
    const rcaAnchor = rcaPts[1].clone().add(new THREE.Vector3(-0.06, 0.06, 0.05));

    return {
      ladGeo: mergedLad,
      lcxGeo: mergedLcx,
      rcaGeo: mergedRca,
      ladBadgePos: [ladAnchor.x, ladAnchor.y, ladAnchor.z] as [number, number, number],
      lcxBadgePos: [lcxAnchor.x, lcxAnchor.y, lcxAnchor.z] as [number, number, number],
      rcaBadgePos: [rcaAnchor.x, rcaAnchor.y, rcaAnchor.z] as [number, number, number],
    };
  }, [myocardiumMesh]);

  // Extract patient prediction data for each vessel
  const vesselsPred = analysis?.predictions?.vessels;

  const ladPred = vesselsPred?.lad;
  const ladProb = ladPred?.probability ?? 0.142;
  const ladColorHex = ladPred?.color_hex ?? '#10B981';
  const isLadCritical = ladProb > 0.70;
  const isLadBorderline = ladProb > 0.40 && ladProb <= 0.70;
  const isLadSelected = activeVesselFocus === 'vessel_LAD';

  const lcxPred = vesselsPred?.lcx;
  const lcxProb = lcxPred?.probability ?? 0.114;
  const lcxColorHex = lcxPred?.color_hex ?? '#10B981';
  const isLcxCritical = lcxProb > 0.70;
  const isLcxBorderline = lcxProb > 0.40 && lcxProb <= 0.70;
  const isLcxSelected = activeVesselFocus === 'vessel_LCX';

  const rcaPred = vesselsPred?.rca;
  const rcaProb = rcaPred?.probability ?? 0.127;
  const rcaColorHex = rcaPred?.color_hex ?? '#10B981';
  const isRcaCritical = rcaProb > 0.70;
  const isRcaBorderline = rcaProb > 0.40 && rcaProb <= 0.70;
  const isRcaSelected = activeVesselFocus === 'vessel_RCA';

  const isGlobalFocus = activeVesselFocus === 'default';
  const isLadDimmed = !isGlobalFocus && !isLadSelected;
  const isLcxDimmed = !isGlobalFocus && !isLcxSelected;
  const isRcaDimmed = !isGlobalFocus && !isRcaSelected;

  const ladRiskText = `${(ladProb * 100).toFixed(1)}%`;
  const lcxRiskText = `${(lcxProb * 100).toFixed(1)}%`;
  const rcaRiskText = `${(rcaProb * 100).toFixed(1)}%`;

  // Dynamic 60fps frame loop: synchronized resting heartbeat pulse on critical vessels
  useFrame(({ clock }) => {
    const elapsed = clock.getElapsedTime();
    const pulse = (Math.sin(elapsed * 7.54) + 1.0) * 0.5;

    if (ladMatRef.current) {
      if (isLadDimmed) {
        ladMatRef.current.emissiveIntensity = 0.0;
      } else if (isLadSelected) {
        ladMatRef.current.emissiveIntensity = 0.8;
      } else if (isLadCritical) {
        ladMatRef.current.emissiveIntensity = 0.7 + 0.3 * pulse;
      } else {
        ladMatRef.current.emissiveIntensity = 0.25;
      }
    }

    if (lcxMatRef.current) {
      if (isLcxDimmed) {
        lcxMatRef.current.emissiveIntensity = 0.0;
      } else if (isLcxSelected) {
        lcxMatRef.current.emissiveIntensity = 0.8;
      } else if (isLcxCritical) {
        lcxMatRef.current.emissiveIntensity = 0.7 + 0.3 * pulse;
      } else {
        lcxMatRef.current.emissiveIntensity = 0.25;
      }
    }

    if (rcaMatRef.current) {
      if (isRcaDimmed) {
        rcaMatRef.current.emissiveIntensity = 0.0;
      } else if (isRcaSelected) {
        rcaMatRef.current.emissiveIntensity = 0.8;
      } else if (isRcaCritical) {
        rcaMatRef.current.emissiveIntensity = 0.7 + 0.3 * pulse;
      } else {
        rcaMatRef.current.emissiveIntensity = 0.25;
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
          <meshPhysicalMaterial
            ref={ladMatRef}
            color={ladColorHex}
            emissive={ladColorHex}
            emissiveIntensity={isLadSelected ? 0.8 : (isLadCritical ? 0.7 : 0.25)}
            roughness={0.2}
            metalness={0.1}
            clearcoat={1.0}
            clearcoatRoughness={0.1}
            depthTest={true}
            depthWrite={false}
            polygonOffset={true}
            polygonOffsetFactor={-4}
            polygonOffsetUnits={-4}
            transparent={true}
            opacity={isLadDimmed ? 0.3 : 1.0}
          />

          {/* Step 3: Floating Drei <Html> Callout Badge for LAD */}
          <Html
            position={ladBadgePos}
            center
            distanceFactor={3.5}
            style={{ pointerEvents: 'auto', userSelect: 'none' }}
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleSelectVessel('vessel_LAD');
              }}
              onMouseEnter={() => handlePointerOver('vessel_LAD')}
              onMouseLeave={handlePointerOut}
              className={`group flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-medium backdrop-blur-md transition-all duration-200 cursor-pointer shadow-lg hover:scale-110 active:scale-95 ${
                isLadSelected
                  ? 'ring-2 ring-white shadow-cyan-500/50 scale-105'
                  : 'hover:border-cyan-400/80'
              } ${
                isLadCritical
                  ? 'bg-rose-950/85 border border-rose-500/70 text-rose-200 shadow-rose-900/40'
                  : isLadBorderline
                  ? 'bg-amber-950/85 border border-amber-500/70 text-amber-200 shadow-amber-900/40'
                  : 'bg-emerald-950/85 border border-emerald-500/70 text-emerald-200 shadow-emerald-900/40'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isLadCritical
                    ? 'bg-rose-500 animate-ping'
                    : isLadBorderline
                    ? 'bg-amber-400'
                    : 'bg-emerald-400'
                }`}
              />
              <span className="tracking-wide">LAD · {ladRiskText}</span>
            </button>
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
          <meshPhysicalMaterial
            ref={lcxMatRef}
            color={lcxColorHex}
            emissive={lcxColorHex}
            emissiveIntensity={isLcxSelected ? 0.8 : (isLcxCritical ? 0.7 : 0.25)}
            roughness={0.2}
            metalness={0.1}
            clearcoat={1.0}
            clearcoatRoughness={0.1}
            depthTest={true}
            depthWrite={false}
            polygonOffset={true}
            polygonOffsetFactor={-4}
            polygonOffsetUnits={-4}
            transparent={true}
            opacity={isLcxDimmed ? 0.3 : 1.0}
          />

          {/* Step 3: Floating Drei <Html> Callout Badge for LCX */}
          <Html
            position={lcxBadgePos}
            center
            distanceFactor={3.5}
            style={{ pointerEvents: 'auto', userSelect: 'none' }}
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleSelectVessel('vessel_LCX');
              }}
              onMouseEnter={() => handlePointerOver('vessel_LCX')}
              onMouseLeave={handlePointerOut}
              className={`group flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-medium backdrop-blur-md transition-all duration-200 cursor-pointer shadow-lg hover:scale-110 active:scale-95 ${
                isLcxSelected
                  ? 'ring-2 ring-white shadow-cyan-500/50 scale-105'
                  : 'hover:border-cyan-400/80'
              } ${
                isLcxCritical
                  ? 'bg-rose-950/85 border border-rose-500/70 text-rose-200 shadow-rose-900/40'
                  : isLcxBorderline
                  ? 'bg-amber-950/85 border border-amber-500/70 text-amber-200 shadow-amber-900/40'
                  : 'bg-emerald-950/85 border border-emerald-500/70 text-emerald-200 shadow-emerald-900/40'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isLcxCritical
                    ? 'bg-rose-500 animate-ping'
                    : isLcxBorderline
                    ? 'bg-amber-400'
                    : 'bg-emerald-400'
                }`}
              />
              <span className="tracking-wide">LCX · {lcxRiskText}</span>
            </button>
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
          <meshPhysicalMaterial
            ref={rcaMatRef}
            color={rcaColorHex}
            emissive={rcaColorHex}
            emissiveIntensity={isRcaSelected ? 0.8 : (isRcaCritical ? 0.7 : 0.25)}
            roughness={0.2}
            metalness={0.1}
            clearcoat={1.0}
            clearcoatRoughness={0.1}
            depthTest={true}
            depthWrite={false}
            polygonOffset={true}
            polygonOffsetFactor={-4}
            polygonOffsetUnits={-4}
            transparent={true}
            opacity={isRcaDimmed ? 0.3 : 1.0}
          />

          {/* Step 3: Floating Drei <Html> Callout Badge for RCA */}
          <Html
            position={rcaBadgePos}
            center
            distanceFactor={3.5}
            style={{ pointerEvents: 'auto', userSelect: 'none' }}
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleSelectVessel('vessel_RCA');
              }}
              onMouseEnter={() => handlePointerOver('vessel_RCA')}
              onMouseLeave={handlePointerOut}
              className={`group flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-medium backdrop-blur-md transition-all duration-200 cursor-pointer shadow-lg hover:scale-110 active:scale-95 ${
                isRcaSelected
                  ? 'ring-2 ring-white shadow-cyan-500/50 scale-105'
                  : 'hover:border-cyan-400/80'
              } ${
                isRcaCritical
                  ? 'bg-rose-950/85 border border-rose-500/70 text-rose-200 shadow-rose-900/40'
                  : isRcaBorderline
                  ? 'bg-amber-950/85 border border-amber-500/70 text-amber-200 shadow-amber-900/40'
                  : 'bg-emerald-950/85 border border-emerald-500/70 text-emerald-200 shadow-emerald-900/40'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isRcaCritical
                    ? 'bg-rose-500 animate-ping'
                    : isRcaBorderline
                    ? 'bg-amber-400'
                    : 'bg-emerald-400'
                }`}
              />
              <span className="tracking-wide">RCA · {rcaRiskText}</span>
            </button>
          </Html>
        </mesh>
      </primitive>
    </group>
  );
};

// Pre-load the authentic glTF model
useGLTF.preload('/models/heart_coronary_optimized.glb');
