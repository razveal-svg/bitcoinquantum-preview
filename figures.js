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

  const fieldCols = 20;
  const fieldRows = 6;
  let fieldStep = 0;
  let fieldShown = 0;

  function fieldKind(x, z) {
    if ((x === 1 || x === 3) && z === 2) return { levels: 4, kind: "wire", zone: 0 };
    if (x >= 6 && x <= 8 && z >= 1 && z <= 3) {
      const levels = x === 7 && z === 2 ? 3 : x === 7 || z === 2 ? 2 : 1;
      return { levels, kind: "dash", zone: 1 };
    }
    if (x >= 11 && x <= 17 && z <= 4) {
      const ridge = [1, 2, 3, 4, 4, 3, 2][x - 11];
      const levels = ridge - Math.abs(z - 2);
      if (levels > 0) return { levels, kind: "solid", zone: x >= 14 ? 3 : 2 };
    }
    return { levels: 0, kind: "floor", zone: x < 5 ? 0 : x < 10 ? 1 : x < 14 ? 2 : 3 };
  }

  function drawField(canvas) {
    const { ctx, width, height } = sizeOf(canvas);
    ctx.clearRect(0, 0, width, height);

    for (let i = 0; i < 36; i++) {
      const sx = ((i * 97) % 997) / 997 * width;
      const sy = ((i * 53) % 991) / 991 * height * 0.62;
      ctx.fillStyle = `rgba(255,255,255,${0.1 + (i % 4) * 0.04})`;
      ctx.fillRect(sx, sy, 1.1, 1.1);
    }

    const s = Math.min(width * 0.9 / ((fieldCols + fieldRows) * 0.92), height * 0.8 / 13.5);
    const originX = width * 0.5 - (fieldCols / 2 - fieldRows / 2) * s;
    const originY = height * 0.8 - (fieldCols + fieldRows - 4) * s * 0.26;
    const iso = (x, y, z) => [
      originX + (x - z) * s,
      originY + (x + z) * s * 0.26 - y * s * 0.52,
    ];

    const cells = [];
    for (let z = 0; z < fieldRows; z++) {
      for (let x = 0; x < fieldCols; x++) cells.push({ x, z, ...fieldKind(x, z) });
    }
    cells.sort((a, b) => a.x + a.z - (b.x + b.z) || a.levels - b.levels);

    function poly(pts) {
      ctx.beginPath();
      pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
      ctx.closePath();
    }

    function cube(x, z, y0, y1, kind, near) {
      const A = iso(x, y1, z);
      const B = iso(x + 1, y1, z);
      const C = iso(x + 1, y1, z + 1);
      const D = iso(x, y1, z + 1);
      const F = iso(x + 1, y0, z);
      const G = iso(x + 1, y0, z + 1);
      const H = iso(x, y0, z + 1);
      const faces = [[D, C, G, H], [B, C, G, F], [A, B, C, D]];
      const filled = kind === "floor" || kind === "solid";
      const lit = kind === "solid" && near > 0.55;
      const fills = kind === "solid"
        ? [
            lit ? "rgba(14, 36, 72, 0.96)" : "rgba(12, 18, 30, 0.96)",
            lit ? "rgba(22, 52, 102, 0.96)" : "rgba(18, 28, 46, 0.96)",
            lit ? "rgba(86, 150, 220, 0.72)" : "rgba(42, 58, 82, 0.96)",
          ]
        : ["rgba(7, 12, 20, 0.96)", "rgba(11, 16, 26, 0.96)", "rgba(16, 24, 36, 0.96)"];
      const stroke = kind === "wire"
        ? `rgba(236, 242, 252, ${0.72 + near * 0.28})`
        : kind === "dash"
          ? `rgba(220, 230, 244, ${0.55 + near * 0.35})`
          : kind === "solid"
            ? `rgba(214, 226, 240, ${0.42 + near * 0.35})`
            : "rgba(150, 168, 190, 0.28)";
      ctx.lineWidth = kind === "wire" ? 1.2 : 1;
      ctx.setLineDash(kind === "dash" ? [3, 2.4] : []);
      faces.forEach((pts, face) => {
        poly(pts);
        if (filled) {
          ctx.fillStyle = fills[face];
          ctx.fill();
        }
        ctx.strokeStyle = stroke;
        ctx.stroke();
      });
      ctx.setLineDash([]);
    }

    for (const cell of cells) {
      const near = 1 - Math.min(1, Math.abs(fieldShown - cell.zone) / 1.4);
      const fade = Math.min(1, (cell.x + 0.4) / 1.3, (fieldCols - cell.x) / 1.5);
      ctx.globalAlpha = 0.45 + 0.55 * fade;
      cube(cell.x, cell.z, 0, 0.72, "floor", near);
      for (let level = 0; level < cell.levels; level++) {
        cube(cell.x, cell.z, 0.72 + level * 0.92, 0.72 + (level + 1) * 0.92, cell.kind, near);
      }
      ctx.globalAlpha = 1;
    }

    const peak = iso(15.2, 0.72 + 4 * 0.92, 2.5);
    function planeAt(u, v) {
      const w = s * 5.2;
      const h = s * 2.5;
      return [
        peak[0] - w * 0.2 + u * w + (v - 0.5) * s * 0.45,
        peak[1] - s * 1.15 - u * h * 0.85 + v * h * 0.28,
      ];
    }
    const planeNear = 1 - Math.min(1, Math.abs(fieldShown - 3) / 1.15);
    ctx.globalAlpha = 0.55 + planeNear * 0.45;
    poly([planeAt(0, 0), planeAt(1, 0), planeAt(1, 1), planeAt(0, 1)]);
    ctx.fillStyle = "rgba(34, 97, 246, 0.18)";
    ctx.fill();
    ctx.strokeStyle = `rgba(186, 216, 255, ${0.55 + planeNear * 0.4})`;
    ctx.lineWidth = 1.1;
    ctx.stroke();
    ctx.beginPath();
    for (let i = 1; i < 4; i++) {
      const a = planeAt(i / 4, 0);
      const b = planeAt(i / 4, 1);
      ctx.moveTo(a[0], a[1]);
      ctx.lineTo(b[0], b[1]);
      const c = planeAt(0, i / 4);
      const d = planeAt(1, i / 4);
      ctx.moveTo(c[0], c[1]);
      ctx.lineTo(d[0], d[1]);
    }
    ctx.stroke();
    ctx.globalAlpha = 1;

    const marks = [
      iso(2, 0.72 + 4 * 0.92 + 0.45, 2.5),
      iso(7.5, 0.72 + 3 * 0.92 + 0.35, 2),
      iso(13.2, 0.72 + 3 * 0.92 + 0.25, 2.2),
      planeAt(0.55, 0.4),
    ];
    const names = ["SHA-256", "P2MR", "DILITHIUM", "BLOCK 1"];
    const i0 = Math.max(0, Math.min(3, Math.floor(fieldShown)));
    const glide = fieldShown - i0;
    const i1 = Math.min(3, i0 + 1);
    const orb = [
      marks[i0][0] + (marks[i1][0] - marks[i0][0]) * glide,
      marks[i0][1] + (marks[i1][1] - marks[i0][1]) * glide,
    ];

    names.forEach((name, n) => {
      const on = 1 - Math.min(1, Math.abs(fieldShown - n));
      if (on < 0.08) return;
      const spot = n === 3 ? planeAt(0.82, 0.02) : [marks[n][0], marks[n][1] - s * 0.55];
      ctx.globalAlpha = on;
      ctx.font = "500 11px 'Geist Mono', ui-monospace, monospace";
      ctx.textAlign = n === 3 ? "left" : "center";
      ctx.textBaseline = "bottom";
      ctx.fillStyle = "#f4f7fb";
      ctx.fillText(name, spot[0], spot[1]);
      ctx.globalAlpha = 1;
    });

    const beam = ctx.createLinearGradient(orb[0], orb[1], orb[0], orb[1] + s * 1.8);
    beam.addColorStop(0, "rgba(186, 220, 255, 0.8)");
    beam.addColorStop(1, "transparent");
    ctx.strokeStyle = beam;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(orb[0], orb[1]);
    ctx.lineTo(orb[0], orb[1] + s * 1.8);
    ctx.stroke();
    glow(ctx, orb[0], orb[1], 18 + planeNear * 10, sky, 0.95);
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(orb[0], orb[1], 4, 0, Math.PI * 2);
    ctx.fill();
  }

  const painters = { lattice: drawLattice, stack: drawStack, field: drawField };
  const fieldButtons = [...document.querySelectorAll("[data-chain]")];
  const chain = document.getElementById("chain");

  function showField(step) {
    fieldStep = step;
    fieldButtons.forEach((btn, index) => {
      const on = index === step;
      btn.classList.toggle("is-on", on);
      btn.setAttribute("aria-selected", on ? "true" : "false");
    });
  }

  function chainValue() {
    if (!chain) return fieldStep;
    const travel = chain.offsetHeight - window.innerHeight;
    if (travel <= 0) return fieldStep;
    const scrolled = -chain.getBoundingClientRect().top;
    const p = Math.min(1, Math.max(0, scrolled / travel));
    return p * 3;
  }

  function goTo(step) {
    const next = Math.min(3, Math.max(0, step));
    showField(next);
    const travel = chain ? chain.offsetHeight - window.innerHeight : 0;
    if (!chain || travel <= 0) {
      fieldShown = next;
      kick();
      return;
    }
    const p = next >= 3 ? 1 : (next + 0.12) / 3;
    const top = window.scrollY + chain.getBoundingClientRect().top + p * travel;
    const root = document.documentElement;
    const previous = root.style.scrollBehavior;
    root.style.scrollBehavior = "auto";
    window.scrollTo(0, top);
    root.style.scrollBehavior = previous;
    kick();
  }

  let wheelLock = 0;
  chain.addEventListener("wheel", (event) => {
    const rect = chain.getBoundingClientRect();
    const onIt = rect.top < window.innerHeight * 0.45 && rect.bottom > window.innerHeight * 0.55;
    if (!onIt) return;
    const delta = event.deltaY;
    if (!delta) return;
    const down = delta > 0;
    if ((down && fieldStep >= 3) || (!down && fieldStep <= 0)) return;
    event.preventDefault();
    const now = performance.now();
    if (now < wheelLock) return;
    wheelLock = now + 460;
    goTo(fieldStep + (down ? 1 : -1));
  }, { passive: false });

  fieldButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      goTo(Number(btn.dataset.chain));
    });
  });

  let start = 0;
  let running = false;

  function frame(now) {
    if (!start) start = now;
    const t = (now - start) / 1000;
    if (reduce) fieldShown = fieldStep;
    else {
      const next = chainValue();
      const step = Math.min(3, Math.floor(next + 0.001));
      if (step !== fieldStep) showField(step);
      fieldShown = next;
    }
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
