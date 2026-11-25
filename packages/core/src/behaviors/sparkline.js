// Sparkline geometry engine (Fritsch-Carlson monotone cubic Hermite splines, area fills, bars) & plain-HTML initializer.

const SVG_NS = 'http://www.w3.org/2000/svg';

/**
 * @param {number} n
 * @param {number} lo
 * @param {number} hi
 */
const clamp = (n, lo, hi) => (n < lo ? lo : n > hi ? hi : n);

/**
 * Format SVG coordinate cleanly up to 3 decimal places without trailing zeros.
 * @param {number} n
 * @returns {number}
 */
const fmt = (n) => Math.round(n * 1000) / 1000;

/**
 * @typedef {'line' | 'area' | 'bar'} SparklineVariant
 *
 * @typedef {object} SparklineOptions
 * @property {number} [width=88]
 * @property {number} [height=24]
 * @property {number} [strokeWidth=1.5]
 * @property {number} [padding=2]
 * @property {SparklineVariant} [variant='line']
 * @property {boolean} [smooth=false]
 * @property {number} [min]
 * @property {number} [max]
 * @property {number} [barGap=1.5]
 *
 * @typedef {object} SparklinePoint
 * @property {number} x
 * @property {number} y
 * @property {number} value
 * @property {number} index
 *
 * @typedef {object} SparklineBar
 * @property {number} x
 * @property {number} y
 * @property {number} width
 * @property {number} height
 * @property {number} value
 * @property {number} index
 * @property {boolean} isMin
 * @property {boolean} isMax
 * @property {boolean} isLast
 *
 * @typedef {object} SparklineGeometry
 * @property {string} viewBox
 * @property {string} linePath
 * @property {string} areaPath
 * @property {SparklineBar[]} bars
 * @property {SparklinePoint[]} points
 * @property {SparklinePoint | null} lastPoint
 * @property {SparklinePoint | null} minPoint
 * @property {SparklinePoint | null} maxPoint
 * @property {number | null} minValue
 * @property {number | null} maxValue
 */

/**
 * Compute Fritsch-Carlson monotone cubic Hermite SVG path (`M ... C ...`).
 * Guaranteed never to overshoot local or global data bounds.
 * @param {SparklinePoint[]} pts
 * @returns {string}
 */
function buildMonotoneSplinePath(pts) {
  const n = pts.length;
  if (n === 0) return '';
  if (n === 1) return `M ${fmt(pts[0].x)} ${fmt(pts[0].y)} L ${fmt(pts[0].x)} ${fmt(pts[0].y)}`;

  /** @type {number[]} */
  const h = new Array(n - 1);
  /** @type {number[]} */
  const delta = new Array(n - 1);

  for (let k = 0; k < n - 1; k += 1) {
    const dx = pts[k + 1].x - pts[k].x;
    h[k] = dx > 0 ? dx : 1e-6;
    delta[k] = (pts[k + 1].y - pts[k].y) / h[k];
  }

  /** @type {number[]} */
  const m = new Array(n);
  m[0] = delta[0];
  m[n - 1] = delta[n - 2];

  for (let k = 1; k < n - 1; k += 1) {
    const d0 = delta[k - 1];
    const d1 = delta[k];
    if (d0 === 0 || d1 === 0 || d0 > 0 !== d1 > 0) {
      m[k] = 0;
    } else {
      const w1 = 2 * h[k] + h[k - 1];
      const w2 = h[k] + 2 * h[k - 1];
      m[k] = (w1 + w2) / (w1 / d0 + w2 / d1);
    }
  }

  for (let k = 0; k < n - 1; k += 1) {
    const dk = delta[k];
    if (dk === 0) {
      m[k] = 0;
      m[k + 1] = 0;
    } else {
      let alpha = m[k] / dk;
      let beta = m[k + 1] / dk;
      if (alpha < 0) {
        m[k] = 0;
        alpha = 0;
      }
      if (beta < 0) {
        m[k + 1] = 0;
        beta = 0;
      }
      const r = alpha * alpha + beta * beta;
      if (r > 9) {
        const tau = 3 / Math.sqrt(r);
        m[k] = tau * alpha * dk;
        m[k + 1] = tau * beta * dk;
      }
    }
  }

  let d = `M ${fmt(pts[0].x)} ${fmt(pts[0].y)}`;
  for (let k = 0; k < n - 1; k += 1) {
    const p0 = pts[k];
    const p1 = pts[k + 1];
    const hk = h[k];
    const lo = Math.min(p0.y, p1.y);
    const hi = Math.max(p0.y, p1.y);
    const cp1x = p0.x + hk / 3;
    const cp1y = clamp(p0.y + (m[k] * hk) / 3, lo, hi);
    const cp2x = p1.x - hk / 3;
    const cp2y = clamp(p1.y - (m[k + 1] * hk) / 3, lo, hi);
    d += ` C ${fmt(cp1x)} ${fmt(cp1y)}, ${fmt(cp2x)} ${fmt(cp2y)}, ${fmt(p1.x)} ${fmt(p1.y)}`;
  }
  return d;
}

/**
 * Pure zero-dependency sparkline geometry engine.
 * @param {readonly number[] | null | undefined} data
 * @param {SparklineOptions} [options]
 * @returns {SparklineGeometry}
 */
export function computeSparkline(data, options = {}) {
  const w =
    typeof options.width === 'number' && Number.isFinite(options.width) && options.width > 0
      ? options.width
      : 88;
  const h =
    typeof options.height === 'number' && Number.isFinite(options.height) && options.height > 0
      ? options.height
      : 24;
  const pad =
    typeof options.padding === 'number' && Number.isFinite(options.padding) && options.padding >= 0
      ? options.padding
      : 2;
  const smooth = Boolean(options.smooth);
  const barGap =
    typeof options.barGap === 'number' && Number.isFinite(options.barGap) && options.barGap >= 0
      ? options.barGap
      : 1.5;

  const viewBox = `0 0 ${fmt(w)} ${fmt(h)}`;

  /** @type {number[]} */
  const values = [];
  if (data && typeof data[Symbol.iterator] === 'function') {
    for (const raw of data) {
      const num = typeof raw === 'number' ? raw : Number(raw);
      if (Number.isFinite(num)) values.push(num);
    }
  }

  const n = values.length;
  if (n === 0) {
    return {
      viewBox,
      linePath: '',
      areaPath: '',
      bars: [],
      points: [],
      lastPoint: null,
      minPoint: null,
      maxPoint: null,
      minValue: null,
      maxValue: null,
    };
  }

  let rawMin = values[0];
  let rawMax = values[0];
  for (let i = 1; i < n; i += 1) {
    const v = values[i];
    if (v < rawMin) rawMin = v;
    if (v > rawMax) rawMax = v;
  }

  let domainMin =
    typeof options.min === 'number' && Number.isFinite(options.min) ? options.min : rawMin;
  let domainMax =
    typeof options.max === 'number' && Number.isFinite(options.max) ? options.max : rawMax;
  if (domainMax < domainMin) {
    const tmp = domainMin;
    domainMin = domainMax;
    domainMax = tmp;
  }

  const x0 = Math.min(pad, w / 2);
  const x1 = Math.max(x0, w - x0);
  const y0 = Math.min(pad, h / 2);
  const y1 = Math.max(y0, h - y0);
  const plotW = x1 - x0;
  const plotH = y1 - y0;
  const span = domainMax - domainMin;

  /** @type {SparklinePoint[]} */
  const points = new Array(n);
  /** @type {SparklinePoint | null} */
  let minPoint = null;
  /** @type {SparklinePoint | null} */
  let maxPoint = null;

  for (let i = 0; i < n; i += 1) {
    const v = values[i];
    const px = n === 1 ? x0 + plotW / 2 : x0 + (i / (n - 1)) * plotW;
    const py =
      span > 0
        ? y1 - clamp((v - domainMin) / span, 0, 1) * plotH
        : y0 + plotH / 2;
    const pt = { x: fmt(px), y: fmt(py), value: v, index: i };
    points[i] = pt;
    if (!minPoint && v === rawMin) minPoint = pt;
    if (!maxPoint && v === rawMax) maxPoint = pt;
  }

  const lastPoint = points[n - 1];

  let linePath = '';
  let areaPath = '';
  if (n === 1) {
    linePath = `M ${points[0].x} ${points[0].y} L ${points[0].x} ${points[0].y}`;
    areaPath = '';
  } else {
    if (smooth) {
      linePath = buildMonotoneSplinePath(points);
    } else {
      linePath = points
        .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
        .join(' ');
    }
    areaPath = `${linePath} L ${lastPoint.x} ${fmt(y1)} L ${points[0].x} ${fmt(y1)} Z`;
  }

  const minBarH = Math.min(2, plotH);
  /** @type {SparklineBar[]} */
  const bars = new Array(n);
  if (n === 1) {
    const singleW = fmt(Math.max(2, Math.min(12, plotW * 0.3)));
    const bx = fmt(x0 + (plotW - singleW) / 2);
    const barH = fmt(
      span > 0
        ? minBarH + clamp((values[0] - domainMin) / span, 0, 1) * Math.max(0, plotH - minBarH)
        : Math.max(minBarH, plotH * 0.5),
    );
    bars[0] = {
      x: bx,
      y: fmt(y1 - barH),
      width: singleW,
      height: barH,
      value: values[0],
      index: 0,
      isMin: true,
      isMax: true,
      isLast: true,
    };
  } else {
    const effectiveGap = Math.min(barGap, (plotW / n) * 0.45);
    const barW = Math.max(0.75, (plotW - effectiveGap * (n - 1)) / n);
    for (let i = 0; i < n; i += 1) {
      const v = values[i];
      const bx = x0 + i * (barW + effectiveGap);
      const barH =
        span > 0
          ? minBarH + clamp((v - domainMin) / span, 0, 1) * Math.max(0, plotH - minBarH)
          : Math.max(minBarH, plotH * 0.5);
      bars[i] = {
        x: fmt(bx),
        y: fmt(y1 - barH),
        width: fmt(barW),
        height: fmt(barH),
        value: v,
        index: i,
        isMin: v === rawMin,
        isMax: v === rawMax,
        isLast: i === n - 1,
      };
    }
  }

  return {
    viewBox,
    linePath,
    areaPath,
    bars,
    points,
    lastPoint,
    minPoint,
    maxPoint,
    minValue: rawMin,
    maxValue: rawMax,
  };
}

let gradientSeq = 0;

/**
 * Parse `data-values` attribute (comma/whitespace separated or JSON array).
 * @param {string | null} raw
 * @returns {number[]}
 */
function parseDataValues(raw) {
  if (!raw) return [];
  const trimmed = raw.trim();
  if (!trimmed) return [];
  if (trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return parsed.map(Number).filter(Number.isFinite);
    } catch {
      // Fall through to delimiter split.
    }
  }
  return trimmed
    .split(/[\s,]+/)
    .filter(Boolean)
    .map(Number)
    .filter(Number.isFinite);
}

/**
 * Wire one `.j-sparkline` element for plain-HTML usage (`data-values="12,18,15,..."`).
 * Skips `[data-j-managed]`.
 * @param {HTMLElement} root
 * @returns {() => void}
 */
export function createSparkline(root) {
  if (root.hasAttribute('data-j-managed')) return () => {};

  const data = parseDataValues(root.getAttribute('data-values'));
  const variantAttr = root.getAttribute('data-variant');
  /** @type {SparklineVariant} */
  const variant =
    variantAttr === 'area' || variantAttr === 'bar' ? variantAttr : 'line';

  const widthAttr = Number(root.getAttribute('data-width'));
  const heightAttr = Number(root.getAttribute('data-height'));
  const strokeAttr = Number(root.getAttribute('data-stroke-width'));
  const minAttr = root.hasAttribute('data-min') ? Number(root.getAttribute('data-min')) : undefined;
  const maxAttr = root.hasAttribute('data-max') ? Number(root.getAttribute('data-max')) : undefined;
  const fillOpacityAttr = Number(root.getAttribute('data-fill-opacity'));

  const width = Number.isFinite(widthAttr) && widthAttr > 0 ? widthAttr : 88;
  const height = Number.isFinite(heightAttr) && heightAttr > 0 ? heightAttr : 24;
  const strokeWidth = Number.isFinite(strokeAttr) && strokeAttr > 0 ? strokeAttr : 1.5;
  const fillOpacity =
    Number.isFinite(fillOpacityAttr) && fillOpacityAttr >= 0 ? fillOpacityAttr : 0.16;
  const smooth = root.hasAttribute('data-smooth') && root.getAttribute('data-smooth') !== 'false';
  const showEndDot =
    (root.hasAttribute('data-show-end-dot') &&
      root.getAttribute('data-show-end-dot') !== 'false') ||
    (root.hasAttribute('data-end-dot') && root.getAttribute('data-end-dot') !== 'false');
  const showMinMax =
    (root.hasAttribute('data-show-min-max') &&
      root.getAttribute('data-show-min-max') !== 'false') ||
    (root.hasAttribute('data-min-max') && root.getAttribute('data-min-max') !== 'false');

  const customColor = root.getAttribute('data-color');
  if (customColor) {
    root.style.setProperty('--j-sparkline-color', customColor);
  }

  const label = root.getAttribute('aria-label') || root.getAttribute('data-label');
  if (label) {
    root.setAttribute('role', 'img');
    root.setAttribute('aria-label', label);
    root.removeAttribute('aria-hidden');
  } else if (!root.hasAttribute('aria-hidden')) {
    root.setAttribute('aria-hidden', 'true');
  }

  const geo = computeSparkline(data, {
    width,
    height,
    strokeWidth,
    padding: showEndDot || showMinMax ? Math.max(2.5, strokeWidth + 1) : Math.max(2, strokeWidth),
    variant,
    smooth,
    min: minAttr,
    max: maxAttr,
  });

  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('class', 'j-sparkline__svg');
  svg.setAttribute('width', String(width));
  svg.setAttribute('height', String(height));
  svg.setAttribute('viewBox', geo.viewBox);
  svg.setAttribute('focusable', 'false');
  svg.setAttribute('aria-hidden', 'true');

  if (variant === 'bar') {
    for (const bar of geo.bars) {
      const rect = document.createElementNS(SVG_NS, 'rect');
      rect.setAttribute('class', 'j-sparkline__bar');
      rect.setAttribute('x', String(bar.x));
      rect.setAttribute('y', String(bar.y));
      rect.setAttribute('width', String(bar.width));
      rect.setAttribute('height', String(bar.height));
      rect.setAttribute('rx', bar.width >= 3 ? '1' : '0.5');
      if (bar.isLast) rect.setAttribute('data-last', '');
      if (bar.isMin) rect.setAttribute('data-min', '');
      if (bar.isMax) rect.setAttribute('data-max', '');
      svg.appendChild(rect);
    }
  } else {
    if (variant === 'area' && geo.areaPath) {
      gradientSeq += 1;
      const gradId = `j-spark-plain-${gradientSeq}`;
      const defs = document.createElementNS(SVG_NS, 'defs');
      const grad = document.createElementNS(SVG_NS, 'linearGradient');
      grad.setAttribute('id', gradId);
      grad.setAttribute('x1', '0');
      grad.setAttribute('y1', '0');
      grad.setAttribute('x2', '0');
      grad.setAttribute('y2', '1');

      const stopTop = document.createElementNS(SVG_NS, 'stop');
      stopTop.setAttribute('offset', '0%');
      stopTop.setAttribute('stop-color', 'currentColor');
      stopTop.setAttribute('stop-opacity', String(fillOpacity));

      const stopBottom = document.createElementNS(SVG_NS, 'stop');
      stopBottom.setAttribute('offset', '100%');
      stopBottom.setAttribute('stop-color', 'currentColor');
      stopBottom.setAttribute('stop-opacity', '0');

      grad.appendChild(stopTop);
      grad.appendChild(stopBottom);
      defs.appendChild(grad);
      svg.appendChild(defs);

      const area = document.createElementNS(SVG_NS, 'path');
      area.setAttribute('class', 'j-sparkline__area');
      area.setAttribute('d', geo.areaPath);
      area.setAttribute('fill', `url(#${gradId})`);
      svg.appendChild(area);
    }

    if (geo.linePath) {
      const line = document.createElementNS(SVG_NS, 'path');
      line.setAttribute('class', 'j-sparkline__line');
      line.setAttribute('d', geo.linePath);
      line.setAttribute('stroke-width', String(strokeWidth));
      svg.appendChild(line);
    }

    const dotR = Math.max(1.75, strokeWidth + 0.5);
    /** @type {Set<number>} */
    const drawnIndices = new Set();
    /**
     * @param {SparklinePoint | null} pt
     * @param {string} kind
     */
    const appendDot = (pt, kind) => {
      if (!pt || drawnIndices.has(pt.index)) return;
      drawnIndices.add(pt.index);
      const circle = document.createElementNS(SVG_NS, 'circle');
      circle.setAttribute('class', 'j-sparkline__dot');
      circle.setAttribute('cx', String(pt.x));
      circle.setAttribute('cy', String(pt.y));
      circle.setAttribute('r', String(dotR));
      circle.setAttribute(`data-${kind}`, '');
      svg.appendChild(circle);
    };

    if (showEndDot) appendDot(geo.lastPoint, 'end');
    if (showMinMax) {
      appendDot(geo.maxPoint, 'max');
      appendDot(geo.minPoint, 'min');
    }
  }

  root.replaceChildren(svg);
  return () => {
    if (svg.parentNode === root) root.removeChild(svg);
  };
}

/** @type {WeakMap<HTMLElement, () => void>} */
const bound = new WeakMap();

/**
 * Init every `.j-sparkline` inside `root`. Idempotent.
 * @param {ParentNode} [root=document]
 * @returns {() => void}
 */
export function initSparklines(root = document) {
  /** @type {HTMLElement[]} */
  const made = [];
  root.querySelectorAll('.j-sparkline').forEach((el) => {
    const spark = /** @type {HTMLElement} */ (el);
    if (spark.hasAttribute('data-j-managed') || bound.has(spark)) return;
    if (!spark.hasAttribute('data-values')) return;
    bound.set(spark, createSparkline(spark));
    made.push(spark);
  });
  return () =>
    made.forEach((s) => {
      bound.get(s)?.();
      bound.delete(s);
    });
}
