// Global variables
let scene, camera, renderer, object, controls;
let currentRotation = { x: 0, y: 0, z: 0 };
let targetRotation = { x: 0, y: 0, z: 0 }; // radians the object eases toward
let rotationOrder = 'XYZ';

// Axis materials (set in createAxes) + glow state for the highlight effect
let axisMaterials = { x: null, y: null, z: null };
let axisGlow = { x: 0, y: 0, z: 0 };
const AXIS_COLORS = { x: 0xff0000, y: 0x00ff00, z: 0x0000ff };

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing Euler Angles visualization...');
    initThreeJS();
    initControls();
    initEventListeners();
    updateVisualization();
    console.log('Initialization complete');
});

// Initialize Three.js scene
function initThreeJS() {
    const container = document.getElementById('threejs-container');
    
    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);
    
    // Camera
    camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(6, 4, 6);
    camera.lookAt(0, 0, 0);
    
    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);
    
    // Lighting (tuned for MeshStandardMaterial so the model reads bright and lively)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444466, 0.6);
    scene.add(hemiLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.1);
    directionalLight.position.set(10, 10, 5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);
    
    // Create coordinate system axes
    createAxes();
    
    // Create the main object (airplane-like shape)
    createMainObject();
    
    // Add grid
    const gridHelper = new THREE.GridHelper(10, 10, 0x888888, 0xcccccc);
    scene.add(gridHelper);
    
    // Orbit controls: inertia (damping) + pinch/drag touch support for tablets & phones
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 2;
    controls.maxDistance = 20;
    controls.target.set(0, 0, 0);
    controls.update();

    // Handle window resize
    window.addEventListener('resize', onWindowResize);
}

// Create coordinate system axes
function createAxes() {
    const axesGroup = new THREE.Group();
    
    // Emissive standard materials so we can make an axis "glow" on demand
    const makeAxisMaterial = (color) => new THREE.MeshStandardMaterial({
        color: color,
        emissive: color,
        emissiveIntensity: 0,
        metalness: 0.3,
        roughness: 0.5
    });

    // X-axis (Red)
    const xGeometry = new THREE.CylinderGeometry(0.02, 0.02, 3, 8);
    const xMaterial = makeAxisMaterial(0xff0000);
    const xAxis = new THREE.Mesh(xGeometry, xMaterial);
    xAxis.rotation.z = -Math.PI / 2;
    xAxis.position.x = 1.5;
    axesGroup.add(xAxis);
    
    // X-axis arrow
    const xArrowGeometry = new THREE.ConeGeometry(0.05, 0.2, 8);
    const xArrow = new THREE.Mesh(xArrowGeometry, xMaterial);
    xArrow.rotation.z = -Math.PI / 2;
    xArrow.position.x = 3.1;
    axesGroup.add(xArrow);
    
    // Y-axis (Green)
    const yGeometry = new THREE.CylinderGeometry(0.02, 0.02, 3, 8);
    const yMaterial = makeAxisMaterial(0x00ff00);
    const yAxis = new THREE.Mesh(yGeometry, yMaterial);
    yAxis.position.y = 1.5;
    axesGroup.add(yAxis);
    
    // Y-axis arrow
    const yArrowGeometry = new THREE.ConeGeometry(0.05, 0.2, 8);
    const yArrow = new THREE.Mesh(yArrowGeometry, yMaterial);
    yArrow.position.y = 3.1;
    axesGroup.add(yArrow);
    
    // Z-axis (Blue)
    const zGeometry = new THREE.CylinderGeometry(0.02, 0.02, 3, 8);
    const zMaterial = makeAxisMaterial(0x0000ff);
    const zAxis = new THREE.Mesh(zGeometry, zMaterial);
    zAxis.rotation.x = Math.PI / 2;
    zAxis.position.z = 1.5;
    axesGroup.add(zAxis);
    
    // Z-axis arrow
    const zArrowGeometry = new THREE.ConeGeometry(0.05, 0.2, 8);
    const zArrow = new THREE.Mesh(zArrowGeometry, zMaterial);
    zArrow.rotation.x = Math.PI / 2;
    zArrow.position.z = 3.1;
    axesGroup.add(zArrow);

    // Keep references so we can pulse an axis when the matching control is used
    axisMaterials.x = xMaterial;
    axisMaterials.y = yMaterial;
    axisMaterials.z = zMaterial;

    scene.add(axesGroup);
}

// Make an axis briefly glow (called when its rotation control changes)
function highlightAxis(axis) {
    if (axisGlow[axis] === undefined) return;
    axisGlow[axis] = 1;
}

// Create the main object to be rotated
function createMainObject() {
    object = new THREE.Group();
    
    // Create an airplane-like shape (make it bigger and more visible)
    // Fuselage
    const fuselageGeometry = new THREE.CylinderGeometry(0.15, 0.08, 3, 8);
    const fuselageMaterial = new THREE.MeshStandardMaterial({ color: 0x2f6bff, metalness: 0.4, roughness: 0.35 });
    const fuselage = new THREE.Mesh(fuselageGeometry, fuselageMaterial);
    fuselage.rotation.z = Math.PI / 2;
    object.add(fuselage);
    
    // Wings
    const wingGeometry = new THREE.BoxGeometry(0.08, 2.5, 0.4);
    const wingMaterial = new THREE.MeshStandardMaterial({ color: 0x4fd1ff, metalness: 0.3, roughness: 0.4 });
    const wings = new THREE.Mesh(wingGeometry, wingMaterial);
    wings.position.x = -0.3;
    object.add(wings);
    
    // Tail
    const tailGeometry = new THREE.BoxGeometry(0.08, 1.2, 0.3);
    const tailMaterial = new THREE.MeshStandardMaterial({ color: 0x4fd1ff, metalness: 0.3, roughness: 0.4 });
    const tail = new THREE.Mesh(tailGeometry, tailMaterial);
    tail.position.x = -1.2;
    tail.rotation.y = Math.PI / 2;
    object.add(tail);
    
    // Nose cone
    const noseGeometry = new THREE.ConeGeometry(0.15, 0.5, 8);
    const noseMaterial = new THREE.MeshStandardMaterial({ color: 0xff5a3c, emissive: 0xff5a3c, emissiveIntensity: 0.25, metalness: 0.3, roughness: 0.4 });
    const nose = new THREE.Mesh(noseGeometry, noseMaterial);
    nose.rotation.z = -Math.PI / 2;
    nose.position.x = 1.75;
    object.add(nose);
    
    // Add a small sphere at the center to show rotation point
    const centerGeometry = new THREE.SphereGeometry(0.08, 16, 16);
    const centerMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.4, metalness: 0.2, roughness: 0.5 });
    const center = new THREE.Mesh(centerGeometry, centerMaterial);
    object.add(center);
    
    // Add some propeller blades for more visual interest
    const propGeometry = new THREE.BoxGeometry(0.05, 0.8, 0.05);
    const propMaterial = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.6, roughness: 0.3 });
    
    const prop1 = new THREE.Mesh(propGeometry, propMaterial);
    prop1.position.x = 2.0;
    prop1.rotation.z = Math.PI / 4;
    object.add(prop1);
    
    const prop2 = new THREE.Mesh(propGeometry, propMaterial);
    prop2.position.x = 2.0;
    prop2.rotation.z = -Math.PI / 4;
    object.add(prop2);
    
    // Make sure the object is visible and positioned correctly
    object.position.set(0, 0, 0);
    console.log('Airplane object created and added to scene');
    
    scene.add(object);
}

// Initialize UI controls
function initControls() {
    // Sync sliders with number inputs. Each control maps to the axis it spins.
    const controlAxis = { roll: 'x', pitch: 'y', yaw: 'z' };

    Object.keys(controlAxis).forEach(control => {
        const slider = document.getElementById(`${control}-slider`);
        const input = document.getElementById(`${control}-input`);
        const axis = controlAxis[control];

        slider.addEventListener('input', function() {
            input.value = slider.value;
            highlightAxis(axis);
            updateRotation();
        });

        input.addEventListener('input', function() {
            slider.value = input.value;
            highlightAxis(axis);
            updateRotation();
        });
    });
}

// Initialize event listeners
function initEventListeners() {
    // Reset button
    document.getElementById('reset-btn').addEventListener('click', function() {
        currentRotation = { x: 0, y: 0, z: 0 };
        updateUI();
        updateVisualization();
    });
    
    // Rotation order selector
    document.getElementById('rotation-order').addEventListener('change', function() {
        rotationOrder = this.value;
        updateVisualization();
    });
    
    // Matrix input listeners
    const matrixInputs = ['r11', 'r12', 'r13', 'r21', 'r22', 'r23', 'r31', 'r32', 'r33'];
    matrixInputs.forEach(id => {
        const input = document.getElementById(id);
        input.addEventListener('input', function() {
            if (this.value !== '') {
                updateFromMatrix();
            }
        });
        input.addEventListener('blur', function() {
            if (this.value === '') {
                updateMatrixDisplay();
            }
        });
    });
    
    // Normalize matrix button
    document.getElementById('normalize-matrix-btn').addEventListener('click', function() {
        normalizeMatrix();
    });
    
    // Identity matrix button
    document.getElementById('identity-matrix-btn').addEventListener('click', function() {
        resetToIdentity();
    });
    
    // Preset buttons
    document.querySelectorAll('.preset-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            currentRotation.x = parseFloat(this.dataset.roll);
            currentRotation.y = parseFloat(this.dataset.pitch);
            currentRotation.z = parseFloat(this.dataset.yaw);
            updateUI();
            updateVisualization();
        });
    });
}

// Update rotation from UI controls
function updateRotation() {
    currentRotation.x = parseFloat(document.getElementById('roll-input').value);
    currentRotation.y = parseFloat(document.getElementById('pitch-input').value);
    currentRotation.z = parseFloat(document.getElementById('yaw-input').value);
    updateVisualization();
}

// Update the 3D visualization
function updateVisualization() {
    if (!object) return;
    
    // Set the target orientation; the animate loop eases the model toward it
    object.rotation.order = rotationOrder;
    targetRotation.x = THREE.MathUtils.degToRad(currentRotation.x);
    targetRotation.y = THREE.MathUtils.degToRad(currentRotation.y);
    targetRotation.z = THREE.MathUtils.degToRad(currentRotation.z);

    // Update rotation matrix display
    updateMatrixDisplay();

    // Update rotation info display
    updateRotationInfo();
}

// Update UI elements
function updateUI() {
    document.getElementById('roll-slider').value = currentRotation.x;
    document.getElementById('roll-input').value = currentRotation.x;
    document.getElementById('pitch-slider').value = currentRotation.y;
    document.getElementById('pitch-input').value = currentRotation.y;
    document.getElementById('yaw-slider').value = currentRotation.z;
    document.getElementById('yaw-input').value = currentRotation.z;
}

// Update rotation matrix display
function updateMatrixDisplay() {
    if (!object) return;

    // Build the matrix from the target orientation so the numbers reflect the
    // user's input immediately, even while the model is still easing into place.
    const euler = new THREE.Euler(targetRotation.x, targetRotation.y, targetRotation.z, rotationOrder);
    const matrix = new THREE.Matrix4().makeRotationFromEuler(euler);
    const elements = matrix.elements;
    
    // Update matrix inputs (Three.js uses column-major order)
    document.getElementById('r11').value = elements[0].toFixed(3);
    document.getElementById('r12').value = elements[4].toFixed(3);
    document.getElementById('r13').value = elements[8].toFixed(3);
    document.getElementById('r21').value = elements[1].toFixed(3);
    document.getElementById('r22').value = elements[5].toFixed(3);
    document.getElementById('r23').value = elements[9].toFixed(3);
    document.getElementById('r31').value = elements[2].toFixed(3);
    document.getElementById('r32').value = elements[6].toFixed(3);
    document.getElementById('r33').value = elements[10].toFixed(3);
}

// Update rotation info display
function updateRotationInfo() {
    document.getElementById('roll-value').textContent = currentRotation.x.toFixed(1) + '°';
    document.getElementById('pitch-value').textContent = currentRotation.y.toFixed(1) + '°';
    document.getElementById('yaw-value').textContent = currentRotation.z.toFixed(1) + '°';
}

// Apply rotation matrix from user input
function applyRotationMatrix() {
    try {
        // Get matrix elements from input
        const r11 = parseFloat(document.getElementById('input-r11').value) || 1;
        const r12 = parseFloat(document.getElementById('input-r12').value) || 0;
        const r13 = parseFloat(document.getElementById('input-r13').value) || 0;
        const r21 = parseFloat(document.getElementById('input-r21').value) || 0;
        const r22 = parseFloat(document.getElementById('input-r22').value) || 1;
        const r23 = parseFloat(document.getElementById('input-r23').value) || 0;
        const r31 = parseFloat(document.getElementById('input-r31').value) || 0;
        const r32 = parseFloat(document.getElementById('input-r32').value) || 0;
        const r33 = parseFloat(document.getElementById('input-r33').value) || 1;
        
        // Create matrix (Three.js uses column-major order)
        const matrix = new THREE.Matrix4();
        matrix.set(
            r11, r21, r31, 0,
            r12, r22, r32, 0,
            r13, r23, r33, 0,
            0, 0, 0, 1
        );
        
        // Extract euler angles from matrix
        const euler = new THREE.Euler();
        euler.setFromRotationMatrix(matrix, rotationOrder);
        
        // Update current rotation
        currentRotation.x = THREE.MathUtils.radToDeg(euler.x);
        currentRotation.y = THREE.MathUtils.radToDeg(euler.y);
        currentRotation.z = THREE.MathUtils.radToDeg(euler.z);
        
        // Update UI and visualization
        updateUI();
        updateVisualization();
        
        // Clear input fields
        document.querySelectorAll('.matrix-input-grid input').forEach(input => {
            input.value = '';
        });
        
    } catch (error) {
        alert('Invalid matrix values. Please enter valid numbers.');
    }
}

// Update rotation from matrix input
function updateFromMatrix() {
    try {
        // Get matrix elements from input
        const r11 = parseFloat(document.getElementById('r11').value) || 1;
        const r12 = parseFloat(document.getElementById('r12').value) || 0;
        const r13 = parseFloat(document.getElementById('r13').value) || 0;
        const r21 = parseFloat(document.getElementById('r21').value) || 0;
        const r22 = parseFloat(document.getElementById('r22').value) || 1;
        const r23 = parseFloat(document.getElementById('r23').value) || 0;
        const r31 = parseFloat(document.getElementById('r31').value) || 0;
        const r32 = parseFloat(document.getElementById('r32').value) || 0;
        const r33 = parseFloat(document.getElementById('r33').value) || 1;
        
        // Create matrix (Three.js uses column-major order)
        const matrix = new THREE.Matrix4();
        matrix.set(
            r11, r21, r31, 0,
            r12, r22, r32, 0,
            r13, r23, r33, 0,
            0, 0, 0, 1
        );
        
        // Check if it's a valid rotation matrix (determinant should be 1)
        const det = matrix.determinant();
        if (Math.abs(det - 1) > 0.1) {
            // Show warning but don't prevent update
            console.warn('Matrix determinant is ' + det.toFixed(3) + ', not 1. Consider normalizing.');
        }
        
        // Extract euler angles from matrix
        const euler = new THREE.Euler();
        euler.setFromRotationMatrix(matrix, rotationOrder);
        
        // Update current rotation
        currentRotation.x = THREE.MathUtils.radToDeg(euler.x);
        currentRotation.y = THREE.MathUtils.radToDeg(euler.y);
        currentRotation.z = THREE.MathUtils.radToDeg(euler.z);
        
        // Update UI (but not matrix inputs to avoid recursion)
        updateEulerUI();
        updateObjectRotation();
        updateRotationInfo();

    } catch (error) {
        console.error('Invalid matrix values:', error);
    }
}

// Normalize the rotation matrix
function normalizeMatrix() {
    try {
        // Get current matrix values
        const r11 = parseFloat(document.getElementById('r11').value) || 1;
        const r12 = parseFloat(document.getElementById('r12').value) || 0;
        const r13 = parseFloat(document.getElementById('r13').value) || 0;
        const r21 = parseFloat(document.getElementById('r21').value) || 0;
        const r22 = parseFloat(document.getElementById('r22').value) || 1;
        const r23 = parseFloat(document.getElementById('r23').value) || 0;
        const r31 = parseFloat(document.getElementById('r31').value) || 0;
        const r32 = parseFloat(document.getElementById('r32').value) || 0;
        const r33 = parseFloat(document.getElementById('r33').value) || 1;
        
        // Create vectors for each column
        const v1 = new THREE.Vector3(r11, r21, r31);
        const v2 = new THREE.Vector3(r12, r22, r32);
        const v3 = new THREE.Vector3(r13, r23, r33);
        
        // Normalize the first column
        v1.normalize();
        
        // Make the second column orthogonal to the first and normalize
        v2.addScaledVector(v1, -v1.dot(v2));
        v2.normalize();
        
        // Make the third column orthogonal to both and normalize
        v3.crossVectors(v1, v2);
        v3.normalize();
        
        // Update the matrix inputs
        document.getElementById('r11').value = v1.x.toFixed(3);
        document.getElementById('r21').value = v1.y.toFixed(3);
        document.getElementById('r31').value = v1.z.toFixed(3);
        document.getElementById('r12').value = v2.x.toFixed(3);
        document.getElementById('r22').value = v2.y.toFixed(3);
        document.getElementById('r32').value = v2.z.toFixed(3);
        document.getElementById('r13').value = v3.x.toFixed(3);
        document.getElementById('r23').value = v3.y.toFixed(3);
        document.getElementById('r33').value = v3.z.toFixed(3);
        
        // Update the rotation
        updateFromMatrix();
        
    } catch (error) {
        alert('Error normalizing matrix. Please check your values.');
    }
}

// Reset matrix to identity
function resetToIdentity() {
    document.getElementById('r11').value = '1.000';
    document.getElementById('r12').value = '0.000';
    document.getElementById('r13').value = '0.000';
    document.getElementById('r21').value = '0.000';
    document.getElementById('r22').value = '1.000';
    document.getElementById('r23').value = '0.000';
    document.getElementById('r31').value = '0.000';
    document.getElementById('r32').value = '0.000';
    document.getElementById('r33').value = '1.000';
    
    currentRotation = { x: 0, y: 0, z: 0 };
    updateEulerUI();
    updateObjectRotation();
    updateRotationInfo();
}

// Update only Euler angle UI elements
function updateEulerUI() {
    document.getElementById('roll-slider').value = currentRotation.x;
    document.getElementById('roll-input').value = currentRotation.x;
    document.getElementById('pitch-slider').value = currentRotation.y;
    document.getElementById('pitch-input').value = currentRotation.y;
    document.getElementById('yaw-slider').value = currentRotation.z;
    document.getElementById('yaw-input').value = currentRotation.z;
}

// Update only the target orientation (the animate loop eases the model there)
function updateObjectRotation() {
    if (!object) return;

    object.rotation.order = rotationOrder;
    targetRotation.x = THREE.MathUtils.degToRad(currentRotation.x);
    targetRotation.y = THREE.MathUtils.degToRad(currentRotation.y);
    targetRotation.z = THREE.MathUtils.degToRad(currentRotation.z);
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

    // Ease the model toward its target orientation for smooth, lively motion
    if (object) {
        object.rotation.x += (targetRotation.x - object.rotation.x) * 0.15;
        object.rotation.y += (targetRotation.y - object.rotation.y) * 0.15;
        object.rotation.z += (targetRotation.z - object.rotation.z) * 0.15;
    }

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

// Mathematical helper functions
function degreesToRadians(degrees) {
    return degrees * (Math.PI / 180);
}

function radiansToDegrees(radians) {
    return radians * (180 / Math.PI);
}

// Matrix multiplication helper
function multiplyMatrices(a, b) {
    const result = [];
    for (let i = 0; i < 3; i++) {
        result[i] = [];
        for (let j = 0; j < 3; j++) {
            result[i][j] = 0;
            for (let k = 0; k < 3; k++) {
                result[i][j] += a[i][k] * b[k][j];
            }
        }
    }
    return result;
}

// Create rotation matrices for individual axes
function getRotationMatrixX(angle) {
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    return [
        [1, 0, 0],
        [0, c, -s],
        [0, s, c]
    ];
}

function getRotationMatrixY(angle) {
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    return [
        [c, 0, s],
        [0, 1, 0],
        [-s, 0, c]
    ];
}

function getRotationMatrixZ(angle) {
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    return [
        [c, -s, 0],
        [s, c, 0],
        [0, 0, 1]
    ];
}
