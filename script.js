/* ============================================================
   Luxury Hospitality Recruitment — site behaviour
   Vanilla JS, no dependencies.
   ============================================================ */
(function () {
  "use strict";

  /* ---------- Navbar: shadow on scroll ---------- */
  const nav = document.querySelector(".nav");
  function syncNav() {
    if (!nav) return;
    nav.classList.toggle("is-scrolled", window.scrollY > 20);
  }
  syncNav();
  window.addEventListener("scroll", syncNav, { passive: true });

  /* ---------- Mobile menu ---------- */
  const toggle = document.querySelector(".nav__toggle");
  const menu = document.querySelector(".nav__menu");
  if (toggle && menu) {
    toggle.addEventListener("click", function () {
      const open = menu.classList.toggle("is-open");
      toggle.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", String(open));
      document.body.style.overflow = open ? "hidden" : "";
    });
    menu.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        menu.classList.remove("is-open");
        toggle.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
        document.body.style.overflow = "";
      });
    });
  }

  /* ---------- Scroll reveal ---------- */
  const reveals = document.querySelectorAll(".reveal");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (reduce || !("IntersectionObserver" in window)) {
    reveals.forEach(function (el) { el.classList.add("is-in"); });
  } else {
    const io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        const el = entry.target;
        const repeat = el.hasAttribute("data-reveal-repeat");
        if (entry.isIntersecting) {
          // gentle stagger for grouped siblings
          const delay = Number(el.dataset.delay || 0);
          el._revealT = setTimeout(function () { el.classList.add("is-in"); }, delay);
          // one-way reveals stop observing; repeatable ones keep toggling on scroll
          if (!repeat) io.unobserve(el);
        } else if (repeat) {
          // scrolled back out of the trigger zone — reset so it fades in again
          clearTimeout(el._revealT);
          el.classList.remove("is-in");
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -12% 0px" });
    reveals.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Count-up animation for Results metrics ---------- */
  (function () {
    const nums = document.querySelectorAll(".metric__num");
    if (!nums.length) return;
    if (reduce || !("IntersectionObserver" in window)) return;

    function animateCount(el, delay) {
      const raw = el.dataset.target || el.textContent.trim();
      el.dataset.target = raw;
      const m = raw.match(/^(\D*)(\d[\d.,]*)(.*)$/);
      if (!m) return;
      const prefix = m[1];
      const target = parseFloat(m[2].replace(/,/g, ""));
      const suffix = m[3];
      const dur = 1500;
      let start = null;
      el.textContent = prefix + "0";
      function step(ts) {
        if (start === null) start = ts;
        const p = Math.min((ts - start) / dur, 1);
        const eased = 1 - Math.pow(1 - p, 3);    // easeOutCubic
        el.textContent = prefix + Math.round(eased * target) + (p === 1 ? suffix : "");
        if (p < 1) requestAnimationFrame(step);
      }
      setTimeout(function () { requestAnimationFrame(step); }, delay);
    }

    const io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          if (entry.target.dataset.ran !== "1") {
            entry.target.dataset.ran = "1";
            animateCount(entry.target, (Number(entry.target.dataset.i) || 0) * 110);
          }
        } else {
          // left the viewport — arm it to re-animate on the next scroll-in
          entry.target.dataset.ran = "";
        }
      });
    }, { threshold: 0.6 });
    nums.forEach(function (n, i) { n.dataset.i = i; io.observe(n); });
  })();

  /* ---------- Global Reach: dotted-continents globe + pins ---------- */
  (function () {
    const canvas = document.querySelector("canvas.globe");
    if (!canvas || !canvas.getContext) return;
    const ctx = canvas.getContext("2d");
    const TILT = -0.68;
    let W = 0, H = 0, R = 0, cx = 0, cy = 0;

    function toVec(lat, lon) {
      const la = lat * Math.PI / 180, lo = lon * Math.PI / 180;
      return [Math.cos(la) * Math.sin(lo), Math.sin(la), Math.cos(la) * Math.cos(lo)];
    }
    function project(v, rot) {
      const x0 = v[0] * Math.cos(rot) + v[2] * Math.sin(rot);
      const z0 = -v[0] * Math.sin(rot) + v[2] * Math.cos(rot);
      const y0 = v[1];
      const y = y0 * Math.cos(TILT) - z0 * Math.sin(TILT);
      const z = y0 * Math.sin(TILT) + z0 * Math.cos(TILT);
      return { x: cx + x0 * R, y: cy - y * R, z: z };
    }

    const land = (window.LANDDOTS || []).map(function (d) { return toVec(d[0], d[1]); });
    const SOURCE = [[-34,-64],[4,-74],[8,-66],[23,-102],[-33,-71],[-10,-76],[-10,-52]];
    const PLACE  = [[24,54],[25,51],[24,45],[43.2,18.4],[40,20.8],[-25,133],[36,138],[54,-2]];
    const sourceVecs = SOURCE.map(function (p) { return toVec(p[0], p[1]); });
    const placeVecs  = PLACE.map(function (p) { return toVec(p[0], p[1]); });

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      W = rect.width; H = rect.height;
      if (!W || !H) return;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      R = Math.min(W, H) * 0.46;
      cx = W / 2; cy = H / 2;
    }

    let rot = -0.16;   // start centred on Europe / UK
    var mqMobile = window.matchMedia("(max-width: 760px)");
    var rotSpeed = mqMobile.matches ? 0.0034 : 0.0014;   // spin faster on mobile

    function pin(x, y, s, color, alpha) {
      const r = 4.7 * s, hy = y - 11 * s;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = color;
      ctx.beginPath();                       // tail
      ctx.moveTo(x, y);
      ctx.lineTo(x - r * 0.72, hy + r * 0.25);
      ctx.lineTo(x + r * 0.72, hy + r * 0.25);
      ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.arc(x, hy, r, 0, 6.2832); ctx.fill();   // head
      ctx.beginPath(); ctx.arc(x, hy, r * 0.4, 0, 6.2832);          // inner dot
      ctx.fillStyle = "rgba(255,255,255,.92)"; ctx.fill();
      ctx.globalAlpha = 1;
    }

    function frame() {
      if (!W) { resize(); if (!W) return; }
      ctx.clearRect(0, 0, W, H);

      // soft sphere depth
      const g = ctx.createRadialGradient(cx - R * 0.25, cy - R * 0.3, R * 0.1, cx, cy, R * 1.05);
      g.addColorStop(0, "rgba(255,255,255,0.08)");
      g.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, 6.2832); ctx.fill();

      // land dots (front hemisphere only)
      for (let i = 0; i < land.length; i++) {
        const p = project(land[i], rot);
        if (p.z <= 0.02) continue;
        ctx.globalAlpha = 0.18 + p.z * 0.45;
        ctx.fillStyle = "#ffffff";
        ctx.beginPath(); ctx.arc(p.x, p.y, 1.35, 0, 6.2832); ctx.fill();
      }
      ctx.globalAlpha = 1;

      // pins — destinations (white) then sources (gold), sorted so nearer ones draw last
      const markers = [];
      for (let i = 0; i < placeVecs.length; i++) markers.push([placeVecs[i], "#ffffff"]);
      for (let i = 0; i < sourceVecs.length; i++) markers.push([sourceVecs[i], "#ECC76E"]);
      markers.map(function (m) { return [project(m[0], rot), m[1]]; })
             .filter(function (m) { return m[0].z > 0.04; })
             .sort(function (a, b) { return a[0].z - b[0].z; })
             .forEach(function (m) {
               const p = m[0];
               const alpha = Math.min(1, (p.z - 0.04) * 4);
               pin(p.x, p.y, 0.85 + p.z * 0.35, m[1], alpha);
             });

      if (!reduce) { rot += rotSpeed; requestAnimationFrame(frame); }
    }

    resize();
    window.addEventListener("resize", function () {
      resize();
      rotSpeed = mqMobile.matches ? 0.0034 : 0.0014;   // keep speed in sync with viewport
      if (reduce) frame();
    });
    frame();
  })();

  /* ---------- Prefill form interest from query string ---------- */
  // e.g. work-and-travel.html?program=Work%20%26%20Travel%20Japan
  const params = new URLSearchParams(window.location.search);
  const program = params.get("program");
  if (program) {
    const target = document.querySelector('[data-prefill="program"]');
    if (target) target.value = program;
    const open = document.querySelector("#program-enquiry");
    if (open) open.scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
  }

  /* ---------- Forms ---------- */
  // Submits via fetch to the configured action (e.g. FormSubmit / Formspree).
  // On success shows an inline confirmation without leaving the page.
  document.querySelectorAll("form[data-form]").forEach(function (form) {
    form.addEventListener("submit", function (e) {
      const action = form.getAttribute("action") || "";
      const usesService = /^https?:\/\//.test(action);

      // If no remote endpoint configured yet, fall back to mailto so the
      // site is functional the moment it is uploaded.
      if (!usesService) {
        e.preventDefault();
        showSuccess(form);
        buildMailto(form);
        return;
      }

      e.preventDefault();
      const btn = form.querySelector('[type="submit"]');
      const original = btn ? btn.textContent : "";
      if (btn) { btn.disabled = true; btn.textContent = "Sending…"; }

      fetch(action, {
        method: "POST",
        body: new FormData(form),
        headers: { Accept: "application/json" }
      })
        .then(function (res) {
          if (!res.ok) throw new Error("Network");
          form.reset();
          showSuccess(form);
        })
        .catch(function () {
          buildMailto(form);
          showSuccess(form);
        })
        .finally(function () {
          if (btn) { btn.disabled = false; btn.textContent = original; }
        });
    });
  });

  function showSuccess(form) {
    const box = form.querySelector(".form-success");
    if (box) {
      box.classList.add("is-visible");
      box.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
    }
  }

  function buildMailto(form) {
    const to = form.dataset.email || "luxuryhospitalityhiring@gmail.com";
    const subject = encodeURIComponent(form.dataset.subject || "Website enquiry");
    let body = "";
    new FormData(form).forEach(function (value, key) {
      if (key.startsWith("_")) return;
      body += key + ": " + value + "\n";
    });
    window.location.href =
      "mailto:" + to + "?subject=" + subject + "&body=" + encodeURIComponent(body);
  }

  /* ---------- Pick hero video source by viewport + ensure autoplay ---------- */
  // Mobile gets the trimmed clip (no letterbox); desktop gets the full video.
  (function () {
    var hv = document.querySelector(".hero-video__media");
    if (!hv || reduce) return;   // reduced motion is handled below

    var isMobile = window.matchMedia("(max-width: 760px)").matches;
    var src = isMobile ? hv.dataset.srcMobile : hv.dataset.src;
    var source = hv.querySelector("source");

    // iOS only autoplays when muted is set as a PROPERTY and playback is inline
    hv.muted = true;
    hv.setAttribute("muted", "");
    hv.playsInline = true;

    if (src && source && source.getAttribute("src") !== src) {
      source.setAttribute("src", src);
      hv.load();   // reloading cancels the autoplay attribute's effect on iOS…
    }

    // …so start playback explicitly as soon as there are frames to show
    function tryPlay() {
      var p = hv.play();
      if (p && typeof p.catch === "function") p.catch(function () {});
    }
    tryPlay();
    hv.addEventListener("loadeddata", tryPlay, { once: true });
    hv.addEventListener("canplay", tryPlay, { once: true });
    // last resort (iOS Low Power Mode blocks autoplay): resume on first touch
    document.addEventListener("touchstart", tryPlay, { once: true, passive: true });
  })();

  /* ---------- Pause background video for reduced motion ---------- */
  if (reduce) {
    document.querySelectorAll(".hero-video__media").forEach(function (v) {
      v.removeAttribute("autoplay");
      v.addEventListener("loadeddata", function () { v.pause(); });
      try { v.pause(); } catch (e) {}
    });
  }

  /* ---------- Footer year ---------- */
  const yearEl = document.querySelector("[data-year]");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());
})();
