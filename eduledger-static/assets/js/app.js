/**
 * =============================================================
 *  EDULEDGER — Application JavaScript principale
 *  Remplace : React state, React Router, hooks, Framer Motion
 *
 *  Fonctionnalités :
 *   - Basculement thème clair/sombre
 *   - Collapse / expand de la sidebar
 *   - Navigation active (highlight du lien courant)
 *   - Modales (open/close)
 *   - Dropdown menus
 *   - Visibilité mot de passe (login)
 *   - Drag & drop zone upload (cosmétique)
 *   - Support mobile (overlay sidebar)
 *   - Tabs (onglets)
 *   - Recherche dans les tableaux (côté client)
 * =============================================================
 */

/* ─────────────────────────────────────────────────────────
   THÈME CLAIR / SOMBRE
   Persist dans localStorage
   ───────────────────────────────────────────────────────── */

const ThemeManager = (() => {
  const STORAGE_KEY = 'eduledger-theme';
  const html = document.documentElement;

  function get() {
    return localStorage.getItem(STORAGE_KEY)
      || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  }

  function apply(theme) {
    html.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }

  function toggle() {
    apply(get() === 'dark' ? 'light' : 'dark');
  }

  function init() {
    apply(get());
    // Bouton toggle (id="themeToggle" partout)
    document.querySelectorAll('[data-action="theme-toggle"], #themeToggle').forEach(btn => {
      btn.addEventListener('click', toggle);
    });
  }

  return { init, get, apply, toggle };
})();

/* ─────────────────────────────────────────────────────────
   SIDEBAR
   ───────────────────────────────────────────────────────── */

const SidebarManager = (() => {
  const STORAGE_KEY = 'eduledger-sidebar';
  let sidebar, overlay;

  function getState() {
    return Boolean(sessionStorage.getItem(STORAGE_KEY));
  }

  function setCollapsed(collapsed) {
    if (!sidebar) return;
    if (collapsed) {
      sidebar.classList.add('collapsed');
      sessionStorage.setItem(STORAGE_KEY, '1');
    } else {
      sidebar.classList.remove('collapsed');
      sessionStorage.removeItem(STORAGE_KEY);
    }
  }

  function toggle() {
    if (!sidebar) return;
    // Sur mobile : toggle mobile-open
    if (window.innerWidth <= 768) {
      const isOpen = sidebar.classList.contains('mobile-open');
      sidebar.classList.toggle('mobile-open', !isOpen);
      if (overlay) overlay.classList.toggle('visible', !isOpen);
    } else {
      setCollapsed(!sidebar.classList.contains('collapsed'));
    }
  }

  function init() {
    sidebar = document.getElementById('sidebar');
    overlay = document.getElementById('mobileOverlay');

    if (!sidebar) return;

    // Rétablit l'état sauvegardé
    if (window.innerWidth > 768 && getState()) {
      sidebar.classList.add('collapsed');
    }

    // Bouton toggle
    document.querySelectorAll('[data-action="sidebar-toggle"], #sidebarToggle').forEach(btn => {
      btn.addEventListener('click', toggle);
    });

    // Ferme sur clic overlay mobile
    if (overlay) {
      overlay.addEventListener('click', () => {
        sidebar.classList.remove('mobile-open');
        overlay.classList.remove('visible');
      });
    }
  }

  return { init, toggle, setCollapsed };
})();

/* ─────────────────────────────────────────────────────────
   NAVIGATION ACTIVE
   Met en surbrillance le lien de nav correspondant à l'URL
   ───────────────────────────────────────────────────────── */

function highlightActiveNav() {
  const path = window.location.pathname;

  document.querySelectorAll('.nav-link[href]').forEach(link => {
    const href = link.getAttribute('href');
    if (!href) return;

    // Résout le chemin relatif en chemin absolu
    const resolved = new URL(href, window.location.href).pathname;

    // Actif exact or parent path
    const isActive = path === resolved
      || (resolved !== '/' && resolved !== '/index.html' && path.startsWith(resolved.replace(/\/index\.html$/, '')));

    link.classList.toggle('active', isActive);
    if (isActive) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
}

/* ─────────────────────────────────────────────────────────
   MODALES
   Ouvre/ferme les modales via data-modal="<id>"
   ───────────────────────────────────────────────────────── */

const ModalManager = (() => {
  function open(modalId) {
    const overlay = document.getElementById(modalId);
    if (!overlay) return;
    overlay.classList.add('open');
    // Focus sur le premier champ interactif
    const first = overlay.querySelector('input, button, select');
    if (first) setTimeout(() => first.focus(), 50);
    document.body.style.overflow = 'hidden';
  }

  function close(modalId) {
    const overlay = document.getElementById(modalId);
    if (!overlay) return;
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  function init() {
    // Boutons d'ouverture : data-modal-open="<id>"
    document.querySelectorAll('[data-modal-open]').forEach(btn => {
      btn.addEventListener('click', () => open(btn.dataset.modalOpen));
    });

    // Boutons de fermeture : data-modal-close ou .modal-close
    document.querySelectorAll('[data-modal-close], .modal-close').forEach(btn => {
      btn.addEventListener('click', () => {
        const overlay = btn.closest('.modal-overlay');
        if (overlay) close(overlay.id);
      });
    });

    // Clic sur l'overlay ferme la modale
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) close(overlay.id);
      });
    });

    // Touche Échap
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        document.querySelectorAll('.modal-overlay.open').forEach(overlay => {
          close(overlay.id);
        });
      }
    });
  }

  return { init, open, close };
})();

/* ─────────────────────────────────────────────────────────
   DROPDOWN MENUS
   ───────────────────────────────────────────────────────── */

function initDropdowns() {
  document.querySelectorAll('[data-dropdown]').forEach(trigger => {
    const menu = document.getElementById(trigger.dataset.dropdown);
    if (!menu) return;

    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = menu.classList.contains('open');
      // Ferme tous les dropdowns ouverts
      document.querySelectorAll('.dropdown-menu.open').forEach(m => m.classList.remove('open'));
      if (!isOpen) menu.classList.add('open');
    });
  });

  // Clic en dehors ferme tout
  document.addEventListener('click', () => {
    document.querySelectorAll('.dropdown-menu.open').forEach(m => m.classList.remove('open'));
  });
}

/* ─────────────────────────────────────────────────────────
   TOGGLE VISIBILITÉ MOT DE PASSE
   ───────────────────────────────────────────────────────── */

function initPasswordToggles() {
  document.querySelectorAll('[data-toggle-password]').forEach(btn => {
    const targetId = btn.dataset.togglePassword;
    const input = targetId
      ? document.getElementById(targetId)
      : btn.closest('.input-wrapper')?.querySelector('input[type="password"], input[type="text"]');

    if (!input) return;

    btn.addEventListener('click', () => {
      const isPassword = input.type === 'password';
      input.type = isPassword ? 'text' : 'password';

      // Change l'icône (œil → œil barré)
      const eyeOpen  = btn.querySelector('.icon-eye');
      const eyeOff   = btn.querySelector('.icon-eye-off');
      if (eyeOpen)  eyeOpen.style.display  = isPassword ? 'none'  : 'block';
      if (eyeOff)   eyeOff.style.display   = isPassword ? 'block' : 'none';
    });
  });
}

/* ─────────────────────────────────────────────────────────
   ZONE DE DÉPÔT FICHIER (Upload zone)
   ───────────────────────────────────────────────────────── */

function initUploadZones() {
  document.querySelectorAll('.upload-zone').forEach(zone => {
    const input = zone.querySelector('input[type="file"]');

    zone.addEventListener('click', () => input?.click());

    zone.addEventListener('dragover', (e) => {
      e.preventDefault();
      zone.classList.add('dragging');
    });

    zone.addEventListener('dragleave', () => zone.classList.remove('dragging'));

    zone.addEventListener('drop', (e) => {
      e.preventDefault();
      zone.classList.remove('dragging');
      const files = e.dataTransfer.files;
      if (files.length > 0) handleFileSelected(zone, files[0]);
    });

    input?.addEventListener('change', () => {
      if (input.files.length > 0) handleFileSelected(zone, input.files[0]);
    });
  });
}

function handleFileSelected(zone, file) {
  const nameEl = zone.querySelector('.upload-zone-text');
  const hintEl = zone.querySelector('.upload-zone-hint');
  if (nameEl) nameEl.textContent = file.name;
  if (hintEl) hintEl.textContent = `${(file.size / 1024).toFixed(1)} Ko — Prêt à importer`;
  zone.classList.add('file-selected');
}

/* ─────────────────────────────────────────────────────────
   TABS (onglets)
   ───────────────────────────────────────────────────────── */

function initTabs() {
  document.querySelectorAll('.tabs-list').forEach(list => {
    const triggers = list.querySelectorAll('.tab-trigger');

    triggers.forEach(trigger => {
      trigger.addEventListener('click', () => {
        const tabId = trigger.dataset.tab;
        const container = list.closest('.tabs');
        if (!container || !tabId) return;

        // Met à jour les triggers
        triggers.forEach(t => t.setAttribute('aria-selected', 'false'));
        trigger.setAttribute('aria-selected', 'true');

        // Met à jour les panels
        container.querySelectorAll('.tab-panel').forEach(panel => {
          panel.classList.toggle('active', panel.id === tabId);
        });
      });
    });

    // Initialise le premier onglet
    const first = triggers[0];
    if (first && !list.querySelector('[aria-selected="true"]')) {
      first.setAttribute('aria-selected', 'true');
      const firstTabId = first.dataset.tab;
      const container = list.closest('.tabs');
      container?.querySelector(`#${firstTabId}`)?.classList.add('active');
    }
  });
}

/* ─────────────────────────────────────────────────────────
   RECHERCHE DANS LES TABLEAUX (côté client)
   Usage : <input data-search-table="tableId" placeholder="Rechercher…">
   ───────────────────────────────────────────────────────── */

function initTableSearch() {
  document.querySelectorAll('[data-search-table]').forEach(input => {
    const tableId = input.dataset.searchTable;

    input.addEventListener('input', () => {
      const query = input.value.toLowerCase().trim();
      const table = document.getElementById(tableId);
      if (!table) return;

      table.querySelectorAll('tbody tr').forEach(row => {
        row.style.display = row.textContent.toLowerCase().includes(query) ? '' : 'none';
      });
    });
  });
}

/* ─────────────────────────────────────────────────────────
   FILTRE SELECT SUR LES TABLEAUX
   Usage : <select data-filter-table="tableId" data-filter-col="2">
   ───────────────────────────────────────────────────────── */

function initTableFilters() {
  document.querySelectorAll('[data-filter-table]').forEach(select => {
    select.addEventListener('change', () => {
      const tableId = select.dataset.filterTable;
      const colIndex = parseInt(select.dataset.filterCol ?? '0', 10);
      const value = select.value.toLowerCase();
      const table = document.getElementById(tableId);
      if (!table) return;

      table.querySelectorAll('tbody tr').forEach(row => {
        const cell = row.cells[colIndex];
        const match = !value || (cell && cell.textContent.toLowerCase().includes(value));
        row.style.display = match ? '' : 'none';
      });
    });
  });
}

/* ─────────────────────────────────────────────────────────
   FORMULAIRE DE CONNEXION (validation simple)
   ───────────────────────────────────────────────────────── */

function initLoginForms() {
  document.querySelectorAll('.login-form').forEach(form => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const btn = form.querySelector('[type="submit"]');
      const emailInp = form.querySelector('#email');
      const passInp  = form.querySelector('#password');

      // Validation simple
      let valid = true;

      if (emailInp && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInp.value)) {
        showFieldError(emailInp, 'Adresse email invalide');
        valid = false;
      } else clearFieldError(emailInp);

      if (passInp && passInp.value.length < 6) {
        showFieldError(passInp, 'Le mot de passe doit contenir au moins 6 caractères');
        valid = false;
      } else clearFieldError(passInp);

      if (!valid) return;

      // Simule le chargement puis redirige
      if (btn) {
        btn.disabled = true;
        btn.textContent = 'Connexion…';
      }

      const redirect = form.dataset.redirect || '../admin/dashboard.html';
      setTimeout(() => { window.location.href = redirect; }, 900);
    });
  });
}

function showFieldError(input, message) {
  if (!input) return;
  input.style.borderColor = 'var(--clr-destructive)';
  let err = input.closest('.form-group')?.querySelector('.form-error');
  if (!err) {
    err = document.createElement('p');
    err.className = 'form-error';
    input.closest('.form-group')?.appendChild(err);
  }
  err.textContent = message;
}

function clearFieldError(input) {
  if (!input) return;
  input.style.borderColor = '';
  input.closest('.form-group')?.querySelector('.form-error')?.remove();
}

/* ─────────────────────────────────────────────────────────
   QUICK ACTIONS CARDS (navigation du dashboard)
   ───────────────────────────────────────────────────────── */

function initQuickActions() {
  document.querySelectorAll('[data-href]').forEach(el => {
    el.style.cursor = 'pointer';
    el.addEventListener('click', () => {
      window.location.href = el.dataset.href;
    });
    // Accessibilité clavier
    el.setAttribute('tabindex', '0');
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        window.location.href = el.dataset.href;
      }
    });
  });
}

/* ─────────────────────────────────────────────────────────
   MENU MOBILE (hamburger nav landing page)
   ───────────────────────────────────────────────────────── */

function initMobileMenu() {
  const btn = document.getElementById('mobileMenuBtn');
  const menu = document.getElementById('mobileMenu');
  if (!btn || !menu) return;

  btn.addEventListener('click', () => {
    const isOpen = menu.style.display === 'flex';
    menu.style.display = isOpen ? 'none' : 'flex';
  });
}

/* ─────────────────────────────────────────────────────────
   INITIALISATION GLOBALE
   ───────────────────────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', () => {
  ThemeManager.init();
  SidebarManager.init();
  highlightActiveNav();
  ModalManager.init();
  initDropdowns();
  initPasswordToggles();
  initUploadZones();
  initTabs();
  initTableSearch();
  initTableFilters();
  initLoginForms();
  initQuickActions();
  initMobileMenu();
});

/* Expose les utils publics */
window.EduLedger = { ThemeManager, SidebarManager, ModalManager };
