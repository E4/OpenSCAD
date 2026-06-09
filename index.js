import * as THREE from 'three';
import { STLLoader } from 'three/addons/loaders/STLLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// Configure Monaco Editor AMD Loader
require.config({ paths: { vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.39.0/min/vs' } });

require(['vs/editor/editor.main'], async function () {
  // Register OpenSCAD language definition in Monaco
  monaco.languages.register({ id: 'openscad' });
  monaco.languages.setMonarchTokensProvider('openscad', {
    defaultToken: '',
    tokenPostfix: '.scad',
    keywords: [
      'module', 'function', 'use', 'include', 'for', 'intersection', 
      'difference', 'union', 'if', 'else', 'let', 'each', 'true', 'false'
    ],
    builtins: [
      'cube', 'sphere', 'cylinder', 'polyhedron', 'square', 'circle', 
      'polygon', 'text', 'linear_extrude', 'rotate_extrude', 'rotate', 
      'translate', 'scale', 'resize', 'mirror', 'multmatrix', 'color', 
      'offset', 'hull', 'minkowski', 'union', 'difference', 'intersection',
      'echo', 'version', 'version_num'
    ],
    operators: [
      '=', '>', '<', '!', '~', '?', ':', '==', '<=', '>=', '!=',
      '&&', '||', '+', '-', '*', '/', '%', '^'
    ],
    symbols:  /[=><!~?:&|+\-*\/\^%]+/,
    escapes: /\\(?:[abfnrtv\\"']|x[0-9A-Fa-f]{1,4}|u[0-9A-Fa-f]{4}|U[0-9A-Fa-f]{8})/,
    tokenizer: {
      root: [
        [/[a-zA-Z_]\w*/, {
          cases: {
            '@keywords': 'keyword',
            '@builtins': 'predefined',
            '@default': 'identifier'
          }
        }],
        { include: '@whitespace' },
        [/[{}()\[\]]/, '@brackets'],
        [/@symbols/, {
          cases: {
            '@operators': 'operator',
            '@default': ''
          }
        }],
        [/\d*\.\d+([eE][\-+]?\d+)?/, 'number.float'],
        [/\d+/, 'number'],
        [/[;,.]/, 'delimiter'],
        [/"([^"\\]|\\.)*$/, 'string.invalid'],
        [/"/, 'string', '@string'],
      ],
      whitespace: [
        [/[ \t\r\n]+/, ''],
        [/\/\*/, 'comment', '@comment'],
        [/\/\/.*$/, 'comment'],
      ],
      comment: [
        [/[^\/*]+/, 'comment'],
        [/\*\//, 'comment', '@pop'],
        [/[\/*]/, 'comment']
      ],
      string: [
        [/[^\\"]+/, 'string'],
        [/@escapes/, 'string.escape'],
        [/\\./, 'string.invalid'],
        [/"/, 'string', '@pop']
      ]
    }
  });

  // Register OpenSCAD completion provider for language hints
  monaco.languages.registerCompletionItemProvider('openscad', {
    provideCompletionItems: function (model, position) {
      const suggestions = [];

      const keywords = [
        'module', 'function', 'use', 'include', 'for', 'intersection', 
        'difference', 'union', 'if', 'else', 'let', 'each', 'true', 'false'
      ];
      keywords.forEach(kw => {
        suggestions.push({
          label: kw,
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: kw
        });
      });

      const builtins = [
        'cube', 'sphere', 'cylinder', 'polyhedron', 'square', 'circle', 
        'polygon', 'text', 'linear_extrude', 'rotate_extrude', 'rotate', 
        'translate', 'scale', 'resize', 'mirror', 'multmatrix', 'color', 
        'offset', 'hull', 'minkowski', 'echo', 'version', 'version_num'
      ];
      builtins.forEach(bi => {
        let insertText = bi;
        let kind = monaco.languages.CompletionItemKind.Function;
        
        if (bi === 'cube') {
          insertText = 'cube(size = [${1:10}, ${2:10}, ${3:10}], center = ${4:true});';
          kind = monaco.languages.CompletionItemKind.Snippet;
        } else if (bi === 'sphere') {
          insertText = 'sphere(r = ${1:10}, $fn = ${2:50});';
          kind = monaco.languages.CompletionItemKind.Snippet;
        } else if (bi === 'cylinder') {
          insertText = 'cylinder(h = ${1:20}, r = ${2:5}, center = ${3:true}, $fn = ${4:50});';
          kind = monaco.languages.CompletionItemKind.Snippet;
        } else if (bi === 'translate') {
          insertText = 'translate([${1:0}, ${2:0}, ${3:0}]) {\n\t$0\n}';
          kind = monaco.languages.CompletionItemKind.Snippet;
        } else if (bi === 'rotate') {
          insertText = 'rotate([${1:0}, ${2:0}, ${3:0}]) {\n\t$0\n}';
          kind = monaco.languages.CompletionItemKind.Snippet;
        } else if (bi === 'scale') {
          insertText = 'scale([${1:1}, ${2:1}, ${3:1}]) {\n\t$0\n}';
          kind = monaco.languages.CompletionItemKind.Snippet;
        } else if (bi === 'difference') {
          insertText = 'difference() {\n\t$1\n\t$2\n}';
          kind = monaco.languages.CompletionItemKind.Snippet;
        } else if (bi === 'union') {
          insertText = 'union() {\n\t$1\n\t$2\n}';
          kind = monaco.languages.CompletionItemKind.Snippet;
        } else if (bi === 'intersection') {
          insertText = 'intersection() {\n\t$1\n\t$2\n}';
          kind = monaco.languages.CompletionItemKind.Snippet;
        } else if (bi === 'module') {
          insertText = 'module ${1:name}(${2:params}) {\n\t$0\n}';
          kind = monaco.languages.CompletionItemKind.Snippet;
        } else {
          insertText = bi + '($0)';
        }

        suggestions.push({
          label: bi,
          kind: kind,
          insertText: insertText,
          insertTextRules: insertText.includes('$') ? monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet : undefined,
          documentation: `OpenSCAD built-in: ${bi}`
        });
      });

      return { suggestions: suggestions };
    }
  });

  const initialCode = `$fn=200;

module testshape()
{
  function r_from_dia(d) = d / 2;

  module rotcy(rot, r, h) {
    rotate(90, rot)
      cylinder(r = r, h = h, center = true);
  }

  difference() {
    sphere(r = r_from_dia(size));
    rotcy([0, 0, 0], cy_r, cy_h);
    rotcy([1, 0, 0], cy_r, cy_h);
    rotcy([0, 1, 0], cy_r, cy_h);
    for (x_idx = [0 : 1]) {
      for (y_idx = [0 : 3]) {
        rotate([-45+x_idx*90, y_idx * 90, 0])
          translate([0, 0 , 24])
            linear_extrude(1)
              text(str((x_idx * 4) + y_idx + 1), halign="center", valign="center");
      }
    }
  }

  size = 50;
  hole = 25;

  cy_r = r_from_dia(hole);
  cy_h = r_from_dia(size * 2.5);
}

echo(version=version());

testshape();
`;

  const editor = monaco.editor.create(document.getElementById('editor-container'), {
    value: initialCode,
    language: 'openscad',
    theme: 'vs-dark',
    automaticLayout: true,
    fontFamily: 'Fira Code, monospace',
    fontSize: 14,
    lineHeight: 22,
    minimap: { enabled: false },
    scrollbar: {
      verticalScrollbarSize: 8,
      horizontalScrollbarSize: 8
    }
  });

  // Initialize UI & ThreeJS variables
  const renderBtn = document.getElementById('render-btn');
  const downloadBtn = document.getElementById('download-btn');
  const terminalOutput = document.getElementById('terminal-output');
  const clearBtn = document.getElementById('clear-terminal');
  const statusDot = document.getElementById('status-dot');
  const statusText = document.getElementById('status-text');

  const styleSelect = document.getElementById('material-select');
  const gridToggle = document.getElementById('helper-grid-toggle');
  const autoRenderToggle = document.getElementById('auto-render-toggle');

  // Load saved UI settings from localStorage
  const savedStyle = localStorage.getItem('openscad_setting_style');
  if (savedStyle !== null) {
    styleSelect.value = savedStyle;
  }
  
  const savedGrid = localStorage.getItem('openscad_setting_grid');
  if (savedGrid !== null) {
    gridToggle.checked = (savedGrid === 'true');
  } else {
    gridToggle.checked = false; // default is off
  }

  const savedAutoRender = localStorage.getItem('openscad_setting_autorender');
  if (savedAutoRender !== null) {
    autoRenderToggle.checked = (savedAutoRender === 'true');
  } else {
    autoRenderToggle.checked = true; // default is on
  }

  let lastRenderedSTL = null; // Buffer to hold rendered STL data

  function appendLog(text, type = '') {
    const line = document.createElement('div');
    line.className = `terminal-line ${type}`;
    line.textContent = text;
    terminalOutput.appendChild(line);
    terminalOutput.scrollTop = terminalOutput.scrollHeight;
  }

  clearBtn.addEventListener('click', () => {
    terminalOutput.innerHTML = '';
    appendLog('Console cleared.', 'info');
  });

  let isSwitchingFile = false;
  let lastLoadedFile = null;

  function saveCurrentFile() {
    const activeFile = localStorage.getItem("openscad_active_file") || "testShape";
    const code = editor.getValue();
    let files = JSON.parse(localStorage.getItem("openscad_files") || "{}");
    files[activeFile] = code;
    localStorage.setItem("openscad_files", JSON.stringify(files));
  }

  function updateFileSelectOptions() {
    const fileSelect = document.getElementById('file-select');
    fileSelect.innerHTML = '';
    const files = JSON.parse(localStorage.getItem("openscad_files") || "{}");
    const activeFile = localStorage.getItem("openscad_active_file") || "testShape";
    
    for (const name in files) {
      const option = document.createElement('option');
      option.value = name;
      option.textContent = name;
      if (name === activeFile) {
        option.selected = true;
      }
      fileSelect.appendChild(option);
    }
  }

  // Initialize files in localStorage if not present
  let localFiles = JSON.parse(localStorage.getItem("openscad_files") || "{}");
  if (!localFiles["testShape"]) {
    localFiles["testShape"] = initialCode;
    localStorage.setItem("openscad_files", JSON.stringify(localFiles));
  }
  let activeFile = localStorage.getItem("openscad_active_file") || "testShape";
  if (!localFiles[activeFile]) {
    activeFile = "testShape";
    localStorage.setItem("openscad_active_file", "testShape");
  }

  updateFileSelectOptions();

  isSwitchingFile = true;
  editor.setValue(localFiles[activeFile]);
  isSwitchingFile = false;

  // File selection dropdown handler
  document.getElementById('file-select').addEventListener('change', (e) => {
    saveCurrentFile();
    
    const newActiveFile = e.target.value;
    localStorage.setItem("openscad_active_file", newActiveFile);
    
    const files = JSON.parse(localStorage.getItem("openscad_files") || "{}");
    isSwitchingFile = true;
    editor.setValue(files[newActiveFile] || "");
    isSwitchingFile = false;
    
    // Trigger render when switching files
    renderModel();
  });

  // New File handler
  const newFileBtn = document.getElementById('new-file-btn');
  newFileBtn.addEventListener('click', () => {
    saveCurrentFile();

    let defaultName = "untitled";
    let files = JSON.parse(localStorage.getItem("openscad_files") || "{}");
    if (files[defaultName] !== undefined) {
      let counter = 1;
      while (files["untitled" + counter] !== undefined) {
        counter++;
      }
      defaultName = "untitled" + counter;
    }
    
    const name = prompt("Enter file name:", defaultName);
    if (name === null) return;
    const trimmedName = name.trim();
    if (!trimmedName) {
      alert("File name cannot be empty.");
      return;
    }
    
    if (files[trimmedName] !== undefined) {
      alert("A file with this name already exists.");
      return;
    }
    
    files[trimmedName] = "";
    localStorage.setItem("openscad_files", JSON.stringify(files));
    localStorage.setItem("openscad_active_file", trimmedName);
    
    updateFileSelectOptions();
    
    isSwitchingFile = true;
    editor.setValue("");
    isSwitchingFile = false;
    
    appendLog(`Created new file "${trimmedName}"`, 'info');
  });

  // Delete File handler
  const deleteFileBtn = document.getElementById('delete-file-btn');
  deleteFileBtn.addEventListener('click', () => {
    const activeFile = localStorage.getItem("openscad_active_file") || "testShape";
    if (activeFile === "testShape") {
      alert("Cannot delete the default template shape.");
      return;
    }
    
    if (!confirm(`Are you sure you want to delete "${activeFile}"?`)) return;
    
    let files = JSON.parse(localStorage.getItem("openscad_files") || "{}");
    delete files[activeFile];
    
    localStorage.setItem("openscad_files", JSON.stringify(files));
    localStorage.setItem("openscad_active_file", "testShape");
    
    updateFileSelectOptions();
    
    isSwitchingFile = true;
    editor.setValue(files["testShape"] || initialCode);
    isSwitchingFile = false;
    
    appendLog(`Deleted "${activeFile}"`, 'info');
  });

  // Debounced editor change listener (Auto-Save & Auto-Render)
  let changeTimeout = null;
  editor.onDidChangeModelContent(() => {
    if (isSwitchingFile) return;
    
    if (changeTimeout) clearTimeout(changeTimeout);
    
    changeTimeout = setTimeout(() => {
      saveCurrentFile();
      
      if (document.getElementById('auto-render-toggle').checked) {
        renderModel();
      }
    }, 1000);
  });

  // --- ThreeJS 3D Viewport Setup ---
  let scene, camera, renderer, controls, currentMesh, gridHelper, axesHelper;
  let gizmoScene, gizmoCamera, gizmoRenderer;

  function initViewport() {
    const container = document.getElementById('viewport-container');
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x12141c);

    // Camera
    camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(40, 40, 60);

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    // Controls (Inertia Damping Disabled as requested!)
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = false;
    controls.screenSpacePanning = true;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x555555);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 0.75);
    dirLight1.position.set(1, 1, 1).normalize();
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x334466, 0.5);
    dirLight2.position.set(-1, -1, -1).normalize();
    scene.add(dirLight2);

    const pointLight = new THREE.PointLight(0x00f0ff, 0.6, 150);
    pointLight.position.set(0, 30, 20);
    scene.add(pointLight);

    // Grid Helper
    gridHelper = new THREE.GridHelper(100, 30, 0x00f0ff, 0x222633);
    gridHelper.position.y = -0.01;
    gridHelper.visible = gridToggle.checked;
    scene.add(gridHelper);

    // Axes Helper
    axesHelper = new THREE.AxesHelper(15);
    axesHelper.position.y = 0.01; // Slightly offset to avoid z-fighting
    axesHelper.visible = gridToggle.checked;
    scene.add(axesHelper);

    // Initialize Orientation Gizmo
    initGizmo();

    // Animation Loop
    function animate() {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
      updateGizmo(); // Synchronize and render coordinate gizmo!
    }
    animate();

    // Resize Handler
    window.addEventListener('resize', () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      
      // Gizmo Resize
      const gizmoContainer = document.getElementById('orientation-gizmo');
      const gw = gizmoContainer.clientWidth;
      const gh = gizmoContainer.clientHeight;
      gizmoRenderer.setSize(gw, gh);
    });
  }

  // --- Orientation Gizmo Setup ---
  function initGizmo() {
    const container = document.getElementById('orientation-gizmo');
    const width = container.clientWidth;
    const height = container.clientHeight;

    gizmoScene = new THREE.Scene();

    // Orthographic Camera for alignment
    gizmoCamera = new THREE.OrthographicCamera(-2, 2, 2, -2, 0.1, 100);
    gizmoCamera.position.set(0, 0, 10);

    // Renderer (alpha: true for transparent background)
    gizmoRenderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    gizmoRenderer.setSize(width, height);
    gizmoRenderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(gizmoRenderer.domElement);

    // Lighting for Gizmo
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    gizmoScene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
    dirLight.position.set(1, 1, 2).normalize();
    gizmoScene.add(dirLight);

    // Materials (X = Red, Y = Green, Z = Blue)
    const matX = new THREE.MeshBasicMaterial({ color: 0xff3b30 });
    const matY = new THREE.MeshBasicMaterial({ color: 0x34c759 });
    const matZ = new THREE.MeshBasicMaterial({ color: 0x007aff });
    const matNeg = new THREE.MeshBasicMaterial({ color: 0x2c2c2e, transparent: true, opacity: 0.6 });

    // Geometry components
    const stemGeo = new THREE.CylinderGeometry(0.06, 0.06, 1.2, 8);
    const headGeo = new THREE.SphereGeometry(0.24, 16, 16);

    // X Axis (+) - Red
    const stemX = new THREE.Mesh(stemGeo, matX);
    stemX.rotation.z = -Math.PI / 2;
    stemX.position.x = 0.6;
    const headX = new THREE.Mesh(headGeo, matX);
    headX.position.x = 1.2;
    gizmoScene.add(stemX, headX);

    // Y Axis (+) - Green
    const stemY = new THREE.Mesh(stemGeo, matY);
    stemY.position.y = 0.6;
    const headY = new THREE.Mesh(headGeo, matY);
    headY.position.y = 1.2;
    gizmoScene.add(stemY, headY);

    // Z Axis (+) - Blue
    const stemZ = new THREE.Mesh(stemGeo, matZ);
    stemZ.rotation.x = Math.PI / 2;
    stemZ.position.z = 0.6;
    const headZ = new THREE.Mesh(headGeo, matZ);
    headZ.position.z = 1.2;
    gizmoScene.add(stemZ, headZ);

    // Negative Axes (-) - Dark Grey circles
    const headNegX = new THREE.Mesh(headGeo, matNeg);
    headNegX.position.x = -1.2;
    const headNegY = new THREE.Mesh(headGeo, matNeg);
    headNegY.position.y = -1.2;
    const headNegZ = new THREE.Mesh(headGeo, matNeg);
    headNegZ.position.z = -1.2;
    gizmoScene.add(headNegX, headNegY, headNegZ);
  }

  function updateGizmo() {
    if (!gizmoCamera || !camera) return;

    // Sync gizmo rotation to mirror main camera rotation
    gizmoCamera.quaternion.copy(camera.quaternion);

    // Reposition camera along camera direction vector relative to gizmo origin
    const dir = new THREE.Vector3(0, 0, 10);
    dir.applyQuaternion(camera.quaternion);
    gizmoCamera.position.copy(dir);

    gizmoCamera.lookAt(0, 0, 0);
    gizmoRenderer.render(gizmoScene, gizmoCamera);
  }

  function getSelectedMaterial() {
    const style = document.getElementById('material-select').value;
    if (style === 'normals') {
      return new THREE.MeshNormalMaterial({
        flatShading: true
      });
    } else if (style === 'wireframe') {
      return new THREE.MeshBasicMaterial({
        color: 0x00f0ff,
        wireframe: true
      });
    } else { // 'solid'
      return new THREE.MeshStandardMaterial({
        color: 0x9d4edd, // Bright violet
        roughness: 0.35,
        metalness: 0.15,
        flatShading: true
      });
    }
  }

  function updateMeshMaterial(style) {
    if (!currentMesh) return;
    const mesh = currentMesh.children[0];
    if (!mesh) return;
    mesh.material = getSelectedMaterial();
    appendLog(`Viewport material updated to: ${style}`, 'info');
  }

  function loadSTLIntoViewport(arrayBuffer, shouldResetCamera = true) {
    if (currentMesh) {
      scene.remove(currentMesh);
    }

    const loader = new STLLoader();
    let geometry;
    try {
      geometry = loader.parse(arrayBuffer);
    } catch (e) {
      appendLog('Three.js failed to parse STL: ' + e.message, 'error');
      return;
    }

    const material = getSelectedMaterial();
    const mesh = new THREE.Mesh(geometry, material);

    // Compute boundaries and auto-center
    geometry.computeBoundingBox();
    const boundingBox = geometry.boundingBox;
    const center = new THREE.Vector3();
    boundingBox.getCenter(center);

    // Offset the geometry to align the bounding box center with the origin
    mesh.position.set(-center.x, -center.y, -center.z);

    const group = new THREE.Group();
    group.add(mesh);
    scene.add(group);
    currentMesh = group;

    if (shouldResetCamera) {
      // Adjust camera to fit the model bounding box
      const size = new THREE.Vector3();
      boundingBox.getSize(size);
      const maxDim = Math.max(size.x, size.y, size.z);
      const fov = camera.fov * (Math.PI / 180);
      let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
      
      cameraZ *= 1.7; // Factor to add spacing around the model
      camera.position.set(cameraZ * 0.7, cameraZ * 0.7, cameraZ);
      camera.lookAt(new THREE.Vector3(0, 0, 0));
      controls.target.set(0, 0, 0);
      controls.update();
    }
  }

  // Initialize 3D Viewport
  initViewport();

  // Hide orientation instructions on first interaction with the viewport
  const viewportContainer = document.getElementById('viewport-container');
  const overlayInfo = document.querySelector('.viewport-overlay-info');
  if (viewportContainer && overlayInfo) {
    const hideOverlay = () => {
      overlayInfo.style.opacity = '0';
      // Clean up event listeners so we don't keep firing them
      viewportContainer.removeEventListener('pointerdown', hideOverlay);
      viewportContainer.removeEventListener('wheel', hideOverlay);
    };
    viewportContainer.addEventListener('pointerdown', hideOverlay, { passive: true });
    viewportContainer.addEventListener('wheel', hideOverlay, { passive: true });
  }

  // Listen for material style changes
  styleSelect.addEventListener('change', (e) => {
    updateMeshMaterial(e.target.value);
    localStorage.setItem('openscad_setting_style', e.target.value);
  });

  // Listen for grid visibility changes
  gridToggle.addEventListener('change', (e) => {
    if (gridHelper) {
      gridHelper.visible = e.target.checked;
    }
    if (axesHelper) {
      axesHelper.visible = e.target.checked;
    }
    localStorage.setItem('openscad_setting_grid', e.target.checked);
  });

  // Listen for auto-render setting changes
  autoRenderToggle.addEventListener('change', (e) => {
    localStorage.setItem('openscad_setting_autorender', e.target.checked);
  });

  // --- Render function and handlers ---
  let activeWorker = null;

  function safeDump(obj, depth = 3) {
    const seen = new WeakSet();
    
    function clean(val, currentDepth) {
      if (val === null || val === undefined) return val;
      if (typeof val === 'function') {
        return `[Function: ${val.name || 'anonymous'}]`;
      }
      if (typeof val !== 'object') return val;
      if (currentDepth > depth) return '[Object]';
      if (seen.has(val)) return '[Circular]';
      
      seen.add(val);
      
      if (val instanceof Error) {
        const copy = {
          name: val.name,
          message: val.message,
          stack: val.stack
        };
        for (const key of Object.getOwnPropertyNames(val)) {
          if (!(key in copy)) {
            copy[key] = clean(val[key], currentDepth + 1);
          }
        }
        return copy;
      }
      
      if (Array.isArray(val)) {
        return val.map(item => clean(item, currentDepth + 1));
      }
      
      const copy = {};
      const keys = Object.getOwnPropertyNames(val);
      for (const key of keys) {
        try {
          copy[key] = clean(val[key], currentDepth + 1);
        } catch (e) {
          copy[key] = '[Unreadable: ' + e.message + ']';
        }
      }
      return copy;
    }
    
    try {
      const cleaned = clean(obj, 0);
      return JSON.stringify(cleaned, null, 2);
    } catch (e) {
      try {
        let keys = [];
        for (let k in obj) {
          keys.push(k);
        }
        return `[Failed to serialize object. Keys: ${keys.join(', ')}. Error: ${e.message}]`;
      } catch (e2) {
        return `[Failed to serialize object: ${String(obj)}]`;
      }
    }
  }

  function formatWorkerError(err) {
    if (!err) return 'Unknown error';
    if (typeof err === 'string') return err;
    if (err instanceof Error) {
      return err.stack || `${err.name}: ${err.message}`;
    }
    if (err && typeof err === 'object') {
      if (err.message && typeof err.message === 'string' && err.message !== '[object Object]') {
        let msg = err.message;
        if (err.filename) {
          const parts = err.filename.split('/');
          const filename = parts[parts.length - 1];
          msg += ` at ${filename}:${err.lineno}:${err.colno}`;
        }
        if (err.error) {
          if (err.error.stack) {
            msg += `\nDetails: ${err.error.stack}`;
          } else {
            msg += `\nDetails: ${safeDump(err.error)}`;
          }
        }
        return msg;
      } else {
        return safeDump(err);
      }
    }
    return String(err);
  }

  async function renderModel() {
    // If a worker is compiling, terminate it to cancel the current run
    if (activeWorker) {
      activeWorker.terminate();
      activeWorker = null;
      appendLog('Previous compilation cancelled.', 'info');
    }

    renderBtn.disabled = true;
    downloadBtn.disabled = true;
    statusDot.className = 'status-indicator busy';
    statusText.textContent = 'Rendering...';

    // Spawn a new background worker (using ES module type)
    activeWorker = new Worker('./openscad-worker.js', { type: 'module' });

    activeWorker.onmessage = function(e) {
      const msg = e.data;
      if (msg.type === 'log') {
        appendLog(msg.text, msg.logType);
      } else if (msg.type === 'success') {
        lastRenderedSTL = new Uint8Array(msg.buffer);
        
        const activeFile = localStorage.getItem("openscad_active_file") || "testShape";
        const shouldResetCamera = (lastLoadedFile !== activeFile);
        lastLoadedFile = activeFile;

        loadSTLIntoViewport(msg.buffer, shouldResetCamera);
        appendLog('Model rendered in viewport successfully!', 'success');
        
        activeWorker.terminate();
        activeWorker = null;

        renderBtn.disabled = false;
        downloadBtn.disabled = false;
        statusDot.className = 'status-indicator';
        statusText.textContent = 'Ready';
      } else if (msg.type === 'error') {
        let errorMsg = msg.message;
        if (errorMsg && typeof errorMsg === 'object') {
          errorMsg = safeDump(errorMsg);
        }
        appendLog('Compilation failed: ' + errorMsg, 'error');
        
        activeWorker.terminate();
        activeWorker = null;

        renderBtn.disabled = false;
        downloadBtn.disabled = false;
        statusDot.className = 'status-indicator';
        statusText.textContent = 'Ready';
      }
    };

    activeWorker.onerror = function(err) {
      const errorMsg = formatWorkerError(err);
      appendLog('Worker error: ' + errorMsg, 'error');
      
      activeWorker.terminate();
      activeWorker = null;

      renderBtn.disabled = false;
      downloadBtn.disabled = false;
      statusDot.className = 'status-indicator';
      statusText.textContent = 'Ready';
    };

    const code = editor.getValue();
    activeWorker.postMessage({ type: 'compile', code: code });
  }

  renderBtn.addEventListener('click', renderModel);

  // --- Download Click Handler ---
  downloadBtn.addEventListener('click', () => {
    if (!lastRenderedSTL) return;
    
    try {
      const blob = new Blob([lastRenderedSTL], { type: "application/octet-stream" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "model.stl";
      document.body.append(link);
      link.click();
      link.remove();
      appendLog('STL file downloaded successfully.', 'success');
    } catch (e) {
      appendLog('Download failed: ' + e.message, 'error');
    }
  });

  // Trigger initial render
  renderModel();
});
