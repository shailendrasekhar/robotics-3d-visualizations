# Mobile Robotics 3D Visualizations

## Overview
An interactive web platform featuring 3D visualizations of fundamental mobile robotics concepts. The platform includes a beautiful home page with animated typing effects and easy navigation to three core visualization modules.

## Available Pages

**🏠 Home Page** (`index.html`)
- Animated typing effect displaying "MOBILE ROBOTICS"
- Centered navigation buttons with hover effects
- Beautiful gradient background with floating animations
- Responsive design for all screen sizes

**Visualization Modules:**

1. **Euler Angles** (`html/eulerangles.html`)
   - Interactive 3D visualization of roll, pitch, and yaw rotations
   - Real-time controls for each rotation axis
   - Visual representation of rotation effects

2. **Coordinate Frames** (`html/coordinate-frames.html`)
   - Visualization of coordinate frame transformations
   - Multiple reference frames and their relationships
   - Interactive transformation controls

3. **Quaternions** (`html/quaternions.html`)
   - Quaternion rotation visualization
   - Comparison with Euler angles
   - Interactive quaternion manipulation
   - Enhanced explanation of conjugate vs inverse operations

## Project Structure
```
robotics-3d-visualizations/
├── README.md                     # This documentation file
├── index.html                    # 🏠 Beautiful home page with typing effect
├── html/                         # Visualization pages
│   ├── eulerangles.html         # Euler Angles page
│   ├── coordinate-frames.html   # Coordinate Frames page  
│   └── quaternions.html         # Quaternions page
├── css/                         # Stylesheets
│   ├── style.css               # Main styles (used by Euler Angles)
│   ├── enhancements.css        # Enhanced UI styles (used by all)
│   ├── frames-style.css        # Coordinate frames styles
│   └── quaternions-style.css   # Quaternions styles
└── js/                          # JavaScript files
    ├── script.js               # Euler Angles functionality
    ├── frames-script.js        # Coordinate Frames functionality
    └── quaternions-script.js   # Quaternions functionality
```

## Technology Stack
- Three.js r128 for 3D graphics
- dat.GUI for Euler Angles controls
- Pure HTML/CSS/JavaScript with modern animations
- No external dependencies beyond Three.js and dat.GUI
- Fully responsive design

## Getting Started

**🚀 Start Here:** Open `index.html` in your web browser for the best experience!

The home page features:
- ✨ Animated typing effect
- 🎨 Beautiful gradient background
- 🔘 Interactive navigation buttons
- 📱 Mobile-responsive design

**Direct Access to Visualizations:**
- `html/eulerangles.html` - Euler Angles visualization
- `html/coordinate-frames.html` - Coordinate Frames visualization  
- `html/quaternions.html` - Quaternions visualization

## Features
- **Animated Home Page** with typing effects and smooth transitions
- **Interactive 3D Visualizations** using Three.js
- **Clean, Modern UI** with gradient backgrounds and glass-morphism effects
- **Responsive Design** that works on desktop, tablet, and mobile
- **Smooth Animations** and hover effects throughout

