import React, { useState, useEffect, useRef } from 'react'
import SpiroCanvas from './components/SpiroCanvas'
import ControlPanel from './components/ControlPanel'
import LayerPanel from './components/LayerPanel'
import { SpiroLayer, SpiroParameters } from './types'
import { toPng } from 'html-to-image'
import { Analytics } from "@vercel/analytics/react"
import { generateSpirographPoints } from './utils/spiroCalculations'
import './App.css'

function App() {
  const [layers, setLayers] = useState<SpiroLayer[]>([]);
  const [activeLayerIndex, setActiveLayerIndex] = useState<number>(-1);
  const [visualizerParam, setVisualizerParam] = useState<'R' | 'r' | 'd' | 'startAngle' | 'tooth' | 'strokeWidth' | 'isHypotrochoid' | 'blendMode' | 'color' | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [defaultParameters] = useState<SpiroParameters>({
    R: 100,
    r: 50,
    d: 50,
    isHypotrochoid: false,
    startAngle: 0,
    strokeWidth: 2,
    blendMode: 'normal',
    tooth: 0,
    maxR: 200,
    maxr: 100,
    color: '#000000',
    lineStyle: 'solid',
    harmonyThreshold: 0.1
  });

  const addLayer = () => {
    // If there are existing layers, duplicate the last one, otherwise use defaults
    const baseLayer = layers.length > 0 ? layers[layers.length - 1] : null;
    
    const newLayer: SpiroLayer = {
      id: Date.now().toString(),
      name: `Layer ${layers.length + 1}`,
      visible: true,
      parameters: {
        R: baseLayer?.parameters.R ?? 200,
        r: baseLayer?.parameters.r ?? 75,
        d: baseLayer?.parameters.d ?? 50,  // This will be constrained below
        isHypotrochoid: baseLayer?.parameters.isHypotrochoid ?? true,
        startAngle: baseLayer?.parameters.startAngle ?? 0,
        strokeWidth: baseLayer?.parameters.strokeWidth ?? 2,
        blendMode: baseLayer?.parameters.blendMode ?? 'normal',
        tooth: baseLayer?.parameters.tooth ?? 1,
        maxR: baseLayer?.parameters.maxR ?? 300,
        maxr: baseLayer?.parameters.maxr ?? 150,
        // Adjust color hue by +15 if there's a base layer
        color: baseLayer ? adjustHue(baseLayer.parameters.color, 15) : '#3060ff',
        lineStyle: baseLayer?.parameters.lineStyle ?? 'solid',
        harmonyThreshold: baseLayer?.parameters.harmonyThreshold ?? 0.1
      }
    };

    // Ensure d doesn't exceed r-1
    newLayer.parameters.d = Math.min(newLayer.parameters.d, newLayer.parameters.r - 1);

    setLayers([...layers, newLayer]);
    setActiveLayerIndex(layers.length);
  };

  // Helper function to adjust hue of a hex color
  const adjustHue = (hexColor: string, degrees: number): string => {
    // Convert hex to RGB
    const r = parseInt(hexColor.slice(1, 3), 16) / 255;
    const g = parseInt(hexColor.slice(3, 5), 16) / 255;
    const b = parseInt(hexColor.slice(5, 7), 16) / 255;

    // Convert RGB to HSL
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }

    // Adjust hue
    h = (h + degrees / 360) % 1;
    if (h < 0) h += 1;

    // Convert HSL back to RGB
    let r2, g2, b2;
    if (s === 0) {
      r2 = g2 = b2 = l;
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };

      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r2 = hue2rgb(p, q, h + 1/3);
      g2 = hue2rgb(p, q, h);
      b2 = hue2rgb(p, q, h - 1/3);
    }

    // Convert RGB back to hex
    const toHex = (x: number) => {
      const hex = Math.round(x * 255).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };

    return `#${toHex(r2)}${toHex(g2)}${toHex(b2)}`;
  };

  const updateLayer = (index: number, updatedLayer: SpiroLayer) => {
    const updatedLayers = [...layers];
    updatedLayers[index] = updatedLayer;
    setLayers(updatedLayers);
  };

  const deleteLayer = (index: number) => {
    const updatedLayers = layers.filter((_, i) => i !== index);
    setLayers(updatedLayers);
    setActiveLayerIndex(updatedLayers.length > 0 ? 0 : -1);
  };

  const moveLayer = (fromIndex: number, toIndex: number) => {
    const updatedLayers = [...layers];
    const [movedLayer] = updatedLayers.splice(fromIndex, 1);
    updatedLayers.splice(toIndex, 0, movedLayer);
    setLayers(updatedLayers);
    setActiveLayerIndex(toIndex);
  };

  // Export functions moved from SpiroCanvas
  const exportImage = () => {
    const canvas = document.querySelector('.spiro-canvas') as HTMLCanvasElement;
    if (!canvas) {
      console.error('Canvas element not found');
      return;
    }

    // Create a temporary canvas to combine the main canvas and visualizer
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    
    if (!tempCtx) {
      console.error('Could not get canvas context');
      return;
    }

    // Draw the main canvas
    tempCtx.drawImage(canvas, 0, 0);

    // Draw the visualizer canvas if it exists
    const visualizer = document.querySelector('.spiro-visualizer') as HTMLCanvasElement;
    if (visualizer) {
      tempCtx.drawImage(visualizer, 0, 0);
    }

    // Convert to PNG
    try {
      const dataUrl = tempCanvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = 'spirograph.png';
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Error exporting image:', err);
    }
  };

  const exportSVG = () => {
    const canvas = document.querySelector('.spiro-canvas') as HTMLCanvasElement;
    if (!canvas) return;

    // Create SVG element
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', canvas.width.toString());
    svg.setAttribute('height', canvas.height.toString());
    svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

    // Calculate center point
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    // Add each visible layer as a path
    layers.forEach(layer => {
      if (!layer.visible) return;

      const { parameters } = layer;
      const points = generateSpirographPoints(parameters);

      // Create path element
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      
      // Build path data
      let pathData = '';
      if (points.length > 0) {
        pathData = `M ${centerX + points[0].x} ${centerY + points[0].y}`;
        
        for (let i = 1; i < points.length; i++) {
          pathData += ` L ${centerX + points[i].x} ${centerY + points[i].y}`;
        }
      }

      // Set path attributes
      path.setAttribute('d', pathData);
      path.setAttribute('stroke', parameters.color);
      path.setAttribute('stroke-width', parameters.strokeWidth.toString());
      path.setAttribute('fill', 'none');
      path.setAttribute('style', `mix-blend-mode: ${parameters.blendMode}`);

      // Add path to SVG
      svg.appendChild(path);
    });

    // Convert SVG to data URL and download
    const svgData = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);
    
    const link = document.createElement('a');
    link.href = svgUrl;
    link.download = 'spirograph.svg';
    link.click();
    URL.revokeObjectURL(svgUrl);
  };

  // Auto-add the first layer when the component mounts
  useEffect(() => {
    if (layers.length === 0) {
      addLayer();
    }
  }, []);

  return (
    <div className="app-container">
      <div className="canvas-container">
        <SpiroCanvas 
          layers={layers}
          activeLayerIndex={activeLayerIndex}
          visualizerParam={visualizerParam}
          setVisualizerParam={setVisualizerParam}
          exportImage={exportImage}
          exportSVG={exportSVG}
        />
      </div>
      <div className="sidebar-container">
        <div className="panels-container">
          <ControlPanel 
            layer={activeLayerIndex >= 0 ? layers[activeLayerIndex] : null} 
            updateLayer={(updatedLayer) => {
              if (activeLayerIndex >= 0) {
                updateLayer(activeLayerIndex, updatedLayer);
              }
            }}
            setVisualizerParam={setVisualizerParam}
          />
          <LayerPanel 
            layers={layers}
            activeLayerIndex={activeLayerIndex}
            setActiveLayerIndex={setActiveLayerIndex}
            addLayer={addLayer}
            deleteLayer={deleteLayer}
            updateLayer={updateLayer}
            moveLayer={moveLayer}
          />
        </div>
        <div className="export-buttons-container">
          <button onClick={exportImage} className="export-button">
            Export PNG
          </button>
          <button onClick={exportSVG} className="export-button">
            Export SVG
          </button>
        </div>
      </div>
      <Analytics />
    </div>
  )
}

export default App 