import { fetchComponentsByCategory } from '/src/database/db-complib.js';

window.addEventListener('DOMContentLoaded', () => {
  const gridContainer = document.getElementById('complib-grid');
  const tabButtons = document.querySelectorAll('.tab-btn');
  const mobileSelect = document.getElementById('category-select');

  async function loadCategory(category) {
    gridContainer.innerHTML = '<p style="color: white;">Loading hardware...</p>';
    const components = await fetchComponentsByCategory(category);
    gridContainer.innerHTML = '';

    if (components.length === 0) {
      gridContainer.innerHTML = '<p style="color: gray;">No components found in this category.</p>';
      return;
    }

    components.forEach(comp => {
      const card = document.createElement('div');
      card.className = 'comp-card';
      card.dataset.modelPath = comp.model_file_path;
      card.dataset.category = comp.category;

      let specHtml = '<div class="spec-list">';
      if (comp.specs && Object.keys(comp.specs).length > 0) {
        for (const [key, value] of Object.entries(comp.specs)) {
          specHtml += `<div class="spec-item"><span class="spec-key">${key}</span><span class="spec-val">${value}</span></div>`;
        }
      } else {
        specHtml += '<div class="spec-item"><span class="spec-key">Specs</span><span class="spec-val">N/A</span></div>';
      }
      specHtml += '</div>';

      card.innerHTML = `
        <div class="comp-brand">${comp.brand || 'Generic'}</div>
        <h4 class="comp-name">${comp.name}</h4>
        <div class="comp-category-tag">${comp.category}</div>
        <div class="comp-specs">${specHtml}</div>
      `;

      card.addEventListener('click', () => {
        if (window.simulator) window.simulator.spawnModel(comp.model_file_path, comp);
      });
      gridContainer.appendChild(card);
    });
  }

  tabButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelector('.tab-btn.active')?.classList.remove('active');
      e.target.classList.add('active');
      const category = e.target.getAttribute('data-category');
      loadCategory(category);
      if (mobileSelect) mobileSelect.value = category;
    });
  });

  mobileSelect?.addEventListener('change', (e) => {
    const category = e.target.value;
    loadCategory(category);
    document.querySelector('.tab-btn.active')?.classList.remove('active');
    document.querySelector(`.tab-btn[data-category="${category}"]`)?.classList.add('active');
  });

  loadCategory('Dummy RAM');
});