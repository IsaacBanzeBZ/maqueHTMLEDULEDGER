/**
 * =============================================================
 *  EDULEDGER — Bibliothèque de graphiques Canvas
 *  Remplace : Recharts (BarChart, LineChart, PieChart, RadarChart)
 *
 *  Fonctions exposées :
 *   - EduCharts.bar(canvasId, labels, values, options)
 *   - EduCharts.line(canvasId, labels, datasets, options)
 *   - EduCharts.pie(canvasId, segments, options)
 *   - EduCharts.radar(canvasId, labels, datasets, options)
 *
 *  Aucune dépendance externe. Vanilla Canvas 2D API.
 * =============================================================
 */

const EduCharts = (() => {

  /* ── Lit les CSS variables pour respecter le thème ── */
  function cssVar(name) {
    return getComputedStyle(document.documentElement)
      .getPropertyValue(name)
      .trim();
  }

  /* ── Couleurs par défaut depuis le thème CSS ── */
  function themeColors() {
    return {
      primary:    `hsl(${cssVar('--clr-primary')  || '217 84% 53%'})`,
      accent:     `hsl(${cssVar('--clr-accent')   || '160 84% 39%'})`,
      secondary:  `hsl(${cssVar('--clr-secondary')|| '221 72% 40%'})`,
      muted:      `hsl(${cssVar('--clr-muted')    || '210 40% 96%'})`,
      mutedFg:    `hsl(${cssVar('--clr-muted-fg') || '215 16% 47%'})`,
      border:     `hsl(${cssVar('--clr-border')   || '220 13% 91%'})`,
      fg:         `hsl(${cssVar('--clr-fg')       || '222 47% 11%'})`,
      card:       `hsl(${cssVar('--clr-card')     || '0 0% 100%'})`,
    };
  }

  /* ── Palette de couleurs pour les graphiques multi-séries ── */
  const PALETTE = [
    '#2563eb',  // blue-600 (primary)
    '#10b981',  // emerald-500 (accent)
    '#8b5cf6',  // violet-500
    '#f59e0b',  // amber-500
    '#ef4444',  // red-500
    '#06b6d4',  // cyan-500
    '#ec4899',  // pink-500
    '#84cc16',  // lime-500
  ];

  /* ── Utilitaire : retaille le canvas correctement (HiDPI) ── */
  function setupCanvas(canvas) {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width  = rect.width  * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    // Taille CSS (non modifiée)
    canvas.style.width  = rect.width  + 'px';
    canvas.style.height = rect.height + 'px';
    return { ctx, w: rect.width, h: rect.height };
  }

  /* ── Arrondit les coins d'un rectangle (barre de graphique) ── */
  function roundedRect(ctx, x, y, w, h, r) {
    if (h < 0) { y += h; h = Math.abs(h); }
    if (r > h / 2) r = h / 2;
    if (r > w / 2) r = w / 2;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  /* ── Tronque un texte si trop long ── */
  function truncate(ctx, text, maxWidth) {
    if (ctx.measureText(text).width <= maxWidth) return text;
    let t = text;
    while (t.length > 1 && ctx.measureText(t + '…').width > maxWidth) t = t.slice(0, -1);
    return t + '…';
  }

  /* ==========================================================
     GRAPHIQUE EN BARRES (Bar Chart)
     labels  : string[]
     values  : number[]  ou  { data: number[], label: string, color?: string }[]
     options :
       maxValue, color, unit, thresholdY, thresholdLabel, barRadius,
       showValues, title, horizontal
     ========================================================== */
  function bar(canvasId, labels, values, options = {}) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const tc = themeColors();
    const { ctx, w, h } = setupCanvas(canvas);

    const {
      color       = tc.primary,
      unit        = '',
      thresholdY  = null,
      barRadius   = 6,
      showValues  = true,
    } = options;

    // Support multi-dataset
    const isMulti = Array.isArray(values) && typeof values[0] === 'object' && 'data' in values[0];
    const datasets = isMulti ? values : [{ data: values, color }];

    // Calcul des marges
    const paddingTop    = 24;
    const paddingBottom = 44;
    const paddingLeft   = 40;
    const paddingRight  = 16;
    const chartW = w - paddingLeft - paddingRight;
    const chartH = h - paddingTop - paddingBottom;

    // Valeur max
    const allValues = datasets.flatMap(ds => ds.data);
    const maxVal = options.maxValue || Math.ceil(Math.max(...allValues) * 1.1);

    // Grille & axes
    ctx.font = '10px Inter, sans-serif';
    ctx.textBaseline = 'middle';

    // Lignes de grille horizontales
    const gridLines = 5;
    for (let i = 0; i <= gridLines; i++) {
      const y = paddingTop + chartH - (i / gridLines) * chartH;
      const val = ((i / gridLines) * maxVal).toFixed(maxVal <= 20 ? 0 : 0);

      ctx.strokeStyle = tc.border;
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(paddingLeft, y);
      ctx.lineTo(paddingLeft + chartW, y);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = tc.mutedFg;
      ctx.textAlign = 'right';
      ctx.fillText(val, paddingLeft - 6, y);
    }

    // Ligne de seuil (ex: score minimum 10)
    if (thresholdY !== null && thresholdY >= 0) {
      const ty = paddingTop + chartH - (thresholdY / maxVal) * chartH;
      ctx.strokeStyle = 'hsl(0 84% 60%)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.moveTo(paddingLeft, ty);
      ctx.lineTo(paddingLeft + chartW, ty);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = 'hsl(0 84% 60%)';
      ctx.textAlign = 'left';
      ctx.fillText(options.thresholdLabel || `Seuil ${thresholdY}`, paddingLeft + 4, ty - 8);
    }

    // Barres
    const totalGroups = labels.length;
    const groupW = chartW / totalGroups;
    const dsCount = datasets.length;
    const gap = 4;
    const barTotalW = groupW * 0.75;
    const barW = (barTotalW - gap * (dsCount - 1)) / dsCount;

    datasets.forEach((ds, dsIndex) => {
      const barColor = ds.color || PALETTE[dsIndex % PALETTE.length];

      ds.data.forEach((value, i) => {
        const barH = (value / maxVal) * chartH;
        const groupX = paddingLeft + i * groupW + groupW * 0.125;
        const x = groupX + dsIndex * (barW + gap);
        const y = paddingTop + chartH - barH;

        ctx.fillStyle = barColor;
        roundedRect(ctx, x, y, barW, barH, barRadius);
        ctx.fill();

        // Valeur au-dessus de la barre
        if (showValues && barH > 16) {
          ctx.fillStyle = tc.fg;
          ctx.font = '10px Inter, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'bottom';
          ctx.fillText(value + unit, x + barW / 2, y - 2);
          ctx.textBaseline = 'middle';
        }
      });
    });

    // Labels axe X
    ctx.fillStyle = tc.mutedFg;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.font = '10px Inter, sans-serif';
    labels.forEach((label, i) => {
      const cx = paddingLeft + i * groupW + groupW / 2;
      ctx.fillText(truncate(ctx, label, groupW - 4), cx, paddingTop + chartH + 8);
    });
  }

  /* ==========================================================
     GRAPHIQUE EN LIGNE (Line Chart)
     labels   : string[]
     datasets : { data: number[], label: string, color?: string, fill?: boolean }[]
     ========================================================== */
  function line(canvasId, labels, datasets, options = {}) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const tc = themeColors();
    const { ctx, w, h } = setupCanvas(canvas);
    const { smooth = true, showDots = true, showValues = false } = options;

    const paddingTop    = 24;
    const paddingBottom = 44;
    const paddingLeft   = 44;
    const paddingRight  = 16;
    const chartW = w - paddingLeft - paddingRight;
    const chartH = h - paddingTop - paddingBottom;

    const allValues = datasets.flatMap(ds => ds.data).filter(v => v !== undefined);
    const maxVal = options.maxValue || Math.ceil(Math.max(...allValues) * 1.15);
    const minVal = options.minValue ?? 0;
    const range = maxVal - minVal;

    // Grille
    const gridLines = 5;
    ctx.font = '10px Inter, sans-serif';
    for (let i = 0; i <= gridLines; i++) {
      const y = paddingTop + chartH - (i / gridLines) * chartH;
      const val = (minVal + (i / gridLines) * range).toFixed(1);

      ctx.strokeStyle = tc.border;
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(paddingLeft, y); ctx.lineTo(paddingLeft + chartW, y);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = tc.mutedFg;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(val, paddingLeft - 6, y);
    }

    // Référence horizontale (ex: moyenne nationale)
    if (options.referenceLine !== undefined) {
      const ry = paddingTop + chartH - ((options.referenceLine - minVal) / range) * chartH;
      ctx.strokeStyle = tc.accent;
      ctx.lineWidth = 1;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(paddingLeft, ry); ctx.lineTo(paddingLeft + chartW, ry);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Point X helper
    const xPos = (i) => paddingLeft + (i / (labels.length - 1)) * chartW;
    const yPos = (v) => paddingTop + chartH - ((v - minVal) / range) * chartH;

    datasets.forEach((ds, dsIndex) => {
      const color = ds.color || PALETTE[dsIndex % PALETTE.length];
      const pts = ds.data;

      // Zone de remplissage (fill)
      if (ds.fill) {
        ctx.beginPath();
        ctx.moveTo(xPos(0), yPos(pts[0]));
        for (let i = 1; i < pts.length; i++) {
          if (smooth) {
            const cpx = (xPos(i - 1) + xPos(i)) / 2;
            ctx.bezierCurveTo(cpx, yPos(pts[i - 1]), cpx, yPos(pts[i]), xPos(i), yPos(pts[i]));
          } else {
            ctx.lineTo(xPos(i), yPos(pts[i]));
          }
        }
        ctx.lineTo(xPos(pts.length - 1), paddingTop + chartH);
        ctx.lineTo(xPos(0), paddingTop + chartH);
        ctx.closePath();
        ctx.fillStyle = color.replace(')', ' / 0.1)').replace('hsl(', 'hsl(');
        ctx.fill();
      }

      // Ligne
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.setLineDash([]);

      ctx.beginPath();
      ctx.moveTo(xPos(0), yPos(pts[0]));
      for (let i = 1; i < pts.length; i++) {
        if (smooth) {
          const cpx = (xPos(i - 1) + xPos(i)) / 2;
          ctx.bezierCurveTo(cpx, yPos(pts[i - 1]), cpx, yPos(pts[i]), xPos(i), yPos(pts[i]));
        } else {
          ctx.lineTo(xPos(i), yPos(pts[i]));
        }
      }
      ctx.stroke();

      // Points
      if (showDots) {
        pts.forEach((v, i) => {
          ctx.beginPath();
          ctx.arc(xPos(i), yPos(v), 4, 0, Math.PI * 2);
          ctx.fillStyle = color;
          ctx.fill();
          ctx.strokeStyle = tc.card;
          ctx.lineWidth = 2;
          ctx.stroke();
        });
      }

      // Valeurs au-dessus des points
      if (showValues) {
        ctx.fillStyle = tc.fg;
        ctx.font = '10px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        pts.forEach((v, i) => ctx.fillText(v, xPos(i), yPos(v) - 8));
        ctx.textBaseline = 'middle';
      }
    });

    // Labels axe X
    ctx.fillStyle = tc.mutedFg;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.font = '10px Inter, sans-serif';
    labels.forEach((label, i) => {
      ctx.fillText(label, xPos(i), paddingTop + chartH + 8);
    });
  }

  /* ==========================================================
     GRAPHIQUE CAMEMBERT / DONUT (Pie / Donut)
     segments : { label: string, value: number, color?: string }[]
     ========================================================== */
  function pie(canvasId, segments, options = {}) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const tc = themeColors();
    const { ctx, w, h } = setupCanvas(canvas);
    const {
      donut    = true,
      donutRatio = 0.55,
      showLabels = false,
      showLegend = true,   // la légende est rendue hors du canvas via legend()
    } = options;

    const cx = w / 2;
    const cy = h / 2;
    const radius = Math.min(w, h) / 2 - 16;

    const total = segments.reduce((sum, s) => sum + s.value, 0);
    let startAngle = -Math.PI / 2;

    segments.forEach((seg, i) => {
      const color = seg.color || PALETTE[i % PALETTE.length];
      const sliceAngle = (seg.value / total) * Math.PI * 2;

      // Tranche
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius, startAngle, startAngle + sliceAngle);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = tc.card;
      ctx.lineWidth = 2;
      ctx.stroke();

      startAngle += sliceAngle;
    });

    // Trou donut
    if (donut) {
      ctx.beginPath();
      ctx.arc(cx, cy, radius * donutRatio, 0, Math.PI * 2);
      ctx.fillStyle = tc.card;
      ctx.fill();

      // % total au centre
      ctx.fillStyle = tc.fg;
      ctx.font = `bold 1.5rem Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(total, cx, cy - 8);
      ctx.font = '0.625rem Inter, sans-serif';
      ctx.fillStyle = tc.mutedFg;
      ctx.fillText('total', cx, cy + 12);
    }
  }

  /* ==========================================================
     GRAPHIQUE RADAR
     labels   : string[]
     datasets : { data: number[], color?: string, label?: string }[]
     maxValue : number (défaut 20)
     ========================================================== */
  function radar(canvasId, labels, datasets, options = {}) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const tc = themeColors();
    const { ctx, w, h } = setupCanvas(canvas);
    const { maxValue = 20 } = options;

    const cx = w / 2;
    const cy = h / 2;
    const radius = Math.min(w, h) / 2 - 40;
    const sides = labels.length;
    const step = (Math.PI * 2) / sides;
    const rings = 4;

    // Angle de chaque axe (base : vers le haut = -π/2)
    const angle = (i) => step * i - Math.PI / 2;

    // Point sur l'axe i à la valeur v
    const pt = (i, v) => ({
      x: cx + (v / maxValue) * radius * Math.cos(angle(i)),
      y: cy + (v / maxValue) * radius * Math.sin(angle(i)),
    });

    // Anneaux de fond
    for (let r = 1; r <= rings; r++) {
      ctx.beginPath();
      for (let i = 0; i < sides; i++) {
        const { x, y } = pt(i, (r / rings) * maxValue);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.strokeStyle = tc.border;
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Axes radiaux
    for (let i = 0; i < sides; i++) {
      const outer = pt(i, maxValue);
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(outer.x, outer.y);
      ctx.strokeStyle = tc.border;
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Labels des axes
    ctx.font = '11px Inter, sans-serif';
    ctx.fillStyle = tc.mutedFg;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < sides; i++) {
      const { x, y } = pt(i, maxValue * 1.18);
      ctx.fillText(labels[i], x, y);
    }

    // Polygones des jeux de données
    datasets.forEach((ds, dsIndex) => {
      const color = ds.color || PALETTE[dsIndex % PALETTE.length];

      // Zone colorée
      ctx.beginPath();
      for (let i = 0; i < sides; i++) {
        const { x, y } = pt(i, ds.data[i] ?? 0);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fillStyle = color.replace(')', ' / 0.15)').replace('hsl(', 'hsl(');
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Points
      for (let i = 0; i < sides; i++) {
        const { x, y } = pt(i, ds.data[i] ?? 0);
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = tc.card;
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    });
  }

  /* ==========================================================
     REDESSIN AU CHANGEMENT DE THÈME
     ========================================================== */

  /**
   * Enregistre un graphique pour qu'il se redessine au changement de thème.
   * drawFn : function() → rappel de la fonction de dessin
   */
  function watchTheme(drawFn) {
    const observer = new MutationObserver(() => drawFn());
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });
    // Dessine immédiatement
    drawFn();
  }

  /* API publique */
  return { bar, line, pie, radar, watchTheme };

})();

window.EduCharts = EduCharts;
