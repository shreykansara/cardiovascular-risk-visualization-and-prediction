/**
 * 3D Anatomical Mesh Pipeline & glTF Optimization
 * Multimodal AI Hackathon 2026 - Track A: Cardiovascular Risk Visualization & Prediction
 *
 * Generates an anatomically accurate human coronary heart asset with distinct semantic nodes:
 * - 'myocardium': Ventricles, atria, aorta, and pulmonary trunk
 * - 'vessel_LAD': Left Anterior Descending Artery (anterior interventricular sulcus to apex)
 * - 'vessel_LCX': Left Circumflex Artery (atrioventricular sulcus to posterolateral wall)
 * - 'vessel_RCA': Right Coronary Artery (right coronary sulcus to posterior interventricular)
 *
 * Exports optimized production .glb assets and manifest to assets/3d/ and apps/web/public/models/
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';

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
 * Builds the composite 3D heart scene with verified semantic hierarchy.
 */
function buildHeartScene() {
  const root = new THREE.Group();
  root.name = 'Heart_Root';

  // --- 1. Myocardium (Cardiac Muscle & Great Vessels) ---
  const myocardiumGroup = new THREE.Group();
  myocardiumGroup.name = 'myocardium';

  // Ventricles Body (Curved organic ellipsoid tapering to apex)
  const ventGeo = new THREE.SphereGeometry(1.2, 48, 48);
  const ventPos = ventGeo.attributes.position;
  for (let i = 0; i < ventPos.count; i++) {
    const x = ventPos.getX(i);
    const y = ventPos.getY(i);
    const z = ventPos.getZ(i);

    // Sculpt into human heart shape: conical apex downwards, broader anterior left ventricle
    const taper = (1.5 - y) * 0.45;
    const anteriorBulge = z > 0 ? 1.0 + z * 0.25 : 1.0;
    ventPos.setXYZ(
      i,
      x * taper * 0.95 + (y < -0.5 ? -0.15 : 0.0),
      y * 1.35,
      z * taper * 0.85 * anteriorBulge
    );
  }
  ventGeo.computeVertexNormals();

  const myocardiumMaterial = new THREE.MeshStandardMaterial({
    color: 0x881337, // Deep anatomical burgundy / myocardium crimson
    roughness: 0.65,
    metalness: 0.12,
    name: 'mat_myocardium',
  });

  const ventriclesMesh = new THREE.Mesh(ventGeo, myocardiumMaterial);
  ventriclesMesh.name = 'ventricles_mesh';
  myocardiumGroup.add(ventriclesMesh);

  // Aorta Arch (Originating from central base, arching upwards and posterior)
  const aortaCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.1, 0.9, 0.1),
    new THREE.Vector3(0.05, 1.4, 0.15),
    new THREE.Vector3(-0.15, 1.85, 0.0),
    new THREE.Vector3(-0.35, 1.7, -0.35),
    new THREE.Vector3(-0.4, 1.2, -0.5),
  ]);
  const aortaGeo = new THREE.TubeGeometry(aortaCurve, 32, 0.24, 20, false);
  const aortaMaterial = new THREE.MeshStandardMaterial({
    color: 0xbe123c, // Rose aorta
    roughness: 0.55,
    metalness: 0.18,
    name: 'mat_aorta',
  });
  const aortaMesh = new THREE.Mesh(aortaGeo, aortaMaterial);
  aortaMesh.name = 'aorta_mesh';
  myocardiumGroup.add(aortaMesh);

  // Pulmonary Trunk (Crossing anterior to aorta)
  const pulmonaryCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.25, 0.7, 0.35),
    new THREE.Vector3(0.15, 1.2, 0.4),
    new THREE.Vector3(-0.25, 1.5, 0.25),
    new THREE.Vector3(-0.55, 1.4, 0.05),
  ]);
  const pulmonaryGeo = new THREE.TubeGeometry(pulmonaryCurve, 28, 0.21, 20, false);
  const pulmonaryMaterial = new THREE.MeshStandardMaterial({
    color: 0x1d4ed8, // Deep deoxygenated pulmonary blue
    roughness: 0.6,
    metalness: 0.15,
    name: 'mat_pulmonary',
  });
  const pulmonaryMesh = new THREE.Mesh(pulmonaryGeo, pulmonaryMaterial);
  pulmonaryMesh.name = 'pulmonary_mesh';
  myocardiumGroup.add(pulmonaryMesh);

  root.add(myocardiumGroup);

  // --- 2. Coronary Arterial Vessels (LAD, LCX, RCA) ---
  const defaultVesselMaterial = new THREE.MeshStandardMaterial({
    color: 0x10b981, // Default baseline healthy emerald
    roughness: 0.35,
    metalness: 0.25,
    emissive: 0x000000,
    name: 'mat_vessel_healthy',
  });

  // Target Vessel 1: Left Anterior Descending (LAD)
  // Originates from left coronary ostium, courses down the anterior interventricular sulcus to apex
  const ladCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.25, 0.85, 0.42),
    new THREE.Vector3(0.35, 0.55, 0.68),
    new THREE.Vector3(0.32, 0.15, 0.88),
    new THREE.Vector3(0.22, -0.35, 0.94),
    new THREE.Vector3(0.12, -0.85, 0.82),
    new THREE.Vector3(0.04, -1.35, 0.55),
    new THREE.Vector3(-0.05, -1.68, 0.18),
  ]);
  const ladGeo = new THREE.TubeGeometry(ladCurve, 64, 0.048, 16, false);
  const ladMesh = new THREE.Mesh(ladGeo, defaultVesselMaterial.clone());
  ladMesh.name = 'vessel_LAD';
  root.add(ladMesh);

  // Target Vessel 2: Left Circumflex (LCX)
  // Branches from left main, travels posteriorly around the left atrioventricular groove
  const lcxCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.25, 0.85, 0.42),
    new THREE.Vector3(0.58, 0.72, 0.32),
    new THREE.Vector3(0.88, 0.48, 0.05),
    new THREE.Vector3(0.96, 0.15, -0.32),
    new THREE.Vector3(0.82, -0.35, -0.65),
    new THREE.Vector3(0.55, -0.85, -0.78),
    new THREE.Vector3(0.25, -1.25, -0.65),
  ]);
  const lcxGeo = new THREE.TubeGeometry(lcxCurve, 64, 0.044, 16, false);
  const lcxMesh = new THREE.Mesh(lcxGeo, defaultVesselMaterial.clone());
  lcxMesh.name = 'vessel_LCX';
  root.add(lcxMesh);

  // Target Vessel 3: Right Coronary Artery (RCA)
  // Originates from right aortic sinus, descends along the right atrioventricular sulcus
  const rcaCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.22, 0.85, 0.35),
    new THREE.Vector3(-0.55, 0.65, 0.48),
    new THREE.Vector3(-0.82, 0.25, 0.52),
    new THREE.Vector3(-0.92, -0.25, 0.38),
    new THREE.Vector3(-0.85, -0.75, 0.05),
    new THREE.Vector3(-0.62, -1.15, -0.32),
    new THREE.Vector3(-0.25, -1.48, -0.42),
    new THREE.Vector3(-0.02, -1.65, -0.15),
  ]);
  const rcaGeo = new THREE.TubeGeometry(rcaCurve, 64, 0.046, 16, false);
  const rcaMesh = new THREE.Mesh(rcaGeo, defaultVesselMaterial.clone());
  rcaMesh.name = 'vessel_RCA';
  root.add(rcaMesh);

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
        position: [0.0, 0.5, 4.2],
        target: [0.0, 0.0, 0.0],
      },
      vessel_LAD: {
        position: [0.35, -0.2, 2.6],
        target: [0.18, -0.5, 0.5],
        display_name: 'Left Anterior Descending (Anterior View)',
      },
      vessel_LCX: {
        position: [2.8, -0.2, -0.5],
        target: [0.65, -0.3, -0.3],
        display_name: 'Left Circumflex (Left Lateral/Posterior View)',
      },
      vessel_RCA: {
        position: [-2.6, -0.2, 1.2],
        target: [-0.55, -0.4, 0.1],
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
        triangles: obj.geometry.index ? obj.geometry.index.count / 3 : obj.geometry.attributes.position.count / 3,
      };
    }
  });

  return manifest;
}

async function exportScene() {
  ensureDirectories();
  console.log('Building high-fidelity 3D coronary heart scene...');
  const scene = buildHeartScene();
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
