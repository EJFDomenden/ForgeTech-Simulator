document.addEventListener('DOMContentLoaded', () => {
  const runBtn = document.getElementById('run-test-btn');
  const resultsContainer = document.getElementById('test-results');
  if (!runBtn || !resultsContainer) return;

  runBtn.addEventListener('click', runDiagnostic);

  function runDiagnostic() {
    const sim = window.simulator;
    if (!sim || !sim.placedComponents) {
      return renderResults({ error: 'Simulator engine not initialized.' });
    }

    const placed = sim.placedComponents || [];
    const components = { spds: [], chips: [], others: [] };
    placed.forEach(comp => {
      const cat = (comp.userData?.category || '').toLowerCase();
      if (cat.includes('spd')) components.spds.push(comp);
      else if (cat.includes('memory chip')) components.chips.push(comp);
      else components.others.push(comp);
    });

    const hasSPD = components.spds.length > 0;
    const chipCount = components.chips.length;
    const speeds = components.chips.map(c => extractNumber(c.userData?.specs?.speed || c.userData?.specs?.mhz || 3200));
    const minSpeed = speeds.length > 0 ? Math.min(...speeds) : 0;
    const mixedSpeeds = [...new Set(speeds)].length > 1;
    const caps = components.chips.map(c => extractNumber(c.userData?.specs?.capacityGb || c.userData?.specs?.size || 1));
    const totalCapacityGb = caps.reduce((sum, val) => sum + val, 0);
    const gens = components.chips.map(c => parseGeneration(c));
    const uniqueGens = [...new Set(gens)];
    const mixedGen = uniqueGens.length > 1 || (gens.length === 0 && chipCount > 0);
    const primaryGen = uniqueGens[0] || 'Unknown';
    const brands = components.chips.map(c => c.userData?.brand || 'Generic');
    const mixedBrands = [...new Set(brands)].length > 1;

    let criticalScore = 0;
    if (hasSPD) criticalScore += 50;
    if (chipCount >= 4) criticalScore += 50;

    let capacityFactor = 0;
    if (chipCount === 0) capacityFactor = 0;
    else if (chipCount < 4) capacityFactor = 15;
    else if (chipCount < 8) capacityFactor = 40;
    else if (chipCount < 12) capacityFactor = 65;
    else if (chipCount < 16) capacityFactor = 85;
    else capacityFactor = 100;

    let compatibilityScore = mixedGen ? 0 : 100;
    if (!mixedGen && !mixedBrands && chipCount > 0) compatibilityScore = 110;

    let health = chipCount === 0 ? 0 : Math.round((criticalScore + capacityFactor + compatibilityScore) / 3);

    let status = 'fail', statusMsg = '';
    if (!hasSPD) statusMsg = '✗ No SPD - System cannot detect module';
    else if (mixedGen) statusMsg = `✗ Gen mismatch (${uniqueGens.join('/')}) - Voltage incompatibility`;
    else if (chipCount < 4) statusMsg = `✗ Only ${chipCount} chips - Minimum 4 required for POST`;
    else if (mixedSpeeds || chipCount < 16) {
      status = 'warn';
      statusMsg = mixedSpeeds ? '⚠ Mixed speeds - Downclocking to slowest chip' : '⚠ Partially populated - Reduced capacity';
    } else {
      status = 'pass';
      statusMsg = '✓ Fully Functional & Optimized';
    }

    renderResults({ health, status, statusMsg, chipCount, totalCapacityGb, minSpeed, mixedSpeeds, hasSPD, primaryGen, mixedBrands, components });
  }

  function extractNumber(val) {
    if (typeof val === 'number') return val;
    const match = String(val).match(/\d+/);
    return match ? parseInt(match[0], 10) : 0;
  }

  function parseGeneration(comp) {
    const name = (comp.userData?.name || '').toUpperCase();
    const specs = JSON.stringify(comp.userData?.specs || '').toUpperCase();
    if (name.includes('DDR5') || specs.includes('DDR5')) return 'DDR5';
    if (name.includes('DDR3') || specs.includes('DDR3')) return 'DDR3';
    return 'DDR4';
  }

  function renderResults(data) {
    if (data.error) {
      resultsContainer.innerHTML = `<div class="placeholder-msg">${data.error}</div>`;
      return;
    }
    const { health, status, statusMsg, chipCount, totalCapacityGb, minSpeed, mixedSpeeds, hasSPD, primaryGen, mixedBrands, components } = data;
    const healthColor = health >= 80 ? 'var(--clr-accent-a0)' : health >= 50 ? 'var(--clr-warning-a0)' : 'var(--clr-danger-a0)';
    const rankType = chipCount <= 8 ? 'Single-Rank' : chipCount > 8 ? 'Dual-Rank' : 'N/A';
    const speedNote = mixedSpeeds ? `<span class="note">⚠ Mixed speeds detected - runs at ${minSpeed}MHz</span>` : '';

    resultsContainer.innerHTML = `
      <div class="health-score">
        <div class="score-val" style="color:${healthColor}">${health}%</div>
        <div class="health-bar"><div class="health-fill" style="width:${health}%;background:${healthColor}"></div></div>
        <div class="health-label">Board Health</div>
      </div>
      <div class="status-banner ${status}">${statusMsg}</div>
      <div class="diag-section">
        <h3>Estimated Specs</h3>
        <div class="diag-row"><span class="label">Capacity</span><span class="val">${totalCapacityGb}GB</span></div>
        <div class="diag-row"><span class="label">Speed</span><span class="val">${minSpeed}MHz ${speedNote}</span></div>
        <div class="diag-row"><span class="label">Type</span><span class="val">${primaryGen} ${rankType}</span></div>
      </div>
      <div class="diag-section">
        <h3>Critical Check (DDR4)</h3>
        <div class="diag-row"><span class="label">SPD EEPROM</span><span class="val"><span class="check-icon">${hasSPD ? '✅' : '❌'}</span> ${hasSPD ? 'Detected' : 'Missing'}</span></div>
        <div class="diag-row"><span class="label">Memory Chips</span><span class="val">${chipCount}/16 slots</span></div>
        <div class="diag-row"><span class="label">PMIC</span><span class="val" style="color:var(--clr-surface-a40);font-style:italic;">N/A (Motherboard Supplied)</span></div>
      </div>
      <div class="diag-section">
        <h3>Compatibility</h3>
        <div class="diag-row"><span class="label">Generation</span><span class="val" style="color:${primaryGen === 'DDR4' ? 'var(--clr-accent-a0)' : 'var(--clr-danger-a0)'}">${primaryGen === 'DDR4' ? '✅ Match' : '❌ Mismatch'}</span></div>
        <div class="diag-row"><span class="label">Brand</span><span class="val" style="color:${mixedBrands ? 'var(--clr-warning-a0)' : 'var(--clr-accent-a0)'}">${mixedBrands ? '⚠ Mixed' : '✅ Uniform (+5% Bonus)'}</span></div>
      </div>
      <div class="diag-section">
        <h3>Parts Used</h3>
        <div class="diag-row"><span class="label">SPD</span><span class="val">${components.spds.length > 0 ? 'Yes' : 'None'}</span></div>
        <div class="diag-row"><span class="label">Chips</span><span class="val">${components.chips.map(c => c.userData?.brand || 'Generic').slice(0,3).join(', ')}${components.chips.length > 3 ? '...' : ''}</span></div>
      </div>
    `;
  }
});