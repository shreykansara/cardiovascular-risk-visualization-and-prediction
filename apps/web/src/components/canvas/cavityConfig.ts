/**
 * Cavity Color & Lighting Configuration (Perfusion3D Clinical DLS)
 * Dark, desaturated plum-brown chest cavity environment
 */

export const CAVITY_EDGE = '#0F0809';
export const CAVITY_MID = '#1E1315';
export const CAVITY_GLOW = '#2E1B1D';

export const CAVITY_LIGHTS = {
  // Key light: #FFE9D6, intensity 1.4 from upper-left-front
  key: {
    color: '#FFE9D6',
    intensity: 1.4,
    position: [-3.0, 3.5, 3.2] as [number, number, number],
  },
  // Fill light: #C9D6E6, intensity 0.35 from the right
  fill: {
    color: '#C9D6E6',
    intensity: 0.35,
    position: [3.5, 1.0, 2.0] as [number, number, number],
  },
  // Rim light: #B7C4D4, intensity 0.9 from behind-top (separates silhouette from dark wall)
  rim: {
    color: '#B7C4D4',
    intensity: 0.9,
    position: [0.0, 3.5, -3.5] as [number, number, number],
  },
  // Point light: #7A2E33, intensity 0.5 behind the heart (cavity wall glow)
  glow: {
    color: '#7A2E33',
    intensity: 0.5,
    position: [0.0, -0.1, -1.2] as [number, number, number],
  },
};
