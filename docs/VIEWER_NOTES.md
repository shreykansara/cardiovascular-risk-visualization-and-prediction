# 3D Viewer Inspection Notes

## Component & File Architecture

The 3D heart visualization in Perfusion3D is organized under `apps/web/src/components/3d/` and consumed by `apps/web/src/pages/ResultsPage.tsx`.

### 1. Scene Background
- **File**: `apps/web/src/components/3d/HeartCanvas.tsx`
- **Line 15**: Outer container with `className="relative w-full h-full bg-panel overflow-hidden select-none"`.
- **Line 21**: Three.js scene background color:
  ```tsx
  <color attach="background" args={['rgb(246, 247, 249)']} />
  ```
  Currently hardcoded to a clinical light grey (`rgb(246, 247, 249)`).

### 2. Camera Configuration
- **File**: `apps/web/src/components/3d/HeartCanvas.tsx`
  - **Line 18**: Initial camera parameters:
    ```tsx
    camera={{ position: [0.0, 0.0, 3.1], fov: 40 }}
    ```
- **File**: `apps/web/src/components/3d/CameraRig.tsx`
  - **Lines 12–33**: Vessel-specific camera presets (`CAMERA_PRESETS`) for `default`, `all`, `vessel_LAD`, `vessel_LCX`, and `vessel_RCA`.
  - **Lines 48–54**: Initial mount cinematic dolly-in starting from `[0.0, 0.0, 3.9]` to target.
  - **Lines 80–107**: `useFrame` lerp transition towards active vessel focus targets.

### 3. Lighting System
- **File**: `apps/web/src/components/3d/HeartCanvas.tsx`
- **Lines 24–28**: High-luminance clinical studio lighting:
  ```tsx
  <ambientLight intensity={1.35} color="rgb(255, 255, 255)" />
  <directionalLight position={[3.5, 4.0, 3.5]} intensity={2.2} color="rgb(255, 255, 255)" />
  <directionalLight position={[-3.5, 1.5, 2.5]} intensity={1.1} color="rgb(226, 232, 240)" />
  <directionalLight position={[0.0, 3.0, -4.0]} intensity={1.2} color="rgb(203, 213, 225)" />
  <directionalLight position={[0.0, -3.0, 1.5]} intensity={0.5} color="rgb(255, 255, 255)" />
  ```

### 4. Controls
- **File**: `apps/web/src/components/3d/HeartCanvas.tsx`
- **Lines 43–61**: Drei `OrbitControls`:
  ```tsx
  <OrbitControls
    ref={controlsRef}
    enableDamping
    dampingFactor={0.08}
    minDistance={1.8}
    maxDistance={6.0}
    maxPolarAngle={Math.PI * 0.85}
    minPolarAngle={Math.PI * 0.15}
    makeDefault
    onStart={...}
    onEnd={...}
  />
  ```

### 5. Loading State
- **File**: `apps/web/src/components/3d/HeartCanvas.tsx`
- **Lines 30–38**: React Suspense fallback with Drei `<Html center>`:
  ```tsx
  <Suspense
    fallback={
      <Html center>
        <div className="flex flex-col items-center gap-2 p-3 rounded bg-page text-text-muted text-[13px] border border-border">
          <span className="spinner" />
          <span>Loading 3D model...</span>
        </div>
      </Html>
    }
  >
  ```

### 6. Vessel Status Labels
- **Question**: Do the vessel labels live in `HeartModel`?
- **Answer**: **YES**. All vessel callout badges are implemented as Drei `<Html>` overlays directly embedded inside `apps/web/src/components/3d/HeartModel.tsx`:
  - **LAD Badge**: Lines 451–488 (`<Html position={ladBadgePos} center distanceFactor={3.5}...>`)
  - **LCX Badge**: Lines 523–560 (`<Html position={lcxBadgePos} center distanceFactor={3.5}...>`)
  - **RCA Badge**: Lines 595–632 (`<Html position={rcaBadgePos} center distanceFactor={3.5}...>`)
  - Currently styled as large rounded-full pills (`gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-medium backdrop-blur-md shadow-lg`) with animated ping dots, which violate the DLS rules (no shadows, no pills, no blur).

## 7. Round 4 Baseline & Reversion (Task 0.2 & 0.4)

- **BASELINE_SHA**: `64e9f331941c74a4981bdb8e3765459c09101c51` (`64e9f33`)
  - Commit message: `feat(screens): implement Task 5.4 Results screen layout and telemetry`
  - Immediately precedes commit `b7ac9dd` (`feat(viewer): recessed chest cavity, compact vessel labels, and interactive toolbar`) which introduced `cavityConfig.ts`, `CavityBackdrop.tsx`, `cavity.css`, scene fog, and rim/fill/glow lights.

### Baseline Scene Luminance & Occupancy (Sample Patient: Normal, 1440px desktop)
Measured from baseline scene renders (`rgb(246, 247, 249)` background, heart pixels only):
- **Front View**:
  - Heart Occupancy: 26.81% (63,706 / 237,600 pixels)
  - Mean Heart Luminance (0–255): 63.50
  - Mean Heart Luminance (0–1): 0.2490
- **Left View**:
  - Heart Occupancy: 24.70% (58,698 / 237,600 pixels)
  - Mean Heart Luminance (0–255): 57.25
  - Mean Heart Luminance (0–1): 0.2245
- **Back View**:
  - Heart Occupancy: 23.44% (55,687 / 237,600 pixels)
  - Mean Heart Luminance (0–255): 53.96
  - Mean Heart Luminance (0–1): 0.2116
- **Right View**:
  - Heart Occupancy: 26.22% (62,299 / 237,600 pixels)
  - Mean Heart Luminance (0–255): 61.61
  - Mean Heart Luminance (0–1): 0.2416
- **Overall Baseline Mean Heart Luminance**: 59.08 (0–255) / 0.2317 (0–1)

### Artifacts Captured:
- Current (broken cavity) look: `docs/screenshots/round4/viewer-before/{front,left,back,right}.png`
- Baseline (pre-cavity) look: `docs/screenshots/round4/viewer-baseline/{front,left,back,right}.png`

