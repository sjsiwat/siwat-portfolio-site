/* ════════════════════════════════════════════════════════════
   SIWAT JANKAM — PORTFOLIO SCRIPTS
   Typing · scroll effects · reveals · counters · visitor API
   ════════════════════════════════════════════════════════════ */

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;


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
  // `fun` lines are the off-duty ones: vermilion, in the sans. Roles run
  //  cobalt in the serif italic.
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
    if (wrap) {
      wrap.classList.toggle("is-role", !entry.fun);
      wrap.classList.toggle("is-fun", !!entry.fun);
    }
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

/* ── Heading line reveal ───────────────────────────────────────
   Split a heading into its rendered lines, mask each one, and slide
   them up in sequence. Lines are measured, not guessed, so the split
   survives a resize — and an .accent word stays inside its own line
   rather than animating on a beat of its own. */
(function headingReveal() {
  const SELECTOR = ".hero__name, .hero__tagline, .section-title, .contact__title";
  const heads = [...document.querySelectorAll(SELECTOR)];
  if (!heads.length) return;

  // Remember the original markup so a resize can re-split from clean source.
  heads.forEach((el) => { el.dataset.source = el.innerHTML; });

  function tokenise(el) {
    const out = [];
    (function walk(node, accent) {
      node.childNodes.forEach((n) => {
        if (n.nodeType === Node.TEXT_NODE) {
          n.textContent.split(/\s+/).forEach((w) => {
            if (w) out.push({ word: w, accent });
          });
        } else if (n.nodeType === Node.ELEMENT_NODE) {
          if (n.tagName === "BR") out.push({ br: true });
          else walk(n, accent || n.classList.contains("accent"));
        }
      });
    })(el, false);
    return out;
  }

  function split(el) {
    el.innerHTML = el.dataset.source;
    const tokens = tokenise(el);

    // Lay the words out flat first so the browser tells us where they break.
    el.innerHTML = "";
    const probes = [];
    tokens.forEach((t) => {
      if (t.br) { probes.push({ br: true }); el.appendChild(document.createElement("br")); return; }
      const s = document.createElement("span");
      if (t.accent) s.className = "accent";
      s.textContent = t.word;
      el.appendChild(s);
      el.appendChild(document.createTextNode(" "));
      probes.push({ node: s, token: t });
    });

    // Group by vertical position — that is the rendered line.
    const lines = [];
    let current = null, lastTop = null;
    probes.forEach((p) => {
      if (p.br) { current = null; lastTop = null; return; }
      const top = p.node.offsetTop;
      if (current === null || Math.abs(top - lastTop) > 2) {
        current = [];
        lines.push(current);
        lastTop = top;
      }
      current.push(p.token);
    });

    el.innerHTML = "";
    lines.forEach((words, i) => {
      const mask = document.createElement("span");
      mask.className = "ln";
      const inner = document.createElement("span");
      inner.className = "ln__i";
      inner.style.setProperty("--ln-delay", i * 70 + "ms");
      words.forEach((t, j) => {
        if (j) inner.appendChild(document.createTextNode(" "));
        if (t.accent) {
          const a = document.createElement("span");
          a.className = "accent";
          a.textContent = t.word;
          inner.appendChild(a);
        } else {
          inner.appendChild(document.createTextNode(t.word));
        }
      });
      mask.appendChild(inner);
      el.appendChild(mask);
    });
  }

  if (reducedMotion) return;

  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add("is-revealed");
      io.unobserve(e.target);
    });
  }, { threshold: 0.15, rootMargin: "0px 0px -8% 0px" });

  // Wait for the display faces before measuring — fallback metrics break
  // lines in the wrong places, and re-splitting later would replay the
  // animation halfway through.
  const ready = document.fonts && document.fonts.ready
    ? document.fonts.ready
    : Promise.resolve();

  ready.then(() => {
    heads.forEach((el) => { split(el); io.observe(el); });

    // Re-measure on resize; anything already shown stays shown.
    let t;
    window.addEventListener("resize", () => {
      clearTimeout(t);
      t = setTimeout(() => heads.forEach((el) => {
        const was = el.classList.contains("is-revealed");
        split(el);
        if (was) el.classList.add("is-revealed");
        else io.observe(el);
      }), 200);
    });
  });
})();

/* ── Image reveal — the picture settles back to its own size ──── */
(function imageReveal() {
  const frames = document.querySelectorAll(".img-reveal");
  if (!frames.length) return;
  if (reducedMotion) {
    frames.forEach((f) => f.classList.add("is-revealed"));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add("is-revealed");
      io.unobserve(e.target);
    });
  }, { threshold: 0.2 });
  frames.forEach((f) => io.observe(f));
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

/* ── Disclosures — every section folds away ────────────────────
   Panels are open in the markup so the page still reads without JS;
   the collapse only becomes possible once this runs. */
(function disclosures() {
  const btns = [...document.querySelectorAll(".disclosure__btn")];
  if (!btns.length) return;

  document.documentElement.classList.add("js-disclosure");

  const setState = (btn, panel, open) => {
    panel.classList.toggle("is-open", open);
    btn.setAttribute("aria-expanded", String(open));
    panel.setAttribute("aria-hidden", String(!open));
    const label = btn.querySelector(".disclosure__label");
    if (label) label.textContent = (open ? "Hide " : "Show ") + btn.dataset.noun;
  };

  btns.forEach((btn) => {
    const panel = document.getElementById(btn.getAttribute("aria-controls"));
    if (!panel) return;

    // Experience stays folded on arrival; everything else opens.
    setState(btn, panel, panel.id !== "panel-experience");

    btn.addEventListener("click", () => {
      const open = !panel.classList.contains("is-open");
      setState(btn, panel, open);

      // Closing a tall panel can strand the button off-screen.
      if (!open) {
        const top = btn.getBoundingClientRect().top;
        if (top < 80) btn.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "center" });
      }
    });
  });

  // A deep link opens the section it points at.
  const deep = location.hash && document.querySelector(location.hash + " .disclosure__btn");
  if (deep && deep.getAttribute("aria-expanded") === "false") deep.click();
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
