'use strict';

// ═══════════════════════════════════════════════════════════════════
// DEFAULT DIMENSIONS
// 6 dimensions pré-configurées, activables / modifiables librement
// ═══════════════════════════════════════════════════════════════════

const DEFAULT_DIMENSIONS = [
  {
    id: 'accessibilite',
    label: 'Accessibilité',
    type: 'single-choice',
    required: true,
    shortcut: 'a',
    options: [
      { id: 'accessible',    label: 'Accessible',     color: '#22c55e', shortcut: null },
      { id: 'intermediaire', label: 'Intermédiaire',  color: '#f59e0b', shortcut: null },
      { id: 'difficile',     label: 'Difficile',      color: '#ef4444', shortcut: null },
    ]
  },
  {
    id: 'color_pie',
    label: 'Color Pie respecté',
    type: 'boolean',
    required: true,
    shortcut: 'z',
    trueLabel: 'Oui',
    falseLabel: 'Non',
    unselectedLabel: 'Non sélectionné'
  },
  {
    id: 'illustration_coherente',
    label: 'Illustration cohérente',
    type: 'boolean',
    required: true,
    shortcut: 'e',
    trueLabel: 'Oui',
    falseLabel: 'Non',
    unselectedLabel: 'Non sélectionné'
  },
  {
    id: 'nom_coherent',
    label: 'Nom cohérent',
    type: 'boolean',
    required: true,
    shortcut: 'r',
    trueLabel: 'Oui',
    falseLabel: 'Non',
    unselectedLabel: 'Non sélectionné'
  },
  {
    id: 'standard_mtg',
    label: 'Standard MTG respecté',
    type: 'boolean',
    required: true,
    shortcut: 'q',
    trueLabel: 'Oui',
    falseLabel: 'Non',
    unselectedLabel: 'Non sélectionné'
  },
  {
    id: 'puissance',
    label: 'Puissance',
    type: 'scale',
    required: false,
    min: 1, max: 4, step: 1,
    shortcut: 's',
    scaleLabels: { 1: 'Trop faible', 2: 'OK', 3: 'Ne sait pas', 4: 'Trop fort' }
  }
];

// ═══════════════════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════════════════

const state = {
  session:  null,     // { meta, dimensions, cards }
  imageMap: {},       // imagePath → objectURL | dataURL
  ui: {
    view:             'empty',   // 'empty' | 'gallery' | 'focus'
    filter:           'all',     // 'all' | 'unreviewed' | 'flagged'
    search:           '',
    currentCardIndex: 0,
    unsaved:          false,
    dimensionFilters: {},
  }
};

const DEFAULT_IMAGE_MANIFEST = 'images_cube/manifest.json';

// ═══════════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════════

function getDim(id) {
  return state.session?.dimensions.find(d => d.id === id) ?? null;
}

function getImageSrc(card) {
  if (card.imageData) return card.imageData;
  return state.imageMap[card.imagePath] || (card.imagePath?.startsWith('images_cube/') ? card.imagePath : null);
}

function getFilteredCards() {
  if (!state.session) return [];
  let cards = state.session.cards;
  const q = state.ui.search.trim().toLowerCase();
  if (q) cards = cards.filter(c => c.name.toLowerCase().includes(q));
  if      (state.ui.filter === 'unreviewed') cards = cards.filter(c => !TaggingEngine.isReviewed(c));
  else if (state.ui.filter === 'flagged')    cards = cards.filter(c => c.flagged);
  for (const dim of state.session.dimensions) {
    const selected = state.ui.dimensionFilters[dim.id];
    if (!selected) continue;
    cards = cards.filter(card => {
      const value = TaggingEngine.get(card, dim.id);
      if (selected === '__unset__') return value === null;
      if (dim.type === 'multi-tag') return Array.isArray(value) && value.includes(selected);
      return String(value) === selected;
    });
  }
  return cards;
}

function renderDimensionFilters() {
  const wrap = document.getElementById('dimension-filters');
  if (!wrap || !state.session) return;
  wrap.innerHTML = '';
  for (const dim of state.session.dimensions) {
    const select = document.createElement('select');
    select.className = 'dimension-filter';
    select.dataset.dimension = dim.id;
    select.title = `Filtrer par ${dim.label}`;
    const all = document.createElement('option');
    all.value = '';
    all.textContent = dim.label;
    select.appendChild(all);
    const values = dim.type === 'boolean'
      ? [{ value: '__unset__', label: 'Non sélectionné' }, { value: 'true', label: dim.trueLabel || 'Oui' }, { value: 'false', label: dim.falseLabel || 'Non' }]
      : dim.type === 'scale'
        ? Array.from({ length: Math.floor(((dim.max ?? 5) - (dim.min ?? 1)) / (dim.step || 1)) + 1 }, (_, i) => {
            const value = (dim.min ?? 1) + i * (dim.step || 1);
            return { value: String(value), label: dim.scaleLabels?.[value] || String(value) };
          })
        : (dim.options || []).map(option => ({ value: option.id, label: option.label }));
    values.forEach(item => {
      const option = document.createElement('option');
      option.value = item.value;
      option.textContent = item.label;
      select.appendChild(option);
    });
    select.value = state.ui.dimensionFilters[dim.id] || '';
    select.addEventListener('change', event => {
      const value = event.target.value;
      if (value) state.ui.dimensionFilters[dim.id] = value;
      else delete state.ui.dimensionFilters[dim.id];
      GalleryView.render();
    });
    wrap.appendChild(select);
  }
  const clear = document.createElement('button');
  clear.className = 'filter-clear';
  clear.textContent = 'Effacer filtres';
  clear.type = 'button';
  clear.addEventListener('click', () => {
    state.ui.dimensionFilters = {};
    renderDimensionFilters();
    GalleryView.render();
  });
  wrap.appendChild(clear);
}

// Perçoit la luminance hex → couleur de texte contrasté
function contrastColor(hex) {
  if (!hex || hex.length < 7) return '#0a0a14';
  const r = parseInt(hex.slice(1,3), 16);
  const g = parseInt(hex.slice(3,5), 16);
  const b = parseInt(hex.slice(5,7), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.45 ? '#0a0a14' : '#eaeaf8';
}

function escHtml(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

let _toastTimer;
function toast(msg, isError = false, duration = 2800) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = 'show' + (isError ? ' error' : '');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => { el.className = ''; }, duration);
}

function updateSaveStatus() {
  const status = document.getElementById('save-status');
  if (!status) return;
  status.textContent = state.ui.unsaved ? 'Session locale à jour · à exporter' : 'Sauvegardée localement';
  status.classList.toggle('pending', state.ui.unsaved);
}

function updateProgress() {
  const wrap = document.getElementById('progress-wrap');
  if (!state.session?.cards.length) { wrap.classList.add('hidden'); return; }
  const total = state.session.cards.length;
  const done  = state.session.cards.filter(c => TaggingEngine.isReviewed(c)).length;
  const pct   = Math.round(done / total * 100);
  wrap.classList.remove('hidden');
  document.getElementById('progress-bar-fill').style.width = pct + '%';
  document.getElementById('progress-label').textContent    = `${done} / ${total} triées (${pct}%)`;
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  Object.assign(document.createElement('a'), { href: url, download: filename }).click();
  URL.revokeObjectURL(url);
}

function mkField(labelText, inputHtml) {
  const d = document.createElement('div');
  d.className = 'dim-edit-field';
  d.innerHTML = (labelText ? `<label>${escHtml(labelText)}</label>` : '') + inputHtml;
  return d;
}

function mkRow(fields) {
  const d = document.createElement('div');
  d.className = 'dim-edit-row';
  fields.forEach(f => d.appendChild(f));
  return d;
}

// ═══════════════════════════════════════════════════════════════════
// SESSION MANAGER
// ═══════════════════════════════════════════════════════════════════

const SessionManager = {
  createNew() {
    return {
      meta: {
        version:     '1.0',
        createdAt:   today(),
        updatedAt:   today(),
        author:      '',
        description: ''
      },
      dimensions: JSON.parse(JSON.stringify(DEFAULT_DIMENSIONS)),
      cards: []
    };
  },

  addImages(files) {
    const existing = new Set(state.session.cards.map(c => c.imagePath));
    let added = 0;
    for (const file of files) {
      if (existing.has(file.name)) continue;
      state.imageMap[file.name] = URL.createObjectURL(file);
      state.session.cards.push({
        id:              `card_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        name:            file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' '),
        imagePath:       file.name,
        imageData:       null,
        classifications: {},
        notes:           '',
        flagged:         false
      });
      added++;
    }
    if (added) this.touch();
    return added;
  },

  relinkImages(files) {
    let linked = 0;
    for (const file of files) {
      const card = state.session.cards.find(c =>
        c.imagePath === file.name ||
        c.imagePath.split(/[/\\]/).pop() === file.name
      );
      if (card) { state.imageMap[card.imagePath] = URL.createObjectURL(file); linked++; }
    }
    return linked;
  },

  touch() {
    if (state.session) state.session.meta.updatedAt = today();
    state.ui.unsaved = true;
    updateSaveStatus();
  }
};

function today() { return new Date().toISOString().slice(0, 10); }

function imageNumber(card) {
  const match = card.imagePath?.match(/(?:^|\/)(\d+)_/);
  return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER;
}

function sortDefaultCards(cards) {
  cards.sort((a, b) => imageNumber(a) - imageNumber(b));
  return cards;
}

async function loadDefaultSession() {
  const response = await fetch(DEFAULT_IMAGE_MANIFEST);
  if (!response.ok) throw new Error(`Impossible de charger ${DEFAULT_IMAGE_MANIFEST}`);
  const imageNames = await response.json();
  const session = SessionManager.createNew();
  session.meta.description = 'Cube images par défaut';
  session.cards = sortDefaultCards(imageNames.map((imageName, index) => ({
    id:              `default_card_${String(index + 1).padStart(3, '0')}`,
    name:            imageName.replace(/\.[^.]+$/, '').replace(/^\d+_/, '').replace(/[-_]+/g, ' '),
    imagePath:       `images_cube/${imageName}`,
    imageData:       null,
    classifications: {},
    notes:           '',
    flagged:         false
  })));
  return session;
}

// ═══════════════════════════════════════════════════════════════════
// STORAGE ADAPTER
// ═══════════════════════════════════════════════════════════════════

const StorageAdapter = {
  KEY: 'mtg-cube-sorter',

  saveLocal() {
    if (!state.session) return;
    try {
      const copy = JSON.parse(JSON.stringify(state.session));
      copy.cards.forEach(c => { c.imageData = null; }); // ne pas saturer localStorage
      localStorage.setItem(this.KEY, JSON.stringify(copy));
    } catch { /* quota dépassé — silencieux */ }
  },

  loadLocal() {
    try {
      const raw = localStorage.getItem(this.KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  },

  clearLocal() { localStorage.removeItem(this.KEY); },

  async exportJSON(embedImages = false) {
    const session = JSON.parse(JSON.stringify(state.session));
    if (embedImages) {
      for (const card of session.cards) {
        const src = getImageSrc(card);
        if (src && src.startsWith('data:')) {
          card.imageData = src;
        } else if (src) {
          try {
            const response = await fetch(src);
            if (!response.ok) continue;
            const blob = await response.blob();
            card.imageData = await blobToDataURL(blob);
          } catch { /* skip */ }
        }
      }
    } else {
      session.cards.forEach(c => { c.imageData = null; });
    }
    downloadBlob(
      new Blob([JSON.stringify(session, null, 2)], { type: 'application/json' }),
      `cube-session-${session.meta.updatedAt}.json`
    );
    state.ui.unsaved = false;
    updateProgress();
  },

  importJSON(file) {
    return new Promise((resolve, reject) => {
      const fr = new FileReader();
      fr.onerror = reject;
      fr.onload  = ev => {
        try {
          const session = JSON.parse(ev.target.result);
          if (!Array.isArray(session.cards) || !Array.isArray(session.dimensions)) {
            reject(new Error('Structure JSON invalide (cards ou dimensions manquants).')); return;
          }
          for (const card of session.cards) {
            if (card.imageData) state.imageMap[card.imagePath] = card.imageData;
          }
          resolve(session);
        } catch (e) { reject(e); }
      };
      fr.readAsText(file);
    });
  },

  exportConfig() {
    if (!state.session) return;
    const cfg = {
      meta: { ...state.session.meta, description: 'Configuration uniquement — sans cartes' },
      dimensions: JSON.parse(JSON.stringify(state.session.dimensions)),
      cards: []
    };
    downloadBlob(
      new Blob([JSON.stringify(cfg, null, 2)], { type: 'application/json' }),
      `cube-config-${cfg.meta.updatedAt}.json`
    );
  }
};

function blobToDataURL(blob) {
  return new Promise(res => {
    const fr = new FileReader();
    fr.onload = () => res(fr.result);
    fr.readAsDataURL(blob);
  });
}

// ═══════════════════════════════════════════════════════════════════
// TAGGING ENGINE
// ═══════════════════════════════════════════════════════════════════

const TaggingEngine = {
  get(card, dimId) {
    return card.classifications[dimId] ?? null;
  },

  set(card, dimId, value) {
    if (value === null || value === undefined) delete card.classifications[dimId];
    else card.classifications[dimId] = value;
    SessionManager.touch();
    StorageAdapter.saveLocal();
  },

  // single-choice : bascule, multi-tag : toggle sur l'option
  toggle(card, dimId, optionId) {
    const dim = getDim(dimId);
    if (!dim) return;
    if (dim.type === 'single-choice') {
      this.set(card, dimId, this.get(card, dimId) === optionId ? null : optionId);
    } else if (dim.type === 'multi-tag') {
      const arr = [...(this.get(card, dimId) || [])];
      const i = arr.indexOf(optionId);
      if (i === -1) arr.push(optionId); else arr.splice(i, 1);
      this.set(card, dimId, arr.length ? arr : null);
    }
  },

  toggleBool(card, dimId) {
    const value = this.get(card, dimId);
    this.set(card, dimId, value === null || value === undefined ? true : value ? false : null);
  },

  cycleChoice(card, dimId) {
    const dim = getDim(dimId);
    if (!dim?.options?.length) return;
    const current = this.get(card, dimId);
    const index = dim.options.findIndex(option => option.id === current);
    this.set(card, dimId, dim.options[(index + 1) % dim.options.length].id);
  },

  // scale : cycle valeur → suivante → null
  cycleScale(card, dimId) {
    const dim = getDim(dimId);
    if (!dim) return;
    const v = this.get(card, dimId);
    if (v === null)          this.set(card, dimId, dim.min  ?? 1);
    else if (v >= (dim.max ?? 5)) this.set(card, dimId, null);
    else                          this.set(card, dimId, v + (dim.step ?? 1));
  },

  clearAll(card) {
    card.classifications = {};
    card.flagged         = false;
    card.notes           = '';
    SessionManager.touch();
    StorageAdapter.saveLocal();
  },

  isReviewed(card) {
    if (!state.session) return false;
    const required = state.session.dimensions.filter(d => d.required);
    if (!required.length) {
      return Object.values(card.classifications).some(v =>
        Array.isArray(v) ? v.length > 0 : (v !== null && v !== undefined && v !== '')
      );
    }
    return required.every(d => {
      const v = card.classifications[d.id];
      if (v === null || v === undefined) return false;
      if (Array.isArray(v))  return v.length > 0;
      if (typeof v === 'string') return v.trim() !== '';
      return true;
    });
  }
};

// ═══════════════════════════════════════════════════════════════════
// GALLERY VIEW
// ═══════════════════════════════════════════════════════════════════

const GalleryView = {
  render() {
    const grid  = document.getElementById('card-grid');
    const cards = getFilteredCards();
    grid.innerHTML = '';
    if (!cards.length) {
      grid.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:var(--text-3);padding:48px 0;font-size:16px">Aucune carte correspondante.</p>';
      return;
    }
    const frag = document.createDocumentFragment();
    cards.forEach(card => frag.appendChild(this._thumb(card)));
    grid.appendChild(frag);
  },

  _thumb(card) {
    const reviewed = TaggingEngine.isReviewed(card);
    const status   = card.flagged ? 'flagged' : reviewed ? 'reviewed' : 'unreviewed';
    const el       = document.createElement('div');
    el.className   = `card-thumb ${status}`;

    const imageWrap = document.createElement('div');
    imageWrap.className = 'card-thumb-image';
    const src = getImageSrc(card);
    if (src) {
      const img = document.createElement('img');
      img.src = src; img.alt = card.name; img.loading = 'lazy';
      img.addEventListener('load', () => {
        el.classList.toggle('landscape', img.naturalWidth > img.naturalHeight);
      });
      imageWrap.appendChild(img);
    } else {
      const ph = document.createElement('div');
      ph.className = 'card-thumb-placeholder'; ph.textContent = '🃏';
      imageWrap.appendChild(ph);
    }
    el.appendChild(imageWrap);

    const foot = document.createElement('div');
    foot.className = 'card-thumb-footer';
    const dot  = document.createElement('span');
    dot.className = `status-dot ${status}`;
    const name = document.createElement('span');
    name.className = 'card-thumb-name'; name.textContent = card.name;
    foot.append(dot, name);
    el.appendChild(foot);

    el.addEventListener('click', () => openFocus(state.session.cards.indexOf(card)));
    return el;
  }
};

// ═══════════════════════════════════════════════════════════════════
// FOCUS VIEW
// ═══════════════════════════════════════════════════════════════════

const FocusView = {
  render() {
    if (!state.session?.cards.length) return;
    const idx  = state.ui.currentCardIndex;
    const card = state.session.cards[idx];
    const src  = getImageSrc(card);

    const img     = document.getElementById('focus-img');
    const noImage = document.getElementById('focus-no-image');
    if (src) { img.src = src; img.classList.remove('hidden'); noImage.classList.add('hidden'); }
    else     { img.src = ''; img.classList.add('hidden');    noImage.classList.remove('hidden'); }

    document.getElementById('focus-card-name').textContent = card.name;
    document.getElementById('focus-counter').textContent   = `${idx + 1} / ${state.session.cards.length}`;
    document.getElementById('btn-prev').disabled = idx === 0;
    document.getElementById('btn-next').disabled = idx === state.session.cards.length - 1;

    const panel = document.getElementById('focus-dims-panel');
    panel.innerHTML = '';
    state.session.dimensions.forEach(dim => panel.appendChild(this._block(dim, card)));

    document.getElementById('focus-notes').value = card.notes || '';

  },

  _block(dim, card) {
    const block = document.createElement('div');
    block.className = 'dim-block';

    const hdr = document.createElement('div');
    hdr.className = 'dim-header';
    hdr.setAttribute('role', 'button');
    hdr.setAttribute('tabindex', '0');
    hdr.setAttribute('aria-expanded', 'true');
    hdr.textContent = dim.label;
    if (dim.shortcut) {
      const shortcut = document.createElement('span');
      shortcut.className = 'dim-shortcut';
      shortcut.textContent = dim.shortcut.toUpperCase();
      hdr.appendChild(shortcut);
    }
    if (dim.required) {
      const b = document.createElement('span');
      b.className = 'dim-required-badge'; b.textContent = 'requis';
      hdr.appendChild(b);
    }
    const chevron = document.createElement('span');
    chevron.className = 'dim-chevron';
    chevron.textContent = '⌄';
    hdr.appendChild(chevron);

    const body = document.createElement('div');
    body.className = 'dim-body';
    body.appendChild(this._control(dim, card));
    const toggle = () => {
      const collapsed = block.classList.toggle('collapsed');
      hdr.setAttribute('aria-expanded', String(!collapsed));
    };
    hdr.addEventListener('click', toggle);
    hdr.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); toggle(); }
    });

    block.append(hdr, body);
    return block;
  },

  _control(dim, card) {
    switch (dim.type) {
      case 'single-choice': return this._singleChoice(dim, card);
      case 'multi-tag':     return this._multiTag(dim, card);
      case 'scale':         return this._scale(dim, card);
      case 'boolean':       return this._boolean(dim, card);
      case 'text':          return this._text(dim, card);
      default:              return document.createElement('div');
    }
  },

  _singleChoice(dim, card) {
    const wrap = document.createElement('div');
    wrap.className = 'dim-single';
    const val = TaggingEngine.get(card, dim.id);
    for (const opt of dim.options) {
      const row = document.createElement('button');
      row.type = 'button';
      row.className = 'option-row' + (val === opt.id ? ' selected' : '');
      if (opt.shortcut) {
        const kbd = document.createElement('span');
        kbd.className = 'option-kbd'; kbd.textContent = opt.shortcut.toUpperCase();
        row.appendChild(kbd);
      }
      const dot = document.createElement('span');
      dot.className = 'option-dot'; dot.style.background = opt.color;
      const lbl = document.createElement('span');
      lbl.className = 'option-label'; lbl.textContent = opt.label;
      row.append(dot, lbl);
      row.addEventListener('click', () => { TaggingEngine.toggle(card, dim.id, opt.id); this.render(); updateProgress(); });
      wrap.appendChild(row);
    }
    return wrap;
  },

  _multiTag(dim, card) {
    const wrap  = document.createElement('div');
    wrap.className = 'dim-multitag';
    const inner = document.createElement('div');
    inner.className = 'tags-wrap';
    const val   = TaggingEngine.get(card, dim.id) || [];
    for (const opt of dim.options) {
      const active = val.includes(opt.id);
      const btn    = document.createElement('button');
      btn.className = 'tag-btn' + (active ? ' active' : '');
      if (active) {
        btn.style.background  = opt.color;
        btn.style.borderColor = opt.color;
        btn.style.color       = contrastColor(opt.color);
      }
      if (opt.shortcut) {
        const kbd = document.createElement('span');
        kbd.className = 'option-kbd'; kbd.textContent = opt.shortcut.toUpperCase();
        btn.appendChild(kbd);
      }
      btn.append(document.createTextNode(opt.label));
      btn.addEventListener('click', () => { TaggingEngine.toggle(card, dim.id, opt.id); this.render(); updateProgress(); });
      inner.appendChild(btn);
    }
    wrap.appendChild(inner);
    return wrap;
  },

  _scale(dim, card) {
    const wrap = document.createElement('div');
    wrap.className = 'dim-scale';
    const row  = document.createElement('div');
    row.className = 'scale-row';
    const val  = TaggingEngine.get(card, dim.id);
    for (let v = dim.min; v <= dim.max; v += (dim.step || 1)) {
      const btn = document.createElement('button');
      btn.className = 'scale-btn' + (val === v ? ' active' : '');
      btn.textContent = dim.scaleLabels?.[v] || v;
      btn.title = dim.scaleLabels?.[v] || String(v);
      btn.addEventListener('click', () => {
        TaggingEngine.set(card, dim.id, val === v ? null : v);
        this.render(); updateProgress();
      });
      row.appendChild(btn);
    }
    const lbl = document.createElement('span');
    lbl.className = 'scale-label';
    lbl.textContent = dim.shortcut ? `(${dim.shortcut.toUpperCase()}) pour cycler` : '';
    row.appendChild(lbl);
    wrap.appendChild(row);
    return wrap;
  },

  _boolean(dim, card) {
    const wrap = document.createElement('div');
    wrap.className = 'dim-boolean';
    const row  = document.createElement('div');
    row.className = 'bool-row';
    const value = TaggingEngine.get(card, dim.id);
    const selected = value === true || value === false;
    const button = document.createElement('button');
    const shortcutHint = dim.shortcut ? ` (${dim.shortcut.toUpperCase()})` : '';
    button.className = `bool-btn ${selected ? (value ? 'yes' : 'no') : 'unset'} active`;
    button.textContent = value === null || value === undefined
      ? (dim.unselectedLabel || 'Non sélectionné')
      : value ? (dim.trueLabel || 'Oui') : (dim.falseLabel || 'Non');
    if (shortcutHint) {
      const shortcut = document.createElement('span');
      shortcut.className = 'option-kbd';
      shortcut.textContent = dim.shortcut.toUpperCase();
      button.appendChild(shortcut);
    }
    button.setAttribute('aria-pressed', selected ? String(value) : 'false');
    button.addEventListener('click', () => { TaggingEngine.toggleBool(card, dim.id); this.render(); updateProgress(); });
    row.appendChild(button);

    wrap.appendChild(row);
    return wrap;
  },

  _text(dim, card) {
    const wrap = document.createElement('div');
    wrap.className = 'dim-text';
    const ta   = document.createElement('textarea');
    ta.rows = 2; ta.placeholder = `Commentaire — ${dim.label}…`;
    ta.value = TaggingEngine.get(card, dim.id) || '';
    ta.addEventListener('input', () => { TaggingEngine.set(card, dim.id, ta.value || null); updateProgress(); });
    wrap.appendChild(ta);
    return wrap;
  }
};

// ═══════════════════════════════════════════════════════════════════
// DIMENSION EDITOR
// ═══════════════════════════════════════════════════════════════════

const DimensionEditor = {
  open() {
    this._rebuild();
    document.getElementById('modal-overlay').classList.remove('hidden');
    this._updateShortcutConflicts();
  },

  close() {
    if (this._updateShortcutConflicts()) {
      toast('Corrigez les raccourcis en conflit avant de fermer.', true, 4500);
      return;
    }
    document.getElementById('modal-overlay').classList.add('hidden');
    if (state.ui.view === 'focus') { KeyboardHandler.buildMap(); FocusView.render(); }
    updateProgress();
    StorageAdapter.saveLocal();
  },

  _rebuild() {
    const list = document.getElementById('dim-editor-list');
    list.innerHTML = '';
    state.session.dimensions.forEach((dim, i) => list.appendChild(this._item(dim, i)));
    this._updateShortcutConflicts();
  },

  _shortcutEntries() {
    const entries = [];
    state.session.dimensions.forEach(dim => {
      if (dim.shortcut && ['single-choice', 'scale', 'boolean'].includes(dim.type)) {
        entries.push({ key: dim.shortcut.trim().toLowerCase(), label: `${dim.label} (dimension)`, selector: `[data-shortcut-owner="dim:${CSS.escape(dim.id)}"]` });
      }
      if (['single-choice', 'multi-tag'].includes(dim.type)) {
        (dim.options || []).forEach(option => {
          if (option.shortcut) entries.push({ key: option.shortcut.trim().toLowerCase(), label: `${dim.label} : ${option.label}`, selector: `[data-shortcut-owner="option:${CSS.escape(dim.id)}:${CSS.escape(option.id)}"]` });
        });
      }
    });
    return entries.filter(entry => entry.key);
  },

  _updateShortcutConflicts() {
    const groups = new Map();
    this._shortcutEntries().forEach(entry => {
      if (!groups.has(entry.key)) groups.set(entry.key, []);
      groups.get(entry.key).push(entry);
    });
    const conflicts = [...groups.entries()].filter(([, entries]) => entries.length > 1);
    document.querySelectorAll('[data-shortcut-owner]').forEach(field => {
      field.classList.remove('shortcut-conflict');
      field.removeAttribute('aria-invalid');
      field.removeAttribute('title');
    });
    conflicts.forEach(([key, entries]) => {
      entries.forEach(entry => document.querySelectorAll(entry.selector).forEach(field => {
        field.classList.add('shortcut-conflict');
        field.setAttribute('aria-invalid', 'true');
        field.title = `Conflit avec : ${entries.filter(other => other !== entry).map(other => other.label).join(', ')}`;
      }));
    });
    const notice = document.getElementById('shortcut-conflicts');
    if (notice) {
      notice.textContent = conflicts.length
        ? `⚠ Raccourcis en conflit : ${conflicts.map(([key, entries]) => `${key.toUpperCase()} (${entries.map(entry => entry.label).join(' / ')})`).join(' · ')}`
        : '';
      notice.classList.toggle('visible', conflicts.length > 0);
    }
    return conflicts.length > 0;
  },

  _item(dim, idx) {
    const item = document.createElement('div');
    item.className = 'dim-edit-item';

    const hdr = document.createElement('div');
    hdr.className = 'dim-edit-header';
    hdr.innerHTML = `
      <span class="dim-edit-title">${escHtml(dim.label)}</span>
      <span class="dim-edit-type-badge">${escHtml(dim.type)}</span>
      ${dim.required ? '<span class="dim-required-badge">requis</span>' : ''}
      <span class="dim-edit-chevron">▶</span>
    `;
    const body = document.createElement('div');
    body.className = 'dim-edit-body';
    hdr.addEventListener('click', () => {
      const isOpen = hdr.classList.toggle('open');
      body.classList.toggle('open', isOpen);
      if (isOpen) {
        requestAnimationFrame(() => item.scrollIntoView({ behavior: 'smooth', block: 'nearest' }));
      }
    });

    body.appendChild(this._form(dim, idx, hdr));
    item.append(hdr, body);
    return item;
  },

  _form(dim, idx, hdr) {
    const f = document.createElement('div');

    // Ligne 1 : label + type
    f.appendChild(mkRow([
      mkField('Nom de la dimension', `<input class="f-label" type="text" value="${escHtml(dim.label)}">`),
      mkField('Type de réponse', `<select class="f-type">
        ${[['single-choice','Choix unique'],['multi-tag','Multi-tags'],['scale','Échelle'],['boolean','Oui / Non'],['text','Texte libre']]
          .map(([v,l]) => `<option value="${v}"${dim.type===v?' selected':''}>${l}</option>`).join('')}
      </select>`)
    ]));

    // Ligne 2 : obligatoire + raccourci (scale / boolean)
    const reqItems = [mkField('', `<label style="display:flex;align-items:center;gap:7px;cursor:pointer;font-size:13px">
      <input class="f-required" type="checkbox" ${dim.required?'checked':''}> Dimension obligatoire</label>`)];
    if (dim.type === 'scale' || dim.type === 'boolean') {
      reqItems.push(mkField('Raccourci (1 touche)', `<input class="f-shortcut" data-shortcut-owner="dim:${escHtml(dim.id)}" type="text" maxlength="1" value="${escHtml(dim.shortcut||'')}" style="width:70px">`));
    }
    f.appendChild(mkRow(reqItems));

    // Scale : min / max / step
    if (dim.type === 'scale') {
      f.appendChild(mkRow([
        mkField('Min',  `<input class="f-min"  type="number" value="${dim.min  ?? 1}" min="0" style="width:80px">`),
        mkField('Max',  `<input class="f-max"  type="number" value="${dim.max  ?? 5}" min="1" style="width:80px">`),
        mkField('Pas',  `<input class="f-step" type="number" value="${dim.step ?? 1}" min="1" style="width:80px">`),
      ]));
    }

    // Boolean : labels oui / non
    if (dim.type === 'boolean') {
      f.appendChild(mkRow([
        mkField('Label "Vrai"', `<input class="f-truelabel"  type="text" value="${escHtml(dim.trueLabel  || 'Oui')}">`),
        mkField('Label "Faux"', `<input class="f-falselabel" type="text" value="${escHtml(dim.falseLabel || 'Non')}">`),
      ]));
    }

    // Options (single-choice / multi-tag)
    if (dim.type === 'single-choice' || dim.type === 'multi-tag') {
      const sec  = document.createElement('div');
      sec.className = 'dim-edit-field';
      const lbl  = document.createElement('label'); lbl.textContent = 'Options';
      const list = document.createElement('div');   list.className = 'dim-options-list';
      (dim.options || []).forEach(opt => list.appendChild(this._optRow(opt, dim)));
      const addBtn = document.createElement('button');
      addBtn.className = 'btn-add-opt';
      addBtn.textContent = '+ Ajouter une option';
      addBtn.addEventListener('click', () => {
        const o = { id: `opt_${Date.now()}`, label: 'Nouvelle option', color: '#6366f1', shortcut: null };
        if (!dim.options) dim.options = [];
        dim.options.push(o);
        list.appendChild(this._optRow(o, dim));
        SessionManager.touch();
      });
      sec.append(lbl, list, addBtn);
      f.appendChild(sec);
    }

    // Actions : monter / descendre / supprimer
    const acts = document.createElement('div');
    acts.className = 'dim-edit-actions';

    const upBtn = document.createElement('button');
    upBtn.className = 'btn-move-up'; upBtn.textContent = '↑'; upBtn.title = 'Monter';
    upBtn.disabled = idx === 0;
    upBtn.addEventListener('click', () => this._move(idx, -1));

    const dnBtn = document.createElement('button');
    dnBtn.className = 'btn-move-down'; dnBtn.textContent = '↓'; dnBtn.title = 'Descendre';
    dnBtn.disabled = idx === state.session.dimensions.length - 1;
    dnBtn.addEventListener('click', () => this._move(idx, 1));

    const delBtn = document.createElement('button');
    delBtn.className = 'btn-delete-dim'; delBtn.textContent = '🗑 Supprimer';
    delBtn.addEventListener('click', () => {
      if (!confirm(`Supprimer la dimension "${dim.label}" ? Les données associées sur toutes les cartes seront perdues.`)) return;
      state.session.dimensions.splice(idx, 1);
      state.session.cards.forEach(c => delete c.classifications[dim.id]);
      this._rebuild(); SessionManager.touch();
    });

    acts.append(upBtn, dnBtn, delBtn);
    f.appendChild(acts);

    this._wire(f, dim, hdr);
    return f;
  },

  _optRow(opt, dim) {
    const row = document.createElement('div');
    row.className = 'dim-option-row';
    row.innerHTML = `
      <input type="text"  value="${escHtml(opt.label)}"        placeholder="Label" title="Nom de l'option">
      <input type="color" value="${opt.color || '#6366f1'}"     title="Couleur">
      <input type="text"  class="shortcut-input" data-shortcut-owner="option:${escHtml(dim.id)}:${escHtml(opt.id)}" value="${escHtml(opt.shortcut || '')}" maxlength="1" placeholder="⌨" title="Raccourci clavier">
      <button class="btn-remove-opt" title="Supprimer cette option">✕</button>
    `;
    const [lInp, cInp, sInp, delBtn] = row.querySelectorAll('input, button');
    lInp.addEventListener('input',   () => { opt.label    = lInp.value;    SessionManager.touch(); });
    cInp.addEventListener('input',   () => { opt.color    = cInp.value;    SessionManager.touch(); });
    sInp.addEventListener('input',   () => { opt.shortcut = sInp.value || null; SessionManager.touch(); this._updateShortcutConflicts(); });
    delBtn.addEventListener('click', () => {
      const i = dim.options.indexOf(opt);
      if (i === -1) return;
      dim.options.splice(i, 1);
      state.session.cards.forEach(c => {
        const v = c.classifications[dim.id];
        if (Array.isArray(v)) c.classifications[dim.id] = v.filter(x => x !== opt.id);
        else if (v === opt.id) delete c.classifications[dim.id];
      });
      row.remove(); SessionManager.touch();
    });
    return row;
  },

  _wire(form, dim, hdr) {
    const q = s => form.querySelector(s);
    q('.f-label')?.addEventListener('input', e => {
      dim.label = e.target.value;
      const t = hdr.querySelector('.dim-edit-title');
      if (t) t.textContent = dim.label;
      SessionManager.touch();
    });
    q('.f-type')?.addEventListener('change', e => {
      if (e.target.value === dim.type) return;
      if (!confirm(`Changer le type de "${dim.label}" en "${e.target.value}" ?\nLes classifications existantes pour cette dimension seront effacées.`)) {
        e.target.value = dim.type; return;
      }
      dim.type = e.target.value;
      if (!['single-choice','multi-tag'].includes(dim.type)) { /* keep options array */ }
      if (dim.type === 'scale') { dim.min ??= 1; dim.max ??= 5; dim.step ??= 1; }
      state.session.cards.forEach(c => delete c.classifications[dim.id]);
      this._rebuild(); SessionManager.touch();
    });
    q('.f-required')?.addEventListener('change',    e => { dim.required   = e.target.checked;         SessionManager.touch(); });
    q('.f-shortcut')?.addEventListener('input',     e => { dim.shortcut   = e.target.value || null;   SessionManager.touch(); this._updateShortcutConflicts(); });
    q('.f-min')?.addEventListener('input',          e => { dim.min        = parseInt(e.target.value) || 1; SessionManager.touch(); });
    q('.f-max')?.addEventListener('input',          e => { dim.max        = parseInt(e.target.value) || 5; SessionManager.touch(); });
    q('.f-step')?.addEventListener('input',         e => { dim.step       = parseInt(e.target.value) || 1; SessionManager.touch(); });
    q('.f-truelabel')?.addEventListener('input',    e => { dim.trueLabel  = e.target.value;           SessionManager.touch(); });
    q('.f-falselabel')?.addEventListener('input',   e => { dim.falseLabel = e.target.value;           SessionManager.touch(); });
  },

  _move(idx, dir) {
    const dims = state.session.dimensions;
    const ni   = idx + dir;
    if (ni < 0 || ni >= dims.length) return;
    [dims[idx], dims[ni]] = [dims[ni], dims[idx]];
    this._rebuild(); SessionManager.touch();
  },

  addNew() {
    const nd = {
      id:       `dim_${Date.now()}`,
      label:    'Nouvelle dimension',
      type:     'single-choice',
      required: false,
      options: [
        { id: `opt_${Date.now()}_a`, label: 'Option A', color: '#22c55e', shortcut: null },
        { id: `opt_${Date.now()}_b`, label: 'Option B', color: '#ef4444', shortcut: null },
      ]
    };
    state.session.dimensions.push(nd);
    this._rebuild();
    const list = document.getElementById('dim-editor-list');
    list.scrollTop = list.scrollHeight;
    SessionManager.touch();
  }
};

// ═══════════════════════════════════════════════════════════════════
// KEYBOARD HANDLER
// ═══════════════════════════════════════════════════════════════════

const KeyboardHandler = {
  _map: {},

  buildMap() {
    this._map = {};
    if (!state.session) return;
    for (const dim of state.session.dimensions) {
      if (dim.type === 'single-choice' || dim.type === 'multi-tag') {
        for (const opt of (dim.options || [])) {
          if (opt.shortcut) this._map[opt.shortcut.toLowerCase()] = { action: 'toggle', dimId: dim.id, optId: opt.id };
        }
        if (dim.type === 'single-choice' && dim.shortcut) {
          this._map[dim.shortcut.toLowerCase()] = { action: 'cycle-choice', dimId: dim.id };
        }
      } else if ((dim.type === 'scale' || dim.type === 'boolean') && dim.shortcut) {
        this._map[dim.shortcut.toLowerCase()] = {
          action: dim.type === 'scale' ? 'cycle-scale' : 'toggle-bool',
          dimId:  dim.id
        };
      }
    }
  },

  handle(e) {
    if (['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName)) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const k = e.key.toLowerCase();

    if (state.ui.view === 'focus') {
      if (k === 'arrowright' || k === ' ') { e.preventDefault(); nav(1);  return; }
      if (k === 'arrowleft')               { e.preventDefault(); nav(-1); return; }
      if (k === 'escape')                  {
        if (document.getElementById('focus-left')?.classList.contains('zoomed')) setImageZoom(false);
        else switchView('gallery');
        return;
      }
      if (k === 'n')                       { e.preventDefault(); document.getElementById('focus-notes').focus(); return; }

      const card = state.session?.cards[state.ui.currentCardIndex];
      if (!card) return;
      const act = this._map[k];
      if (!act) return;
      e.preventDefault();
      if      (act.action === 'toggle')      TaggingEngine.toggle(card, act.dimId, act.optId);
      else if (act.action === 'cycle-choice') TaggingEngine.cycleChoice(card, act.dimId);
      else if (act.action === 'cycle-scale') TaggingEngine.cycleScale(card, act.dimId);
      else if (act.action === 'toggle-bool') TaggingEngine.toggleBool(card, act.dimId);
      FocusView.render();
      updateProgress();
    }

    if (state.ui.view === 'gallery' && k === 's') { e.preventDefault(); exportDialog(); }
  }
};

// ═══════════════════════════════════════════════════════════════════
// NAVIGATION
// ═══════════════════════════════════════════════════════════════════

function switchView(view) {
  if (view !== 'focus') {
    swipeTransitionId++;
    swipeInProgress = false;
    touchActive = false;
    document.getElementById('focus-body')?.classList.remove('swipe-in-left', 'swipe-in-right', 'swipe-out-left', 'swipe-out-right');
  }
  state.ui.view = view;
  document.getElementById('empty-state').classList.toggle('hidden',    view !== 'empty');
  document.getElementById('view-gallery').classList.toggle('hidden',   view !== 'gallery');
  document.getElementById('view-focus').classList.toggle('hidden',     view !== 'focus');
  if (view === 'gallery') { renderDimensionFilters(); GalleryView.render();  updateProgress(); }
  if (view === 'focus')   { KeyboardHandler.buildMap(); FocusView.render(); updateProgress(); }
}

function setImageZoom(zoomed) {
  const panel = document.getElementById('focus-left');
  const button = document.getElementById('btn-zoom-image');
  if (!panel || !button) return;
  panel.classList.toggle('zoomed', zoomed);
  button.textContent = zoomed ? '⤡ Réduire' : '⤢ Agrandir';
  button.setAttribute('aria-expanded', String(zoomed));
}

function openFocus(idx) {
  const max = (state.session?.cards.length ?? 1) - 1;
  state.ui.currentCardIndex = Math.max(0, Math.min(idx, max));
  switchView('focus');
}

function nav(dir, fromSwipe = false) {
  if (swipeInProgress && !fromSwipe) return;
  if (!state.session) return;
  const next = state.ui.currentCardIndex + dir;
  if (next < 0 || next >= state.session.cards.length) return;
  state.ui.currentCardIndex = next;
  FocusView.render();
  StorageAdapter.saveLocal();
}

let swipeInProgress = false;
let swipeTransitionId = 0;
let touchActive = false;

function swipeNav(dir) {
  if (swipeInProgress || !state.session || state.ui.view !== 'focus') return;
  const next = state.ui.currentCardIndex + dir;
  if (next < 0 || next >= state.session.cards.length) return;
  swipeInProgress = true;
  const focusBody = document.getElementById('focus-body');
  const transitionId = ++swipeTransitionId;
  focusBody.classList.remove('swipe-in-left', 'swipe-in-right', 'swipe-out-left', 'swipe-out-right');
  focusBody.classList.add(dir > 0 ? 'swipe-out-left' : 'swipe-out-right');
  window.setTimeout(() => {
    if (transitionId !== swipeTransitionId || state.ui.view !== 'focus') return;
    nav(dir, true);
    focusBody.classList.remove('swipe-out-left', 'swipe-out-right');
    focusBody.classList.add(dir > 0 ? 'swipe-in-right' : 'swipe-in-left');
    window.setTimeout(() => {
      if (transitionId !== swipeTransitionId) return;
      focusBody.classList.remove('swipe-in-left', 'swipe-in-right');
      swipeInProgress = false;
    }, 180);
  }, 150);
}

function render() {
  if (!state.session?.cards.length) switchView('empty');
  else if (state.ui.view === 'empty') switchView('gallery');
  else switchView(state.ui.view);
  updateProgress();
}

// ═══════════════════════════════════════════════════════════════════
// EXPORT DIALOG
// ═══════════════════════════════════════════════════════════════════

function exportDialog() {
  const hasCards = Boolean(state.session?.cards.length);
  const embed = hasCards && confirm(
    'Inclure les images dans le fichier JSON ?\n\n' +
    'OK → fichier autoportant et partageable (plus volumineux)\n' +
    'Annuler → fichier léger (ré-importer les images à la prochaine ouverture)'
  );
  StorageAdapter.exportJSON(embed).then(() => toast('Session exportée ✓'));
}

// ═══════════════════════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════════════════════

function init() {
  const $imgs = document.getElementById('file-images');
  const $json = document.getElementById('file-json');

  function onImages(files) {
    if (!state.session) state.session = SessionManager.createNew();
    const n = SessionManager.addImages(Array.from(files));
    if (n) { toast(`${n} carte(s) ajoutée(s)`); render(); StorageAdapter.saveLocal(); }
    else    toast('Aucune nouvelle carte (doublons ignorés)', true);
  }

  // ── Fichiers
  $imgs.addEventListener('change', e => { onImages(e.target.files); e.target.value = ''; });
  $json.addEventListener('change', e => {
    const f = e.target.files[0]; if (!f) return;
    StorageAdapter.importJSON(f).then(session => {
      state.session = session;
      state.ui.currentCardIndex = 0;
      render();
      const missing = session.cards.filter(c => !getImageSrc(c)).length;
      toast(
        missing
          ? `Session chargée. ${missing} image(s) manquante(s).\nUtilisez "⊕ Images" pour les ré-importer.`
          : 'Session chargée ✓',
        false, 5000
      );
      StorageAdapter.saveLocal();
    }).catch(err => toast('Erreur : ' + err.message, true));
    e.target.value = '';
  });

  // ── Header
  document.getElementById('btn-new-session').addEventListener('click', () => {
    if (state.session?.cards.length &&
        !confirm('Créer une nouvelle session ? La session actuelle sera perdue si elle n\'a pas été exportée.')) return;
    state.session = SessionManager.createNew();
    state.imageMap = {};
    state.ui.currentCardIndex = 0;
    state.ui.unsaved = false;
    StorageAdapter.clearLocal();
    render();
  });
  document.getElementById('btn-import-images').addEventListener('click', () => {
    if (!state.session) state.session = SessionManager.createNew();
    $imgs.click();
  });
  document.getElementById('btn-import-json').addEventListener('click',    () => $json.click());
  document.getElementById('btn-export-json').addEventListener('click',    exportDialog);
  document.getElementById('btn-open-dim-editor').addEventListener('click', () => {
    if (!state.session) { toast('Créez ou chargez une session d\'abord.', true); return; }
    DimensionEditor.open();
  });

  // ── Empty state
  document.getElementById('btn-empty-images').addEventListener('click', () => {
    if (!state.session) state.session = SessionManager.createNew();
    $imgs.click();
  });
  document.getElementById('btn-empty-json').addEventListener('click', () => $json.click());

  // ── Focus nav
  document.getElementById('btn-prev').addEventListener('click', () => nav(-1));
  document.getElementById('btn-next').addEventListener('click', () => nav(1));
  document.getElementById('btn-back').addEventListener('click', () => switchView('gallery'));
  document.getElementById('btn-zoom-image').addEventListener('click', () => {
    setImageZoom(!document.getElementById('focus-left').classList.contains('zoomed'));
  });
  document.getElementById('focus-left').addEventListener('click', event => {
    if (event.target === event.currentTarget && event.currentTarget.classList.contains('zoomed')) setImageZoom(false);
  });

  let touchStartX = 0;
  let touchStartY = 0;
  const focusBody = document.getElementById('focus-body');
  focusBody.addEventListener('touchstart', event => {
    if (swipeInProgress) return;
    const touch = event.changedTouches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
    touchActive = true;
  }, { passive: true });
  focusBody.addEventListener('touchend', event => {
    if (swipeInProgress || !touchActive) return;
    touchActive = false;
    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - touchStartX;
    const deltaY = touch.clientY - touchStartY;
    if (state.ui.view !== 'focus' || Math.abs(deltaX) < 60 || Math.abs(deltaX) < Math.abs(deltaY)) return;
    swipeNav(deltaX < 0 ? 1 : -1);
  }, { passive: true });
  focusBody.addEventListener('touchcancel', () => { touchActive = false; }, { passive: true });

  // ── Notes
  document.getElementById('focus-notes').addEventListener('input', e => {
    const card = state.session?.cards[state.ui.currentCardIndex];
    if (card) { card.notes = e.target.value; SessionManager.touch(); StorageAdapter.saveLocal(); }
  });

  // ── Reset
  document.getElementById('btn-reset-card').addEventListener('click', () => {
    const card = state.session?.cards[state.ui.currentCardIndex];
    if (!card || !confirm('Effacer toutes les classifications de cette carte ?')) return;
    TaggingEngine.clearAll(card);
    FocusView.render();
    updateProgress();
  });

  // ── Gallery toolbar
  document.getElementById('search-input').addEventListener('input', e => {
    state.ui.search = e.target.value;
    if (state.ui.view === 'gallery') GalleryView.render();
  });
  document.querySelectorAll('.filter-btn').forEach(btn => btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.ui.filter = btn.dataset.filter;
    if (state.ui.view === 'gallery') GalleryView.render();
  }));
  document.getElementById('btn-sort-mode').addEventListener('click', () => {
    if (!state.session?.cards.length) return;
    const first = state.session.cards.findIndex(c => !TaggingEngine.isReviewed(c));
    openFocus(first >= 0 ? first : 0);
  });
  document.getElementById('btn-toggle-filters').addEventListener('click', e => {
    const panel = document.getElementById('filter-panel');
    const expanded = panel.classList.toggle('open');
    e.currentTarget.setAttribute('aria-expanded', String(expanded));
  });

  // ── Modal dimensions
  document.getElementById('btn-close-modal').addEventListener('click', () => DimensionEditor.close());
  document.getElementById('modal-overlay').addEventListener('click', e => {
    if (e.target.id === 'modal-overlay') DimensionEditor.close();
  });
  document.getElementById('btn-add-dim').addEventListener('click', () => DimensionEditor.addNew());
  document.getElementById('btn-export-config').addEventListener('click', () => StorageAdapter.exportConfig());

  // ── Clavier global
  document.addEventListener('keydown', e => KeyboardHandler.handle(e));

  // ── Bloquer le dépôt accidentel sans importer de fichier
  const app = document.getElementById('app');
  app.addEventListener('dragover',  e  => e.preventDefault());
  app.addEventListener('drop', e => e.preventDefault());

  // ── Avertissement fermeture non sauvegardée
  window.addEventListener('beforeunload', e => {
    if (state.ui.unsaved && state.session?.cards.length) {
      e.preventDefault(); e.returnValue = '';
    }
  });

  // ── Restauration depuis localStorage
  const saved = StorageAdapter.loadLocal();
  if (saved?.cards?.length) {
    state.session = saved;
    if (state.session.cards.every(card => card.imagePath?.startsWith('images_cube/'))) {
      sortDefaultCards(state.session.cards);
    }
    toast('Session précédente restaurée. Re-importez vos images si nécessaire.', false, 4500);
    render();
  } else {
    loadDefaultSession()
      .then(session => {
        state.session = session;
        render();
      })
      .catch(error => {
        console.warn('Images par défaut indisponibles:', error);
        render();
      });
  }
  updateSaveStatus();
}

document.addEventListener('DOMContentLoaded', init);
