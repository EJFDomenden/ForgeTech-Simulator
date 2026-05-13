# Renderer.js Updates - Highlight & Mounting System

## 🎯 Overview
The `renderer.js` has been updated to:
1. Load actual 3D models from Supabase (instead of geometric primitives)
2. Lay the RAM model flat on the grid
3. Generate 16 interactive highlight boxes for Memory Chip mounting
4. Implement click-based selection system with visual feedback

---

## ✨ Key Changes

### 1. **Removed**: `spawnDummyHardware()`
The old geometric primitive-based RAM creation has been removed.

### 2. **Added**: `loadDummyRAM(modelPath)`
Loads actual .glb/.gltf models from Supabase and automatically:
- Rotates the model to lay flat on the grid (`rotation.x = -Math.PI / 2`)
- Positions it slightly above the grid (`position.y = 0.6`)
- Generates 16 highlight boxes at Memory Chip mounting points

**Usage:**
```javascript
const modelPath = 'https://your-supabase-url/storage/v1/object/public/models/dummy-ram.glb';
window.simulator.loadDummyRAM(modelPath);
```

### 3. **Added**: Highlight Generation System
Creates 16 clickable highlight boxes (8 front, 8 back) with:
- **Dimensions**: 9.85mm × 13.0mm × 0.6mm (universal for Memory Chips)
- **Positioning**: Spread across the 133mm RAM length
- **Metadata**: Each highlight stores:
  - `category: 'Memory Chip'` - For validation
  - `side: 'front'` or `'back'` - Position tracking
  - `index: 0-7` - Slot number
  - `isOccupied: false` - Mount status
  - `mountedComponent: null` - Reference to mounted model

### 4. **Added**: Selection System
Click on any highlight to select it:
- **Visual Feedback**: 
  - Default: Green translucent (`#5eff9e`, 30% opacity)
  - Selected: Blue glowing (`#0057ff`, 50% opacity)
- **Events**: Dispatches custom events:
  - `highlightSelected` - When a highlight is clicked
  - `highlightDeselected` - When clicking empty space or another highlight

### 5. **Added**: Component Mounting Functions
```javascript
// Toggle highlight visibility when mounting/unmounting
simulator.toggleHighlight(highlight, isOccupied, componentModel);

// Get currently selected highlight
const active = simulator.getActiveHighlight(); // Returns THREE.Mesh or null

// Get all highlights
const allHighlights = simulator.getAllHighlights(); // Returns Array<THREE.Mesh>

// Manual selection/deselection
simulator.selectHighlight(highlightMesh);
simulator.deselectHighlight();
```

---

## 🔧 Setup Instructions

### Step 1: Update the Model Path
In `renderer.js` at the bottom, update this line:
```javascript
const DUMMY_RAM_MODEL_PATH = '/models/dummy-ram.glb'; // ← UPDATE THIS
```

Replace with your actual Supabase URL:
```javascript
const DUMMY_RAM_MODEL_PATH = 'https://yoursupabseproject.supabase.co/storage/v1/object/public/models/dummy-ram.glb';
```

### Step 2: Ensure Model Orientation
If your model doesn't lay flat after loading, adjust the rotation in `loadDummyRAM()`:
```javascript
// Try different rotations if needed:
ramModel.rotation.x = -Math.PI / 2; // Current: Lay flat
// ramModel.rotation.z = Math.PI / 2; // Alternative orientation
```

### Step 3: Test Highlight Positions
The highlights are positioned based on these constants:
```javascript
const START_X = -45;     // Starting position
const SPACING_X = 13;    // Distance between chips
const FRONT_Z = 1.0;     // Front side offset
const BACK_Z = -1.0;     // Back side offset
const Y_POSITION = 2;    // Height above PCB
```

If highlights don't align with your model, adjust these values.

---

## 🎮 How to Use (Integration with UI)

### Listen for Selection Events
In your `sandbox.js` or `complib.js`:

```javascript
// Enable the component card buttons when a highlight is selected
window.addEventListener('highlightSelected', (event) => {
    const { highlight, category } = event.detail;
    
    // Enable only buttons matching the category
    document.querySelectorAll('.comp-card').forEach(card => {
        if (card.dataset.category === category) {
            card.classList.remove('disabled');
            card.querySelector('button').disabled = false;
        }
    });
    
    console.log(`Slot selected: ${highlight.name} (${category})`);
});

// Disable buttons when deselected
window.addEventListener('highlightDeselected', () => {
    document.querySelectorAll('.comp-card button').forEach(btn => {
        btn.disabled = true;
    });
});
```

### Mount a Component
When a component card is clicked:

```javascript
async function mountComponent(componentModelPath) {
    // 1. Get the active highlight
    const highlight = window.simulator.getActiveHighlight();
    
    if (!highlight) {
        console.error('No highlight selected!');
        return;
    }
    
    // 2. Validate category match
    if (componentCategory !== highlight.userData.category) {
        console.error('Category mismatch!');
        return;
    }
    
    // 3. Load the component model at the highlight's position
    const position = highlight.position;
    const component = await window.simulator.loadModel(
        componentModelPath,
        position.x,
        position.y,
        position.z,
        1 // scale
    );
    
    // 4. Hide the highlight
    window.simulator.toggleHighlight(highlight, true, component);
    
    // 5. Deselect after mounting
    window.simulator.deselectHighlight();
}
```

---

## 🧪 Testing the System

### Test 1: Load the RAM
Open your browser console and check for:
```
Loading Dummy RAM model...
✓ Model loaded: /models/dummy-ram.glb
✓ Generated 16 Memory Chip highlights
✓ Dummy RAM loaded and highlights generated
```

### Test 2: Click Highlights
Click on the green translucent boxes. You should see:
- The box turns blue and glows
- Console: `✓ Highlight selected: highlight_front_0`
- Event fires: Check with `window.addEventListener('highlightSelected', e => console.log(e))`

### Test 3: Click Empty Space
Click anywhere else in the scene:
- The selected highlight returns to green
- Console: `✓ Highlight deselected: highlight_front_0`

### Test 4: Check Active Highlight
```javascript
window.simulator.getActiveHighlight(); // Should return the mesh or null
```

---

## 📋 Next Steps for Full Integration

### In `sandbox.js`:
1. Listen for `highlightSelected` / `highlightDeselected` events
2. Enable/disable component card buttons based on selection
3. Implement `mountComponent()` function
4. Add keyboard shortcuts (Ctrl+D to deselect)
5. Add delete functionality (Backspace/Delete to unmount)

### In `complib.js`:
1. Add validation before mounting:
```javascript
// Universal Restriction Check
function canMount(componentCategory, highlight) {
    return componentCategory === highlight.userData.category && 
           !highlight.userData.isOccupied;
}
```

2. Update card click handler to call `mountComponent()`

### Additional Features to Add:
- Undo/Redo stack (save mount/unmount operations)
- Highlight hover effects (subtle glow on mouseover)
- Component removal (click mounted component + Delete key)
- Visual indicators for occupied slots (red outline)
- Auto-save mounted components to localStorage

---

## 🐛 Troubleshooting

### Model doesn't appear
- Check the model path is correct
- Open Network tab in DevTools to see if model loads
- Check console for CORS errors

### Model appears but is rotated wrong
- Adjust `ramModel.rotation.x/y/z` in `loadDummyRAM()`

### Highlights don't align with model
- Adjust position constants in `generateMemoryChipHighlights()`
- Check if your model's origin/pivot is centered

### Clicking doesn't work
- Check if `setupRaycasting()` is called in `init()`
- Verify the canvas element ID is `forge-canvas`
- Check console for raycasting errors

### Highlights are invisible
- Check if materials are created correctly
- Verify `opacity` and `transparent` are set
- Try increasing `emissiveIntensity`

---

## 📊 Technical Specs

### Highlight Dimensions
- Width: 9.85mm
- Height: 13.0mm  
- Depth: 0.6mm

### RAM Dimensions
- Length: 133.350mm
- Height: 31.250mm
- PCB Thickness: 1.2mm

### Highlight Spacing
- Start X: -45mm
- Spacing: 13mm between each chip
- Front Z: +1.0mm
- Back Z: -1.0mm
- Y Position: 2mm above PCB

---

## 🎨 Color Scheme
- **Default Highlight**: `#5eff9e` (green accent, 30% opacity)
- **Selected Highlight**: `#0057ff` (blue primary, 50% opacity)
- **Emissive**: Matches base color at 20-50% intensity

---

## ✅ Checklist

- [x] Load actual models from Supabase
- [x] Lay model flat on grid
- [x] Generate 16 highlights with proper spacing
- [x] Implement click-based selection
- [x] Visual feedback for selection
- [x] Category tagging for validation
- [x] Occupied state tracking
- [x] Custom event dispatching
- [ ] UI button activation (sandbox.js)
- [ ] Component mounting logic (complib.js)
- [ ] Delete/unmount functionality
- [ ] Undo/redo system

---

**Updated**: 2024
**Version**: 2.0
**Purpose**: Renderer focus - Visual management only
