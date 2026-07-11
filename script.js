/* ════════════════════════════════════════════════════════════
   SIWAT JANKAM — PORTFOLIO SCRIPTS
   Starfield · typing · scroll effects · counters · visitor API
   ════════════════════════════════════════════════════════════ */

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ── Starfield canvas (stars, nebulae, shooting stars) ─────── */
(function starfield() {
  const canvas = document.getElementById("starfield");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  const resize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  };
  resize();
  window.addEventListener("resize", resize);

  // Background stars — 3 depth layers
  const stars = [];
  for (let i = 0; i < 320; i++) {
    const depth = Math.random(); // 0 = far (slow), 1 = near (fast)
    stars.push({
      x: Math.random(),
      y: Math.random(),
      r: depth < 0.4 ? Math.random() * 0.8 + 0.2
        : depth < 0.75 ? Math.random() * 1.2 + 0.5
        : Math.random() * 1.8 + 0.8,
      twinkle: Math.random() * 0.6 + 0.4,
      phase: Math.random() * Math.PI * 2,
      depth,
    });
  }

  const shoots = [];
  let nextShoot = 2000 + Math.random() * 3000;

  const nebulae = [
    { x: 0.25, y: 0.30, rx: 180, ry: 110, color: "rgba(99,102,241,0.06)" },
    { x: 0.70, y: 0.60, rx: 220, ry: 130, color: "rgba(0,200,255,0.05)" },
    { x: 0.50, y: 0.15, rx: 300, ry: 80,  color: "rgba(168,85,247,0.04)" },
    { x: 0.15, y: 0.75, rx: 150, ry: 90,  color: "rgba(16,185,129,0.04)" },
  ];

  let lastTs = 0;

  function draw(ts) {
    const dt = ts - lastTs;
    lastTs = ts;
    const W = canvas.width;
    const H = canvas.height;
    const scroll = window.scrollY;
    const t = ts * 0.001;

    ctx.clearRect(0, 0, W, H);

    // Milky Way band
    const band = ctx.createLinearGradient(0, H * 0.2, W, H * 0.8);
    band.addColorStop(0, "transparent");
    band.addColorStop(0.3, "rgba(99,102,241,0.03)");
    band.addColorStop(0.5, "rgba(168,85,247,0.05)");
    band.addColorStop(0.7, "rgba(99,102,241,0.03)");
    band.addColorStop(1, "transparent");
    ctx.fillStyle = band;
    ctx.fillRect(0, 0, W, H);

    // Nebulae
    for (const n of nebulae) {
      const cx = n.x * W;
      const cy = n.y * H - scroll * 0.05;
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(n.rx, n.ry));
      g.addColorStop(0, n.color);
      g.addColorStop(1, "transparent");
      ctx.save();
      ctx.scale(1, n.ry / n.rx);
      ctx.beginPath();
      ctx.arc(cx, cy * (n.rx / n.ry), n.rx, 0, Math.PI * 2);
      ctx.fillStyle = g;
      ctx.fill();
      ctx.restore();
    }

    // Stars with parallax + twinkle
    for (const s of stars) {
      const px = s.x * W;
      const parallax = scroll * (0.02 + s.depth * 0.12);
      const py = ((s.y * H - parallax) % (H + 20) + H + 20) % (H + 20);
      const brightness = s.twinkle * (0.6 + 0.4 * Math.sin(t * (1 + s.depth) + s.phase));
      ctx.beginPath();
      ctx.arc(px, py, s.r, 0, Math.PI * 2);
      ctx.fillStyle = s.depth > 0.7
        ? `rgba(220,240,255,${brightness})`
        : `rgba(180,210,255,${brightness * 0.7})`;
      ctx.fill();

      // Glow on larger stars
      if (s.r > 1.4) {
        const glow = ctx.createRadialGradient(px, py, 0, px, py, s.r * 4);
        glow.addColorStop(0, `rgba(180,220,255,${brightness * 0.3})`);
        glow.addColorStop(1, "transparent");
        ctx.beginPath();
        ctx.arc(px, py, s.r * 4, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();
      }
    }

    // Shooting stars
    nextShoot -= dt;
    if (nextShoot <= 0) {
      shoots.push({
        x: Math.random() * W * 0.7,
        y: Math.random() * H * 0.4,
        vx: 6 + Math.random() * 6,
        vy: 2 + Math.random() * 3,
        life: 0,
        maxLife: 60 + Math.random() * 40,
      });
      nextShoot = 3000 + Math.random() * 5000;
    }

    for (let i = shoots.length - 1; i >= 0; i--) {
      const s = shoots[i];
      s.x += s.vx;
      s.y += s.vy;
      s.life++;

      const prog = s.life / s.maxLife;
      const alpha = prog < 0.2 ? prog / 0.2 : prog > 0.8 ? (1 - prog) / 0.2 : 1;
      const len = 80 + prog * 40;
      const mag = Math.hypot(s.vx, s.vy);

      const sg = ctx.createLinearGradient(s.x - s.vx * 10, s.y - s.vy * 10, s.x, s.y);
      sg.addColorStop(0, "rgba(255,255,255,0)");
      sg.addColorStop(1, `rgba(255,255,255,${alpha * 0.9})`);

      ctx.beginPath();
      ctx.moveTo(s.x - (s.vx / mag) * len, s.y - (s.vy / mag) * len);
      ctx.lineTo(s.x, s.y);
      ctx.strokeStyle = sg;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      if (s.life >= s.maxLife) shoots.splice(i, 1);
    }

    requestAnimationFrame(draw);
  }

  if (!reducedMotion) requestAnimationFrame(draw);
})();

/* ── Cursor glow (spring-like follow) ──────────────────────── */
(function cursorGlow() {
  const glow = document.getElementById("cursorGlow");
  if (!glow || reducedMotion) return;
  let tx = -600, ty = -600, x = -600, y = -600;
  window.addEventListener("mousemove", (e) => { tx = e.clientX; ty = e.clientY; });
  (function tick() {
    x += (tx - x) * 0.12;
    y += (ty - y) * 0.12;
    glow.style.left = x + "px";
    glow.style.top = y + "px";
    requestAnimationFrame(tick);
  })();
})();

/* ── Scroll progress + nav background ──────────────────────── */
(function scrollEffects() {
  const bar = document.getElementById("progressBar");
  const nav = document.getElementById("nav");
  const onScroll = () => {
    const total = document.body.scrollHeight - window.innerHeight;
    bar.style.width = (total > 0 ? (window.scrollY / total) * 100 : 0) + "%";
    nav.classList.toggle("scrolled", window.scrollY > 40);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
})();

/* ── Typing effect ─────────────────────────────────────────── */
(function typing() {
  const el = document.getElementById("typedText");
  if (!el) return;
  const strings = [
    "Full Stack Developer",
    "Cloud Explorer",
    "Automation Builder",
    "Lifelong Learner",
  ];
  if (reducedMotion) { el.textContent = strings[0]; return; }

  let idx = 0, text = "", deleting = false;
  const SPEED = 80, PAUSE = 1800;

  function step() {
    const current = strings[idx % strings.length];
    if (!deleting && text === current) {
      deleting = true;
      setTimeout(step, PAUSE);
      return;
    }
    if (deleting && text === "") {
      deleting = false;
      idx++;
      setTimeout(step, SPEED);
      return;
    }
    text = deleting ? text.slice(0, -1) : current.slice(0, text.length + 1);
    el.textContent = text;
    setTimeout(step, deleting ? SPEED / 2 : SPEED);
  }
  step();
})();

/* ── Reveal on scroll ──────────────────────────────────────── */
(function reveal() {
  const els = document.querySelectorAll(".reveal");
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    }
  }, { threshold: 0.15 });
  els.forEach((el) => observer.observe(el));
})();

/* ── Animated stat counters ────────────────────────────────── */
(function counters() {
  const els = document.querySelectorAll("[data-count]");
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      const el = entry.target;
      observer.unobserve(el);
      const target = parseInt(el.dataset.count, 10);
      const suffix = el.dataset.suffix || "";
      const duration = 1500;
      const start = performance.now();
      (function tick(now) {
        const p = Math.min((now - start) / duration, 1);
        el.textContent = Math.round((1 - Math.pow(1 - p, 3)) * target) + suffix;
        if (p < 1) requestAnimationFrame(tick);
      })(start);
    }
  }, { threshold: 0.5 });
  els.forEach((el) => observer.observe(el));
})();

/* ── Mobile menu ───────────────────────────────────────────── */
(function mobileMenu() {
  const burger = document.getElementById("burger");
  const menu = document.getElementById("mobileMenu");
  const iconOpen = document.getElementById("iconMenu");
  const iconClose = document.getElementById("iconClose");
  burger.addEventListener("click", () => {
    const open = menu.classList.toggle("open");
    iconOpen.style.display = open ? "none" : "block";
    iconClose.style.display = open ? "block" : "none";
  });
  menu.querySelectorAll("button").forEach((btn) => {
    btn.addEventListener("click", () => {
      menu.classList.remove("open");
      iconOpen.style.display = "block";
      iconClose.style.display = "none";
    });
  });
})();

/* ── Smooth scroll for nav links ───────────────────────────── */
function scrollToSection(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth" });
}

/* ── Visitor counter (Cloudflare Workers + D1) ─────────────── */
(async function visitorCounter() {
  const VISITOR_API = "https://visitor-counter.sj-siwat.workers.dev";
  const el = document.getElementById("visitor-count");
  try {
    const response = await fetch(VISITOR_API);
    const data = await response.json();
    el.textContent = data.count.toLocaleString();
  } catch (error) {
    console.error("Visitor counter error:", error);
    el.textContent = "—";
  }
})();
