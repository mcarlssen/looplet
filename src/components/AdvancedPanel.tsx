import React, { useEffect, useRef, useState } from 'react';
import { SpiroLayer } from '../types';
import { calculateOptimalToothSizes, calculateToothHarmony, calculateHarmonyFactor } from '../utils/spiroCalculations';

interface AdvancedPanelProps {
  layer: SpiroLayer | null;
  updateLayer: (layer: SpiroLayer) => void;
  isOpen: boolean;
  onToggle: () => void;
}

const AdvancedPanel = ({ layer, updateLayer, isOpen, onToggle }: AdvancedPanelProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [optimalToothSizes, setOptimalToothSizes] = useState<number[]>([]);
  const STANDARD_TOOTH_SIZES = [24, 30, 36, 45, 60];

  useEffect(() => {
    const positionPanel = () => {
      const container = containerRef.current;
      if (!container) return;

      // Find the parameters panel
      const paramsPanel = document.querySelector('.control-panel') as HTMLElement;
      if (!paramsPanel) return;

      // Get the parameters panel position
      const paramsBounds = paramsPanel.getBoundingClientRect();

      // Position the advanced panel container
      container.style.right = `${window.innerWidth - paramsBounds.left}px`;
      container.style.top = `${paramsBounds.top}px`;
      container.style.height = `${paramsBounds.height}px`;
    };

    // Position initially and on resize
    positionPanel();
    window.addEventListener('resize', positionPanel);

    return () => {
      window.removeEventListener('resize', positionPanel);
    };
  }, []);

  // Calculate optimal tooth sizes when R changes and update the layer's tooth size
  useEffect(() => {
    if (layer) {
      const optimal = calculateOptimalToothSizes(layer.parameters.R);
      setOptimalToothSizes(optimal);
      
      // If current tooth size isn't one of the standard sizes,
      // update to the smallest standard value
      if (!STANDARD_TOOTH_SIZES.includes(layer.parameters.tooth)) {
        handleParameterChange('tooth', STANDARD_TOOTH_SIZES[0]);
      }
    }
  }, []);

  if (!layer) return null;

  const handleParameterChange = (key: string, value: number) => {
    const newLayer = { ...layer };
    newLayer.parameters = {
      ...layer.parameters,
      [key]: value
    };
    updateLayer(newLayer);
  };

  return (
    <div ref={containerRef} className={`advanced-panel-container ${isOpen ? 'open' : ''}`}>
      <div className="advanced-panel">
        <h3>Advanced Parameters</h3>
        
        <div className="advanced-parameter-group">
          <div className="tooth-size-section">
            <div className="tooth-size-header">
              <span>Tooth Size: {layer.parameters.tooth}</span>
            </div>
            <div className="optimal-tooth-list">
              {STANDARD_TOOTH_SIZES.map((size) => (
                <button
                  key={size}
                  className={`optimal-tooth-button ${size === layer.parameters.tooth ? 'active' : ''}`}
                  onClick={() => handleParameterChange('tooth', size)}
                >
                  {size}
                </button>
              ))}
            </div>
            <div className="tooth-size-description">
              Sets the granularity of the fixed ring (R). Higher values create more regular patterns.
            </div>
          </div>
        </div>

        <div className="advanced-parameter-group">
          <div className="tooth-size-section">
            <div className="tooth-size-header">
              <span>Max Ring Size (R): {layer.parameters.maxR}</span>
            </div>
            <input
              id="max-R"
              type="range"
              min={100}
              max={500}
              step={10}
              value={layer.parameters.maxR}
              onChange={(e) => handleParameterChange('maxR', parseFloat(e.target.value))}
            />
            <div className="tooth-size-description">
              Maximum allowed value for the fixed ring radius (R).
            </div>
          </div>
        </div>

        <div className="advanced-parameter-group">
          <div className="tooth-size-section">
            <div className="tooth-size-header">
              <span>Max Gear Size (r): {layer.parameters.maxr}</span>
            </div>
            <input
              id="max-r"
              type="range"
              min={50}
              max={250}
              step={10}
              value={layer.parameters.maxr}
              onChange={(e) => handleParameterChange('maxr', parseFloat(e.target.value))}
            />
            <div className="tooth-size-description">
              Maximum allowed value for the rolling gear radius (r).
            </div>
          </div>
        </div>
      </div>

      <button 
        className="advanced-panel-tab"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onToggle();
        }}
        aria-label="Toggle advanced parameters"
      >
        <svg 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2"
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>
    </div>
  );
};

export default AdvancedPanel; 