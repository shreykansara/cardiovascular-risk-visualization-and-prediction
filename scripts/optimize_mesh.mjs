/**
 * Production 3D Anatomical Heart Pipeline & Native Coronary Vascular Integration
 * Multimodal AI Hackathon 2026 - Track A: Cardiovascular Risk Visualization & Prediction
 *
 * Integrates an authentic pre-modeled 3D human heart digital twin with genuine
 * 3D vascular conduits extruded as smooth round cylindrical tubes (128 tubular segments,
 * 12 radial segments) with organic anatomical tapering (0.016 proximal -> 0.007 apex).
 *
 * Preserves 100% of the original photorealistic heart mesh and PBR textures intact
 * with ZERO triangle tearing or jagged polygon cuts.
 *
 * Output nodes & materials:
 * - 'myocardium'  -> 'mat_Myocardium' (100% complete original textured heart)
 * - 'vessel_LAD'   -> 'mat_LAD'        (anterior interventricular sulcus conduit)
 * - 'vessel_LCX'   -> 'mat_LCX'        (left atrioventricular groove conduit)
 * - 'vessel_RCA'   -> 'mat_RCA'        (right coronary sulcus conduit)
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { NodeIO } from '@gltf-transform/core';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const OUT_OPTIMIZED_DIR = path.join(ROOT_DIR, 'assets', '3d', 'optimized');
const OUT_WEB_PUBLIC_DIR = path.join(ROOT_DIR, 'apps', 'web', 'public', 'models');
const RAW_CACHE_DIR = path.join(ROOT_DIR, 'assets', '3d', 'raw');

const MODEL_SOURCE_URL =
  'https://raw.githubusercontent.com/36villages/heart-model/main/realistic_human_heart.glb';

function ensureDirectories() {
  fs.mkdirSync(OUT_OPTIMIZED_DIR, { recursive: true });
  fs.mkdirSync(OUT_WEB_PUBLIC_DIR, { recursive: true });
  fs.mkdirSync(RAW_CACHE_DIR, { recursive: true });
}

/**
 * Generates an authentic tapering vascular tube geometry with smooth Frenet frames.
 */
function createTaperedArteryGeometry(
  curve,
  tubularSegments,
  radialSegments,
  radiusStart,
  radiusEnd
) {
  const points = curve.getPoints(tubularSegments);
  const frames = curve.computeFrenetFrames(tubularSegments, false);

  const positions = [];
  const normals = [];
  const uvs = [];
  const indices = [];

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

export async function processAndSegmentHeart() {
  ensureDirectories();
  const outGlbOptimized = path.join(OUT_OPTIMIZED_DIR, 'heart_coronary_optimized.glb');
  const outGlbWebPublic = path.join(OUT_WEB_PUBLIC_DIR, 'heart_coronary_optimized.glb');
  const outManifest = path.join(OUT_OPTIMIZED_DIR, 'mesh_manifest.json');
  const localCache = path.join(RAW_CACHE_DIR, 'realistic_human_heart.glb');

  let rawBuffer;
  if (fs.existsSync(localCache)) {
    console.log(`Loading cached source GLB: ${localCache}`);
    rawBuffer = fs.readFileSync(localCache);
  } else {
    console.log(`Downloading authentic medical heart model from: ${MODEL_SOURCE_URL}`);
    const res = await fetch(MODEL_SOURCE_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to download model`);
    const arrayBuffer = await res.arrayBuffer();
    rawBuffer = Buffer.from(arrayBuffer);
    fs.writeFileSync(localCache, rawBuffer);
  }

  const io = new NodeIO();
  const doc = await io.readBinary(new Uint8Array(rawBuffer));
  const root = doc.getRoot();
  const scene = root.listScenes()[0];
  const buffer = root.listBuffers()[0];

  // 1. Identify original heart mesh and retain it 100% complete
  const oldNode = root.listNodes().find((n) => n.getName().includes('Heart Tex_0'));
  if (!oldNode) {
    throw new Error('Could not find heart mesh node in GLB');
  }

  oldNode.setName('myocardium');
  oldNode.getMesh().setName('myocardium');
  const prim0 = oldNode.getMesh().listPrimitives()[0];
  if (prim0.getMaterial()) {
    prim0.getMaterial().setName('mat_Myocardium');
  }

  // 2. Extract world transform to align artery spline paths
  const m0 = new THREE.Matrix4().compose(
    new THREE.Vector3(0, 0, 0),
    new THREE.Quaternion(-0.7071067811865475, 0, 0, 0.7071067811865476),
    new THREE.Vector3(0.17420147359371185, 0.17420147359371185, 0.17420147359371185)
  );
  const m1 = new THREE.Matrix4().compose(
    new THREE.Vector3(0, 0, 0),
    new THREE.Quaternion(0.7071067811865475, 0, 0, 0.7071067811865476),
    new THREE.Vector3(0.01, 0.01, 0.01)
  );
  const m3 = new THREE.Matrix4().compose(
    new THREE.Vector3(0, 0, 0),
    new THREE.Quaternion(0, 0, 0, 1),
    new THREE.Vector3(286.3651428222656, 286.3651428222656, 286.3651428222656)
  );
  const worldM = new THREE.Matrix4().multiply(m0).multiply(m1).multiply(m3);
  const normM = new THREE.Matrix3().getNormalMatrix(worldM);

  const posArr = prim0.getAttribute('POSITION').getArray();
  const normArr = prim0.getAttribute('NORMAL').getArray();

  const worldPos = [];
  const worldNorm = [];
  const v = new THREE.Vector3();
  const n = new THREE.Vector3();

  for (let i = 0; i < posArr.length; i += 3) {
    v.set(posArr[i], posArr[i + 1], posArr[i + 2]).applyMatrix4(worldM);
    n.set(normArr[i], normArr[i + 1], normArr[i + 2]).applyMatrix3(normM).normalize();
    worldPos.push(new THREE.Vector3(v.x, v.y, v.z));
    worldNorm.push(new THREE.Vector3(n.x, n.y, n.z));
  }

  // Snaps control points flush onto epicardial sulci with ~30% embedded depth
  // Center is at surface + (0.7 * radius), so bottom is 0.3*radius embedded, top 0.7*radius protrudes
  function snapAndEmbedControlPoints(controlPoints, rStart, rEnd) {
    return controlPoints.map((pt, idx) => {
      const u = idx / (controlPoints.length - 1);
      const r = rStart + (rEnd - rStart) * u;
      let minIdx = 0;
      let minDist = Infinity;
      for (let i = 0; i < worldPos.length; i++) {
        const d = pt.distanceTo(worldPos[i]);
        if (d < minDist) {
          minDist = d;
          minIdx = i;
        }
      }
      const closestVertex = worldPos[minIdx];
      const surfaceNormal = worldNorm[minIdx];
      const offset = 0.7 * r;
      return closestVertex.clone().addScaledVector(surfaceNormal, offset);
    });
  }

  // 3. Define anatomical guide curves tracing the authentic sulci
  // LAD: Anterior interventricular sulcus to apex
  const ladBasePoints = [
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
  const ladD1BasePoints = [
    new THREE.Vector3(-0.04, -0.15, 0.498),
    new THREE.Vector3(0.08, -0.23, 0.444),
    new THREE.Vector3(0.18, -0.35, 0.344),
    new THREE.Vector3(0.22, -0.48, 0.234),
  ];

  // LCX: Left atrioventricular groove
  const lcxBasePoints = [
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
  const lcxOm1BasePoints = [
    new THREE.Vector3(0.431, 0.08, -0.072),
    new THREE.Vector3(0.424, -0.06, 0.032),
    new THREE.Vector3(0.404, -0.2, 0.052),
    new THREE.Vector3(0.334, -0.36, 0.092),
  ];

  // RCA: Right atrioventricular sulcus and acute margin
  const rcaBasePoints = [
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
  const rcaMarginalBasePoints = [
    new THREE.Vector3(-0.591, -0.05, 0.008),
    new THREE.Vector3(-0.512, -0.18, 0.152),
    new THREE.Vector3(-0.392, -0.32, 0.192),
  ];

  // 4. Generate smoothly embedded Catmull-Rom splines
  const ladPts = snapAndEmbedControlPoints(ladBasePoints, 0.016, 0.007);
  const ladD1Pts = snapAndEmbedControlPoints(ladD1BasePoints, 0.009, 0.005);
  const lcxPts = snapAndEmbedControlPoints(lcxBasePoints, 0.015, 0.0065);
  const lcxOm1Pts = snapAndEmbedControlPoints(lcxOm1BasePoints, 0.0085, 0.005);
  const rcaPts = snapAndEmbedControlPoints(rcaBasePoints, 0.016, 0.007);
  const rcaMarginalPts = snapAndEmbedControlPoints(rcaMarginalBasePoints, 0.009, 0.005);

  const ladMainCurve = new THREE.CatmullRomCurve3(ladPts, false, 'centripetal');
  const ladD1Curve = new THREE.CatmullRomCurve3(ladD1Pts, false, 'centripetal');
  const lcxMainCurve = new THREE.CatmullRomCurve3(lcxPts, false, 'centripetal');
  const lcxOm1Curve = new THREE.CatmullRomCurve3(lcxOm1Pts, false, 'centripetal');
  const rcaMainCurve = new THREE.CatmullRomCurve3(rcaPts, false, 'centripetal');
  const rcaMarginalCurve = new THREE.CatmullRomCurve3(rcaMarginalPts, false, 'centripetal');

  // 5. Generate authentic cylindrical vascular conduits (128 tubular segments, 12 radial segments)
  console.log('Generating vascular conduits (128 segments, 12 radial segments, tapering caliber)...');
  const ladMainGeo = createTaperedArteryGeometry(ladMainCurve, 128, 12, 0.016, 0.007);
  const ladD1Geo = createTaperedArteryGeometry(ladD1Curve, 48, 12, 0.009, 0.005);
  const ladGeo = BufferGeometryUtils.mergeGeometries([ladMainGeo, ladD1Geo]);

  const lcxMainGeo = createTaperedArteryGeometry(lcxMainCurve, 128, 12, 0.015, 0.0065);
  const lcxOm1Geo = createTaperedArteryGeometry(lcxOm1Curve, 48, 12, 0.0085, 0.005);
  const lcxGeo = BufferGeometryUtils.mergeGeometries([lcxMainGeo, lcxOm1Geo]);

  const rcaMainGeo = createTaperedArteryGeometry(rcaMainCurve, 128, 12, 0.016, 0.007);
  const rcaMarginalGeo = createTaperedArteryGeometry(rcaMarginalCurve, 48, 12, 0.009, 0.005);
  const rcaGeo = BufferGeometryUtils.mergeGeometries([rcaMainGeo, rcaMarginalGeo]);

  // 6. Integrate vascular conduits as dedicated mesh nodes in GLTF document
  const vesselConfigs = [
    { name: 'vessel_LAD', matName: 'mat_LAD', geo: ladGeo, color: [0.063, 0.725, 0.506, 1.0] },
    { name: 'vessel_LCX', matName: 'mat_LCX', geo: lcxGeo, color: [0.063, 0.725, 0.506, 1.0] },
    { name: 'vessel_RCA', matName: 'mat_RCA', geo: rcaGeo, color: [0.063, 0.725, 0.506, 1.0] },
  ];

  for (const vc of vesselConfigs) {
    const pos = vc.geo.getAttribute('position').array;
    const norm = vc.geo.getAttribute('normal').array;
    const uv = vc.geo.getAttribute('uv').array;
    const ind = vc.geo.getIndex().array;

    const accPos = doc.createAccessor(`pos_${vc.name}`)
      .setType('VEC3')
      .setArray(new Float32Array(pos))
      .setBuffer(buffer);

    const accNorm = doc.createAccessor(`norm_${vc.name}`)
      .setType('VEC3')
      .setArray(new Float32Array(norm))
      .setBuffer(buffer);

    const accUv = doc.createAccessor(`uv_${vc.name}`)
      .setType('VEC2')
      .setArray(new Float32Array(uv))
      .setBuffer(buffer);

    const accInd = doc.createAccessor(`ind_${vc.name}`)
      .setType('SCALAR')
      .setArray(new Uint32Array(ind))
      .setBuffer(buffer);

    const mat = doc.createMaterial(vc.matName)
      .setRoughnessFactor(0.22)
      .setMetallicFactor(0.08)
      .setBaseColorFactor(vc.color);

    const prim = doc.createPrimitive()
      .setAttribute('POSITION', accPos)
      .setAttribute('NORMAL', accNorm)
      .setAttribute('TEXCOORD_0', accUv)
      .setIndices(accInd)
      .setMaterial(mat);

    const mesh = doc.createMesh(vc.name).addPrimitive(prim);
    const node = doc.createNode(vc.name).setMesh(mesh);
    scene.addChild(node);
  }

  // 7. Export unified, production-optimized GLB
  const finalGlbBytes = await io.writeBinary(doc);
  fs.writeFileSync(outGlbOptimized, Buffer.from(finalGlbBytes));
  fs.writeFileSync(outGlbWebPublic, Buffer.from(finalGlbBytes));

  console.log(`Successfully generated integrated coronary GLB (${(finalGlbBytes.length / (1024 * 1024)).toFixed(2)} MB):`);
  console.log(`  -> ${outGlbOptimized}`);
  console.log(`  -> ${outGlbWebPublic}`);

  const manifest = {
    model_name: 'heart_coronary_optimized.glb',
    created_at: new Date().toISOString(),
    architecture: 'Intact Photorealistic Myocardium + Dedicated 3D Cylindrical Vascular Conduits',
    sub_meshes: ['myocardium', 'vessel_LAD', 'vessel_LCX', 'vessel_RCA'],
    materials: ['mat_Myocardium', 'mat_LAD', 'mat_LCX', 'mat_RCA'],
    vascular_specifications: {
      tubular_segments: 128,
      radial_segments: 12,
      caliber_range_mm: '2.5mm - 4.5mm (0.007 to 0.016 units)',
      embedding: 'Underside embedded ~30% into epicardial sulci, top 70% protruding',
    },
    triangle_counts: {
      myocardium: prim0.getIndices().getArray().length / 3,
      vessel_LAD: ladGeo.getIndex().count / 3,
      vessel_LCX: lcxGeo.getIndex().count / 3,
      vessel_RCA: rcaGeo.getIndex().count / 3,
    },
  };

  fs.writeFileSync(outManifest, JSON.stringify(manifest, null, 2));
  console.log(`Saved manifest to: ${outManifest}`);
}

processAndSegmentHeart().catch((err) => {
  console.error('Pipeline error:', err);
  process.exit(1);
});
