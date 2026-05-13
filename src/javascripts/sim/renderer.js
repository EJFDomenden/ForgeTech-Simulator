import * as THREE from 'three';
import { GLTFLoader } from 'GLTFLoader';
import { OrbitControls } from 'OrbitControls';

class SimulatorRenderer {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.gltfLoader = null;
    this.loadedModels = new Map();
    this.gridHelper = null;
    this.axisHelper = null;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.activeSlot = null;
    this.activeComponent = null;
    this.mainRamModel = null;
    this.placedComponents = [];
    this.pointerDownPos = new THREE.Vector2();
    this.init();
  }

  init() {
    this.setupScene();
    this.setupCamera();
    this.setupRenderer();
    this.setupLighting();
    this.setupControls();
    this.setupGrid();
    this.setupGLTFLoader();
    this.setupInteraction();
    this.animate();
  }

  setupScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0118);
    this.scene.fog = new THREE.Fog(0x0a0118, 500, 1000);
  }

  setupCamera() {
    if (!this.container) {
      console.error("Renderer Error: #forge-canvas not found in the DOM.");
      return;
    }
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    this.camera.position.set(0, 0, 180);
  }

  setupRenderer() {
    this.renderer = new THREE.WebGLRenderer({ canvas: this.container, antialias: true, alpha: true });
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setClearColor(0x000000, 0); // Makes canvas transparent
    this.scene.background = null; // Removes hardcoded dark background
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.shadowMap.enabled = true;
  }

  setupLighting() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(50, 50, 50);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.left = -100;
    directionalLight.shadow.camera.right = 100;
    directionalLight.shadow.camera.top = 100;
    directionalLight.shadow.camera.bottom = -100;
    this.scene.add(directionalLight);

    const fillLight = new THREE.DirectionalLight(0x6d79ff, 0.3);
    fillLight.position.set(-50, 30, -50);
    this.scene.add(fillLight);

    const pointLight = new THREE.PointLight(0x5eff9e, 0.5, 500);
    pointLight.position.set(20, 20, 20);
    this.scene.add(pointLight);
  }

  setupControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.zoomSpeed = 16 / 32;
    this.controls.minDistance = 8;
    this.controls.maxDistance = 256;
    this.controls.panSpeed = 1;
    this.controls.rotateSpeed = 1;
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.update();
  }

  setupGrid() {
    this.gridHelper = new THREE.GridHelper(516, 20, 0x5eff9e, 0x393643);
    this.gridHelper.rotation.x = Math.PI / 2;
    this.gridHelper.position.z = -1;
    this.scene.add(this.gridHelper);

    this.axisHelper = new THREE.AxesHelper(20);
    this.scene.add(this.axisHelper);
  }

  setupGLTFLoader() {
    this.gltfLoader = new GLTFLoader();
  }

  setupInteraction() {
    this.renderer.domElement.addEventListener('pointerdown', (e) => this.pointerDownPos.set(e.clientX, e.clientY));
    this.renderer.domElement.addEventListener('pointerup', (e) => {
      const dist = Math.hypot(e.clientX - this.pointerDownPos.x, e.clientY - this.pointerDownPos.y);
      if (dist < 5) this.onMouseClick(e);
    });
  }

  onMouseClick(event) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) return;

    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(this.mouse, this.camera);

    const intersects = this.raycaster.intersectObjects(this.scene.children, true);
    let hitHighlight = null, hitComponent = null;

    for (let i = 0; i < intersects.length; i++) {
      let obj = intersects[i].object;
      if (obj.userData && obj.userData.isHighlight && obj.visible) {
        hitHighlight = obj;
        break;
      }
      let current = obj;
      while (current && current.type !== 'Scene') {
        if (current.userData && current.userData.isComponent) {
          hitComponent = current;
          break;
        }
        current = current.parent;
      }
      if (hitHighlight || hitComponent) break;
    }

    if (hitHighlight) { this.deselectComponent(); this.selectHighlight(hitHighlight); }
    else if (hitComponent) { this.deselectHighlight(); this.selectComponent(hitComponent); }
    else { this.deselectHighlight(); this.deselectComponent(); }
  }

  selectHighlight(highlightMesh) {
    this.deselectHighlight();
    this.activeSlot = highlightMesh;
    this.activeSlot.material.color.setHex(0xffaa00);
    this.activeSlot.material.opacity = 0.8;
    window.dispatchEvent(new CustomEvent('sim-selection-changed', { detail: { category: this.activeSlot.userData.category, type: 'slot' } }));
  }

  deselectHighlight() {
    if (this.activeSlot) {
      this.activeSlot.material.color.setHex(0x5eff9e);
      this.activeSlot.material.opacity = 0.3;
      this.activeSlot = null;
      window.dispatchEvent(new CustomEvent('sim-selection-changed', { detail: { category: null } }));
    }
  }

  selectComponent(componentGroup) {
    this.deselectComponent();
    this.activeComponent = componentGroup;
    this.activeComponent.traverse((child) => {
      if (child.isMesh && child.material) {
        child.material = child.material.clone();
        if (!child.material.emissive) child.material.emissive = new THREE.Color(0x000000);
        child.userData.originalEmissiveHex = child.material.emissive.getHex();
        child.material.emissive.setHex(0xffaa00);
        child.material.emissiveIntensity = 0.8;
      }
    });
    window.dispatchEvent(new CustomEvent('sim-selection-changed', { detail: { category: this.activeComponent.userData.category, type: 'component' } }));
  }

  deselectComponent() {
    if (this.activeComponent) {
      this.activeComponent.traverse((child) => {
        if (child.isMesh && child.userData.originalEmissiveHex !== undefined) {
          child.material.emissive.setHex(child.userData.originalEmissiveHex);
          child.material.emissiveIntensity = 1.0;
        }
      });
      this.activeComponent = null;
      window.dispatchEvent(new CustomEvent('sim-selection-changed', { detail: { category: null } }));
    }
  }

  generateHighlights(ramModel) {
    const mcGeo = new THREE.BoxGeometry(9.85, 13.0, 1);
    const mcMat = new THREE.MeshBasicMaterial({ color: 0x5eff9e, transparent: true, opacity: 0.3, depthWrite: false });
    const mcxPos = [-110, -80, -50, -20, 20, 50, 80, 110];
    const mcyPos = 3.0;

    mcxPos.forEach((x, index) => {
      const mesh = new THREE.Mesh(mcGeo, mcMat.clone());
      mesh.position.set(x, mcyPos, 0.9);
      mesh.userData = { category: 'Memory Chip', isHighlight: true, id: `front-${index}` };
      ramModel.add(mesh);
    });
    mcxPos.forEach((x, index) => {
      const mesh = new THREE.Mesh(mcGeo, mcMat.clone());
      mesh.position.set(x, mcyPos, -0.9);
      mesh.userData = { category: 'Memory Chip', isHighlight: true, id: `back-${index}` };
      ramModel.add(mesh);
    });
  }

  generateHighlightsForSPD(ramModel) {
    const spdGeo = new THREE.BoxGeometry(4.0, 3.0, 1.0);
    const spdMat = new THREE.MeshBasicMaterial({ color: 0x5eff9e, transparent: true, opacity: 0.3, depthWrite: false });
    const mesh = new THREE.Mesh(spdGeo, spdMat);
    mesh.position.set(0, -12.0, 2);
    mesh.userData = { category: 'SPD', isHighlight: true, id: 'spd-0' };
    ramModel.add(mesh);
  }

  async spawnModel(modelPath, compData = {}) {
    const isLegacyCall = typeof compData === 'string';
    const category = isLegacyCall ? compData : (compData.category || 'Unknown');

    if (category === 'Dummy RAM') {
      if (this.mainRamModel) return console.warn("A Dummy RAM is already placed on the board!");
    } else {
      if (!this.activeSlot || this.activeSlot.userData.category !== category) {
        return console.warn(`Cannot place ${category}. Please select a valid highlight slot first.`);
      }
    }

    try {
      const model = await this._loadGLTF(modelPath);
      const dbMetadata = isLegacyCall ? { category: category } : {
        category: category, brand: compData.brand || 'Generic', name: compData.name || 'Component', specs: compData.specs || {}
      };

      if (category === 'Dummy RAM') {
        model.userData = { ...model.userData, ...dbMetadata, isMainBoard: true };
        this.scene.add(model);
        this.mainRamModel = model;
        this.generateHighlights(model);
        this.generateHighlightsForSPD(model);
        window.dispatchEvent(new CustomEvent('sim-ram-status', { detail: { hasRam: true } }));
      } else if (category === 'Memory Chip' || category === 'SPD') {
        model.position.copy(this.activeSlot.position);
        model.rotation.copy(this.activeSlot.rotation);
        this.mainRamModel.add(model);
        model.userData = { ...model.userData, ...dbMetadata, isComponent: true, attachedTo: this.activeSlot };
        this.placedComponents.push(model);
        this.activeSlot.visible = false;
        this.deselectHighlight();

        if (window.recordAction) {
          window.recordAction({ type: 'ADD', component: model, parent: this.mainRamModel });
        }
      } else {
        model.userData = { ...model.userData, ...dbMetadata };
        this.scene.add(model);
        this.placedComponents.push(model);
      }
      console.log(`✓ Spawned and Metadata Attached: ${category}`);
      return model;
    } catch (error) {
      console.error("Failed to spawn model", error);
    }
  }

  _loadGLTF(path) {
    return new Promise((resolve, reject) => {
      if (this.loadedModels.has(path)) { resolve(this.loadedModels.get(path).clone()); return; }
      this.gltfLoader.load(path, (gltf) => {
        gltf.scene.traverse((child) => { if (child.isMesh) { child.castShadow = true; child.receiveShadow = true; } });
        this.loadedModels.set(path, gltf.scene.clone());
        resolve(gltf.scene);
      }, undefined, reject);
    });
  }

  removeLastComponent() {
    if (this.placedComponents.length === 0) return;
    const lastComp = this.placedComponents.pop();
    if (lastComp.userData.attachedTo) lastComp.userData.attachedTo.visible = true;
    if (lastComp.parent) lastComp.parent.remove(lastComp);
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
}

export { SimulatorRenderer };
window.simulator = new SimulatorRenderer('forge-canvas');