import React, { useMemo } from 'react';
import * as THREE from 'three';
import { CAVITY_MID } from './cavityConfig';

interface CavityBackdropProps {
  boundingCenter?: [number, number, number];
  boundingRadius?: number;
}

export const CavityBackdrop: React.FC<CavityBackdropProps> = ({
  boundingCenter = [0.0, -0.08, 0.0],
  boundingRadius = 0.85,
}) => {
  // Inverted ellipsoid: radii 2.6 / 2.2 / 2.6 times the bounding-sphere radius
  const radii: [number, number, number] = useMemo(() => {
    return [
      boundingRadius * 2.6,
      boundingRadius * 2.2,
      boundingRadius * 2.6,
    ];
  }, [boundingRadius]);

  return (
    <mesh position={boundingCenter} scale={radii}>
      <sphereGeometry args={[1, 32, 24]} />
      <meshStandardMaterial
        color={CAVITY_MID}
        side={THREE.BackSide}
        roughness={1.0}
        metalness={0.0}
      />
    </mesh>
  );
};

export default CavityBackdrop;
