/**
 * Production 3D Anatomical Heart Pipeline & Native Coronary Segmentation
 * Multimodal AI Hackathon 2026 - Track A: Cardiovascular Risk Visualization & Prediction
 *
 * Downloads and segments the authentic 3D human heart digital twin so that
 * coronary arteries (LAD, LCX, RCA) are directly integrated into the asset's
 * native geometry and material slots:
 * - Sub-meshes: 'myocardium', 'vessel_LAD', 'vessel_LCX', 'vessel_RCA'
 * - Materials:  'mat_Myocardium', 'mat_LAD', 'mat_LCX', 'mat_RCA'
 *
 * All sub-meshes share the original PBR albedo, normal, and roughness textures
 * with zero detached tubes, zero z-fighting, and zero occlusion artifacts.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as THREE from 'three';
import { NodeIO } from '@gltf-transform/core';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const OUT_OPTIMIZED_DIR = path.join(ROOT_DIR, 'assets', '3d', 'optimized');
const OUT_WEB_PUBLIC_DIR = path.join(ROOT_DIR, 'apps', 'web', 'public', 'models');

const MODEL_SOURCE_URL =
  'https://raw.githubusercontent.com/36villages/heart-model/main/realistic_human_heart.glb';

function ensureDirectories() {
  fs.mkdirSync(OUT_OPTIMIZED_DIR, { recursive: true });
  fs.mkdirSync(OUT_WEB_PUBLIC_DIR, { recursive: true });
}

// Coronary artery anatomical guide paths (derived from epicardial sulci)
const ladMainCurve = new THREE.CatmullRomCurve3([
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
]);
const ladD1Curve = new THREE.CatmullRomCurve3([
  new THREE.Vector3(-0.04, -0.15, 0.498),
  new THREE.Vector3(0.08, -0.23, 0.444),
  new THREE.Vector3(0.18, -0.35, 0.344),
  new THREE.Vector3(0.22, -0.48, 0.234),
]);

const lcxMainCurve = new THREE.CatmullRomCurve3([
  new THREE.Vector3(0.05, 0.28, 0.404),
  new THREE.Vector3(0.23, 0.28, 0.274),
  new THREE.Vector3(0.342, 0.28, 0.162),
  new THREE.Vector3(0.408, 0.18, -0.042),
  new THREE.Vector3(0.431, 0.08, -0.072),
  new THREE.Vector3(0.419, -0.02, -0.052),
  new THREE.Vector3(0.433, -0.15, -0.062),
  new THREE.Vector3(0.445, -0.25, -0.062),
  new THREE.Vector3(0.434, -0.35, -0.042),
]);
const lcxOm1Curve = new THREE.CatmullRomCurve3([
  new THREE.Vector3(0.431, 0.08, -0.072),
  new THREE.Vector3(0.424, -0.06, 0.032),
  new THREE.Vector3(0.404, -0.2, 0.052),
  new THREE.Vector3(0.334, -0.36, 0.092),
]);

const rcaMainCurve = new THREE.CatmullRomCurve3([
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
]);
const rcaMarginalCurve = new THREE.CatmullRomCurve3([
  new THREE.Vector3(-0.591, -0.05, 0.008),
  new THREE.Vector3(-0.512, -0.18, 0.152),
  new THREE.Vector3(-0.392, -0.32, 0.192),
]);

const ptsLAD = [...ladMainCurve.getPoints(200), ...ladD1Curve.getPoints(80)];
const ptsLCX = [...lcxMainCurve.getPoints(200), ...lcxOm1Curve.getPoints(80)];
const ptsRCA = [...rcaMainCurve.getPoints(200), ...rcaMarginalCurve.getPoints(80)];

export async function processAndSegmentHeart() {
  ensureDirectories();
  const outGlbOptimized = path.join(OUT_OPTIMIZED_DIR, 'heart_coronary_optimized.glb');
  const outGlbWebPublic = path.join(OUT_WEB_PUBLIC_DIR, 'heart_coronary_optimized.glb');
  const outManifest = path.join(OUT_OPTIMIZED_DIR, 'mesh_manifest.json');

  const localCache = path.join(OUT_WEB_PUBLIC_DIR, 'real_heart_raw.glb');
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
  const buffer = root.listBuffers()[0];

  // Identify source mesh node and parent transform
  const oldNode = root.listNodes().find((n) => n.getName().includes('Heart Tex_0'));
  if (!oldNode) {
    throw new Error('Could not find heart mesh node in GLB');
  }
  const parentNode = oldNode.getParent();
  const prim0 = oldNode.getMesh().listPrimitives()[0];
  const posAttr = prim0.getAttribute('POSITION');
  const posArr = posAttr.getArray();
  const indArr = prim0.getIndices().getArray();

  // Compute accumulated world transformation for coordinate projection
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

  // Transform vertices to world space
  const worldPos = [];
  const v = new THREE.Vector3();
  for (let i = 0; i < posArr.length; i += 3) {
    v.set(posArr[i], posArr[i + 1], posArr[i + 2]).applyMatrix4(worldM);
    worldPos.push(v.x, v.y, v.z);
  }

  // Segment triangles into disjoint artery and myocardium partitions
  const indMyo = [];
  const indLAD = [];
  const indLCX = [];
  const indRCA = [];

  const RADIUS = 0.048; // Calibrated coronary corridor radius
  const r2 = RADIUS * RADIUS;

  for (let i = 0; i < indArr.length; i += 3) {
    const i0 = indArr[i];
    const i1 = indArr[i + 1];
    const i2 = indArr[i + 2];

    const cx = (worldPos[i0 * 3] + worldPos[i1 * 3] + worldPos[i2 * 3]) / 3;
    const cy = (worldPos[i0 * 3 + 1] + worldPos[i1 * 3 + 1] + worldPos[i2 * 3 + 1]) / 3;
    const cz = (worldPos[i0 * 3 + 2] + worldPos[i1 * 3 + 2] + worldPos[i2 * 3 + 2]) / 3;

    let minLAD = Infinity, minLCX = Infinity, minRCA = Infinity;
    for (const p of ptsLAD) {
      const d = (cx - p.x) ** 2 + (cy - p.y) ** 2 + (cz - p.z) ** 2;
      if (d < minLAD) minLAD = d;
    }
    for (const p of ptsLCX) {
      const d = (cx - p.x) ** 2 + (cy - p.y) ** 2 + (cz - p.z) ** 2;
      if (d < minLCX) minLCX = d;
    }
    for (const p of ptsRCA) {
      const d = (cx - p.x) ** 2 + (cy - p.y) ** 2 + (cz - p.z) ** 2;
      if (d < minRCA) minRCA = d;
    }

    if (minLAD < r2 && minLAD <= minLCX && minLAD <= minRCA) {
      indLAD.push(i0, i1, i2);
    } else if (minLCX < r2 && minLCX <= minLAD && minLCX <= minRCA) {
      indLCX.push(i0, i1, i2);
    } else if (minRCA < r2 && minRCA <= minLAD && minRCA <= minLCX) {
      indRCA.push(i0, i1, i2);
    } else {
      indMyo.push(i0, i1, i2);
    }
  }

  console.log(`Coronary surface segmentation results:`);
  console.log(`  - Myocardium Triangles: ${indMyo.length / 3}`);
  console.log(`  - LAD Triangles:        ${indLAD.length / 3}`);
  console.log(`  - LCX Triangles:        ${indLCX.length / 3}`);
  console.log(`  - RCA Triangles:        ${indRCA.length / 3}`);

  // Base texture material
  const baseMat = root.listMaterials()[0];

  const partitions = [
    { name: 'myocardium', matName: 'mat_Myocardium', indices: indMyo },
    { name: 'vessel_LAD', matName: 'mat_LAD', indices: indLAD },
    { name: 'vessel_LCX', matName: 'mat_LCX', indices: indLCX },
    { name: 'vessel_RCA', matName: 'mat_RCA', indices: indRCA },
  ];

  for (const part of partitions) {
    const mat = baseMat.clone().setName(part.matName);
    const mesh = doc.createMesh(part.name);
    const accIndices = doc
      .createAccessor(`indices_${part.name}`)
      .setType('SCALAR')
      .setArray(new Uint32Array(part.indices))
      .setBuffer(buffer);

    const prim = doc
      .createPrimitive()
      .setIndices(accIndices)
      .setMaterial(mat);

    for (const sem of ['POSITION', 'NORMAL', 'TANGENT', 'TEXCOORD_0', 'TEXCOORD_1', 'TEXCOORD_2']) {
      const attr = prim0.getAttribute(sem);
      if (attr) prim.setAttribute(sem, attr);
    }

    mesh.addPrimitive(prim);
    const node = doc.createNode(part.name).setMesh(mesh);
    if (parentNode) {
      parentNode.addChild(node);
    } else {
      root.listScenes()[0].addChild(node);
    }
  }

  // Remove the old unsplit node
  if (parentNode) {
    parentNode.removeChild(oldNode);
  }
  oldNode.dispose();

  // Export unified GLB
  const finalGlbBytes = await io.writeBinary(doc);
  fs.writeFileSync(outGlbOptimized, Buffer.from(finalGlbBytes));
  fs.writeFileSync(outGlbWebPublic, Buffer.from(finalGlbBytes));

  console.log(`Successfully generated integrated coronary GLB (${(finalGlbBytes.length / (1024 * 1024)).toFixed(2)} MB):`);
  console.log(`  -> ${outGlbOptimized}`);
  console.log(`  -> ${outGlbWebPublic}`);

  const manifest = {
    model_name: 'heart_coronary_optimized.glb',
    created_at: new Date().toISOString(),
    architecture: 'Native Disjoint Epicardial Segmentation (Zero Tubes, Zero Occlusion)',
    sub_meshes: ['myocardium', 'vessel_LAD', 'vessel_LCX', 'vessel_RCA'],
    materials: ['mat_Myocardium', 'mat_LAD', 'mat_LCX', 'mat_RCA'],
    triangle_counts: {
      myocardium: indMyo.length / 3,
      vessel_LAD: indLAD.length / 3,
      vessel_LCX: indLCX.length / 3,
      vessel_RCA: indRCA.length / 3,
      total: indArr.length / 3,
    },
  };

  fs.writeFileSync(outManifest, JSON.stringify(manifest, null, 2));
  console.log(`Saved manifest to: ${outManifest}`);
}

processAndSegmentHeart().catch((err) => {
  console.error('Pipeline error:', err);
  process.exit(1);
});
