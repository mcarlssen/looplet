export type SpiroParameters = {
  R: number;            // Fixed ring radius
  r: number;            // Rolling gear radius
  d: number;            // Pen offset distance
  isHypotrochoid: boolean; // Inside (hypotrochoid) or outside (epitrochoid)
  startAngle: number;   // Start angle offset in radians
  color: string;        // Stroke color
  strokeWidth: number;  // Stroke width
  blendMode: string;    // CSS blend mode
};

export type SpiroLayer = {
  id: string;
  name: string;
  visible: boolean;
  parameters: SpiroParameters;
};

export type Point = {
  x: number;
  y: number;
};

export type VisualizerState = {
  active: boolean;
  parameterName: 'R' | 'r' | 'd' | 'startAngle' | null;
  fadeTimer: number | null;
  startTime: number;
}; 