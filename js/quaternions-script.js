// Global variables
let scene, camera, renderer, object, controls;
let currentQuaternion = new THREE.Quaternion();
let targetQuaternion = new THREE.Quaternion(); // orientation the model eases toward

// Axis materials (set in createAxes) + glow state for the highlight effect
let axisMaterials = { x: null, y: null, z: null };
let axisGlow = { x: 0, y: 0, z: 0 };

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing Quaternions visualization...');
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
    
    // Create an airplane-like shape (same as Euler angles page)
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
    
    // Add propeller blades
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
    
    object.position.set(0, 0, 0);
    console.log('Airplane object created for quaternions visualization');
    
    scene.add(object);
}

// Initialize UI controls
function initControls() {
    // Sync quaternion sliders with number inputs
    const quatControls = ['quat-w', 'quat-x', 'quat-y', 'quat-z'];
    quatControls.forEach(control => {
        const slider = document.getElementById(`${control}-slider`);
        const input = document.getElementById(`${control}-input`);
        const axis = control.slice(-1); // 'x' | 'y' | 'z' (or 'w' — no axis)

        slider.addEventListener('input', function() {
            input.value = parseFloat(slider.value).toFixed(3);
            highlightAxis(axis);
            updateFromQuaternion();
        });

        input.addEventListener('input', function() {
            slider.value = input.value;
            highlightAxis(axis);
            updateFromQuaternion();
        });
    });
    
    // Sync sliders with number inputs for Euler angles
    const eulerAxis = { 'euler-roll': 'x', 'euler-pitch': 'y', 'euler-yaw': 'z' };
    Object.keys(eulerAxis).forEach(control => {
        const slider = document.getElementById(`${control}-slider`);
        const input = document.getElementById(`${control}-input`);
        const axis = eulerAxis[control];

        slider.addEventListener('input', function() {
            input.value = slider.value;
            highlightAxis(axis);
            updateFromEuler();
        });

        input.addEventListener('input', function() {
            slider.value = input.value;
            highlightAxis(axis);
            updateFromEuler();
        });
    });
    
    // Sync rotation angle slider
    const angleSlider = document.getElementById('rotation-angle');
    const angleInput = document.getElementById('rotation-angle-input');
    
    angleSlider.addEventListener('input', function() {
        angleInput.value = angleSlider.value;
        updateFromAxisAngle();
    });
    
    angleInput.addEventListener('input', function() {
        angleSlider.value = angleInput.value;
        updateFromAxisAngle();
    });
}

// Initialize event listeners
function initEventListeners() {
    // Axis input listeners
    ['axis-x', 'axis-y', 'axis-z'].forEach(id => {
        document.getElementById(id).addEventListener('input', updateFromAxisAngle);
    });
    
    // Button listeners
    document.getElementById('normalize-quat-btn').addEventListener('click', normalizeQuaternion);
    document.getElementById('identity-quat-btn').addEventListener('click', setIdentityQuaternion);
    document.getElementById('apply-axis-angle-btn').addEventListener('click', updateFromAxisAngle);
    document.getElementById('apply-euler-btn').addEventListener('click', updateFromEuler);
    
    // Operation buttons
    document.getElementById('conjugate-btn').addEventListener('click', conjugateQuaternion);
    document.getElementById('inverse-btn').addEventListener('click', inverseQuaternion);
    document.getElementById('double-angle-btn').addEventListener('click', doubleAngle);
    document.getElementById('half-angle-btn').addEventListener('click', halfAngle);
    
    // Preset buttons
    document.querySelectorAll('.preset-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            applyPreset(this.dataset.preset);
        });
    });
}

// Update from quaternion input
function updateFromQuaternion() {
    const w = parseFloat(document.getElementById('quat-w-input').value) || 0;
    const x = parseFloat(document.getElementById('quat-x-input').value) || 0;
    const y = parseFloat(document.getElementById('quat-y-input').value) || 0;
    const z = parseFloat(document.getElementById('quat-z-input').value) || 0;
    
    // Create quaternion and automatically normalize for valid rotation
    currentQuaternion.set(x, y, z, w);
    
    // Check if quaternion is close to zero (invalid)
    const magnitude = Math.sqrt(w*w + x*x + y*y + z*z);
    if (magnitude < 0.0001) {
        // Reset to identity if all components are near zero
        currentQuaternion.set(0, 0, 0, 1);
    } else {
        // Normalize to ensure unit quaternion for valid rotation
        currentQuaternion.normalize();
    }
    
    // Update UI to reflect the normalized values
    updateQuaternionInputs();
    updateEulerSliders();
    updateVisualization();
}

// Update from axis-angle input
function updateFromAxisAngle() {
    const axisX = parseFloat(document.getElementById('axis-x').value) || 1;
    const axisY = parseFloat(document.getElementById('axis-y').value) || 0;
    const axisZ = parseFloat(document.getElementById('axis-z').value) || 0;
    const angle = parseFloat(document.getElementById('rotation-angle-input').value) || 0;
    
    const axis = new THREE.Vector3(axisX, axisY, axisZ).normalize();
    const angleRad = THREE.MathUtils.degToRad(angle);
    
    currentQuaternion.setFromAxisAngle(axis, angleRad);
    updateQuaternionInputs();
    updateEulerSliders();
    updateVisualization();
}

// Update from Euler angles input
function updateFromEuler() {
    const roll = parseFloat(document.getElementById('euler-roll-input').value) || 0;
    const pitch = parseFloat(document.getElementById('euler-pitch-input').value) || 0;
    const yaw = parseFloat(document.getElementById('euler-yaw-input').value) || 0;
    
    const euler = new THREE.Euler(
        THREE.MathUtils.degToRad(roll),
        THREE.MathUtils.degToRad(pitch),
        THREE.MathUtils.degToRad(yaw),
        'XYZ'
    );
    
    currentQuaternion.setFromEuler(euler);
    updateQuaternionInputs();
    updateVisualization();
}

// Update the complete visualization
function updateVisualization() {
    if (!object) return;

    // Set the target orientation; the animate loop slerps the model toward it
    targetQuaternion.copy(currentQuaternion);

    // Update displays
    updateQuaternionDisplay();
    updateEulerDisplay();
}

// Update quaternion input fields and sliders
function updateQuaternionInputs() {
    const w = currentQuaternion.w.toFixed(3);
    const x = currentQuaternion.x.toFixed(3);
    const y = currentQuaternion.y.toFixed(3);
    const z = currentQuaternion.z.toFixed(3);
    
    document.getElementById('quat-w-input').value = w;
    document.getElementById('quat-x-input').value = x;
    document.getElementById('quat-y-input').value = y;
    document.getElementById('quat-z-input').value = z;
    
    document.getElementById('quat-w-slider').value = w;
    document.getElementById('quat-x-slider').value = x;
    document.getElementById('quat-y-slider').value = y;
    document.getElementById('quat-z-slider').value = z;
}

// Update Euler angle sliders and inputs
function updateEulerSliders() {
    const euler = new THREE.Euler().setFromQuaternion(currentQuaternion, 'XYZ');
    
    const rollDeg = THREE.MathUtils.radToDeg(euler.x);
    const pitchDeg = THREE.MathUtils.radToDeg(euler.y);
    const yawDeg = THREE.MathUtils.radToDeg(euler.z);
    
    document.getElementById('euler-roll-slider').value = rollDeg.toFixed(0);
    document.getElementById('euler-roll-input').value = rollDeg.toFixed(0);
    document.getElementById('euler-pitch-slider').value = pitchDeg.toFixed(0);
    document.getElementById('euler-pitch-input').value = pitchDeg.toFixed(0);
    document.getElementById('euler-yaw-slider').value = yawDeg.toFixed(0);
    document.getElementById('euler-yaw-input').value = yawDeg.toFixed(0);
}

// Update quaternion display
function updateQuaternionDisplay() {
    document.getElementById('quat-w').textContent = currentQuaternion.w.toFixed(3);
    document.getElementById('quat-x').textContent = currentQuaternion.x.toFixed(3);
    document.getElementById('quat-y').textContent = currentQuaternion.y.toFixed(3);
    document.getElementById('quat-z').textContent = currentQuaternion.z.toFixed(3);
    
    const magnitude = Math.sqrt(
        currentQuaternion.w * currentQuaternion.w +
        currentQuaternion.x * currentQuaternion.x +
        currentQuaternion.y * currentQuaternion.y +
        currentQuaternion.z * currentQuaternion.z
    );
    document.getElementById('quat-magnitude').textContent = magnitude.toFixed(3);
    
    // Update normalization status
    const statusElement = document.getElementById('magnitude-status');
    const isNormalized = Math.abs(magnitude - 1.0) < 0.001;
    
    if (isNormalized) {
        statusElement.textContent = '✓ Normalized';
        statusElement.className = 'status-indicator normalized';
    } else {
        statusElement.textContent = '⚠ Not Normalized';
        statusElement.className = 'status-indicator not-normalized';
    }
}

// Update Euler angles display
function updateEulerDisplay() {
    const euler = new THREE.Euler().setFromQuaternion(currentQuaternion, 'XYZ');
    
    document.getElementById('euler-roll').textContent = THREE.MathUtils.radToDeg(euler.x).toFixed(1) + '°';
    document.getElementById('euler-pitch').textContent = THREE.MathUtils.radToDeg(euler.y).toFixed(1) + '°';
    document.getElementById('euler-yaw').textContent = THREE.MathUtils.radToDeg(euler.z).toFixed(1) + '°';
}

// Quaternion operations
function normalizeQuaternion() {
    currentQuaternion.normalize();
    updateQuaternionInputs();
    updateEulerSliders();
    updateVisualization();
}

function setIdentityQuaternion() {
    currentQuaternion.set(0, 0, 0, 1);
    updateQuaternionInputs();
    updateEulerSliders();
    updateVisualization();
}

function conjugateQuaternion() {
    currentQuaternion.set(-currentQuaternion.x, -currentQuaternion.y, -currentQuaternion.z, currentQuaternion.w);
    updateQuaternionInputs();
    updateEulerSliders();
    updateVisualization();
}

function inverseQuaternion() {
    currentQuaternion.invert();
    updateQuaternionInputs();
    updateEulerSliders();
    updateVisualization();
}

function doubleAngle() {
    // Convert to axis-angle, double the angle, convert back
    const axis = new THREE.Vector3();
    const angle = currentQuaternion.getAxisAngle ? currentQuaternion.getAxisAngle(axis) : 0;
    currentQuaternion.setFromAxisAngle(axis, angle * 2);
    updateQuaternionInputs();
    updateEulerSliders();
    updateVisualization();
}

function halfAngle() {
    // Convert to axis-angle, halve the angle, convert back
    const axis = new THREE.Vector3();
    const angle = currentQuaternion.getAxisAngle ? currentQuaternion.getAxisAngle(axis) : 0;
    currentQuaternion.setFromAxisAngle(axis, angle * 0.5);
    updateQuaternionInputs();
    updateEulerSliders();
    updateVisualization();
}

// Apply preset quaternions
function applyPreset(preset) {
    switch(preset) {
        case 'identity':
            currentQuaternion.set(0, 0, 0, 1);
            break;
        case '90x':
            currentQuaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2);
            break;
        case '90y':
            currentQuaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2);
            break;
        case '90z':
            currentQuaternion.setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI / 2);
            break;
        case '180x':
            currentQuaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI);
            break;
        case 'arbitrary':
            currentQuaternion.setFromAxisAngle(new THREE.Vector3(1, 1, 1).normalize(), Math.PI / 3);
            break;
    }
    
    updateQuaternionInputs();
    updateEulerSliders();
    updateVisualization();
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

    // Slerp the model toward its target orientation for smooth, lively motion
    if (object) {
        object.quaternion.slerp(targetQuaternion, 0.15);
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
