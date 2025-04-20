import React, { useState, useEffect } from 'react';
import { HexColorPicker } from 'react-colorful';
import { SpiroLayer } from '../types';
import { calculateHarmonyFactor, getValidRValues, findNearestValidR } from '../utils/spiroCalculations';
import './components.css';

interface ControlPanelProps {
  layer: SpiroLayer | null;
  updateLayer: (layer: SpiroLayer) => void;
  setVisualizerParam: (param: 'R' | 'r' | 'd' | 'startAngle' | null) => void;
}

const ControlPanel = ({ layer, updateLayer, setVisualizerParam }: ControlPanelProps) => {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [startAngleDegrees, setStartAngleDegrees] = useState<number>(0);
  const [hoverParam, setHoverParam] = useState<'R' | 'r' | 'd' | 'startAngle' | null>(null);
  const [harmonyFactor, setHarmonyFactor] = useState<number>(0);
  const [validRValues, setValidRValues] = useState<number[]>([]);
  const MIN_HARMONY = 0.5;
  const [colorPickerPosition, setColorPickerPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (layer) {
      const { R, r } = layer.parameters;
      setStartAngleDegrees(Math.round((layer.parameters.startAngle * 180) / Math.PI));
      setHarmonyFactor(calculateHarmonyFactor(R, r));
      setValidRValues(getValidRValues(R, MIN_HARMONY));
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

  const handleParameterChange = (key: string, value: number | boolean | string) => {
    if (!layer) return;

    let updatedValue = value;
    
    // If changing R, find the nearest valid r value
    if (key === 'R') {
      const currentR = layer.parameters.r;
      const nearestValidR = findNearestValidR(value as number, currentR, MIN_HARMONY);
      
      updateLayer({
        ...layer,
        parameters: {
          ...layer.parameters,
          R: value as number,
          r: nearestValidR
        }
      });
      
      // Update visualizer for both parameters
      setVisualizerParam('R');
      setTimeout(() => setVisualizerParam('r'), 100);
      return;
    }
    
    // If changing r, validate against current R
    if (key === 'r') {
      const currentR = layer.parameters.R;
      const nearestValidR = findNearestValidR(currentR, value as number, MIN_HARMONY);
      updatedValue = nearestValidR;
    }

    updateLayer({
      ...layer,
      parameters: {
        ...layer.parameters,
        [key]: updatedValue
      }
    });

    setVisualizerParam(key as 'R' | 'r' | 'd' | 'startAngle');
  };

  // Handle specific start angle change from degrees to radians
  const handleStartAngleChange = (degrees: number) => {
    setStartAngleDegrees(degrees);
    const radians = (degrees * Math.PI) / 180;
    handleParameterChange('startAngle', radians);
  };

  // Handle mouse enter on parameter controls
  const handleMouseEnter = (param: 'R' | 'r' | 'd' | 'startAngle') => {
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

  // Calculate harmony indicator color
  const getHarmonyColor = () => {
    if (harmonyFactor > 0.7) return '#4CAF50'; // Good (green)
    if (harmonyFactor > 0.4) return '#FFC107'; // Medium (yellow)
    return '#F44336'; // Poor (red)
  };
  
  const harmonyColor = getHarmonyColor();
  const harmonyPercentage = Math.round(harmonyFactor * 100);
  
  // Common props for number inputs
  const numberInputProps = (
    key: 'R' | 'r' | 'd' | 'strokeWidth',
    min: number,
    max: number,
    step: number = 1
  ) => ({
    type: 'range',
    min,
    max,
    step,
    value: layer.parameters[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      handleParameterChange(key, parseFloat(e.target.value));
    },
    ...(key !== 'strokeWidth' && {
      onMouseEnter: () => handleMouseEnter(key),
      onMouseLeave: handleMouseLeave,
      onMouseDown: () => handleMouseEnter(key),
      onMouseUp: () => {
        // Keep visualizer showing as long as we're hovering
        if (hoverParam) {
          setVisualizerParam(hoverParam);
        }
      }
    })
  });

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
      <h2>Parameters</h2>
      
      <div className="harmony-indicator">
        <div className="harmony-label">Pattern Harmony: <span className="harmony-percentage">{Math.round(harmonyFactor * 100)}%</span></div>
        <div className="harmony-meter">
          <div 
            className="harmony-value" 
            style={{ 
              width: `${harmonyPercentage}%`, 
              backgroundColor: harmonyColor
            }}
          ></div>
        </div>
      </div>
      
      <div 
        className="parameter-group"
        onMouseEnter={() => handleMouseEnter('R')}
        onMouseLeave={handleMouseLeave}
      >
        <label htmlFor="fixed-radius">Ring Radius (R): {layer.parameters.R}</label>
        <input
          id="fixed-radius"
          {...numberInputProps('R', 50, 300, 1)}
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
          {...numberInputProps('r', 10, 150, 1)}
        />
        {/* <div className="harmony-info">
          Valid r values for current R: {validRValues.join(', ')}
        </div> */}
      </div>
      
      <div 
        className="parameter-group"
        onMouseEnter={() => handleMouseEnter('d')}
        onMouseLeave={handleMouseLeave}
      >
        <label htmlFor="pen-offset">Pen Offset (d): {layer.parameters.d}</label>
        <input
          id="pen-offset"
          {...numberInputProps('d', 0, 150, 1)}
        />
      </div>
      
      <div 
        className="parameter-group"
        onMouseEnter={() => handleMouseEnter('startAngle')}
        onMouseLeave={handleMouseLeave}
      >
        <label htmlFor="start-angle">Rotation: {startAngleDegrees}°</label>
        <div className="angle-inputs">
          <input
            id="start-angle"
            type="range"
            min="0"
            max="360"
            step="1"
            value={startAngleDegrees}
            onChange={(e) => handleStartAngleChange(parseInt(e.target.value))}
            onMouseEnter={() => handleMouseEnter('startAngle')}
            onMouseLeave={handleMouseLeave}
            onMouseDown={() => handleMouseEnter('startAngle')}
            onMouseUp={() => {
              if (hoverParam) {
                setVisualizerParam(hoverParam);
              }
            }}
          />
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
        </div>
      </div>
      
      <div className="parameter-group">
        <label htmlFor="roll-type">Roll Type:</label>
        <select
          id="roll-type"
          value={layer.parameters.isHypotrochoid ? 'inside' : 'outside'}
          onChange={(e) => {
            handleParameterChange('isHypotrochoid', e.target.value === 'inside');
          }}
        >
          <option value="inside">Inside (Hypotrochoid)</option>
          <option value="outside">Outside (Epitrochoid)</option>
        </select>
      </div>
      
      <div className="parameter-group">
        <label htmlFor="stroke-width">Stroke Width: {layer.parameters.strokeWidth}px</label>
        <input
          id="stroke-width"
          {...numberInputProps('strokeWidth', 1, 10, 0.5)}
        />
      </div>
      
      <div className="color-control">
        <div className="style-title">Color</div>
        <div 
          className="color-preview" 
          style={{ backgroundColor: layer.parameters.color }}
          onClick={handleColorClick}
        />
        {showColorPicker && (
          <>
            <div 
              className="color-picker-wrapper"
              style={{
                top: `${colorPickerPosition.top}px`,
                left: `${colorPickerPosition.left}px`
              }}
            >
              <HexColorPicker 
                color={layer.parameters.color} 
                onChange={(color) => handleParameterChange('color', color)}
              />
              <div className="color-picker-value">{layer.parameters.color}</div>
            </div>
            <div 
              className="color-picker-cover"
              onClick={() => setShowColorPicker(false)}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default ControlPanel; 