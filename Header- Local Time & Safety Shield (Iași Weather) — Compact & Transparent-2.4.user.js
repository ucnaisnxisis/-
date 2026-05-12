// ==UserScript==
// @name         Header: Local Time & Safety Shield (Iași Weather) — Compact & Transparent
// @namespace    http://tampermonkey.net/
// @version      2.4
// @description  Afișează data/ora, emoji vreme pentru Iași și un scut de stare site (safe/virus/adult/anime). Toate elementele sunt centrate sus și au fundal transparent. Configurare globală în localStorage (meniul ⚙️).
// @author       You
// @match        *://*/*
// @grant        GM_addStyle
// @grant        GM_setValue
// @grant        GM_getValue
// @run-at       document-end
// ==/UserScript==

(function() {
  'use strict';

  // -------------------------
  // Configurare implicită
  // -------------------------
  const DEFAULTS = {
    timeFormatOptions: {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    },
    locale: 'ro-RO',
    iasiQuery: 'Iași,RO',
    weatherUpdateIntervalMs: 10 * 60 * 1000,
    clockUpdateIntervalMs: 1000,
    sizeScale: 2.5,
    visible: { clock: true, weather: true, shield: true },
    categories: {
      safe: { id: 'safe', label: 'sigur', color: '#7b61ff', emoji: '✔', keywords: [] },
      virus: { id: 'virus', label: 'periculos', color: '#e02424', emoji: '⚠️', keywords: ['malicious', 'phishing'] },
      adult: { id: 'adult', label: 'adult', color: '#ff0000', emoji: '🔞', keywords: ['porn', 'sex', 'adult', 'xxx', '18+'] },
      anime: { id: 'anime', label: 'anime', color: '#ff66b2', emoji: '☮️', keywords: ['anime', 'manga', 'fanservice', 'otaku', 'subbed', 'raw'] }
    },
    knownMalicious: ['malicious.example', 'badsite.test', 'phishing.example'],
    weatherCacheTtl: 9 * 60 * 1000,
    positions: { headerBox: { x: '50%', y: 0 } }
  };

  // -------------------------
  // Storage helper
  // -------------------------
  const LS_KEY = 'tm_header_advanced_v2';

  function loadSettings() {
    try {
      const raw = localStorage.getItem(LS_KEY) || GM_getValue(LS_KEY);
      if (!raw) return JSON.parse(JSON.stringify(DEFAULTS));
      const parsed = JSON.parse(raw);
      return deepMerge(JSON.parse(JSON.stringify(DEFAULTS)), parsed);
    } catch (e) {
      return JSON.parse(JSON.stringify(DEFAULTS));
    }
  }

  function saveSettings(s) {
    localStorage.setItem(LS_KEY, JSON.stringify(s));
    GM_setValue(LS_KEY, JSON.stringify(s));
  }

  function deepMerge(base, patch) {
    for (const k in patch) {
      if (patch[k] === null || patch[k] === undefined) continue;
      if (Array.isArray(patch[k])) {
        base[k] = [...(base[k] || []), ...patch[k]];
      } else if (patch[k] && typeof patch[k] === 'object') {
        base[k] = deepMerge(base[k] || {}, patch[k]);
      } else {
        base[k] = patch[k];
      }
    }
    return base;
  }

  let settings = loadSettings();

  // -------------------------
  // Create DOM Elements
  // -------------------------
  const headerBox = document.createElement('div');
  headerBox.className = 'tm-header-box';
  headerBox.style.position = 'fixed';
  headerBox.style.zIndex = '2147483647';

  const panel = document.createElement('div');
  panel.className = 'tm-config-panel';
  panel.style.display = 'none';
  panel.style.position = 'fixed';
  panel.style.top = '50px';
  panel.style.left = '50%';
  panel.style.transform = 'translateX(-50%)';
  panel.style.background = 'rgba(0,0,0,0.8)';
  panel.style.color = '#fff';
  panel.style.padding = '12px';
  panel.style.borderRadius = '8px';
  panel.style.zIndex = '2147483647';
  panel.style.maxWidth = '400px';
  panel.style.maxHeight = '80vh';
  panel.style.overflow = 'auto';

  // Clock element
  const clock = document.createElement('div');
  clock.className = 'tm-clock';
  clock.id = 'tm-local-clock';
  clock.textContent = '--:--';
  clock.setAttribute('aria-label', 'Ora locală');

  // Weather element
  const weatherBox = document.createElement('div');
  weatherBox.className = 'tm-weather';
  weatherBox.id = 'tm-iasi-weather';
  weatherBox.textContent = '☀️ 20°C';

  // Shield element
  const shield = document.createElement('div');
  shield.className = 'tm-shield';
  shield.id = 'tm-site-shield';
  shield.textContent = '🛡️';

  // Gear (settings) element
  const gear = document.createElement('div');
  gear.className = 'tm-gear';
  gear.title = 'Setări';
  gear.textContent = '⚙️';
  gear.setAttribute('role', 'button');
  gear.setAttribute('tabindex', '0');

  // Group for all elements
  const group = document.createElement('div');
  group.className = 'tm-group';
  group.appendChild(clock);
  group.appendChild(weatherBox);
  group.appendChild(shield);
  group.appendChild(gear);

  // Append group to headerBox
  headerBox.appendChild(group);

  // -------------------------
  // Styles
  // -------------------------
  GM_addStyle(`
    .tm-header-box {
      position: fixed;
      z-index: 2147483647;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      white-space: nowrap;
      background: transparent;
      padding: 0;
      gap: 0;
    }

    .tm-group {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      white-space: nowrap;
      background: transparent;
      padding: 2px;
      gap: 4px;
      border-radius: 4px;
      border: none;
      box-shadow: none;
    }

    .tm-group > div {
      padding: 2px 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: ${16 * settings.sizeScale}px;
      line-height: 1;
      margin: 0;
      border: none;
      background: transparent;
      color: #fff;
    }

    .tm-clock, .tm-weather, .tm-shield, .tm-gear {
      background: transparent !important;
      box-shadow: none !important;
      border: none !important;
    }

    .tm-clock {
      font-weight: bold;
    }

    .tm-weather {
      font-size: ${16 * settings.sizeScale}px;
    }

    .tm-shield {
      font-size: ${16 * settings.sizeScale}px;
    }

    .tm-gear {
      cursor: pointer;
      font-size: ${16 * settings.sizeScale}px;
    }

    /* Config Panel Styles */
    .tm-config-panel {
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      font-size: ${14 * settings.sizeScale}px;
    }
    .tm-config-row {
      display: flex;
      gap: 8px;
      margin: 8px 0;
      align-items: center;
      flex-wrap: wrap;
    }
    .tm-config-button {
      background: #444;
      color: #fff;
      border: none;
      border-radius: 4px;
      padding: 4px 8px;
      cursor: pointer;
      font-size: ${12 * settings.sizeScale}px;
    }
    .tm-config-button:hover {
      background: #555;
    }
    .tm-config-input {
      background: #333;
      color: #fff;
      border: 1px solid #555;
      border-radius: 4px;
      padding: 4px;
      font-size: ${12 * settings.sizeScale}px;
    }
    .tm-cat-list {
      margin: 8px 0;
    }
    .tm-cat-item {
      display: flex;
      justify-content: space-between;
      padding: 6px;
      background: rgba(255,255,255,0.05);
      border-radius: 4px;
      margin: 4px 0;
    }
    .tm-small-muted {
      color: #aaa;
      font-size: ${12 * settings.sizeScale}px;
    }
    .tm-small-muted2 {
      color: #888;
      font-size: ${10 * settings.sizeScale}px;
    }
  `);

  // -------------------------
  // Attach Nodes to DOM
  // -------------------------
  function attachNodes() {
    if (!document.body) return;
    if (!document.body.contains(headerBox)) document.body.appendChild(headerBox);
    if (!document.body.contains(panel)) document.body.appendChild(panel);
  }
  attachNodes();

  // Accessibility
  headerBox.setAttribute('role', 'status');
  clock.setAttribute('aria-label', 'Ora locală');
  shield.setAttribute('aria-label', 'Indicator stare site');
  weatherBox.setAttribute('aria-label', 'Vremea în Iași');

  // -------------------------
  // Clock
  // -------------------------
  function updateClock() {
    const now = new Date();
    const formatted = now.toLocaleString(settings.locale || undefined, settings.timeFormatOptions);
    clock.innerHTML = `<span class="tm-small-muted">⏰ </span><strong>${formatted}</strong>`;
    clock.style.display = settings.visible.clock ? 'flex' : 'none';
  }

  setInterval(updateClock, settings.clockUpdateIntervalMs);
  updateClock();

  // -------------------------
  // Weather (wttr.in + Proxy Public)
  // -------------------------
  let lastWeatherTs = 0;
  async function fetchIasiWeather() {
    if (!settings.visible.weather) {
      weatherBox.style.display = 'none';
      return;
    }
    weatherBox.style.display = 'flex';

    try {
      if (Date.now() - lastWeatherTs < settings.weatherCacheTtl) return;
      lastWeatherTs = Date.now();

      // Listă de proxy-uri publice (fallback)
      const proxies = [
        'https://api.allorigins.win/raw?url=',
        'https://thingproxy.freeboard.io/fetch/',
        'https://api.codetabs.com/v1/proxy/?quest='
      ];

      for (const proxyUrl of proxies) {
        try {
          const targetUrl = encodeURIComponent('https://wttr.in/Iași,RO?format=j1');
          const url = proxyUrl + targetUrl;

          const resp = await fetch(url, {
            headers: {
              'Accept': 'application/json',
            },
          });

          if (!resp.ok) continue;

          const data = await resp.json();
          const currentCondition = data.current_condition?.[0];

          if (!currentCondition) continue;

          const tempC = currentCondition.temp_C;
          const weatherDesc = (currentCondition.weatherDesc?.[0]?.value || '').toLowerCase();

          // Mapare emoji în funcție de descriere
          let emoji = '🌤️';
          if (weatherDesc.includes('sun') || weatherDesc.includes('clear') || weatherDesc.includes('senin')) emoji = '☀️';
          else if (weatherDesc.includes('cloud') || weatherDesc.includes('overcast') || weatherDesc.includes('nori')) emoji = '☁️';
          else if (weatherDesc.includes('rain') || weatherDesc.includes('drizzle') || weatherDesc.includes('ploaie')) emoji = '🌧️';
          else if (weatherDesc.includes('thunder') || weatherDesc.includes('furtună')) emoji = '⛈️';
          else if (weatherDesc.includes('snow') || weatherDesc.includes('sleet') || weatherDesc.includes('zăpadă')) emoji = '❄️';
          else if (weatherDesc.includes('fog') || weatherDesc.includes('mist') || weatherDesc.includes('ceață')) emoji = '🌫️';

          weatherBox.innerHTML = `<span style="font-size:${16 * settings.sizeScale}px">${emoji}</span><span class="tm-small-muted">${tempC}°C</span>`;
          return;
        } catch (e) {
          console.error('Proxy failed:', proxyUrl, e);
        }
      }

      // Dacă toate proxy-urile au eșuat
      throw new Error('All proxies failed');
    } catch (e) {
      console.error('Weather fetch failed:', e);
      weatherBox.textContent = '⚠️ Vreme indisponibilă';
    }
  }

  setInterval(fetchIasiWeather, settings.weatherUpdateIntervalMs);
  fetchIasiWeather();

  // -------------------------
  // Site Classification
  // -------------------------
  function classifySite(url, doc) {
    try {
      const u = new URL(url);
      const host = u.hostname.toLowerCase();
      const path = (u.pathname + u.search).toLowerCase();

      for (const bad of settings.knownMalicious) {
        if (host.includes(bad)) return 'virus';
      }

      const catOrder = ['virus', 'adult', 'anime'];
      for (const cid of catOrder) {
        const cat = settings.categories[cid];
        if (!cat?.keywords?.length) continue;

        const textToCheck = [
          host,
          path,
          document.title.toLowerCase(),
          Array.from(document.querySelectorAll('meta')).reduce((acc, m) =>
            acc + (m.name || '') + '=' + (m.content || '') + ' ', '').toLowerCase(),
          (doc?.body?.innerText || '').slice(0, 1500).toLowerCase()
        ].join(' ');

        for (const keyword of cat.keywords) {
          if (textToCheck.includes(keyword.toLowerCase())) {
            return cid;
          }
        }
      }
      return 'safe';
    } catch (e) {
      return 'safe';
    }
  }

  function applyShield() {
    if (!settings.visible.shield) {
      shield.style.display = 'none';
      return;
    }
    shield.style.display = 'flex';
    const cls = classifySite(window.location.href, document);
    const cat = settings.categories[cls] || settings.categories.safe;
    shield.style.color = cat.color || '#7b61ff';
    shield.textContent = cat.emoji || '';
    shield.setAttribute('title', `Site: ${cat.label || cls}`);
  }

  applyShield();

  // -------------------------
  // SPA Support (MutationObserver + History API)
  // -------------------------
  let obsTimeout;
  const observer = new MutationObserver(() => {
    if (obsTimeout) clearTimeout(obsTimeout);
    obsTimeout = setTimeout(() => {
      attachNodes();
      applyShield();
    }, 200);
  });
  observer.observe(document.body || document.documentElement, { childList: true, subtree: true });

  (function(history) {
    const pushState = history.pushState;
    history.pushState = function() {
      pushState.apply(history, arguments);
      setTimeout(() => { applyShield(); }, 200);
    };
    const replaceState = history.replaceState;
    history.replaceState = function() {
      replaceState.apply(history, arguments);
      setTimeout(() => { applyShield(); }, 200);
    };
  })(window.history);

  // -------------------------
  // Drag & Drop
  // -------------------------
  function makeDraggable(el, posKey) {
    el.style.cursor = 'move';
    el.addEventListener('pointerdown', startDrag);
    let startX, startY, origLeft, origTop;

    function startDrag(e) {
      if (e.button !== 0) return;
      e.preventDefault();
      startX = e.clientX;
      startY = e.clientY;
      const rect = el.getBoundingClientRect();
      origLeft = rect.left;
      origTop = rect.top;
      document.addEventListener('pointermove', onMove);
      document.addEventListener('pointerup', endDrag);
    }

    function onMove(e) {
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      el.style.left = (origLeft + dx) + 'px';
      el.style.top = (origTop + dy) + 'px';
      el.style.transform = 'none';
    }

    function endDrag() {
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', endDrag);
      const rect = el.getBoundingClientRect();
      settings.positions[posKey] = { x: Math.round(rect.left), y: Math.round(rect.top) };
      saveSettings(settings);
    }
  }

  function applyPositions() {
    headerBox.style.left = '50%';
    headerBox.style.top = '0';
    headerBox.style.transform = 'translateX(-50%)';
  }
  applyPositions();

  makeDraggable(headerBox, 'headerBox');

  // -------------------------
  // Config Panel
  // -------------------------
  function renderPanel() {
    panel.innerHTML = '';
    const title = document.createElement('div');
    title.style.fontSize = (15 * settings.sizeScale) + 'px';
    title.style.fontWeight = '700';
    title.textContent = 'Header: Setări (avansat)';
    panel.appendChild(title);

    // Visibility toggles
    const visLabel = document.createElement('label');
    visLabel.textContent = 'Afișare elemente:';
    panel.appendChild(visLabel);
    const visRow = document.createElement('div');
    visRow.className = 'tm-config-row';
    ['clock', 'weather', 'shield'].forEach(k => {
      const btn = document.createElement('button');
      btn.className = 'tm-config-button';
      btn.textContent = (settings.visible[k] ? 'Ascunde' : 'Afișează');
      btn.dataset.key = k;
      btn.onclick = () => {
        settings.visible[k] = !settings.visible[k];
        saveSettings(settings);
        btn.textContent = (settings.visible[k] ? 'Ascunde' : 'Afișează');
        updateVisibility();
      };
      const lbl = document.createElement('div');
      lbl.textContent = k;
      const wrap = document.createElement('div');
      wrap.style.display = 'flex';
      wrap.style.gap = '6px';
      wrap.style.alignItems = 'center';
      wrap.appendChild(lbl);
      wrap.appendChild(btn);
      visRow.appendChild(wrap);
    });
    panel.appendChild(visRow);

    // Size scale
    const sizeLabel = document.createElement('label');
    sizeLabel.textContent = 'Mărime (scale):';
    panel.appendChild(sizeLabel);
    const sizeRow = document.createElement('div');
    sizeRow.className = 'tm-config-row';
    const sizeInput = document.createElement('input');
    sizeInput.className = 'tm-config-input';
    sizeInput.value = settings.sizeScale;
    sizeInput.type = 'number';
    sizeInput.step = '0.1';
    sizeInput.min = '0.5';
    sizeInput.max = '3';
    const sizeBtn = document.createElement('button');
    sizeBtn.className = 'tm-config-button';
    sizeBtn.textContent = 'Aplică';
    sizeBtn.onclick = () => {
      const v = parseFloat(sizeInput.value) || 1;
      settings.sizeScale = v;
      saveSettings(settings);
      location.reload();
    };
    sizeRow.appendChild(sizeInput);
    sizeRow.appendChild(sizeBtn);
    panel.appendChild(sizeRow);

    // Position reset
    const posRow = document.createElement('div');
    posRow.className = 'tm-config-row';
    const resetPosBtn = document.createElement('button');
    resetPosBtn.className = 'tm-config-button';
    resetPosBtn.textContent = 'Reset poziții';
    resetPosBtn.onclick = () => {
      settings.positions = { headerBox: { x: '50%', y: 0 } };
      saveSettings(settings);
      applyPositions();
    };
    posRow.appendChild(resetPosBtn);
    panel.appendChild(posRow);

    // Categories editor
    const catLabel = document.createElement('label');
    catLabel.textContent = 'Categorii (editează keyword-urile, emoji și culoarea):';
    panel.appendChild(catLabel);

    const catList = document.createElement('div');
    catList.className = 'tm-cat-list';
    for (const cid of Object.keys(settings.categories)) {
      const cat = settings.categories[cid];
      const item = document.createElement('div');
      item.className = 'tm-cat-item';
      const left = document.createElement('div');
      left.style.display = 'flex';
      left.style.gap = '8px';
      left.style.alignItems = 'center';
      const colorBox = document.createElement('div');
      colorBox.style.width = '22px';
      colorBox.style.height = '22px';
      colorBox.style.background = cat.color;
      colorBox.style.borderRadius = '4px';
      const label = document.createElement('div');
      label.innerHTML = `<strong>${cat.label}</strong> <div class="tm-small-muted2">${cat.id}</div>`;
      left.appendChild(colorBox);
      left.appendChild(label);

      const right = document.createElement('div');
      right.style.display = 'flex';
      right.style.gap = '6px';
      right.style.alignItems = 'center';
      const editBtn = document.createElement('button');
      editBtn.className = 'tm-config-button';
      editBtn.textContent = 'Editează';
      editBtn.onclick = () => openEditCategoryModal(cat.id);
      const delBtn = document.createElement('button');
      delBtn.className = 'tm-config-button';
      delBtn.textContent = 'Șterge';
      delBtn.onclick = () => {
        if (confirm('Ștergi categoria ' + cat.label + '?')) {
          delete settings.categories[cat.id];
          saveSettings(settings);
          renderPanel();
          applyShield();
        }
      };
      right.appendChild(editBtn);
      right.appendChild(delBtn);

      item.appendChild(left);
      item.appendChild(right);
      catList.appendChild(item);
    }
    panel.appendChild(catList);

    // Add category form
    const addLabel = document.createElement('label');
    addLabel.textContent = 'Adaugă categorie nouă:';
    panel.appendChild(addLabel);
    const addRow = document.createElement('div');
    addRow.className = 'tm-config-row';
    const addId = document.createElement('input');
    addId.className = 'tm-config-input';
    addId.placeholder = 'id (ex: newcat)';
    const addLabelInput = document.createElement('input');
    addLabelInput.className = 'tm-config-input';
    addLabelInput.placeholder = 'label (ex: Nume)';
    const addBtn = document.createElement('button');
    addBtn.className = 'tm-config-button';
    addBtn.textContent = 'Adaugă';
    addBtn.onclick = () => {
      const id = (addId.value || '').trim();
      const lab = (addLabelInput.value || '').trim() || id;
      if (!id) { alert('Id invalid'); return; }
      if (settings.categories[id]) { alert('Id există'); return; }
      settings.categories[id] = { id, label: lab, color: '#888888', emoji: '❓', keywords: [] };
      saveSettings(settings);
      renderPanel();
    };
    addRow.appendChild(addId);
    addRow.appendChild(addLabelInput);
    addRow.appendChild(addBtn);
    panel.appendChild(addRow);

    // Reset settings
    const resetRow = document.createElement('div');
    resetRow.className = 'tm-config-row';
    const resetBtn = document.createElement('button');
    resetBtn.className = 'tm-config-button';
    resetBtn.textContent = 'Reset la implicit';
    resetBtn.onclick = () => {
      if (!confirm('Resetezi toate setările la valorile implicite?')) return;
      settings = JSON.parse(JSON.stringify(DEFAULTS));
      saveSettings(settings);
      location.reload();
    };
    resetRow.appendChild(resetBtn);
    panel.appendChild(resetRow);

    // Help text
    const help = document.createElement('div');
    help.className = 'tm-small-muted2';
    help.style.marginTop = '8px';
    help.textContent = 'Schimbările la mărime și font necesită reîncărcare pentru a aplica stilurile noi.';
    panel.appendChild(help);
  }

  function openEditCategoryModal(catId) {
    const cat = settings.categories[catId];
    if (!cat) return;
    const newLabel = prompt('Etichetă categorie:', cat.label);
    if (newLabel === null) return;
    cat.label = newLabel;
    const newColor = prompt('Culoare (hex sau CSS):', cat.color);
    if (newColor === null) return;
    cat.color = newColor;
    const newEmoji = prompt('Emoji/text afișat:', cat.emoji);
    if (newEmoji === null) return;
    cat.emoji = newEmoji;
    const kw = prompt('Keywords (virgule separate):', (cat.keywords || []).join(','));
    if (kw === null) return;
    cat.keywords = kw.split(',').map(x => x.trim()).filter(Boolean);
    saveSettings(settings);
    renderPanel();
    applyShield();
  }

  gear.onclick = () => {
    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    if (panel.style.display === 'block') renderPanel();
  };

  function updateVisibility() {
    clock.style.display = settings.visible.clock ? 'flex' : 'none';
    weatherBox.style.display = settings.visible.weather ? 'flex' : 'none';
    shield.style.display = settings.visible.shield ? 'flex' : 'none';
    gear.style.display = (settings.visible.clock || settings.visible.weather || settings.visible.shield) ? 'flex' : 'none';
  }

  // -------------------------
  // Initial Setup
  // -------------------------
  updateVisibility();
  applyPositions();
  applyShield();

  // Ensure nodes reattached if page overwrites DOM
  const attachObserver = new MutationObserver(() => attachNodes());
  attachObserver.observe(document.body || document.documentElement, { childList: true, subtree: true });

  // Console tip
  console.info('Header Advanced: draggable (pointer-drag) header box. Open settings with gear icon. Settings saved in localStorage key:', LS_KEY);
})();