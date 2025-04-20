import React, { useState } from 'react';
import { HexColorPicker } from 'react-colorful';
import { SpiroLayer } from '../types';
import './components.css';

interface LayerPanelProps {
  layers: SpiroLayer[];
  activeLayerIndex: number;
  setActiveLayerIndex: (index: number) => void;
  addLayer: () => void;
  deleteLayer: (index: number) => void;
  updateLayer: (index: number, layer: SpiroLayer) => void;
  moveLayer: (fromIndex: number, toIndex: number) => void;
}

const LayerPanel = ({
  layers,
  activeLayerIndex,
  setActiveLayerIndex,
  addLayer,
  deleteLayer,
  updateLayer,
  moveLayer
}: LayerPanelProps) => {
  const [editingNameIndex, setEditingNameIndex] = useState<number | null>(null);
  const [tempName, setTempName] = useState<string>('');
  const [colorPickerLayerIndex, setColorPickerLayerIndex] = useState<number | null>(null);
  const [colorPickerPosition, setColorPickerPosition] = useState({ top: 0, left: 0 });

  const startEditingName = (index: number) => {
    setEditingNameIndex(index);
    setTempName(layers[index].name);
  };

  const saveLayerName = () => {
    if (editingNameIndex !== null) {
      const updatedLayer = { ...layers[editingNameIndex], name: tempName };
      updateLayer(editingNameIndex, updatedLayer);
      setEditingNameIndex(null);
    }
  };

  const toggleLayerVisibility = (index: number) => {
    const updatedLayer = { ...layers[index], visible: !layers[index].visible };
    updateLayer(index, updatedLayer);
  };

  const moveLayerUp = (index: number) => {
    if (index > 0) {
      moveLayer(index, index - 1);
    }
  };

  const moveLayerDown = (index: number) => {
    if (index < layers.length - 1) {
      moveLayer(index, index + 1);
    }
  };
  
  const handleParameterChange = (index: number, key: string, value: any) => {
    const currentLayer = layers[index];
    const updatedLayer = { 
      ...currentLayer,
      parameters: {
        ...currentLayer.parameters,
        [key]: value
      }
    };
    updateLayer(index, updatedLayer);
  };
  
  const toggleColorPicker = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    
    // Position the picker to the left of the button
    setColorPickerPosition({
      top: rect.top,
      left: rect.left - 225 // Width of the picker + some padding
    });
    
    setColorPickerLayerIndex(colorPickerLayerIndex === index ? null : index);
  };
  
  // Get the shorthand name for a blend mode
  const getBlendModeShortName = (blendMode: string): string => {
    switch (blendMode) {
      case 'normal': return 'Normal';
      case 'multiply': return 'Mult';
      case 'screen': return 'Screen';
      case 'overlay': return 'Over';
      case 'darken': return 'Dark';
      case 'lighten': return 'Light';
      case 'color-dodge': return 'Dodge';
      case 'color-burn': return 'Burn';
      case 'hard-light': return 'Hard';
      case 'soft-light': return 'Soft';
      case 'difference': return 'Diff';
      case 'exclusion': return 'Excl';
      case 'hue': return 'Hue';
      case 'saturation': return 'Sat';
      case 'color': return 'Color';
      case 'luminosity': return 'Lum';
      default: return blendMode;
    }
  };

  return (
    <div className="layer-panel">
      <h2>Layers</h2>
      
      <div className="layers-container">
        {layers.length === 0 ? (
          <p className="no-layers-message">No layers yet. Click "Add Layer" to start.</p>
        ) : (
          <ul className="layers-list">
            {layers.map((layer, index) => (
              <li 
                key={layer.id} 
                className={`layer-item ${activeLayerIndex === index ? 'active' : ''}`}
                onClick={() => setActiveLayerIndex(index)}
              >
                <div className="layer-item-content">
                  <div className="layer-item-header">
                    <div className="layer-header-row">
                      <div className="layer-visibility">
                        <button 
                          className={`visibility-toggle ${layer.visible ? 'visible' : 'hidden'}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleLayerVisibility(index);
                          }}
                          title={layer.visible ? 'Hide layer' : 'Show layer'}
                        >
                          {layer.visible ? '👁️' : '👁️‍🗨️'}
                        </button>
                      </div>
                      
                      {editingNameIndex === index ? (
                        <input
                          type="text"
                          className="layer-name-input"
                          value={tempName}
                          onChange={(e) => setTempName(e.target.value)}
                          onBlur={saveLayerName}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveLayerName();
                            if (e.key === 'Escape') setEditingNameIndex(null);
                          }}
                          autoFocus
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <div 
                          className="layer-name"
                          onClick={(e) => {
                            e.stopPropagation();
                            startEditingName(index);
                          }}
                          title="Click to rename"
                        >
                          {layer.name}
                        </div>
                      )}

                      <div className="layer-actions">
                        <div 
                          className="layer-color-preview"
                          style={{ backgroundColor: layer.parameters.color }}
                          title="Click to change color"
                          onClick={(e) => toggleColorPicker(index, e)}
                        />
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            moveLayerUp(index);
                          }}
                          disabled={index === 0}
                          title="Move up"
                        >
                          ↑
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            moveLayerDown(index);
                          }}
                          disabled={index === layers.length - 1}
                          title="Move down"
                        >
                          ↓
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteLayer(index);
                          }}
                          title="Delete layer"
                          className="delete-button"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>

                    <div className="layer-controls">
                      Blend
                      <select
                        className="blend-mode-select"
                        value={layer.parameters.blendMode}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleParameterChange(index, 'blendMode', e.target.value);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        title="Blend Mode"
                      >
                        <option value="normal">Normal</option>
                        <option value="multiply">Multiply</option>
                        <option value="screen">Screen</option>
                        <option value="overlay">Overlay</option>
                        <option value="darken">Darken</option>
                        <option value="lighten">Lighten</option>
                        <option value="color-dodge">Color Dodge</option>
                        <option value="color-burn">Color Burn</option>
                        <option value="hard-light">Hard Light</option>
                        <option value="soft-light">Soft Light</option>
                        <option value="difference">Difference</option>
                        <option value="exclusion">Exclusion</option>
                        <option value="hue">Hue</option>
                        <option value="saturation">Saturation</option>
                        <option value="color">Color</option>
                        <option value="luminosity">Luminosity</option>
                      </select>
                      
                      Stroke
                      <input
                        type="number"
                        min="1"
                        max="10"
                        step="0.5"
                        value={layer.parameters.strokeWidth}
                        onChange={(e) => handleParameterChange(index, 'strokeWidth', parseFloat(e.target.value))}
                        className="stroke-width-input"
                        title="Stroke width"
                      />
                    </div>
                  </div>
                  
                  {colorPickerLayerIndex === index && (
                    <div 
                      className="color-picker-popover layer-color-picker" 
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        top: `${colorPickerPosition.top}px`,
                        left: `${colorPickerPosition.left}px`
                      }}
                    >
                      <div 
                        className="color-picker-cover" 
                        onClick={(e) => {
                          e.stopPropagation();
                          setColorPickerLayerIndex(null);
                        }}
                      />
                      <div className="color-picker-wrapper">
                        <HexColorPicker
                          color={layer.parameters.color}
                          onChange={(color) => handleParameterChange(index, 'color', color)}
                        />
                        <div className="color-picker-value">{layer.parameters.color}</div>
                      </div>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      
      <button 
        onClick={addLayer}
        className="add-layer-button"
      >
        + Add Layer
      </button>
    </div>
  );
};

export default LayerPanel; 