import { SpiroParameters, Point } from '../types';

/**
 * Calculate the greatest common divisor of two numbers
 */
export const gcd = (a: number, b: number): number => {
  return b ? gcd(b, a % b) : a;
};

/**
 * Find all factors of a number
 */
export const getFactors = (n: number): number[] => {
  const factors: number[] = [];
  for (let i = 1; i <= Math.sqrt(n); i++) {
    if (n % i === 0) {
      factors.push(i);
      if (i !== n / i) {
        factors.push(n / i);
      }
    }
  }
  return factors.sort((a, b) => a - b);
};

/**
 * Calculate optimal tooth sizes for given R and r values
 * Returns an array of tooth sizes that would create harmonious patterns
 */
export function calculateOptimalToothSizes(R: number): number[] {
  // Calculate optimal tooth sizes based on R
  // We want tooth sizes that divide R evenly
  const maxTeeth = Math.min(24, Math.floor(R / 4)); // Cap at 24 teeth or R/4, whichever is smaller
  const minTeeth = Math.max(4, Math.floor(R / 20)); // At least 4 teeth or R/20, whichever is larger
  
  const optimalSizes: number[] = [];
  for (let i = minTeeth; i <= maxTeeth; i++) {
    if (R % i < 0.1 || (R % i > i - 0.1)) { // Allow for small floating point errors
      optimalSizes.push(i);
    }
  }
  
  return optimalSizes;
}

/**
 * Calculate how "optimal" a tooth size is for given R and r values
 * Returns a value between 0 and 1, where 1 is perfectly optimal
 */
export const calculateToothHarmony = (R: number, r: number, tooth: number): number => {
  // Check if tooth size divides evenly into both R and r
  const rRemainder = r % tooth;
  const RRemainder = R % tooth;
  
  // Calculate how close the remainders are to 0 or tooth
  const rError = Math.min(rRemainder, tooth - rRemainder) / tooth;
  const RError = Math.min(RRemainder, tooth - RRemainder) / tooth;
  
  // Return harmony factor (1 - average error)
  return 1 - (rError + RError) / 2;
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
 * Calculate symmetry score based on shared factors and their relationships
 */
const calculateSymmetryScore = (R: number, r: number): number => {
  // Get prime factors of both numbers
  const factorsR = getFactors(R);
  const factorsR5 = factorsR.filter(f => f >= 5 && f <= R/4);  // Consider meaningful factors
  const factorsr = getFactors(r);
  const factorsr5 = factorsr.filter(f => f >= 5 && f <= r/2);  // Consider meaningful factors
  
  // Find shared factors
  const sharedFactors = factorsR5.filter(f => factorsr5.includes(f));
  
  // Calculate base symmetry score from shared factors
  const baseSymmetry = sharedFactors.length > 0 ? 
    Math.min(1, sharedFactors.length * 0.3) : 0;
  
  // Calculate alignment score based on how r divides into R
  const division = R / r;
  const nearestWhole = Math.round(division);
  const alignmentError = Math.abs(division - nearestWhole);
  
  // Make alignment score more strict - require very close alignment
  const alignmentScore = Math.max(0, 1 - alignmentError * 4);
  
  // Penalize high rotation counts without shared factors
  const rotationPenalty = sharedFactors.length === 0 && r > 25 ? 0.5 : 1;
  
  // Combine scores with heavier weight on shared factors
  return ((baseSymmetry * 0.6) + (alignmentScore * 0.4)) * rotationPenalty;
};

/**
 * Calculate the harmony factor of a spirograph configuration
 * Higher values (closer to 1) indicate more visually pleasing patterns
 * Considers pattern complexity, organization, and symmetry
 */
export const calculateHarmonyFactor = (R: number, r: number): number => {
  if (R === 0 || r === 0) return 0;
  
  const gcdValue = gcd(R, r);
  const rotations = r / gcdValue;
  
  // Pattern Complexity Score (0 to 1)
  // - Peaks at around 12-20 rotations (most interesting visual patterns)
  // - Lower for too few (<5) or too many (>25) rotations
  const optimalRotations = 16;
  const rotationSpread = 8;
  const complexityScore = Math.exp(
    -Math.pow(rotations - optimalRotations, 2) / (2 * rotationSpread * rotationSpread)
  );
  
  // Visual Organization Score (0 to 1)
  // - How evenly the pattern fills the space
  // - Based on the ratio of r to R, with preference for ratios between 1/8 and 1/4
  const ratio = r / R;
  const optimalRatio = 0.175; // Slightly smaller ratio preferred
  const ratioSpread = 0.125;  // Tighter spread
  const organizationScore = Math.exp(
    -Math.pow(ratio - optimalRatio, 2) / (2 * ratioSpread * ratioSpread)
  );
  
  // Symmetry Score (0 to 1)
  // - Considers shared factors and how well rotations align
  const symmetryScore = calculateSymmetryScore(R, r);
  
  // Combine scores with adjusted weights to emphasize symmetry
  return (complexityScore * 0.25) + 
         (organizationScore * 0.25) + 
         (symmetryScore * 0.5);  // Increased weight on symmetry
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