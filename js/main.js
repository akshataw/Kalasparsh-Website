/* Kalasparsh Tattoo — interactions (vanilla JS, no dependencies) */
(() => {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const desktop = window.matchMedia("(min-width: 1024px)");

  /* ---------- Footer year ---------- */
  $$("[data-year]").forEach((el) => { el.textContent = new Date().getFullYear(); });

  /* ---------- Header: solid on scroll ---------- */
  const header = $(".site-header");
  if (header) {
    const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---------- Mobile navigation ---------- */
  const toggle = $(".nav-toggle");
  const nav = $("#site-nav");
  if (toggle && nav) {
    const label = $(".sr-only", toggle);
    const focusables = () => [toggle, ...$$("a, button", nav)];

    const setOpen = (open) => {
      toggle.setAttribute("aria-expanded", String(open));
      label.textContent = open ? "Close menu" : "Menu";
      nav.classList.toggle("is-open", open);
      document.body.classList.toggle("nav-open", open);
      if (open) $("a", nav).focus();
    };

    toggle.addEventListener("click", () => setOpen(toggle.getAttribute("aria-expanded") !== "true"));
    nav.addEventListener("click", (e) => { if (e.target.closest("a")) setOpen(false); });

    document.addEventListener("keydown", (e) => {
      if (!nav.classList.contains("is-open")) return;
      if (e.key === "Escape") { setOpen(false); toggle.focus(); return; }
      if (e.key === "Tab") {
        const items = focusables();
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });

    desktop.addEventListener("change", (e) => { if (e.matches) setOpen(false); });
  }

  /* ---------- Scroll spy (home page) ---------- */
  const spyLinks = $$(".nav-link[data-spy]");
  // watch every section so the highlight clears in sections without a menu link (work, FAQ, …)
  const spyTargets = spyLinks.length ? $$("main section[id]") : [];
  if (spyTargets.length && "IntersectionObserver" in window) {
    const setActive = (id) => spyLinks.forEach((a) => {
      const on = a.dataset.spy === id;
      a.classList.toggle("is-active", on);
      if (on) a.setAttribute("aria-current", "location"); else a.removeAttribute("aria-current");
    });
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) setActive(en.target.id); });
    }, { rootMargin: "-45% 0px -50% 0px" });
    spyTargets.forEach((t) => spy.observe(t));
  }

  /* ---------- Hero intro ---------- */
  const hero = $(".hero");
  if (hero) requestAnimationFrame(() => hero.classList.add("is-ready"));

  /* ---------- Reveal on scroll + needle strokes + counters ---------- */
  const countUp = (el) => {
    const target = Number(el.dataset.count);
    if (reduceMotion || !target) return;
    const start = performance.now();
    const dur = 1400;
    const fmt = new Intl.NumberFormat("en-IN");
    const tick = (now) => {
      const p = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt.format(Math.round(target * eased));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  $$("[data-needle] path").forEach((p) => {
    const len = Math.ceil(p.getTotalLength ? p.getTotalLength() : 1600);
    p.parentNode.style.setProperty("--len", len);
  });

  const revealables = $$("[data-reveal], [data-needle]");
  if ("IntersectionObserver" in window && !reduceMotion) {
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        en.target.classList.add("is-visible");
        $$("[data-count]", en.target).forEach(countUp);
        obs.unobserve(en.target);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });
    revealables.forEach((el) => io.observe(el));
  } else {
    revealables.forEach((el) => el.classList.add("is-visible"));
  }

  /* ---------- Magnetic CTA ---------- */
  if (!reduceMotion && window.matchMedia("(hover: hover)").matches) {
    $$("[data-magnetic]").forEach((btn) => {
      btn.addEventListener("pointermove", (e) => {
        const r = btn.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) * 0.18;
        const y = (e.clientY - r.top - r.height / 2) * 0.3;
        btn.style.transform = `translate(${x}px, ${y}px)`;
      });
      btn.addEventListener("pointerleave", () => { btn.style.transform = ""; });
    });
  }

  /* ---------- Swipe helper ---------- */
  const onSwipe = (el, left, right) => {
    let x0 = null;
    let y0 = null;
    el.addEventListener("pointerdown", (e) => { if (e.pointerType !== "mouse") { x0 = e.clientX; y0 = e.clientY; } });
    el.addEventListener("pointerup", (e) => {
      if (x0 === null) return;
      const dx = e.clientX - x0;
      const dy = e.clientY - y0;
      x0 = null;
      if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.5) (dx < 0 ? left : right)();
    });
    el.addEventListener("pointercancel", () => { x0 = null; });
  };

  /* ---------- Lightbox ---------- */
  const lb = $("#lightbox");
  if (lb && typeof lb.showModal === "function") {
    const lbImg = $(".lb-stage img", lb);
    const lbTitle = $(".lb-cap b", lb);
    const lbMeta = $(".lb-cap small", lb);
    const lbCount = $(".lb-count", lb);
    let items = [];
    let index = 0;
    let opener = null;

    const show = (i) => {
      index = (i + items.length) % items.length;
      const t = items[index];
      const thumb = $("img", t);
      lbImg.classList.add("is-loading");
      lbImg.alt = thumb.alt;
      lbImg.src = t.dataset.full;
      lbTitle.innerHTML = t.dataset.title;
      lbMeta.textContent = t.dataset.meta;
      lbCount.textContent = `${String(index + 1).padStart(2, "0")} / ${String(items.length).padStart(2, "0")}`;
    };
    lbImg.addEventListener("load", () => lbImg.classList.remove("is-loading"));

    $$("[data-lightbox]").forEach((group) => {
      group.addEventListener("click", (e) => {
        const t = e.target.closest(".tile");
        if (!t) return;
        items = $$(".tile:not([hidden])", group);
        opener = t;
        show(items.indexOf(t));
        lb.showModal();
        document.body.classList.add("nav-open");
      });
    });

    $(".lb-close", lb).addEventListener("click", () => lb.close());
    $(".lb-prev", lb).addEventListener("click", () => show(index - 1));
    $(".lb-next", lb).addEventListener("click", () => show(index + 1));
    lb.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") show(index - 1);
      if (e.key === "ArrowRight") show(index + 1);
    });
    // click on the dark area (not on controls/image) closes
    lb.addEventListener("click", (e) => { if (e.target === lb || e.target.classList.contains("lb-stage")) lb.close(); });
    lb.addEventListener("close", () => {
      document.body.classList.remove("nav-open");
      if (opener) opener.focus();
    });
    onSwipe($(".lb-stage", lb), () => show(index + 1), () => show(index - 1));
  }

  /* ---------- Video slider ---------- */
  $$("[data-slider]").forEach((slider) => {
    const track = $(".slider-track", slider);
    const slides = $$(".slide", slider);
    const dots = $$(".dot", slider);
    const prev = $("[data-prev]", slider);
    const next = $("[data-next]", slider);
    const count = $(".slider-count b", slider);
    let current = 0;
    let inView = false;
    let userPaused = false;

    const videoOf = (i) => $("video", slides[i]);
    const playBtnOf = (i) => $(".slide-play", slides[i]);
    const titleOf = (i) => $("h3", slides[i]).textContent;

    const setPlaying = (i, playing) => {
      const v = videoOf(i);
      const btn = playBtnOf(i);
      if (playing) {
        const p = v.play();
        if (p && p.catch) p.catch(() => setPlaying(i, false));
      } else {
        v.pause();
      }
      btn.setAttribute("aria-pressed", String(playing));
      btn.setAttribute("aria-label", `${playing ? "Pause" : "Play"} video: ${titleOf(i)}`);
    };

    const autoplay = () => {
      if (!reduceMotion && inView && !userPaused) setPlaying(current, true);
    };

    const go = (i) => {
      setPlaying(current, false);
      current = Math.max(0, Math.min(slides.length - 1, i));
      track.style.transform = `translateX(-${current * 100}%)`;
      slides.forEach((s, n) => {
        const on = n === current;
        s.setAttribute("aria-hidden", String(!on));
        s.inert = !on;
      });
      dots.forEach((d, n) => { if (n === current) d.setAttribute("aria-current", "true"); else d.removeAttribute("aria-current"); });
      prev.disabled = current === 0;
      next.disabled = current === slides.length - 1;
      count.textContent = String(current + 1).padStart(2, "0");
      autoplay();
    };

    slides.forEach((s, i) => {
      playBtnOf(i).addEventListener("click", () => {
        const playing = videoOf(i).paused;
        userPaused = !playing;
        setPlaying(i, playing);
      });
    });
    prev.addEventListener("click", () => go(current - 1));
    next.addEventListener("click", () => go(current + 1));
    dots.forEach((d, i) => d.addEventListener("click", () => go(i)));
    slider.addEventListener("keydown", (e) => {
      if (e.target.closest("input, textarea")) return;
      if (e.key === "ArrowLeft") { e.preventDefault(); go(current - 1); }
      if (e.key === "ArrowRight") { e.preventDefault(); go(current + 1); }
    });
    onSwipe($(".slider-viewport", slider), () => go(current + 1), () => go(current - 1));

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(([en]) => {
        inView = en.isIntersecting;
        if (inView) autoplay(); else setPlaying(current, false);
      }, { threshold: 0.5 }).observe(slider);
    }
    go(0);
  });

  /* ---------- Testimonials ---------- */
  $$("[data-reviews]").forEach((root) => {
    const quotes = $$(".quote", root);
    const count = $(".slider-count b", root);
    const toggleBtn = $("[data-toggle]", root);
    const stage = $(".quote-stage", root);
    let current = 0;
    let timer = null;
    let stopped = reduceMotion;
    let hovering = false;

    const show = (i) => {
      quotes[current].classList.remove("is-active");
      quotes[current].setAttribute("aria-hidden", "true");
      current = (i + quotes.length) % quotes.length;
      quotes[current].classList.add("is-active");
      quotes[current].removeAttribute("aria-hidden");
      count.textContent = String(current + 1).padStart(2, "0");
    };
    const schedule = () => {
      clearInterval(timer);
      timer = null;
      // announce changes only when the user drives them
      stage.setAttribute("aria-live", stopped ? "polite" : "off");
      if (!stopped && !hovering) timer = setInterval(() => show(current + 1), 7000);
    };
    const renderToggle = () => {
      toggleBtn.setAttribute("aria-pressed", String(stopped));
      toggleBtn.setAttribute("aria-label", stopped ? "Start automatic rotation" : "Pause automatic rotation");
      $(".i-pause", toggleBtn).style.display = stopped ? "none" : "";
      $(".i-play", toggleBtn).style.display = stopped ? "" : "none";
    };

    $("[data-prev]", root).addEventListener("click", () => { show(current - 1); schedule(); });
    $("[data-next]", root).addEventListener("click", () => { show(current + 1); schedule(); });
    toggleBtn.addEventListener("click", () => { stopped = !stopped; renderToggle(); schedule(); });
    root.addEventListener("mouseenter", () => { hovering = true; schedule(); });
    root.addEventListener("mouseleave", () => { hovering = false; schedule(); });
    root.addEventListener("focusin", () => { hovering = true; schedule(); });
    root.addEventListener("focusout", (e) => { if (!root.contains(e.relatedTarget)) { hovering = false; schedule(); } });
    onSwipe(stage, () => { show(current + 1); schedule(); }, () => { show(current - 1); schedule(); });

    renderToggle();
    schedule();
  });

  /* ---------- FAQ accordion (one open, animated) ---------- */
  $$("[data-accordion]").forEach((acc) => {
    const items = $$("details", acc);

    const animate = (d, open) => {
      const body = $(".qa-body", d);
      if (reduceMotion || !body.animate) { d.open = open; return; }
      if (open) {
        d.open = true;
        const h = body.scrollHeight;
        body.animate([{ height: "0px", opacity: 0 }, { height: `${h}px`, opacity: 1 }], { duration: 320, easing: "cubic-bezier(0.22, 1, 0.36, 1)" });
      } else {
        const h = body.scrollHeight;
        const a = body.animate([{ height: `${h}px`, opacity: 1 }, { height: "0px", opacity: 0 }], { duration: 220, easing: "cubic-bezier(0.55, 0, 1, 0.45)" });
        a.onfinish = () => { d.open = false; };
      }
    };

    items.forEach((d) => {
      $("summary", d).addEventListener("click", (e) => {
        e.preventDefault();
        const willOpen = !d.open;
        items.forEach((o) => { if (o !== d && o.open) animate(o, false); });
        animate(d, willOpen);
      });
    });
  });

  /* ---------- Gallery filters ---------- */
  const grid = $("[data-gallery]");
  if (grid) {
    const buttons = $$("[data-filter]");
    const status = $("[data-filter-status]");
    const tiles = $$(".tile", grid);
    const labels = Object.fromEntries(buttons.map((b) => [b.dataset.filter, b.textContent.trim()]));

    const apply = (key) => {
      buttons.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.filter === key)));
      const swap = () => {
        let n = 0;
        tiles.forEach((t) => {
          const show = key === "all" || t.dataset.style === key;
          t.hidden = !show;
          if (show) { n += 1; t.classList.add("is-visible"); }
        });
        if (status) status.textContent = key === "all" ? `Showing all ${n} pieces` : `Showing ${n} ${labels[key]} piece${n === 1 ? "" : "s"}`;
        grid.classList.remove("is-filtering");
      };
      if (reduceMotion) { swap(); return; }
      grid.classList.add("is-filtering");
      setTimeout(swap, 220);
    };

    buttons.forEach((b) => b.addEventListener("click", () => apply(b.dataset.filter)));
  }

  /* ---------- Booking form (Web3Forms) ---------- */
  const form = $("#booking-form");
  if (form) {
    const status = $(".form-status", form);
    const submit = $("button[type=submit]", form);
    const submitLabel = $(".btn-label", submit);
    const keyField = form.elements.access_key;
    const notConfigured = !keyField.value || keyField.value.startsWith("YOUR_");
    form.elements.redirect.value = new URL("thanks.html", window.location.href).href;

    const validators = {
      name: (v) => v.trim().length >= 2,
      phone: (v) => v.replace(/\D/g, "").length >= 10,
      email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()),
      idea: (v) => v.trim().length >= 10,
      reference: (v) => !v.trim() || /^https?:\/\/\S+\.\S+/.test(v.trim()),
    };

    const check = (input) => {
      const fn = validators[input.name];
      if (!fn) return true;
      const ok = fn(input.value);
      input.closest(".field").classList.toggle("has-error", !ok);
      input.setAttribute("aria-invalid", String(!ok));
      return ok;
    };

    Object.keys(validators).forEach((name) => {
      const input = form.elements[name];
      input.addEventListener("blur", () => { if (input.value || input.required) check(input); });
      input.addEventListener("input", () => { if (input.closest(".field").classList.contains("has-error")) check(input); });
    });

    const showStatus = (type, html) => {
      status.className = `form-status is-shown ${type}`;
      const ic = type === "success" ? "check" : "alert";
      status.innerHTML = `<svg class="icon" aria-hidden="true"><use href="#i-${ic}"/></svg><p>${html}</p>`;
    };

    const setLoading = (on) => {
      submit.disabled = on;
      submit.classList.toggle("is-loading", on);
      submitLabel.textContent = on ? "Sending…" : "Send enquiry";
    };

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const invalid = Object.keys(validators).map((n) => form.elements[n]).filter((i) => !check(i));
      if (invalid.length) {
        invalid[0].focus();
        showStatus("error", `Please fix ${invalid.length === 1 ? "the highlighted field" : `the ${invalid.length} highlighted fields`} and try again.`);
        return;
      }
      if (form.elements.botcheck.checked) return;

      if (notConfigured) {
        showStatus("error", 'The online form isn’t connected yet. Please <a href="https://wa.me/919870501147" target="_blank" rel="noopener">WhatsApp us</a> or <a href="mailto:wagheakshu@gmail.com">send an email</a> instead.');
        return;
      }

      setLoading(true);
      try {
        const data = Object.fromEntries(new FormData(form));
        delete data.redirect;
        const res = await fetch(form.action, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(data),
        });
        const json = await res.json().catch(() => ({}));
        if (res.ok && json.success) {
          form.reset();
          showStatus("success", "Thank you! Your enquiry has been sent — Omkar will reply within 24–48 hours.");
        } else {
          throw new Error(json.message || "Request failed");
        }
      } catch (err) {
        showStatus("error", 'Something went wrong while sending. Please try again, or <a href="https://wa.me/919870501147" target="_blank" rel="noopener">message us on WhatsApp</a>.');
      } finally {
        setLoading(false);
      }
    });
  }
})();
