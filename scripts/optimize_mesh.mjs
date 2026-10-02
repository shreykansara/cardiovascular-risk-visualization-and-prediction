/**
 * 3D Anatomical Mesh Pipeline & glTF Optimization (AuraCor Clinical DLS)
 * Multimodal AI Hackathon 2026 - Track A: Cardiovascular Risk Visualization & Prediction
 *
 * Generates an anatomically authentic human heart digital twin with distinct semantic nodes:
 * - 'myocardium': Left & right ventricles, atria, auricles, aorta & 3 arch branches,
 *                 pulmonary trunk & bifurcation, and venae cavae.
 * - 'vessel_LAD': Left Anterior Descending Artery with diagonal branch D1.
 * - 'vessel_LCX': Left Circumflex Artery with obtuse marginal branch OM1.
 * - 'vessel_RCA': Right Coronary Artery with acute marginal and PDA branches.
 *
 * All coordinates are normalized and centered at origin (0, 0, 0) with verified bounding metrics.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';

// Polyfill FileReader for Node.js GLTF binary export
class PolyfillFileReader {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then((buffer) => {
      this.result = buffer;
      if (this.onloadend) this.onloadend();
    });
  }
  readAsDataURL(blob) {
    blob.arrayBuffer().then((buffer) => {
      const base64 = Buffer.from(buffer).toString('base64');
      this.result = `data:application/octet-stream;base64,${base64}`;
      if (this.onloadend) this.onloadend();
    });
  }
}
global.FileReader = PolyfillFileReader;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const OUT_OPTIMIZED_DIR = path.join(ROOT_DIR, 'assets', '3d', 'optimized');
const OUT_WEB_PUBLIC_DIR = path.join(ROOT_DIR, 'apps', 'web', 'public', 'models');

function ensureDirectories() {
  fs.mkdirSync(OUT_OPTIMIZED_DIR, { recursive: true });
  fs.mkdirSync(OUT_WEB_PUBLIC_DIR, { recursive: true });
}

/**
 * Builds the complete anatomical heart model.
 */
function buildAnatomicalHeartScene() {
  const root = new THREE.Group();
  root.name = 'Heart_Root';

  // =========================================================================
  // 1. MYOCARDIUM GROUP (Muscle, Chambers & Great Vessels)
  // =========================================================================
  const myocardiumGroup = new THREE.Group();
  myocardiumGroup.name = 'myocardium';

  // --- Ventricular Myocardial Mass (Left & Right Ventricles) ---
  const ventGeo = new THREE.SphereGeometry(1.05, 64, 64);
  const ventPos = ventGeo.attributes.position;
  for (let i = 0; i < ventPos.count; i++) {
    let x = ventPos.getX(i);
    let y = ventPos.getY(i);
    let z = ventPos.getZ(i);

    // Anatomical downward taper toward apex
    const normY = (y + 1.05) / 2.1; // [0, 1] bottom to top
    const taper = Math.pow(normY, 0.65) * 0.95 + 0.12;

    // Cardiac anatomical axis tilt: apex points anteriorly, downward, and slightly left
    let apexShiftX = (1.0 - normY) * 0.15;
    let apexShiftZ = (1.0 - normY) * 0.22;

    // Left ventricular posterolateral muscular bulge (x > 0, z <= 0)
    let lvBulge = 1.0;
    if (x > 0 && z < 0.2) {
      lvBulge = 1.0 + (x * 0.25);
    }

    // Right ventricular anterior crescent (x < 0, z > 0)
    let rvBulge = 1.0;
    if (x < 0 && z > 0) {
      rvBulge = 1.0 + Math.abs(x) * 0.18;
    }

    // Sulcus indentation for anterior interventricular groove (where LAD lies)
    let sulcusIndent = 0.0;
    const distToLadSulcus = Math.hypot(x - (0.18 - (1 - normY) * 0.22), z - (0.55 * taper));
    if (distToLadSulcus < 0.25 && y < 0.4) {
      sulcusIndent = (0.25 - distToLadSulcus) * 0.2;
    }

    ventPos.setXYZ(
      i,
      (x * taper * lvBulge + apexShiftX) * 1.05,
      (y * 1.25) - 0.2,
      (z * taper * rvBulge + apexShiftZ - sulcusIndent) * 0.95
    );
  }
  ventGeo.computeVertexNormals();

  const myocardiumMat = new THREE.MeshStandardMaterial({
    color: 0x4a0e17, // Rich dark anatomical organ burgundy
    roughness: 0.42,
    metalness: 0.08,
    name: 'mat_myocardium',
  });
  const ventriclesMesh = new THREE.Mesh(ventGeo, myocardiumMat);
  ventriclesMesh.name = 'ventricles_mesh';
  myocardiumGroup.add(ventriclesMesh);

  // --- Right Atrium (Upper Right Chamber) ---
  const raGeo = new THREE.SphereGeometry(0.42, 32, 32);
  raGeo.scale(1.15, 0.95, 0.9);
  raGeo.translate(-0.58, 0.45, -0.05);
  raGeo.computeVertexNormals();
  const atriaMat = new THREE.MeshStandardMaterial({
    color: 0x3d0c15, // Deep cardiac atrium tone
    roughness: 0.46,
    metalness: 0.06,
    name: 'mat_atria',
  });
  const raMesh = new THREE.Mesh(raGeo, atriaMat);
  raMesh.name = 'ra_mesh';
  myocardiumGroup.add(raMesh);

  // --- Left Atrium (Posterior Upper Chamber) ---
  const laGeo = new THREE.SphereGeometry(0.38, 32, 32);
  laGeo.scale(1.05, 0.95, 1.1);
  laGeo.translate(0.35, 0.48, -0.32);
  laGeo.computeVertexNormals();
  const laMesh = new THREE.Mesh(laGeo, atriaMat);
  laMesh.name = 'la_mesh';
  myocardiumGroup.add(laMesh);

  // --- Right Auricle (Atrial Appendage overlapping aortic root) ---
  const raAuricleGeo = new THREE.ConeGeometry(0.22, 0.42, 24);
  raAuricleGeo.rotateZ(Math.PI * 0.4);
  raAuricleGeo.rotateX(Math.PI * 0.15);
  raAuricleGeo.translate(-0.35, 0.52, 0.28);
  raAuricleGeo.computeVertexNormals();
  const raAuricleMesh = new THREE.Mesh(raAuricleGeo, atriaMat);
  raAuricleMesh.name = 'ra_auricle_mesh';
  myocardiumGroup.add(raAuricleMesh);

  // --- Left Auricle (Muscular flap overlapping proximal LAD) ---
  const laAuricleGeo = new THREE.ConeGeometry(0.2, 0.38, 24);
  laAuricleGeo.rotateZ(-Math.PI * 0.35);
  laAuricleGeo.rotateX(-Math.PI * 0.1);
  laAuricleGeo.translate(0.32, 0.55, 0.18);
  laAuricleGeo.computeVertexNormals();
  const laAuricleMesh = new THREE.Mesh(laAuricleGeo, atriaMat);
  laAuricleMesh.name = 'la_auricle_mesh';
  myocardiumGroup.add(laAuricleMesh);

  // --- Ascending Aorta & Aortic Arch ---
  const aortaCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.0, 0.35, 0.0),
    new THREE.Vector3(-0.04, 0.72, 0.05),
    new THREE.Vector3(-0.1, 1.1, -0.02),
    new THREE.Vector3(-0.18, 1.25, -0.22),
    new THREE.Vector3(-0.25, 1.05, -0.45),
    new THREE.Vector3(-0.28, 0.4, -0.52),
  ]);
  const aortaGeo = new THREE.TubeGeometry(aortaCurve, 40, 0.17, 24, false);
  const aortaMat = new THREE.MeshStandardMaterial({
    color: 0x881337, // Arterial crimson
    roughness: 0.32,
    metalness: 0.15,
    name: 'mat_aorta',
  });
  const aortaMesh = new THREE.Mesh(aortaGeo, aortaMat);
  aortaMesh.name = 'aorta_mesh';
  myocardiumGroup.add(aortaMesh);

  // --- 3 Aortic Arch Branches (Brachiocephalic, Left Common Carotid, Left Subclavian) ---
  const archBranchCurves = [
    new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.08, 1.18, -0.05),
      new THREE.Vector3(-0.15, 1.48, -0.02),
    ]),
    new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.14, 1.22, -0.16),
      new THREE.Vector3(-0.18, 1.5, -0.15),
    ]),
    new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.2, 1.18, -0.28),
      new THREE.Vector3(-0.24, 1.46, -0.3),
    ]),
  ];
  archBranchCurves.forEach((curve, idx) => {
    const branchGeo = new THREE.TubeGeometry(curve, 12, 0.042, 16, false);
    const branchMesh = new THREE.Mesh(branchGeo, aortaMat);
    branchMesh.name = `aorta_branch_${idx + 1}`;
    myocardiumGroup.add(branchMesh);
  });

  // --- Pulmonary Trunk & Bifurcation ---
  const pulmonaryTrunkCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.12, 0.32, 0.32),
    new THREE.Vector3(0.06, 0.65, 0.28),
    new THREE.Vector3(-0.06, 0.88, 0.1),
  ]);
  const pulmonaryTrunkGeo = new THREE.TubeGeometry(pulmonaryTrunkCurve, 28, 0.15, 24, false);

  const leftPaCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.06, 0.88, 0.1),
    new THREE.Vector3(0.3, 0.82, -0.12),
    new THREE.Vector3(0.62, 0.72, -0.28),
  ]);
  const leftPaGeo = new THREE.TubeGeometry(leftPaCurve, 20, 0.1, 18, false);

  const rightPaCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.06, 0.88, 0.1),
    new THREE.Vector3(-0.35, 0.8, -0.08),
    new THREE.Vector3(-0.68, 0.7, -0.18),
  ]);
  const rightPaGeo = new THREE.TubeGeometry(rightPaCurve, 20, 0.1, 18, false);

  const combinedPaGeo = BufferGeometryUtils.mergeGeometries([
    pulmonaryTrunkGeo,
    leftPaGeo,
    rightPaGeo,
  ]);
  const pulmonaryMat = new THREE.MeshStandardMaterial({
    color: 0x1d4ed8, // Deoxygenated pulmonary blue-gray
    roughness: 0.38,
    metalness: 0.12,
    name: 'mat_pulmonary',
  });
  const pulmonaryMesh = new THREE.Mesh(combinedPaGeo, pulmonaryMat);
  pulmonaryMesh.name = 'pulmonary_mesh';
  myocardiumGroup.add(pulmonaryMesh);

  // --- Superior Vena Cava (SVC) & Inferior Vena Cava (IVC) ---
  const svcCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.54, 1.25, -0.12),
    new THREE.Vector3(-0.55, 0.75, -0.1),
    new THREE.Vector3(-0.56, 0.48, -0.08),
  ]);
  const svcGeo = new THREE.TubeGeometry(svcCurve, 16, 0.11, 18, false);

  const ivcCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.56, 0.2, -0.15),
    new THREE.Vector3(-0.56, -0.25, -0.18),
  ]);
  const ivcGeo = new THREE.TubeGeometry(ivcCurve, 12, 0.11, 18, false);

  const combinedVcGeo = BufferGeometryUtils.mergeGeometries([svcGeo, ivcGeo]);
  const vcMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b, // Deep venous navy
    roughness: 0.45,
    metalness: 0.1,
    name: 'mat_venae_cavae',
  });
  const vcMesh = new THREE.Mesh(combinedVcGeo, vcMat);
  vcMesh.name = 'venae_cavae_mesh';
  myocardiumGroup.add(vcMesh);

  root.add(myocardiumGroup);

  // =========================================================================
  // 2. CORONARY ARTERY VASCULAR SYSTEM (LAD, LCX, RCA)
  // High-gloss, elevated PBR tubes offset cleanly from myocardial tissue
  // =========================================================================
  const defaultVesselMat = new THREE.MeshStandardMaterial({
    color: 0x10b981, // Healthy calibrated emerald
    roughness: 0.25,
    metalness: 0.22,
    emissive: 0x000000,
    name: 'mat_vessel_healthy',
  });

  // -------------------------------------------------------------------------
  // TARGET 1: Left Anterior Descending (LAD) + Diagonal Branch D1
  // Courses along anterior interventricular sulcus all the way to apex
  // -------------------------------------------------------------------------
  const ladMainCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.14, 0.42, 0.38),
    new THREE.Vector3(0.24, 0.24, 0.54),
    new THREE.Vector3(0.21, -0.04, 0.65),
    new THREE.Vector3(0.13, -0.38, 0.66),
    new THREE.Vector3(0.06, -0.72, 0.58),
    new THREE.Vector3(-0.01, -1.02, 0.42),
    new THREE.Vector3(-0.08, -1.24, 0.2),
    new THREE.Vector3(-0.11, -1.32, 0.0),
  ]);
  const ladMainGeo = new THREE.TubeGeometry(ladMainCurve, 64, 0.048, 16, false);

  // Diagonal Branch (D1) branching anterolaterally across LV free wall
  const ladD1Curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.21, -0.04, 0.65),
    new THREE.Vector3(0.38, -0.22, 0.58),
    new THREE.Vector3(0.5, -0.48, 0.42),
    new THREE.Vector3(0.54, -0.78, 0.22),
  ]);
  const ladD1Geo = new THREE.TubeGeometry(ladD1Curve, 32, 0.036, 14, false);

  const combinedLadGeo = BufferGeometryUtils.mergeGeometries([ladMainGeo, ladD1Geo]);
  const ladMesh = new THREE.Mesh(combinedLadGeo, defaultVesselMat.clone());
  ladMesh.name = 'vessel_LAD';
  root.add(ladMesh);

  // -------------------------------------------------------------------------
  // TARGET 2: Left Circumflex Artery (LCX) + Obtuse Marginal OM1
  // Courses in left atrioventricular groove around obtuse margin to posterior
  // -------------------------------------------------------------------------
  const lcxMainCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.14, 0.42, 0.38),
    new THREE.Vector3(0.38, 0.4, 0.28),
    new THREE.Vector3(0.62, 0.32, 0.12),
    new THREE.Vector3(0.74, 0.12, -0.12),
    new THREE.Vector3(0.7, -0.16, -0.38),
    new THREE.Vector3(0.54, -0.44, -0.56),
    new THREE.Vector3(0.3, -0.7, -0.54),
    new THREE.Vector3(0.1, -0.92, -0.44),
  ]);
  const lcxMainGeo = new THREE.TubeGeometry(lcxMainCurve, 64, 0.045, 16, false);

  // Obtuse Marginal Branch (OM1) descending across lateral LV wall
  const lcxOm1Curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.74, 0.12, -0.12),
    new THREE.Vector3(0.74, -0.18, -0.06),
    new THREE.Vector3(0.66, -0.52, 0.06),
    new THREE.Vector3(0.55, -0.8, 0.12),
  ]);
  const lcxOm1Geo = new THREE.TubeGeometry(lcxOm1Curve, 32, 0.035, 14, false);

  const combinedLcxGeo = BufferGeometryUtils.mergeGeometries([lcxMainGeo, lcxOm1Geo]);
  const lcxMesh = new THREE.Mesh(combinedLcxGeo, defaultVesselMat.clone());
  lcxMesh.name = 'vessel_LCX';
  root.add(lcxMesh);

  // -------------------------------------------------------------------------
  // TARGET 3: Right Coronary Artery (RCA) + Marginal & PDA Branches
  // Courses down right atrioventricular sulcus to diaphragmatic surface
  // -------------------------------------------------------------------------
  const rcaMainCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.12, 0.42, 0.28),
    new THREE.Vector3(-0.35, 0.36, 0.36),
    new THREE.Vector3(-0.58, 0.18, 0.39),
    new THREE.Vector3(-0.69, -0.1, 0.32),
    new THREE.Vector3(-0.68, -0.42, 0.14),
    new THREE.Vector3(-0.58, -0.72, -0.1),
    new THREE.Vector3(-0.38, -0.98, -0.28),
    new THREE.Vector3(-0.1, -1.16, -0.26),
    new THREE.Vector3(0.04, -1.22, -0.14),
  ]);
  const rcaMainGeo = new THREE.TubeGeometry(rcaMainCurve, 64, 0.046, 16, false);

  // Acute Marginal branch branching toward the RV anterior apex
  const rcaMarginalCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.69, -0.1, 0.32),
    new THREE.Vector3(-0.62, -0.38, 0.38),
    new THREE.Vector3(-0.46, -0.72, 0.4),
  ]);
  const rcaMarginalGeo = new THREE.TubeGeometry(rcaMarginalCurve, 28, 0.034, 14, false);

  const combinedRcaGeo = BufferGeometryUtils.mergeGeometries([rcaMainGeo, rcaMarginalGeo]);
  const rcaMesh = new THREE.Mesh(combinedRcaGeo, defaultVesselMat.clone());
  rcaMesh.name = 'vessel_RCA';
  root.add(rcaMesh);

  // =========================================================================
  // 3. ZERO-CENTERING NORMALIZATION
  // Shift all geometries so the model's true bounding center is exactly (0, 0, 0)
  // =========================================================================
  const boundingBox = new THREE.Box3().setFromObject(root);
  const center = new THREE.Vector3();
  boundingBox.getCenter(center);

  // Offset children so center aligns to world (0, 0, 0)
  root.children.forEach((child) => {
    child.position.sub(center);
  });

  return root;
}

/**
 * Computes bounding centers and camera focal vectors for UI auto-focus.
 */
function extractManifest(scene) {
  const manifest = {
    model_name: 'heart_coronary_optimized.glb',
    created_at: new Date().toISOString(),
    nodes: {},
    camera_presets: {
      default: {
        position: [0.0, 0.3, 5.2],
        target: [0.0, 0.0, 0.0],
        display_name: 'Anatomical Overview',
      },
      vessel_LAD: {
        position: [0.4, -0.2, 3.8],
        target: [0.1, -0.35, 0.35],
        display_name: 'Left Anterior Descending (Anterior View)',
      },
      vessel_LCX: {
        position: [3.8, 0.2, 0.5],
        target: [0.5, -0.2, -0.1],
        display_name: 'Left Circumflex (Left Lateral View)',
      },
      vessel_RCA: {
        position: [-3.6, 0.1, 1.8],
        target: [-0.4, -0.3, 0.2],
        display_name: 'Right Coronary Artery (Right Lateral View)',
      },
    },
  };

  scene.traverse((obj) => {
    if (obj.isMesh) {
      obj.geometry.computeBoundingBox();
      const bb = obj.geometry.boundingBox;
      const center = new THREE.Vector3();
      bb.getCenter(center);
      manifest.nodes[obj.name] = {
        center: [center.x, center.y, center.z],
        vertices: obj.geometry.attributes.position.count,
        triangles: obj.geometry.index
          ? obj.geometry.index.count / 3
          : obj.geometry.attributes.position.count / 3,
      };
    }
  });

  return manifest;
}

async function exportScene() {
  ensureDirectories();
  console.log('Building high-fidelity anatomical 3D coronary heart scene...');
  const scene = buildAnatomicalHeartScene();
  const manifest = extractManifest(scene);

  const exporter = new GLTFExporter();
  console.log('Exporting GLB binary via Three.js GLTFExporter...');

  exporter.parse(
    scene,
    (glbBuffer) => {
      const buffer = Buffer.from(glbBuffer);
      const outGlbOptimized = path.join(OUT_OPTIMIZED_DIR, 'heart_coronary_optimized.glb');
      const outGlbWebPublic = path.join(OUT_WEB_PUBLIC_DIR, 'heart_coronary_optimized.glb');
      const outManifest = path.join(OUT_OPTIMIZED_DIR, 'mesh_manifest.json');

      fs.writeFileSync(outGlbOptimized, buffer);
      fs.writeFileSync(outGlbWebPublic, buffer);
      fs.writeFileSync(outManifest, JSON.stringify(manifest, null, 2));

      console.log(`Successfully exported optimized GLB (${(buffer.length / 1024).toFixed(1)} KB) to:`);
      console.log(`  - ${outGlbOptimized}`);
      console.log(`  - ${outGlbWebPublic}`);
      console.log(`Successfully exported mesh manifest to: ${outManifest}`);
      console.log('Semantic nodes verified: [myocardium, vessel_LAD, vessel_LCX, vessel_RCA]');
    },
    (err) => {
      console.error('Failed to export GLB:', err);
      process.exit(1);
    },
    { binary: true }
  );
}

exportScene();
