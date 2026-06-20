// Global variables
let scene, camera, renderer, controls;
let worldFrame, bodyFrame;
let currentTransform = {
    translation: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 }
};
// The body frame eases toward this target (position lerp + orientation slerp)
let targetTransform = {
    translation: { x: 0, y: 0, z: 0 },
    rotation: new THREE.Quaternion()
};
let points = [];
let testPoint = null;

// World-frame axis materials + glow state for the highlight effect
let axisMaterials = { x: null, y: null, z: null };
let axisGlow = { x: 0, y: 0, z: 0 };

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initThreeJS();
    initControls();
    initEventListeners();
    updateVisualization();
});

// Initialize Three.js scene
function initThreeJS() {
    const container = document.getElementById('threejs-container');
    
    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);
    
    // Camera
    camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(8, 6, 8);
    camera.lookAt(0, 0, 0);
    
    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);
    
    // Lighting (tuned for MeshStandardMaterial so the scene reads bright and lively)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444466, 0.6);
    scene.add(hemiLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.1);
    directionalLight.position.set(10, 10, 5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);
    
    // Create coordinate frames
    createWorldFrame();
    createBodyFrame();
    
    // Add grid
    const gridHelper = new THREE.GridHelper(10, 20, 0x888888, 0xcccccc);
    scene.add(gridHelper);
    
    // Orbit controls: inertia (damping) + pinch/drag touch support for tablets & phones
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 3;
    controls.maxDistance = 30;
    controls.target.set(0, 0, 0);
    controls.update();

    // Handle window resize
    window.addEventListener('resize', onWindowResize);
}

// Create world coordinate frame
function createWorldFrame() {
    worldFrame = new THREE.Group();
    worldFrame.name = 'WorldFrame';
    
    // Create axes with labels (register materials so they can glow on rotation)
    createAxisWithLabel(worldFrame, 'x', 0xff0000, new THREE.Vector3(3, 0, 0), false, true);
    createAxisWithLabel(worldFrame, 'y', 0x00ff00, new THREE.Vector3(0, 3, 0), false, true);
    createAxisWithLabel(worldFrame, 'z', 0x0000ff, new THREE.Vector3(0, 0, 3), false, true);
    
    // Add origin sphere
    const originGeometry = new THREE.SphereGeometry(0.1, 16, 16);
    const originMaterial = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.3, roughness: 0.5 });
    const origin = new THREE.Mesh(originGeometry, originMaterial);
    worldFrame.add(origin);

    // Add frame label
    addFrameLabel(worldFrame, 'W', new THREE.Vector3(0, 3.5, 0), 0x000000);

    scene.add(worldFrame);
}

// Create body coordinate frame
function createBodyFrame() {
    bodyFrame = new THREE.Group();
    bodyFrame.name = 'BodyFrame';
    
    // Create axes with different style (dashed or thicker)
    createAxisWithLabel(bodyFrame, 'x', 0xff4444, new THREE.Vector3(2, 0, 0), true);
    createAxisWithLabel(bodyFrame, 'y', 0x44ff44, new THREE.Vector3(0, 2, 0), true);
    createAxisWithLabel(bodyFrame, 'z', 0x4444ff, new THREE.Vector3(0, 0, 2), true);
    
    // Add origin sphere
    const originGeometry = new THREE.SphereGeometry(0.08, 16, 16);
    const originMaterial = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.3, roughness: 0.5 });
    const origin = new THREE.Mesh(originGeometry, originMaterial);
    bodyFrame.add(origin);
    
    // Add frame label
    addFrameLabel(bodyFrame, 'B', new THREE.Vector3(0, 2.5, 0), 0x666666);
    
    // Add a simple body object (cube)
    const bodyGeometry = new THREE.BoxGeometry(0.5, 0.3, 0.8);
    const bodyMaterial = new THREE.MeshStandardMaterial({
        color: 0x2f6bff,
        metalness: 0.4,
        roughness: 0.35,
        transparent: true,
        opacity: 0.75
    });
    const bodyObject = new THREE.Mesh(bodyGeometry, bodyMaterial);
    bodyObject.position.set(0.5, 0, 0);
    bodyFrame.add(bodyObject);
    
    scene.add(bodyFrame);
}

// Create axis with arrow and label
function createAxisWithLabel(parent, axis, color, direction, isDashed = false, registerGlow = false) {
    const length = direction.length();

    // Axis line
    const geometry = new THREE.CylinderGeometry(0.02, 0.02, length, 8);
    const material = new THREE.MeshStandardMaterial({
        color: color,
        emissive: color,
        emissiveIntensity: 0,
        metalness: 0.3,
        roughness: 0.5
    });

    if (isDashed) {
        material.transparent = true;
        material.opacity = 0.8;
    }

    // Keep world-frame axis materials so we can pulse them when a rotation control is used
    if (registerGlow) {
        axisMaterials[axis] = material;
    }
    
    const axisLine = new THREE.Mesh(geometry, material);
    
    // Position and rotate the cylinder
    const normalizedDir = direction.clone().normalize();
    axisLine.position.copy(direction.clone().multiplyScalar(0.5));
    
    if (axis === 'x') {
        axisLine.rotation.z = -Math.PI / 2;
    } else if (axis === 'z') {
        axisLine.rotation.x = Math.PI / 2;
    }
    
    parent.add(axisLine);
    
    // Arrow head
    const arrowGeometry = new THREE.ConeGeometry(0.05, 0.15, 8);
    const arrow = new THREE.Mesh(arrowGeometry, material);
    arrow.position.copy(direction);
    
    if (axis === 'x') {
        arrow.rotation.z = -Math.PI / 2;
    } else if (axis === 'z') {
        arrow.rotation.x = Math.PI / 2;
    }
    
    parent.add(arrow);
    
    // Label
    const labelPos = direction.clone().multiplyScalar(1.2);
    addFrameLabel(parent, axis.toUpperCase(), labelPos, color);
}

// Add text label (simplified version)
function addFrameLabel(parent, text, position, color) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 64;
    canvas.height = 64;
    
    context.fillStyle = `#${color.toString(16).padStart(6, '0')}`;
    context.font = 'Bold 32px Arial';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(text, 32, 32);
    
    const texture = new THREE.CanvasTexture(canvas);
    const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.position.copy(position);
    sprite.scale.set(0.5, 0.5, 1);
    
    parent.add(sprite);
}

// Initialize UI controls
function initControls() {
    // Sync sliders with number inputs for translation
    const transControls = ['trans-x', 'trans-y', 'trans-z'];
    transControls.forEach(control => {
        const slider = document.getElementById(control);
        const input = document.getElementById(`${control}-input`);
        
        slider.addEventListener('input', function() {
            input.value = slider.value;
            updateTransformation();
        });
        
        input.addEventListener('input', function() {
            slider.value = input.value;
            updateTransformation();
        });
    });
    
    // Sync sliders with number inputs for rotation (and glow the matching world axis)
    const rotControls = ['rot-x', 'rot-y', 'rot-z'];
    rotControls.forEach(control => {
        const slider = document.getElementById(control);
        const input = document.getElementById(`${control}-input`);
        const axis = control.slice(-1); // 'x' | 'y' | 'z'

        slider.addEventListener('input', function() {
            input.value = slider.value;
            highlightAxis(axis);
            updateTransformation();
        });

        input.addEventListener('input', function() {
            slider.value = input.value;
            highlightAxis(axis);
            updateTransformation();
        });
    });
}

// Initialize event listeners
function initEventListeners() {
    // Frame visibility controls
    document.getElementById('show-world-frame').addEventListener('change', function() {
        worldFrame.visible = this.checked;
    });

    document.getElementById('show-body-frame').addEventListener('change', function() {
        bodyFrame.visible = this.checked;
    });

    document.getElementById('show-grid').addEventListener('change', function() {
        const grid = scene.getObjectByName('GridHelper');
        if (grid) grid.visible = this.checked;
    });
    
    // Point transformation controls
    document.getElementById('add-point-btn').addEventListener('click', addPoint);
    document.getElementById('clear-points-btn').addEventListener('click', clearPoints);
    
    // Point input listeners
    ['point-x', 'point-y', 'point-z'].forEach(id => {
        document.getElementById(id).addEventListener('input', updatePointTransformation);
    });
    
    // Preset buttons
    document.querySelectorAll('.preset-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            applyPreset(this.dataset.preset);
        });
    });
}

// Make a world axis briefly glow (called when its rotation control changes)
function highlightAxis(axis) {
    if (axisGlow[axis] === undefined) return;
    axisGlow[axis] = 1;
}

// The body frame's target world matrix (translation + rotation), used for displays
// so the readouts reflect the final transform immediately while the frame eases there.
function getTargetBodyMatrix() {
    const pos = new THREE.Vector3(
        targetTransform.translation.x,
        targetTransform.translation.y,
        targetTransform.translation.z
    );
    return new THREE.Matrix4().compose(pos, targetTransform.rotation, new THREE.Vector3(1, 1, 1));
}

// Update transformation
function updateTransformation() {
    // Read current transform values from the UI
    currentTransform.translation.x = parseFloat(document.getElementById('trans-x-input').value);
    currentTransform.translation.y = parseFloat(document.getElementById('trans-y-input').value);
    currentTransform.translation.z = parseFloat(document.getElementById('trans-z-input').value);
    currentTransform.rotation.x = parseFloat(document.getElementById('rot-x-input').value);
    currentTransform.rotation.y = parseFloat(document.getElementById('rot-y-input').value);
    currentTransform.rotation.z = parseFloat(document.getElementById('rot-z-input').value);

    // Set the target the body frame eases toward (position lerp + orientation slerp)
    targetTransform.translation.x = currentTransform.translation.x;
    targetTransform.translation.y = currentTransform.translation.y;
    targetTransform.translation.z = currentTransform.translation.z;
    targetTransform.rotation.setFromEuler(new THREE.Euler(
        THREE.MathUtils.degToRad(currentTransform.rotation.x),
        THREE.MathUtils.degToRad(currentTransform.rotation.y),
        THREE.MathUtils.degToRad(currentTransform.rotation.z),
        'XYZ'
    ));

    // Update displays from the target so the numbers are accurate immediately
    updateTransformationMatrix();
    updateFrameInfo();
    updatePointTransformation();
}

// Update the complete visualization
function updateVisualization() {
    updateTransformation();
}

// Update transformation matrix display
function updateTransformationMatrix() {
    // Use the target transform so the matrix reflects the final pose immediately
    const matrix = getTargetBodyMatrix();
    const elements = matrix.elements;
    
    // Update matrix display (Three.js uses column-major order)
    document.getElementById('t11').textContent = elements[0].toFixed(3);
    document.getElementById('t12').textContent = elements[4].toFixed(3);
    document.getElementById('t13').textContent = elements[8].toFixed(3);
    document.getElementById('t14').textContent = elements[12].toFixed(3);
    
    document.getElementById('t21').textContent = elements[1].toFixed(3);
    document.getElementById('t22').textContent = elements[5].toFixed(3);
    document.getElementById('t23').textContent = elements[9].toFixed(3);
    document.getElementById('t24').textContent = elements[13].toFixed(3);
    
    document.getElementById('t31').textContent = elements[2].toFixed(3);
    document.getElementById('t32').textContent = elements[6].toFixed(3);
    document.getElementById('t33').textContent = elements[10].toFixed(3);
    document.getElementById('t34').textContent = elements[14].toFixed(3);
    
    document.getElementById('t41').textContent = elements[3].toFixed(3);
    document.getElementById('t42').textContent = elements[7].toFixed(3);
    document.getElementById('t43').textContent = elements[11].toFixed(3);
    document.getElementById('t44').textContent = elements[15].toFixed(3);
}

// Update frame information
function updateFrameInfo() {
    const pos = currentTransform.translation;
    const rot = currentTransform.rotation;
    
    document.getElementById('body-position').textContent = 
        `(${pos.x.toFixed(1)}, ${pos.y.toFixed(1)}, ${pos.z.toFixed(1)})`;
    
    document.getElementById('body-rotation').textContent = 
        `(${rot.x.toFixed(1)}°, ${rot.y.toFixed(1)}°, ${rot.z.toFixed(1)}°)`;
}

// Update point transformation
function updatePointTransformation() {
    const x = parseFloat(document.getElementById('point-x').value) || 0;
    const y = parseFloat(document.getElementById('point-y').value) || 0;
    const z = parseFloat(document.getElementById('point-z').value) || 0;
    
    // Create point in body frame
    const pointBody = new THREE.Vector3(x, y, z);
    
    // Transform to world frame using the target pose
    const pointWorld = pointBody.clone().applyMatrix4(getTargetBodyMatrix());

    // Update display
    document.getElementById('transformed-coords').textContent =
        `(${pointWorld.x.toFixed(3)}, ${pointWorld.y.toFixed(3)}, ${pointWorld.z.toFixed(3)})`;
    
    // Update test point visualization if it exists
    if (testPoint) {
        testPoint.position.copy(pointWorld);
    }
}

// Add a point to the scene
function addPoint() {
    const x = parseFloat(document.getElementById('point-x').value) || 0;
    const y = parseFloat(document.getElementById('point-y').value) || 0;
    const z = parseFloat(document.getElementById('point-z').value) || 0;
    
    // Create point in body frame
    const pointBody = new THREE.Vector3(x, y, z);
    
    // Create point geometry
    const pointGeometry = new THREE.SphereGeometry(0.05, 16, 16);
    const pointMaterial = new THREE.MeshStandardMaterial({ color: 0xff6b6b, emissive: 0xff6b6b, emissiveIntensity: 0.3, metalness: 0.2, roughness: 0.5 });
    
    // Point in body frame
    const bodyPoint = new THREE.Mesh(pointGeometry, pointMaterial);
    bodyPoint.position.copy(pointBody);
    bodyFrame.add(bodyPoint);
    
    // Point in world frame (snapshot at the target pose)
    const pointWorld = pointBody.clone().applyMatrix4(getTargetBodyMatrix());
    const worldPointMaterial = new THREE.MeshStandardMaterial({ color: 0x4ecdc4, emissive: 0x4ecdc4, emissiveIntensity: 0.3, metalness: 0.2, roughness: 0.5 });
    const worldPoint = new THREE.Mesh(pointGeometry, worldPointMaterial);
    worldPoint.position.copy(pointWorld);
    scene.add(worldPoint);
    
    // Connect with a line
    const lineGeometry = new THREE.BufferGeometry().setFromPoints([
        bodyPoint.getWorldPosition(new THREE.Vector3()),
        pointWorld
    ]);
    const lineMaterial = new THREE.LineBasicMaterial({ 
        color: 0x999999, 
        opacity: 0.5, 
        transparent: true 
    });
    const line = new THREE.Line(lineGeometry, lineMaterial);
    scene.add(line);
    
    points.push({ bodyPoint, worldPoint, line });
}

// Clear all points
function clearPoints() {
    points.forEach(point => {
        bodyFrame.remove(point.bodyPoint);
        scene.remove(point.worldPoint);
        scene.remove(point.line);
    });
    points = [];
}

// Apply preset transformations
function applyPreset(preset) {
    switch(preset) {
        case 'identity':
            setTransform(0, 0, 0, 0, 0, 0);
            break;
        case 'translation':
            setTransform(2, 1, 0, 0, 0, 0);
            break;
        case 'rotation':
            setTransform(0, 0, 0, 30, 45, 60);
            break;
        case 'combined':
            setTransform(1.5, 1, 0.5, 15, 30, 45);
            break;
        case 'robot-pose':
            setTransform(3, 2, 0, 0, 0, 90);
            break;
    }
}

// Set transformation values
function setTransform(tx, ty, tz, rx, ry, rz) {
    // Update sliders and inputs
    document.getElementById('trans-x').value = tx;
    document.getElementById('trans-x-input').value = tx;
    document.getElementById('trans-y').value = ty;
    document.getElementById('trans-y-input').value = ty;
    document.getElementById('trans-z').value = tz;
    document.getElementById('trans-z-input').value = tz;
    
    document.getElementById('rot-x').value = rx;
    document.getElementById('rot-x-input').value = rx;
    document.getElementById('rot-y').value = ry;
    document.getElementById('rot-y-input').value = ry;
    document.getElementById('rot-z').value = rz;
    document.getElementById('rot-z-input').value = rz;
    
    // Update transformation
    updateTransformation();
}

// Handle window resize
function onWindowResize() {
    const container = document.getElementById('threejs-container');
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);

    // OrbitControls inertia
    if (controls) controls.update();

    // Ease the body frame toward its target pose (position lerp + orientation slerp)
    if (bodyFrame) {
        bodyFrame.position.x += (targetTransform.translation.x - bodyFrame.position.x) * 0.15;
        bodyFrame.position.y += (targetTransform.translation.y - bodyFrame.position.y) * 0.15;
        bodyFrame.position.z += (targetTransform.translation.z - bodyFrame.position.z) * 0.15;
        bodyFrame.quaternion.slerp(targetTransform.rotation, 0.15);
    }

    // Update point lines if any exist
    points.forEach(point => {
        if (point.line) {
            const bodyWorldPos = point.bodyPoint.getWorldPosition(new THREE.Vector3());
            const worldPos = point.worldPoint.position;
            point.line.geometry.setFromPoints([bodyWorldPos, worldPos]);
        }
    });

    // Decay the axis glow each frame and push it into the emissive intensity
    ['x', 'y', 'z'].forEach(axis => {
        if (axisGlow[axis] > 0.001) {
            axisGlow[axis] *= 0.9;
        } else {
            axisGlow[axis] = 0;
        }
        if (axisMaterials[axis]) {
            axisMaterials[axis].emissiveIntensity = axisGlow[axis];
        }
    });

    if (renderer) renderer.render(scene, camera);
}

// Start animation loop
animate();
