import React, { useRef, useEffect, useState } from 'react';
import { generateSpirographPoints, rotatePoint } from '../utils/spiroCalculations';
import { SpiroLayer, VisualizerState, Point } from '../types';
import './components.css';

interface SpiroCanvasProps {
  layers: SpiroLayer[];
  activeLayerIndex: number;
  visualizerParam: 'R' | 'r' | 'd' | 'startAngle' | 'tooth' | null;
  setVisualizerParam: (param: 'R' | 'r' | 'd' | 'startAngle' | 'tooth' | null) => void;
  exportImage: () => void;
  exportSVG: () => void;
}

const SpiroCanvas = ({ 
  layers, 
  activeLayerIndex,
  visualizerParam, 
  setVisualizerParam,
  exportImage,
  exportSVG
}: SpiroCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const visualizerRef = useRef<HTMLCanvasElement>(null);
  const [visualizer, setVisualizer] = useState<{
    active: boolean;
    parameterName: 'R' | 'r' | 'd' | 'startAngle' | 'tooth' | null;
    fadeTimer: number | null;
    startTime: number;
  }>({
    active: false,
    parameterName: null,
    fadeTimer: null,
    startTime: 0
  });
  
  // Effect for drawing the spirograph curves
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions to match container
    const resizeCanvas = () => {
      const container = canvas.parentElement;
      if (container) {
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;
        canvas.width = containerWidth;
        canvas.height = containerHeight;
        
        // Also resize visualizer canvas if it exists
        if (visualizerRef.current) {
          visualizerRef.current.width = containerWidth;
          visualizerRef.current.height = containerHeight;
        }
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Calculate center point
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    // Draw each visible layer
    layers.forEach(layer => {
      if (!layer.visible) return;

      const { parameters } = layer;
      const points = generateSpirographPoints(parameters);

      // Start drawing path
      ctx.save();
      ctx.globalCompositeOperation = parameters.blendMode as GlobalCompositeOperation;
      ctx.beginPath();

      // Move to first point
      if (points.length > 0) {
        ctx.moveTo(centerX + points[0].x, centerY + points[0].y);
      }

      // Draw lines to each point
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(centerX + points[i].x, centerY + points[i].y);
      }

      // Set styling and stroke
      ctx.strokeStyle = parameters.color;
      ctx.lineWidth = parameters.strokeWidth;
      ctx.stroke();
      ctx.restore();
    });

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [layers]);

  // Effect for the parameter visualizer
  useEffect(() => {
    if (!visualizerRef.current || activeLayerIndex < 0 || !layers[activeLayerIndex]) return;
    
    // If a parameter is being visualized, activate the visualizer
    if (visualizerParam) {
      // Clear any existing fade timer
      if (visualizer.fadeTimer) {
        window.clearTimeout(visualizer.fadeTimer);
      }
      
      // Activate visualizer
      setVisualizer({
        active: true,
        parameterName: visualizerParam,
        fadeTimer: null,
        startTime: Date.now()
      });
      
      // We don't set a auto-hide timer here anymore since we want the visualizer to stay
      // visible as long as the parameter is being changed or hovered
    } else if (visualizer.active) {
      // Set a timer to hide the visualizer when visualizerParam becomes null
      const timer = window.setTimeout(() => {
        setVisualizer(prev => ({
          ...prev,
          active: false,
          fadeTimer: null
        }));
      }, 1000); // Fade out after 1 second when parameter interaction ends
      
      // Update the fade timer
      setVisualizer(prev => ({
        ...prev,
        fadeTimer: timer as unknown as number
      }));
    }
  }, [visualizerParam, activeLayerIndex, layers, visualizer.active]);

  // Effect for drawing the visualizer
  useEffect(() => {
    if (!visualizerRef.current || !visualizer.active || activeLayerIndex < 0) return;
    
    const canvas = visualizerRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const layer = layers[activeLayerIndex];
    if (!layer) return;
    
    const { parameters } = layer;
    const { R, r, d, isHypotrochoid, startAngle } = parameters;
    
    // Calculate center point
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    // Calculate alpha for fade-out effect only when visualizer is no longer active
    let alpha = 1;
    if (visualizer.fadeTimer) {
      const elapsedMs = Date.now() - visualizer.startTime;
      const fadeOutDuration = 500; // ms
      
      // Calculate fade-out alpha
      alpha = Math.max(0, 1 - (elapsedMs / fadeOutDuration));
    }
    
    // Ensure alpha is between 0 and 1
    alpha = Math.max(0, Math.min(1, alpha));
    
    ctx.save();
    ctx.globalAlpha = alpha;
    
    // Draw visualizations based on the parameter being adjusted
    switch (visualizer.parameterName) {
      case 'R':
        // Visualize the fixed ring
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(255, 0, 0, 0.7)';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.arc(centerX, centerY, R, 0, 2 * Math.PI);
        ctx.stroke();
        
        // Add label
        ctx.font = '16px Arial';
        ctx.fillStyle = 'rgba(255, 0, 0, 0.9)';
        ctx.fillText(`Fixed Ring (R): ${R}`, centerX + R + 10, centerY);
        break;
        
      case 'r':
        // Visualize the rolling gear circle
        const gearX = isHypotrochoid 
          ? centerX + (R - r) 
          : centerX + (R + r);
        const gearY = centerY;
        
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(0, 128, 255, 0.7)';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.arc(gearX, gearY, r, 0, 2 * Math.PI);
        ctx.stroke();
        
        // Draw a line from center to rolling gear center
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(100, 100, 100, 0.5)';
        ctx.setLineDash([]);
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(gearX, gearY);
        ctx.stroke();
        
        // Add label
        ctx.font = '16px Arial';
        ctx.fillStyle = 'rgba(0, 128, 255, 0.9)';
        ctx.fillText(`Rolling Gear (r): ${r}`, gearX + 10, gearY - 10);
        break;
        
      case 'tooth':
        // Visualize the tooth size
        const toothSize = parameters.tooth;
        
        // Draw a small circle at the center to represent the tooth size
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(255, 165, 0, 0.7)';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.arc(centerX, centerY, toothSize, 0, 2 * Math.PI);
        ctx.stroke();
        
        // Add label
        ctx.font = '16px Arial';
        ctx.fillStyle = 'rgba(255, 165, 0, 0.9)';
        ctx.fillText(`Tooth Size: ${toothSize}`, centerX + toothSize + 10, centerY);
        break;
        
      case 'd':
        // Visualize the pen offset
        const gearCenterX = isHypotrochoid 
          ? centerX + (R - r) 
          : centerX + (R + r);
        const gearCenterY = centerY;
        
        // Draw the rolling gear
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(0, 128, 255, 0.4)';
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);
        ctx.arc(gearCenterX, gearCenterY, r, 0, 2 * Math.PI);
        ctx.stroke();
        
        // Draw the pen point
        const penX = gearCenterX + d;
        const penY = gearCenterY;
        
        ctx.beginPath();
        ctx.fillStyle = 'rgba(0, 200, 0, 0.7)';
        ctx.arc(penX, penY, 5, 0, 2 * Math.PI);
        ctx.fill();
        
        // Draw a line from gear center to pen
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(0, 200, 0, 0.7)';
        ctx.lineWidth = 2;
        ctx.setLineDash([]);
        ctx.moveTo(gearCenterX, gearCenterY);
        ctx.lineTo(penX, penY);
        ctx.stroke();
        
        // Add label
        ctx.font = '16px Arial';
        ctx.fillStyle = 'rgba(0, 200, 0, 0.9)';
        ctx.fillText(`Pen Offset (d): ${d}`, penX + 10, penY - 10);
        break;
        
      case 'startAngle':
        // Visualize rotation angle
        // Draw a guide circle
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(200, 200, 200, 0.3)';
        ctx.lineWidth = 1;
        ctx.arc(centerX, centerY, Math.min(R, 100), 0, 2 * Math.PI);
        ctx.stroke();
        
        // Draw a radial line at 0 degrees (right)
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(150, 150, 150, 0.5)';
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 2]);
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(centerX + Math.min(R, 100), centerY);
        ctx.stroke();
        
        // Draw a radial line at the start angle
        const anglePoint: Point = {
          x: Math.min(R, 100),
          y: 0
        };
        const rotated = rotatePoint(anglePoint, startAngle);
        
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(255, 165, 0, 0.8)';
        ctx.lineWidth = 2;
        ctx.setLineDash([]);
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(centerX + rotated.x, centerY + rotated.y);
        ctx.stroke();
        
        // Draw an arc showing the angle
        const startAngleDegrees = Math.round(startAngle * 180 / Math.PI);
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(255, 165, 0, 0.5)';
        ctx.lineWidth = 1;
        ctx.arc(centerX, centerY, 30, 0, startAngle, startAngle < 0);
        ctx.stroke();
        
        // Add label
        ctx.font = '16px Work Sans, Arial';
        ctx.fillStyle = 'rgba(255, 165, 0, 0.9)';
        ctx.fillText(`Rotation: ${startAngleDegrees}°`, 
          centerX + rotated.x * 0.6 + 10, 
          centerY + rotated.y * 0.6 - 10);
        break;
    }
    
    ctx.restore();
    
    // If we're fading out, request animation frame to continue animation
    if (visualizer.fadeTimer) {
      requestAnimationFrame(() => {
        // Force a re-render to continue the animation
        setVisualizer(prev => ({...prev}));
      });
    }
  }, [visualizer, layers, activeLayerIndex]);

  return (
    <div className="spiro-canvas-wrapper">
      <canvas 
        ref={canvasRef}
        className="spiro-canvas"
      />
      <canvas 
        ref={visualizerRef}
        className="spiro-visualizer"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          pointerEvents: 'none'
        }}
      />
    </div>
  );
};

export default SpiroCanvas; 