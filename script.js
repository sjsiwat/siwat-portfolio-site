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

/* ── Profile photo power switch ────────────────────────────── */
(function profileSwitch() {
  const profile = document.getElementById("profile");
  const btn = document.getElementById("profileToggle");
  if (!profile || !btn) return;

  let beamTimer = null;

  btn.addEventListener("click", () => {
    const off = profile.classList.toggle("is-off");

    // `flip` marks a user-driven change, so the power-up animation only runs
    // on a real toggle and never on first paint.
    profile.classList.add("flip");
    profile.classList.add("scanning");
    clearTimeout(beamTimer);
    beamTimer = setTimeout(() => profile.classList.remove("scanning"), 560);

    btn.setAttribute("aria-pressed", String(off));
    const label = off ? "Show profile photo" : "Hide profile photo";
    btn.setAttribute("aria-label", label);
    btn.setAttribute("title", label);
    const text = document.getElementById("profileToggleLabel");
    if (text) text.textContent = off ? "profile.show()" : "profile.hide()";
  });
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
  // `fun` lines are the off-duty ones — they type out in a different colour.
  const strings = [
    { text: "Full Stack Developer" },
    { text: "Backend-Leaning Builder" },
    { text: "Cat Lover", fun: true },
    { text: "Data Modeller & API Designer" },
    { text: "Coffee Lover", fun: true },
    { text: "Cloud & Automation Tinkerer" },
    { text: "Road Cyclist", fun: true },
    { text: "Lifelong Learner" },
    { text: "Weekend Fun Runner", fun: true },
  ];
  const wrap = el.closest(".typed");
  if (reducedMotion) { el.textContent = strings[0].text; return; }

  let idx = 0, text = "", deleting = false;
  const SPEED = 80, PAUSE = 1800;

  function step() {
    const entry = strings[idx % strings.length];
    const current = entry.text;
    if (wrap) wrap.classList.toggle("is-fun", !!entry.fun);
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

/* ── Section titles: decode + typewriter, looping while in view ─ */
(function sectionTitles() {
  const titles = document.querySelectorAll(".section-title[data-anim]");
  if (!titles.length) return;
  if (reducedMotion || !("IntersectionObserver" in window)) return;

  const GLYPHS = "01<>/\\[]{}()#$%&*+=_|~^:;!?";
  const rnd = () => GLYPHS[(Math.random() * GLYPHS.length) | 0];

  /* "Who I am" — glyphs scramble, resolve left to right, then re-scramble. */
  function decoder(el, text) {
    const SETTLE_STEP = 70, LEAD_IN = 140, HOLD = 3500;
    let raf = null, timer = null, alive = false;

    function cycle() {
      if (!alive) return;
      el.textContent = "";

      const chars = [...text].map((ch) => {
        const span = document.createElement("span");
        span.className = "dc-char";
        span.textContent = ch;
        el.appendChild(span);
        return { span, final: ch, blank: ch === " " };
      });
      // Freeze each slot at its final width so random glyphs can't jiggle the line.
      for (const c of chars) c.span.style.width = c.span.getBoundingClientRect().width + "px";
      for (const c of chars) if (!c.blank) c.span.classList.add("scrambling");

      const t0 = performance.now();
      let lastFlip = 0;

      raf = requestAnimationFrame(function tick(now) {
        if (!alive) return;
        const elapsed = now - t0;
        const flip = now - lastFlip > 45;
        if (flip) lastFlip = now;
        let remaining = 0;

        chars.forEach((c, i) => {
          if (c.blank || c.done) return;
          if (elapsed >= LEAD_IN + i * SETTLE_STEP) {
            c.done = true;
            c.span.textContent = c.final;
            c.span.classList.remove("scrambling");
            c.span.classList.add("settled");
          } else {
            remaining++;
            if (flip) c.span.textContent = rnd();
          }
        });

        if (remaining) { raf = requestAnimationFrame(tick); return; }

        // Back to plain text between cycles, so the heading keeps its
        // normal letter spacing while it rests.
        timer = setTimeout(() => {
          if (!alive) return;
          el.textContent = text;
          timer = setTimeout(cycle, HOLD);
        }, 500);
      });
    }

    return {
      start() { if (!alive) { alive = true; cycle(); } },
      // restore = put the real text back; otherwise rest blank until it
      // scrolls back into view and replays.
      stop(restore) {
        alive = false;
        cancelAnimationFrame(raf);
        clearTimeout(timer);
        el.textContent = restore ? text : "";
      },
    };
  }

  /* The other titles — typed, held, wiped, retyped, under a blinking caret. */
  function typewriter(el, text) {
    const HOLD = 5000, GAP = 700, DEL = 28;
    let timer = null, alive = false;

    return {
      start() {
        if (alive) return;
        alive = true;
        el.textContent = "";
        const out = document.createElement("span");
        const caret = document.createElement("span");
        caret.className = "tw-caret";
        el.append(out, caret);

        let i = 0, deleting = false;
        (function step() {
          if (!alive) return;
          if (!deleting && i === text.length) {
            deleting = true;
            timer = setTimeout(step, HOLD);
            return;
          }
          if (deleting && i === 0) {
            deleting = false;
            timer = setTimeout(step, GAP);
            return;
          }
          i += deleting ? -1 : 1;
          out.textContent = text.slice(0, i);
          timer = setTimeout(step, deleting ? DEL : 42 + Math.random() * 38);
        })();
      },
      stop(restore) {
        alive = false;
        clearTimeout(timer);
        el.textContent = restore ? text : "";
      },
    };
  }

  // Blank each title up front (height locked so the layout never jumps).
  const players = new Map();
  let everStarted = false;

  for (const el of titles) {
    const text = el.textContent;
    el.style.minHeight = el.getBoundingClientRect().height + "px";
    el.textContent = "";
    players.set(el, el.dataset.anim === "decode" ? decoder(el, text) : typewriter(el, text));
  }

  // Runs only while the heading is on screen — off screen it rests as plain text.
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      const player = players.get(entry.target);
      if (!player) continue;
      if (entry.isIntersecting) { everStarted = true; player.start(); }
      else player.stop(false);
    }
  }, { threshold: 0.6 });

  titles.forEach((el) => observer.observe(el));

  // Safety net: if the observer never fires (page rendered inside a hidden
  // container, for instance), put the text back rather than leave it blank.
  setTimeout(() => {
    if (everStarted) return;
    players.forEach((player) => player.stop(true));
  }, 15000);
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

/* ── Skills explorer (tabs + sliding marker + auto-cycle) ──── */
(function skillStack() {
  const root = document.getElementById("skillStack");
  const marker = document.getElementById("stackMarker");
  if (!root) return;

  const tabs = [...root.querySelectorAll(".stack__tab")];
  const panels = [...root.querySelectorAll(".stack__panel")];
  if (!tabs.length) return;

  // Stagger index for the tag animation.
  panels.forEach((panel) => {
    panel.querySelectorAll(".stack__tags span").forEach((tag, i) => {
      tag.style.setProperty("--i", i);
    });
  });

  const isColumn = () => window.matchMedia("(min-width: 900px)").matches;
  let current = 0;
  let autoTimer = null;
  let userTook = false;

  function placeMarker() {
    if (!marker) return;
    const tab = tabs[current];
    if (isColumn()) {
      marker.style.width = "2px";
      marker.style.height = tab.offsetHeight + "px";
      marker.style.transform = `translateY(${tab.offsetTop}px)`;
    } else {
      marker.style.width = tab.offsetWidth + "px";
      marker.style.height = "2px";
      marker.style.transform =
        `translate(${tab.offsetLeft - root.querySelector(".stack__nav").scrollLeft}px, ${tab.offsetHeight + 2}px)`;
    }
    marker.classList.add("ready");
  }

  function select(index, focus) {
    current = (index + tabs.length) % tabs.length;

    tabs.forEach((tab, i) => {
      const on = i === current;
      tab.classList.toggle("is-active", on);
      tab.setAttribute("aria-selected", String(on));
      tab.tabIndex = on ? 0 : -1;
    });

    panels.forEach((panel, i) => {
      const on = i === current;
      // Re-adding the class restarts the tag stagger.
      panel.classList.toggle("is-active", on);
      if (on) panel.removeAttribute("hidden");
      else panel.setAttribute("hidden", "");
    });

    placeMarker();
    if (focus) tabs[current].focus();
  }

  tabs.forEach((tab, i) => {
    tab.addEventListener("click", () => { stopAuto(); select(i); });
  });

  root.querySelector(".stack__nav").addEventListener("keydown", (e) => {
    const forward = isColumn() ? "ArrowDown" : "ArrowRight";
    const back = isColumn() ? "ArrowUp" : "ArrowLeft";
    if (e.key === forward) { e.preventDefault(); stopAuto(); select(current + 1, true); }
    if (e.key === back) { e.preventDefault(); stopAuto(); select(current - 1, true); }
    if (e.key === "Home") { e.preventDefault(); stopAuto(); select(0, true); }
    if (e.key === "End") { e.preventDefault(); stopAuto(); select(tabs.length - 1, true); }
  });

  window.addEventListener("resize", placeMarker);
  root.querySelector(".stack__nav").addEventListener("scroll", placeMarker, { passive: true });

  /* Cycles through the categories on its own until someone takes over. */
  function startAuto() {
    if (userTook || reducedMotion || autoTimer) return;
    autoTimer = setInterval(() => select(current + 1), 4200);
  }
  function stopAuto() {
    userTook = true;
    clearInterval(autoTimer);
    autoTimer = null;
  }
  root.addEventListener("pointerdown", stopAuto);
  root.addEventListener("focusin", stopAuto);

  // Only run while the section is actually on screen.
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) startAuto();
        else { clearInterval(autoTimer); autoTimer = null; }
      }
    }, { threshold: 0.35 });
    io.observe(root);
  }

  select(0);
  // Fonts can land after first paint and nudge the tab heights.
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(placeMarker);
})();

/* ── Projects carousel ─────────────────────────────────────── */
(function projectCarousel() {
  const root = document.getElementById("projectCarousel");
  const track = document.getElementById("projTrack");
  const prev = document.getElementById("projPrev");
  const next = document.getElementById("projNext");
  const rail = document.getElementById("projRail");
  const indexEl = document.getElementById("projIndex");
  const totalEl = document.getElementById("projTotal");
  if (!root || !track) return;

  const cards = [...track.querySelectorAll(".project-card")];
  if (!cards.length) return;

  const pad = (n) => String(n).padStart(2, "0");
  totalEl.textContent = pad(cards.length);

  // Card pitch straight from layout positions, so it stays exact whatever
  // styling the cards carry.
  const step = () => {
    if (cards.length > 1) return cards[1].offsetLeft - cards[0].offsetLeft;
    const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    return cards[0].offsetWidth + gap;
  };
  const maxScroll = () => track.scrollWidth - track.clientWidth;

  function update() {
    const max = maxScroll();
    const progress = max > 0 ? track.scrollLeft / max : 1;
    rail.style.transform = `scaleX(${Math.min(1, Math.max(0, progress))})`;

    const i = max > 0 ? Math.round(track.scrollLeft / step()) : 0;
    indexEl.textContent = pad(Math.min(cards.length, i + 1));
  }

  function go(dir) {
    const max = maxScroll();
    const atEnd = track.scrollLeft >= max - 2;
    const atStart = track.scrollLeft <= 2;
    // Wrap around rather than dead-ending on the last card.
    let left;
    if (dir > 0) left = atEnd ? 0 : track.scrollLeft + step();
    else left = atStart ? max : track.scrollLeft - step();
    track.scrollTo({ left, behavior: reducedMotion ? "auto" : "smooth" });
  }

  next.addEventListener("click", () => go(1));
  prev.addEventListener("click", () => go(-1));

  track.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") { e.preventDefault(); go(1); }
    if (e.key === "ArrowLeft") { e.preventDefault(); go(-1); }
  });

  track.addEventListener("scroll", () => {
    if (!update.queued) {
      update.queued = true;
      requestAnimationFrame(() => { update.queued = false; update(); });
    }
  }, { passive: true });

  window.addEventListener("resize", update);

  // Cards fully inside the frame stay lit; the ones peeking sit back.
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        entry.target.classList.toggle("is-dim", entry.intersectionRatio <= 0.92);
      }
    }, { root: track, threshold: [0, 0.92, 1] });
    cards.forEach((card) => io.observe(card));
  }

  update();
})();

/* ── Experience panel (drops open on demand) ───────────────── */
(function experiencePanel() {
  const section = document.getElementById("experience");
  const btn = document.getElementById("expToggle");
  const panel = document.getElementById("expCollapse");
  const label = document.getElementById("expLabel");
  if (!section || !btn || !panel) return;

  // Only collapse once JS is running — without it the timeline stays open.
  section.classList.add("experience-ready");
  panel.setAttribute("aria-hidden", "true");

  btn.addEventListener("click", () => {
    const open = panel.classList.toggle("open");
    btn.setAttribute("aria-expanded", String(open));
    panel.setAttribute("aria-hidden", String(!open));
    label.textContent = open ? "hide experience path" : "show experience path";

    // Opening from a half-scrolled position can leave the button off-screen.
    if (open) {
      const top = btn.getBoundingClientRect().top;
      if (top < 80 || top > window.innerHeight - 160) {
        btn.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "center" });
      }
    }
  });

  // Deep link (#experience) opens it straight away.
  if (location.hash === "#experience") btn.click();
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
