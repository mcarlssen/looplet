import React, { useState, useEffect } from 'react';
import { HexColorPicker } from 'react-colorful';
import { SpiroLayer } from '../types';
import { calculateHarmonyFactor, getValidRValues, findNearestValidR } from '../utils/spiroCalculations';
import AdvancedPanel from './AdvancedPanel';
import './components.css';

type ParameterKey = 'R' | 'r' | 'd' | 'startAngle' | 'tooth' | 'strokeWidth' | 'isHypotrochoid' | 'blendMode' | 'color';

interface ControlPanelProps {
  layer: SpiroLayer | null;
  updateLayer: (layer: SpiroLayer) => void;
  setVisualizerParam: (param: ParameterKey | null) => void;
}

const ControlPanel = ({ layer, updateLayer, setVisualizerParam }: ControlPanelProps) => {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [startAngleDegrees, setStartAngleDegrees] = useState<number>(0);
  const [hoverParam, setHoverParam] = useState<ParameterKey | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [colorPickerPosition, setColorPickerPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (layer) {
      setStartAngleDegrees(Math.round((layer.parameters.startAngle * 180) / Math.PI));
    }
  }, [layer]);

  // If no layer is selected, show a message
  if (!layer) {
    return (
      <div className="control-panel">
        <h2>Parameters</h2>
        <p className="no-layer-message">Select a layer or create a new one to adjust parameters.</p>
      </div>
    );
  }

  const handleParameterChange = (
    key: ParameterKey,
    value: number | boolean | string
  ) => {
    if (!layer) return;
    
    const newLayer = { ...layer };
    let newR = layer.parameters.R;
    let newSmallR = layer.parameters.r;

    if (key === 'R') {
      newR = value as number;
    } else if (key === 'r') {
      newSmallR = value as number;
    }

    // Calculate harmony for the new parameters
    const newHarmony = calculateHarmonyFactor(newR, newSmallR);
    
    // If harmony would be too low, find the nearest valid r value
    if (key === 'r' && newHarmony < layer.parameters.harmonyThreshold) {
      const originalValue = newSmallR;
      // Try values around the desired r to find one with acceptable harmony
      let bestR = newSmallR;
      let bestHarmony = newHarmony;
      const searchRange = 20; // Look 20 units in each direction
      
      for (let offset = 1; offset <= searchRange; offset++) {
        // Try larger r
        const largerR = newSmallR + offset;
        if (largerR < layer.parameters.maxr) {
          const largerHarmony = calculateHarmonyFactor(newR, largerR);
          if (largerHarmony >= layer.parameters.harmonyThreshold && largerHarmony > bestHarmony) {
            bestR = largerR;
            bestHarmony = largerHarmony;
            break;
          }
        }
        
        // Try smaller r
        const smallerR = newSmallR - offset;
        if (smallerR >= 10) { // Minimum r value
          const smallerHarmony = calculateHarmonyFactor(newR, smallerR);
          if (smallerHarmony >= layer.parameters.harmonyThreshold && smallerHarmony > bestHarmony) {
            bestR = smallerR;
            bestHarmony = smallerHarmony;
            break;
          }
        }
      }
      
      // Use the best found r value and show notification
      if (bestR !== originalValue) {
        newSmallR = bestR;
      }
    }

    if (key === 'tooth') {
      newLayer.parameters = {
        ...layer.parameters,
        tooth: value as number,
        R: Math.round(newR / (value as number)) * (value as number)
      };
    } else if (key === 'r') {
      newLayer.parameters = {
        ...layer.parameters,
        r: newSmallR,
        d: Math.min(layer.parameters.d, newSmallR - 1)
      };
    } else {
      newLayer.parameters = {
        ...layer.parameters,
        [key]: value
      };
    }
    
    updateLayer(newLayer);
  };

  // Handle specific start angle change from degrees to radians
  const handleStartAngleChange = (degrees: number) => {
    setStartAngleDegrees(degrees);
    const radians = (degrees * Math.PI) / 180;
    handleParameterChange('startAngle', radians);
  };

  // Handle mouse enter on parameter controls
  const handleMouseEnter = (param: ParameterKey) => {
    setHoverParam(param);
    setVisualizerParam(param);
  };

  // Handle mouse leave on parameter controls
  const handleMouseLeave = () => {
    setHoverParam(null);
    // Only clear the visualizer if we're not actively changing a parameter
    // This helps when moving from the label to the slider itself
    setTimeout(() => {
      if (!hoverParam) {
        setVisualizerParam(null);
      }
    }, 100);
  };

  // Common props for number inputs
  const numberInputProps = (
    key: ParameterKey,
    min: number,
    max: number,
    step: number
  ) => {
    const value = key === 'tooth' 
      ? layer.parameters.tooth 
      : typeof layer.parameters[key] === 'number' 
        ? layer.parameters[key] 
        : 0;
    
    return {
      type: 'range',
      min,
      max,
      step,
      value,
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseFloat(e.target.value);
        handleParameterChange(key, value);
      },
      onMouseEnter: () => handleMouseEnter(key),
      onMouseLeave: handleMouseLeave,
      onMouseDown: () => handleMouseEnter(key),
      onMouseUp: () => {
        if (hoverParam) {
          setVisualizerParam(hoverParam);
        }
      }
    };
  };

  const handleColorClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const viewportWidth = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
    const viewportHeight = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
    const pickerWidth = 225;
    const pickerHeight = 280;
    const padding = 20; // Reduced padding for better positioning

    console.log('Positioning debug:', {
      rect,
      viewportWidth,
      viewportHeight,
      pickerWidth,
      pickerHeight,
      padding
    });

    // Initial position - try to place it to the right of the color preview
    let left = Math.min(rect.right + padding, viewportWidth - pickerWidth - padding);
    let top = Math.min(rect.top, viewportHeight - pickerHeight - padding);

    // If it doesn't fit to the right, try placing it to the left
    if (left + pickerWidth > viewportWidth - padding) {
      left = Math.max(padding, rect.left - pickerWidth - padding);
    }

    // If it doesn't fit to the left either, center it horizontally
    if (left < padding || left + pickerWidth > viewportWidth - padding) {
      left = Math.max(padding, Math.min((viewportWidth - pickerWidth) / 2, viewportWidth - pickerWidth - padding));
    }

    // If it goes below viewport, move it up
    if (top + pickerHeight > viewportHeight - padding) {
      top = Math.max(padding, viewportHeight - pickerHeight - padding);
      
      // If there's room above the color preview, place it there
      if (rect.top > pickerHeight + padding * 2) {
        top = Math.max(padding, rect.top - pickerHeight - padding);
      }
    }

    console.log('Final position:', { top, left });

    setColorPickerPosition({ top, left });
    setShowColorPicker(true);
  };

  return (
    <div className="control-panel">
      <AdvancedPanel 
        layer={layer}
        updateLayer={updateLayer}
        isOpen={showAdvanced}
        onToggle={() => setShowAdvanced(!showAdvanced)}
      />
      
      <h2>Parameters</h2>
      
      <div 
        className="parameter-group"
        onMouseEnter={() => handleMouseEnter('R')}
        onMouseLeave={handleMouseLeave}
      >
        <label htmlFor="fixed-radius">Ring Radius (R): {layer.parameters.R}</label>
        <input
          id="fixed-radius"
          {...numberInputProps('R', 50, layer.parameters.maxR, layer.parameters.tooth)}
        />
      </div>
      
      <div 
        className="parameter-group"
        onMouseEnter={() => handleMouseEnter('r')}
        onMouseLeave={handleMouseLeave}
      >
        <label htmlFor="rolling-radius">Gear Radius (r): {layer.parameters.r}</label>
        <input
          id="rolling-radius"
          {...numberInputProps('r', 10, layer.parameters.maxr, 1)}
        />
      </div>
      
      <div 
        className="parameter-group"
        onMouseEnter={() => handleMouseEnter('d')}
        onMouseLeave={handleMouseLeave}
      >
        <label htmlFor="pen-offset">Pen Offset (d): {layer.parameters.d}</label>
        <input
          id="pen-offset"
          {...numberInputProps('d', 0, layer.parameters.r - 1, 1)}
        />
      </div>
      
      <div 
        className="parameter-group inline"
        onMouseEnter={() => handleMouseEnter('startAngle')}
        onMouseLeave={handleMouseLeave}
      >
        <label htmlFor="start-angle">Rotation:</label>
        <div className="angle-inputs">
          <input
            type="number"
            min="0"
            max="360"
            value={startAngleDegrees}
            onChange={(e) => handleStartAngleChange(parseInt(e.target.value) || 0)}
            className="degree-input"
            onFocus={() => handleMouseEnter('startAngle')}
            onBlur={handleMouseLeave}
          />
          <span className="degree-symbol">°</span>
        </div>
      </div>
      
      <div className="parameter-group">
        <div className="toggle-switch">
          <input
            id="roll-type"
            type="checkbox"
            checked={!layer.parameters.isHypotrochoid}
            onChange={(e) => {
              handleParameterChange('isHypotrochoid', !e.target.checked);
            }}
          />
          <label htmlFor="roll-type" className="toggle-label">
            <div className="toggle-text-inside" style={{ display: 'flex', width: '100%' }}>
              <span style={{ flex: 1, color: layer.parameters.isHypotrochoid ? '#333' : 'white' }}>Inside</span>
              <span style={{ flex: 1, color: layer.parameters.isHypotrochoid ? 'white' : '#333' }}>Outside</span>
            </div>
          </label>
        </div>
      </div>
    </div>
  );
};

export default ControlPanel; 