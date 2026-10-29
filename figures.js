(() => {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const canvases = [...document.querySelectorAll("canvas[data-draw]")];
  if (!canvases.length) return;

  const sky = "#35a4ea";
  const ink = "#eef4ff";

  function sizeOf(canvas) {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const width = Math.max(2, Math.round(rect.width));
    const height = Math.max(2, Math.round(rect.height));
    if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(height * dpr)) {
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
    }
    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx, width, height };
  }

  function glow(ctx, x, y, radius, color, alpha) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, radius);
    g.addColorStop(0, color);
    g.addColorStop(1, "transparent");
    ctx.globalAlpha = alpha;
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  function pill(ctx, text, x, y, on) {
    ctx.font = "500 11px Geist, Segoe UI, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const padX = 8;
    const w = ctx.measureText(text).width + padX * 2;
    const h = 18;
    ctx.fillStyle = on ? "rgba(53, 164, 234, 0.22)" : "rgba(8, 12, 20, 0.72)";
    ctx.strokeStyle = on ? sky : "rgba(255,255,255,0.28)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(x - w / 2, y - h / 2, w, h, 3);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = on ? "#ffffff" : "rgba(238, 244, 255, 0.82)";
    ctx.fillText(text, x, y + 0.5);
  }

  function project(x, y, z, rot) {
    const c = Math.cos(rot);
    const s = Math.sin(rot);
    const xr = x * c - z * s;
    const zr = x * s + z * c;
    return [xr, y, zr];
  }

  function drawLattice(canvas, t) {
    const { ctx, width, height } = sizeOf(canvas);
    ctx.clearRect(0, 0, width, height);
    const rot = reduce ? 0.55 : t * 0.18;
    const nx = 3;
    const ny = 5;
    const nz = 3;
    const pts = [];
    for (let i = 0; i < nx; i++) {
      for (let j = 0; j < ny; j++) {
        for (let k = 0; k < nz; k++) {
          const x = (i - (nx - 1) / 2) * 1.05 + j * 0.22;
          const y = (j - (ny - 1) / 2) * 0.92;
          const z = (k - (nz - 1) / 2) * 1.05 + j * 0.08;
          pts.push({ i, j, k, p: project(x, y, z, rot) });
        }
      }
    }
    const index = (i, j, k) => ((i * ny + j) * nz) + k;
    const edges = [];
    const add = (a, b) => {
      if (!pts[a] || !pts[b]) return;
      edges.push([a, b]);
    };
    for (let i = 0; i < nx; i++) {
      for (let j = 0; j < ny; j++) {
        for (let k = 0; k < nz; k++) {
          const a = index(i, j, k);
          if (i + 1 < nx) add(a, index(i + 1, j, k));
          if (j + 1 < ny) add(a, index(i, j + 1, k));
          if (k + 1 < nz) add(a, index(i, j, k + 1));
          if (i + 1 < nx && k + 1 < nz) add(a, index(i + 1, j, k + 1));
        }
      }
    }

    const scale = Math.min(width, height) * 0.2;
    const cx = width * 0.5;
    const cy = height * 0.46;
    const toScreen = (p) => [cx + p[0] * scale, cy - p[1] * scale * 0.92 + p[2] * scale * 0.34];

    ctx.lineWidth = 1;
    for (const [a, b] of edges) {
      const [x1, y1] = toScreen(pts[a].p);
      const [x2, y2] = toScreen(pts[b].p);
      const depth = (pts[a].p[2] + pts[b].p[2]) / 2;
      ctx.strokeStyle = `rgba(210, 226, 246, ${0.28 + depth * 0.08})`;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    const pulse = reduce ? 2 : (Math.sin(t * 1.4) + 1) / 2;
    pts.forEach((pt, n) => {
      const [x, y] = toScreen(pt.p);
      const hot = n % 7 === Math.floor(pulse * 6);
      const radius = hot ? 3.4 : 2.1;
      if (hot) glow(ctx, x, y, 16, sky, 0.85);
      ctx.fillStyle = hot ? "#ffffff" : ink;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    });

    pill(ctx, "ML-DSA-44", cx, height * 0.9, true);
  }

  const layers = [
    { name: "SHA-256" },
    { name: "UTXO" },
    { name: "P2MR" },
    { name: "DILITHIUM" },
  ];

  function drawStack(canvas, t) {
    const { ctx, width, height } = sizeOf(canvas);
    ctx.clearRect(0, 0, width, height);
    const span = reduce ? 3 : (t * 0.28) % layers.length;
    const active = Math.floor(span);
    const glide = span - active;
    const eased = glide * glide * (3 - 2 * glide);
    const orbLayer = reduce ? 3 : (active + eased) % layers.length;

    const s = Math.min(width, height) * 0.108;
    const cx = width * 0.64;
    const base = height * 0.8;
    const rise = s * 1.82;
    const iso = (x, y, z) => [
      cx + (x - z) * s * 0.86,
      base - y * rise + (x + z) * s * 0.42,
    ];

    const corners = [
      [1, 1],
      [-1, 1],
      [-1, -1],
      [1, -1],
    ];

    ctx.lineWidth = 1;
    for (let i = 0; i < layers.length - 1; i++) {
      corners.forEach(([x, z]) => {
        const [x1, y1] = iso(x, i, z);
        const [x2, y2] = iso(x, i + 1, z);
        ctx.strokeStyle = "rgba(180, 198, 220, 0.35)";
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      });
    }

    layers.forEach((layer, i) => {
      const on = i === active;
      const pts = corners.map(([x, z]) => iso(x, i, z));
      ctx.beginPath();
      pts.forEach(([x, y], n) => (n ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      ctx.closePath();
      ctx.strokeStyle = on ? "rgba(255,255,255,0.9)" : "rgba(210, 224, 242, 0.45)";
      ctx.stroke();
      if (on) {
        ctx.fillStyle = "rgba(53, 164, 234, 0.14)";
        ctx.fill();
      }
      pts.forEach(([x, y], n) => {
        const lit = on && n === Math.floor(((reduce ? 0 : t * 0.8) % 4));
        if (lit) glow(ctx, x, y, 14, sky, 0.9);
        ctx.fillStyle = on ? "#ffffff" : ink;
        ctx.beginPath();
        ctx.arc(x, y, on ? 3.3 : 2.4, 0, Math.PI * 2);
        ctx.fill();
      });
      const [lx, ly] = iso(-1.55, i, 1);
      pill(ctx, layer.name, lx - 8, ly, on);
    });

    const [ox, oy] = iso(0, orbLayer, 0);
    glow(ctx, ox, oy, 22, sky, 0.95);
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(ox, oy, 4.5, 0, Math.PI * 2);
    ctx.fill();

    const [sx, sy] = iso(0, 0, 0);
    const [ex, ey] = iso(0, layers.length - 1, 0);
    ctx.strokeStyle = "rgba(157, 185, 255, 0.35)";
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(ex, ey);
    ctx.stroke();
  }

  const painters = { lattice: drawLattice, stack: drawStack };
  let start = 0;
  let running = false;

  function frame(now) {
    if (!start) start = now;
    const t = (now - start) / 1000;
    let visible = false;
    for (const canvas of canvases) {
      const rect = canvas.getBoundingClientRect();
      if (rect.bottom < -40 || rect.top > window.innerHeight + 40) continue;
      visible = true;
      painters[canvas.dataset.draw](canvas, t);
    }
    if (reduce || !visible) {
      running = false;
      return;
    }
    requestAnimationFrame(frame);
  }

  function kick() {
    if (running) return;
    running = true;
    start = 0;
    requestAnimationFrame(frame);
  }

  kick();
  window.addEventListener("scroll", kick, { passive: true });
  window.addEventListener("resize", kick);
})();
