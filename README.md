# Spirograph

A React/Vite-based webapp that generates spirograph designs based on user input.

## Features

- Create beautiful spirograph designs with customizable parameters
- Add multiple layers with different patterns and colors
- Adjust parameters in real-time to see changes immediately
- Export your creations as PNG or SVG files
- Customize blend modes for artistic effects

## Getting Started

### Prerequisites

- Node.js (v14 or newer)
- npm or yarn

### Installation

1. Clone this repository
2. Install dependencies:
   ```
   npm install
   ```
3. Start the development server:
   ```
   npm run dev
   ```
4. Open your browser and navigate to the URL shown in the terminal

## Usage

1. Click "Add Layer" to create your first spirograph layer
2. Adjust the parameters in the control panel:
   - Fixed ring radius (R)
   - Rolling gear radius (r)
   - Pen offset distance (d)
   - Roll type (inside/outside)
   - Start angle offset
   - Color, stroke width, and blend mode
3. Add more layers to create complex designs
4. Use the export buttons to save your creation as PNG or SVG

## Mathematical Foundation

The app implements both hypotrochoid (gear rolls inside fixed ring) and epitrochoid (gear rolls outside fixed ring) curves:

### Hypotrochoid

```
x(θ) = (R - r)cos(θ) + d·cos((R - r)/r·θ)
y(θ) = (R - r)sin(θ) - d·sin((R - r)/r·θ)
```

### Epitrochoid

```
x(θ) = (R + r)cos(θ) - d·cos((R + r)/r·θ)
y(θ) = (R + r)sin(θ) - d·sin((R + r)/r·θ)
```

Where:
- R is the fixed ring radius
- r is the rolling gear radius
- d is the pen offset distance
- θ is the parameter (angle)
