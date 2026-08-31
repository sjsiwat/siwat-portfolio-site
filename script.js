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

/* ── The lamp — light and dark ─────────────────────────────────
   The head sets the attribute before first paint; this only keeps the
   control honest and remembers the choice. With no choice stored the page
   follows the system, and keeps following it. */
(function lamp() {
  const btn = document.getElementById("lamp");
  if (!btn) return;
  const root = document.documentElement;
  const system = window.matchMedia("(prefers-color-scheme: dark)");

  const stored = () => { try { return localStorage.getItem("theme"); } catch (e) { return null; } };
  const current = () =>
    root.getAttribute("data-theme") || (system.matches ? "dark" : "light");

  function show(theme) {
    const dark = theme === "dark";
    btn.setAttribute("aria-pressed", String(dark));
    btn.setAttribute("aria-label", dark ? "Turn the lights up" : "Turn the lights down");
  }
  show(current());

  btn.addEventListener("click", () => {
    const next = current() === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    try { localStorage.setItem("theme", next); } catch (e) {}
    show(next);
  });

  system.addEventListener("change", () => { if (!stored()) show(current()); });
})();

/* ── Wordmark — the nickname while the hero holds the name ─────
   The hero prints SIWAT JANKAM at 139px, so a second copy of it in the bar
   above is saying nothing. It carries YOK instead, and rubs that out and
   writes the full name at the moment the big one leaves the screen — which
   is the moment the bar has to start saying whose site this is. */
(function wordmark() {
  const el = document.querySelector(".nav__logo");
  const anchor = document.querySelector(".hero__name");
  if (!el || !anchor) return;

  const SHORT = "Yok";
  const FULL = "Siwat Jankam";

  // The name it reports never changes, whatever it happens to be showing.
  el.setAttribute("aria-label", FULL);
  const ink = document.createElement("span");
  ink.setAttribute("aria-hidden", "true");
  el.textContent = "";
  el.appendChild(ink);

  let shown = SHORT;
  let timer = 0;
  let first = true;
  ink.textContent = SHORT;

  function write(target) {
    if (shown === target) return;
    shown = target;
    clearTimeout(timer);

    if (reducedMotion || first) {
      ink.textContent = target;
      return;
    }
    el.classList.add("is-typing");
    const step = () => {
      const now = ink.textContent;
      if (now.length && !target.startsWith(now)) {
        // Rub out only what does not belong to the new word.
        ink.textContent = now.slice(0, -1);
        timer = setTimeout(step, 32);
      } else if (now.length < target.length) {
        ink.textContent = target.slice(0, now.length + 1);
        timer = setTimeout(step, 54);
      } else {
        el.classList.remove("is-typing");
      }
    };
    step();
  }

  // The trigger is the big name itself passing under the bar, not a timer
  // and not a pixel count — so it stays right at any type size.
  const io = new IntersectionObserver(
    ([e]) => { write(e.isIntersecting ? SHORT : FULL); first = false; },
    { rootMargin: "-72px 0px 0px 0px" }
  );
  io.observe(anchor);
})();

/* ── Typing effect ─────────────────────────────────────────── */
(function typing() {
  const el = document.getElementById("typedText");
  if (!el) return;
  // `fun` lines are the off-duty ones: vermilion, in the sans. Roles run
  //  cobalt in the serif italic.
  const strings = [
    { text: "Full Stack Developer" },
    { text: "Interface & API Builder" },
    { text: "Cat Lover", fun: true },
    { text: "Design-Minded Engineer" },
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
  const SELECTOR = ".hero__name, .hero__tagline, .section-title, .contact__title, .case-title";
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
    const letters = el.hasAttribute("data-letters");
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
        let host = inner;
        if (t.accent) {
          host = document.createElement("span");
          host.className = "accent";
          inner.appendChild(host);
        }
        if (letters) {
          // One span to a character, so a hover can pick out just that one.
          for (const ch of t.word) {
            const c = document.createElement("span");
            c.className = "ch";
            c.textContent = ch;
            host.appendChild(c);
          }
        } else {
          host.appendChild(document.createTextNode(t.word));
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

/* ── Portrait — an empty frame until you ask for the photo ──── */
(function portrait() {
  const frame = document.querySelector("[data-portrait]");
  const toggle = document.querySelector("[data-portrait-toggle]");
  if (!frame || !toggle) return;

  // Hovering the control previews, the same as hovering the frame does;
  // clicking pins it, which is the only route open on a touch screen.
  const peek = (on) => {
    if (!frame.classList.contains("is-unmasked")) {
      frame.classList.toggle("is-peeking", on);
    }
  };
  toggle.addEventListener("pointerenter", () => peek(true));
  toggle.addEventListener("pointerleave", () => peek(false));
  toggle.addEventListener("focus", () => peek(true));
  toggle.addEventListener("blur", () => peek(false));

  const pin = () => {
    const on = !frame.classList.contains("is-unmasked");
    frame.classList.toggle("is-unmasked", on);
    frame.classList.remove("is-peeking");
    toggle.setAttribute("aria-pressed", String(on));
  };
  toggle.addEventListener("click", pin);
  frame.addEventListener("click", pin);
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
    if (!label) return;
    // A section can name its own two states; otherwise it gets Show/Hide.
    const named = open ? btn.dataset.labelOpen : btn.dataset.labelClosed;
    label.textContent = named || (open ? "Hide " : "Show ") + btn.dataset.noun;
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

/* ── GitHub contribution calendar ──────────────────────────────
   Data comes from a Worker that holds the GitHub token; see
   workers/github-contributions. The section ships hidden and only
   reveals itself once real data lands, so a Worker that is down or
   not yet deployed leaves no empty grid behind. */
(async function contributions() {
  const GITHUB_API = "https://github-contributions.sj-siwat.workers.dev";
  const section = document.getElementById("activity");
  const grid = document.getElementById("ghGrid");
  const months = document.getElementById("ghMonths");
  if (!section || !grid) return;

  const MONTH = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  try {
    const res = await fetch(GITHUB_API);
    if (!res.ok) throw new Error("status " + res.status);
    const data = await res.json();
    if (!Array.isArray(data.days) || !data.days.length) throw new Error("no days");

    // GitHub buckets its levels against the year's single busiest day, so a
    // couple of outliers flatten everything else into one shade. Rebucket
    // against the quartiles of the days actually worked, which is what the
    // graph is meant to show.
    const worked = data.days.map((d) => d[2]).filter((c) => c > 0).sort((a, b) => a - b);
    const q = (p) => worked[Math.min(worked.length - 1, Math.floor(worked.length * p))] || 0;
    const [q1, q2, q3] = [q(0.25), q(0.5), q(0.75)];
    const levelOf = (c) =>
      c === 0 ? 0 : c <= q1 ? 1 : c <= q2 ? 2 : c <= q3 ? 3 : 4;

    // Cells are placed by week and weekday, so a partial first or last
    // week leaves its gap rather than shifting everything along.
    const frag = document.createDocumentFragment();
    let active = 0, streak = 0, best = 0;

    data.days.forEach(([week, weekday, count]) => {
      const cell = document.createElement("i");
      cell.dataset.level = levelOf(count);
      cell.title = count === 1 ? "1 contribution" : count + " contributions";
      cell.style.gridColumn = week + 1;
      cell.style.gridRow = weekday + 1;
      frag.appendChild(cell);

      if (count > 0) { active++; streak++; if (streak > best) best = streak; }
      else streak = 0;
    });
    grid.appendChild(frag);
    grid.style.gridTemplateColumns = `repeat(${data.weeks}, var(--gh-cell))`;

    // A month label sits over the first week that starts in it.
    if (months) {
      months.style.gridTemplateColumns = `repeat(${data.weeks}, var(--gh-cell))`;
      const seen = new Set();
      let lastCol = -99;
      data.days.forEach(([week, weekday]) => {
        if (weekday !== 0) return;
        const date = new Date(data.from);
        date.setDate(date.getDate() + week * 7);
        const key = date.getMonth();
        if (seen.has(key)) return;
        seen.add(key);
        // A month that only clips the edge of the calendar has no room for
        // its name — skip it rather than letting two labels collide.
        if (week - lastCol < 3) return;
        lastCol = week;
        const label = document.createElement("span");
        label.textContent = MONTH[key];
        label.style.gridColumn = week + 1;
        months.appendChild(label);
      });
    }

    const set = (id, value) => {
      const el = document.getElementById(id);
      if (el) el.textContent = value;
    };
    set("ghTotal", data.total.toLocaleString());
    set("ghStreak", best + (best === 1 ? " day" : " days"));
    set("ghActive", active.toLocaleString());

    const range = document.getElementById("ghRange");
    if (range && data.from && data.to) {
      const fmt = (d) => {
        const dt = new Date(d);
        return MONTH[dt.getMonth()] + " " + dt.getFullYear();
      };
      range.textContent = fmt(data.from) + " \u2192 " + fmt(data.to);
    }

    section.hidden = false;
  } catch (error) {
    console.error("Contribution calendar unavailable:", error);
    // Take the nav entries with it — a link to a section that is not
    // there is worse than no link.
    document.querySelectorAll('[onclick*="\'activity\'"]').forEach((b) => b.remove());
    section.remove();
  }
})();

/* ── Visitor counter (Cloudflare Workers + D1) ─────────────── */
(async function visitorCounter() {
  const VISITOR_API = "https://visitor-counter.sj-siwat.workers.dev";
  const el = document.getElementById("visitor-count");
  if (!el) return;
  try {
    const response = await fetch(VISITOR_API);
    const data = await response.json();
    el.textContent = data.count.toLocaleString();
  } catch (error) {
    console.error("Visitor counter error:", error);
    el.textContent = "—";
  }
})();
