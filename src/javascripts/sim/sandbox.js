document.addEventListener('DOMContentLoaded', () => {
  const warningToast = document.getElementById('warning-toast');

  window.addEventListener('sim-selection-changed', (e) => updateButtonStates(e.detail.category));
  window.addEventListener('sim-ram-status', (e) => validateRamButton(e.detail.hasRam));

  function updateButtonStates(activeCategory) {
    document.querySelectorAll('.comp-card').forEach(card => {
      if (card.dataset.category === 'Dummy RAM') return;
      const match = card.dataset.category === activeCategory;
      card.style.opacity = activeCategory ? (match ? '1' : '0.4') : '0.4';
      card.style.pointerEvents = (activeCategory && match) ? 'auto' : 'none';
    });
  }

  function validateRamButton(isPlaced) {
    document.querySelectorAll('.comp-card').forEach(card => {
      if (card.dataset.category === 'Dummy RAM') {
        card.style.opacity = isPlaced ? '0.4' : '1';
        card.style.pointerEvents = isPlaced ? 'none' : 'auto';
      }
    });
  }

  setTimeout(() => updateButtonStates(null), 1000);

  // Panel Toggles (Consolidated)
  const testRamPanel = document.getElementById('test-ram-panel');
  const testRamTrigger = document.getElementById('test-ram-trigger');
  const closeTestPanel = document.getElementById('close-test-panel');
  const complibPanel = document.getElementById('complib-popup');
  const complibTrigger = document.getElementById('complib-trigger');
  const isMobile = () => window.innerWidth <= 768;

  const togglePanel = (panel, trigger, otherTrigger) => {
    panel?.classList.add('open');
    trigger?.classList.add('hidden');
    if (isMobile() && otherTrigger) otherTrigger.classList.add('hidden');
    if (panel === testRamPanel) window.dispatchEvent(new Event('sim-refresh-diagnostics'));
  };

  testRamTrigger?.addEventListener('click', () => togglePanel(testRamPanel, testRamTrigger, complibTrigger));
  complibTrigger?.addEventListener('click', () => togglePanel(complibPanel, complibTrigger, testRamTrigger));

  const closeAllPanels = () => {
    testRamPanel?.classList.remove('open');
    complibPanel?.classList.remove('open');
    testRamTrigger?.classList.remove('hidden');
    complibTrigger?.classList.remove('hidden');
  };

  closeTestPanel?.addEventListener('click', closeAllPanels);
  document.querySelectorAll('.close-btn').forEach(btn => btn.addEventListener('click', closeAllPanels));

  // Notifications
  window.showNotification = function(message, type = 'warning') {
    if (!warningToast) return;
    warningToast.querySelector('.warning-text').textContent = message;
    warningToast.className = `notification-overlay show ${type}`;
    setTimeout(() => warningToast.classList.remove('show'), 5000);
  };
  document.querySelector('#warning-toast .dismiss-btn')?.addEventListener('click', () => warningToast?.classList.remove('show'));

  // Undo / Redo
  let undoStack = [];
  let redoStack = [];
  const MAX_HISTORY = 30;

  window.recordAction = function(action) {
    undoStack.push(action);
    redoStack = [];
    if (undoStack.length > MAX_HISTORY) undoStack.shift();
  };

  function undo() {
    if (undoStack.length === 0) return window.showNotification('Nothing to undo');
    const action = undoStack.pop();
    redoStack.push(action);
    const sim = window.simulator;
    if (action.type === 'ADD') {
      if (action.component.parent) action.component.parent.remove(action.component);
      if (action.component.userData.attachedTo) action.component.userData.attachedTo.visible = true;
      sim.placedComponents = sim.placedComponents.filter(c => c !== action.component);
      sim.deselectComponent();
    } else if (action.type === 'DELETE') {
      if (action.parent) action.parent.add(action.component);
      if (action.component.userData.attachedTo) action.component.userData.attachedTo.visible = false;
      sim.placedComponents.push(action.component);
    }
    window.showNotification('↩ Undo');
  }

  function redo() {
    if (redoStack.length === 0) return window.showNotification('Nothing to redo');
    const action = redoStack.pop();
    undoStack.push(action);
    const sim = window.simulator;
    if (action.type === 'ADD') {
      if (action.parent) action.parent.add(action.component);
      if (action.component.userData.attachedTo) action.component.userData.attachedTo.visible = false;
      sim.placedComponents.push(action.component);
    } else if (action.type === 'DELETE') {
      if (action.component.parent) action.component.parent.remove(action.component);
      if (action.component.userData.attachedTo) action.component.userData.attachedTo.visible = true;
      sim.placedComponents = sim.placedComponents.filter(c => c !== action.component);
      sim.deselectComponent();
    }
    window.showNotification('↪ Redo');
  }

  function deleteSelected() {
    const sim = window.simulator;
    if (!sim || !sim.activeComponent) {
      return window.showNotification("Select a part to delete");
    }
    const comp = sim.activeComponent;
    window.recordAction({ type: 'DELETE', component: comp, parent: comp.parent });
    if (comp.parent) comp.parent.remove(comp);
    if (comp.userData?.attachedTo) comp.userData.attachedTo.visible = true;
    sim.placedComponents = sim.placedComponents.filter(c => c !== comp);
    sim.deselectComponent();
    window.showNotification('Part Deleted');
  }

  document.getElementById('btn-undo')?.addEventListener('click', undo);
  document.getElementById('btn-redo')?.addEventListener('click', redo);
  document.getElementById('btn-delete')?.addEventListener('click', deleteSelected);

  // Keyboard Shortcuts
  window.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
      e.preventDefault();
      window.dispatchEvent(new CustomEvent('forge-save-project'));
    } else if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'z') {
      e.preventDefault(); redo();
    } else if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'z') {
      e.preventDefault(); undo();
    } else if (e.shiftKey && e.key.toLowerCase() === 't') {
      e.preventDefault();
      window.dispatchEvent(new CustomEvent('forge-toggle-grid'));
    } else if (e.key === 'Backspace' || e.key === 'Delete') {
      e.preventDefault(); deleteSelected();
    }
  });

  // Event Listeners
  window.addEventListener('forge-save-project', () => {
    const projectState = { version: "1.0", date: new Date().toISOString(), components: undoStack.filter(a => a.type === 'ADD').map(a => a.component.userData) };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(projectState));
    const anchor = document.createElement('a');
    anchor.setAttribute("href", dataStr);
    anchor.setAttribute("download", "Forgetech_Build.json");
    document.body.appendChild(anchor); anchor.click(); anchor.remove();
    window.showNotification("Project Saved Locally");
  });

  window.addEventListener('forge-load-project', (e) => {
    console.log("Loading project data...", e.detail);
    window.showNotification("Project Loaded Successfully");
  });

  window.addEventListener('forge-new-project', () => window.open(window.location.href, '_blank'));
});

const VITE_SUPABASE_URL = 'https://ugikcueacvxshchdwzgy.supabase.co';
const VITE_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVnaWtjdWVhY3Z4c2hjaGR3emd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzNDMwMDYsImV4cCI6MjA5MTkxOTAwNn0.y2E_GWhVTBtShcbMXYUFX1pcNE0xDYiX2nHMEZ8J5Fg';

// Initialize Supabase client
// The CDN script exposes the global 'supabase' object with createClient
// We must name our instance something else (e.g. supabaseClient) so we don't clobber it.
let supabaseClient = null;

if (typeof supabase !== 'undefined' && supabase.createClient) {
  supabaseClient = supabase.createClient(VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY);
  console.log('✅ Supabase client initialized');
} else {
  console.error('❌ Supabase library failed to load from CDN');
}

document.addEventListener('DOMContentLoaded', () => {
    // 1. Authentication Guard & Initialization
    window.addEventListener('load', async () => {
        // Check local storage for the SupabaseClient token
        const { data: { session } } = await supabaseClient.auth.getSession();
        
        if (!session) {
            // If no token exists, kick them back to the login page immediately
            window.location.href = '/pages/formAccount.html';
            return;
        }

        // Save the user data globally for our views to use
        currentUser = session.user;

        // Start the internal router
        appRouter();
    });
  });