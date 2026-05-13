document.addEventListener('DOMContentLoaded', () => {
  const hamburgerBtn = document.getElementById('hamburger-menu');
  const menuOverlay = document.getElementById('main-menu-overlay');
  const closeMenuBtn = document.getElementById('close-main-menu');
  const overlayBackdrop = document.querySelector('.overlay-backdrop');
  const controlsToggle = document.getElementById('btn-controls-toggle');
  const controlsList = document.getElementById('controls-list');
  const fileInput = document.getElementById('file-input-load');

  const toggleMenu = (forceState) => {
    if (!menuOverlay) return;
    menuOverlay.classList.toggle('hidden', typeof forceState === 'boolean' ? !forceState : undefined);
  };

  hamburgerBtn?.addEventListener('click', () => toggleMenu());
  closeMenuBtn?.addEventListener('click', () => toggleMenu(false));
  overlayBackdrop?.addEventListener('click', () => toggleMenu(false));

  controlsToggle?.addEventListener('click', () => {
    controlsList?.classList.toggle('hidden');
    controlsToggle.classList.toggle('active');
  });

  const dispatcher = (id, eventName) => {
    document.getElementById(id)?.addEventListener('click', () => {
      window.dispatchEvent(new CustomEvent(eventName));
      toggleMenu(false);
    });
  };

  dispatcher('menu-save', 'forge-save-project');
  dispatcher('menu-new', 'forge-new-project');

  window.addEventListener('forge-toggle-grid', () => {
    if (window.simulator?.gridHelper) {
      window.simulator.gridHelper.visible = !window.simulator.gridHelper.visible;
      if (window.simulator.axisHelper) window.simulator.axisHelper.visible = !window.simulator.axisHelper.visible;
    }
  });

  // Toolbar bindings (delegated to sandbox.js functions)
  document.getElementById('btn-undo')?.addEventListener('click', window.undo || (() => window.dispatchEvent(new CustomEvent('forge-undo'))));
  document.getElementById('btn-redo')?.addEventListener('click', window.redo || (() => window.dispatchEvent(new CustomEvent('forge-redo'))));
  document.getElementById('btn-delete')?.addEventListener('click', window.deleteSelected || (() => window.dispatchEvent(new CustomEvent('forge-delete'))));

  document.getElementById('menu-home')?.addEventListener('click', () => { window.location.href = '/index.html'; });
  document.getElementById('menu-signout')?.addEventListener('click', () => {
    window.showNotification?.("Signed Out Successfully");
    toggleMenu(false);
  });

  document.getElementById('menu-load')?.addEventListener('click', () => {
    fileInput?.click();
    toggleMenu(false);
  });

  fileInput?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const jsonData = JSON.parse(event.target.result);
        window.dispatchEvent(new CustomEvent('forge-load-project', { detail: jsonData }));
      } catch (err) {
        console.error("Invalid ForgeTech JSON file", err);
        window.showNotification?.("Error: Invalid project file.");
      }
    };
    reader.readAsText(file);
    fileInput.value = '';
  });
  // --- THEME TOGGLE LOGIC ---
  const themeToggle = document.getElementById('theme-toggle');
  const savedTheme = localStorage.getItem('forgetech-theme') || 'dark';

  // Apply saved theme on load
  document.documentElement.setAttribute('data-theme', savedTheme);
  if (savedTheme === 'light') {
    themeToggle.checked = true;
    document.body.setAttribute('data-theme', 'light');
  }

  // Update 3D scene background to match theme
  function syncSceneTheme(isLight) {
    const sim = window.simulator;
    if (sim?.scene) {
      // Make renderer background transparent so CSS shows through
      sim.renderer.setClearColor(0x000000, 0);
      sim.scene.background = null;
    }
  }
  syncSceneTheme(savedTheme === 'light');

  // Handle toggle click
  themeToggle?.addEventListener('change', (e) => {
    const newTheme = e.target.checked ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    document.body.setAttribute('data-theme', newTheme);
    localStorage.setItem('forgetech-theme', newTheme);
    syncSceneTheme(e.target.checked);
  });
});