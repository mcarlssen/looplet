import { SpiroParameters, Point } from '../types';

/**
 * Calculate the greatest common divisor of two numbers
 */
export const gcd = (a: number, b: number): number => {
  return b ? gcd(b, a % b) : a;
};

/**
 * Calculate the number of rotations needed for the curve to close
 */
export const calculateRotations = (R: number, r: number): number => {
  if (!r || !R) return 1;
  return r / gcd(R, r);
};

/**
 * Calculate a point on a hypotrochoid curve (gear rolls inside fixed ring)
 */
export const calculateHypotrochoidPoint = (
  R: number, 
  r: number, 
  d: number, 
  theta: number
): Point => {
  return {
    x: (R - r) * Math.cos(theta) + d * Math.cos((R - r) / r * theta),
    y: (R - r) * Math.sin(theta) - d * Math.sin((R - r) / r * theta)
  };
};

/**
 * Calculate a point on an epitrochoid curve (gear rolls outside fixed ring)
 */
export const calculateEpitrochoidPoint = (
  R: number, 
  r: number, 
  d: number, 
  theta: number
): Point => {
  return {
    x: (R + r) * Math.cos(theta) - d * Math.cos((R + r) / r * theta),
    y: (R + r) * Math.sin(theta) - d * Math.sin((R + r) / r * theta)
  };
};

/**
 * Rotate a point around the origin by the given angle
 */
export const rotatePoint = (point: Point, angle: number): Point => {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return {
    x: point.x * cos - point.y * sin,
    y: point.x * sin + point.y * cos
  };
};

/**
 * Generate points for a spirograph curve based on parameters
 */
export const generateSpirographPoints = (
  params: SpiroParameters,
  numPoints: number = 1000
): Point[] => {
  const { R, r, d, isHypotrochoid, startAngle } = params;
  
  // Calculate max theta for a closed curve
  const rotations = calculateRotations(R, r);
  const thetaMax = 2 * Math.PI * rotations;
  
  const points: Point[] = [];
  for (let i = 0; i <= numPoints; i++) {
    const theta = (i / numPoints) * thetaMax;
    
    // Calculate base point without rotation
    const basePoint = isHypotrochoid 
      ? calculateHypotrochoidPoint(R, r, d, theta)
      : calculateEpitrochoidPoint(R, r, d, theta);
      
    // Apply rotation if start angle is provided
    const rotatedPoint = startAngle !== 0 
      ? rotatePoint(basePoint, startAngle) 
      : basePoint;
      
    points.push(rotatedPoint);
  }
  
  return points;
};

/**
 * Calculate the harmony factor of a spirograph configuration
 * Higher values (closer to 1) indicate smoother, less dense patterns
 * Lower values indicate more angular, dense patterns
 */
export const calculateHarmonyFactor = (R: number, r: number): number => {
  if (R === 0 || r === 0) return 0;
  
  // Check if r divides evenly into R (or nearly so)
  const remainder = R % r;
  const gcdValue = gcd(R, r);
  
  // Calculate ratio of gcd to the smaller of R and r
  // This gives us a value between 0 and 1
  const gcdRatio = gcdValue / Math.min(R, r);
  
  // Calculate how many rotations needed to close the curve
  const rotations = r / gcdValue;
  
  // Simple ratio - when r is a simple fraction of R (1/2, 1/3, etc.), 
  // patterns tend to be more pleasing
  const simpleRatio = Math.min(R, r) / Math.max(R, r);
  
  // Combine factors:
  // 1. We want higher gcdRatio (means values share common factors)
  // 2. Lower rotations are generally better (less dense)
  // 3. Simple ratios often produce pleasing results
  
  // Map rotations to a 0-1 scale where 1 is good (few rotations)
  const rotationFactor = Math.min(1, 5 / rotations);
  
  // Combine with weights
  return (gcdRatio * 0.4) + (rotationFactor * 0.4) + (simpleRatio * 0.2);
};

export const getValidRValues = (R: number, minHarmony: number = 0.5): number[] => {
  const validValues: number[] = [];
  const maxR = Math.floor(R * 0.95); // Don't let r get too close to R
  
  for (let r = 1; r <= maxR; r++) {
    const harmony = calculateHarmonyFactor(R, r);
    if (harmony >= minHarmony) {
      validValues.push(r);
    }
  }
  
  return validValues;
};

export const findNearestValidR = (R: number, currentR: number, minHarmony: number = 0.5): number => {
  const validValues = getValidRValues(R, minHarmony);
  if (validValues.length === 0) return currentR;
  
  // Find the closest valid value
  return validValues.reduce((prev, curr) => {
    return Math.abs(curr - currentR) < Math.abs(prev - currentR) ? curr : prev;
  });
}; 