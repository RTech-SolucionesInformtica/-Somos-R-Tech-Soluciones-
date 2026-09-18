/* ============================================================
   REBOOT⟩ — script.js  (100% JavaScript vanilla, sin librerías)
   Módulos:
   1. Utilidades
   2. Scroll Reveal (Intersection Observer) — corre primero y a prueba de fallos
   3. Cursor interactivo + glow
   4. Partículas (canvas) que reaccionan al mouse
   5. Parallax de la aurora
   6. Navbar (scroll + menú móvil + progreso)
   7. Contadores animados
   8. Tilt 3D (cards + hero) y glow que sigue al mouse
   9. Slider de testimonios (automático)
   10. Acordeón FAQ
   11. Formulario (validación + feedback)
   12. Detalles (año, smooth scroll seguro)

   NOTA DE MANTENIMIENTO (fix hero invisible):
   Cada módulo corre dentro de su propio try/catch. Antes, todos los
   módulos compartían un mismo bloque de código: si algo fallaba en
   un módulo temprano (cursor, partículas, etc.), el script se
   detenía ahí y el módulo de "Scroll Reveal" nunca llegaba a
   ejecutarse. Como el CSS oculta (opacity:0) todo lo que tiene
   data-reveal hasta que JS le agrega la clase is-visible, esa falla
   dejaba el hero (y otras secciones) permanentemente invisible para
   el usuario. Ahora el reveal corre primero y de forma aislada, y
   además tiene un respaldo si el navegador no soporta
   IntersectionObserver.
============================================================ */

(() => {
  "use strict";

  /* ---------- 1. UTILIDADES ---------- */
  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
  const lerp = (a, b, t) => a + (b - a) * t;
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isTouch = window.matchMedia("(max-width: 520px)").matches || "ontouchstart" in window;

  /* ============================================================
     2. SCROLL REVEAL (se ejecuta primero, aislado y con respaldo)
  ============================================================ */
  try {
    const revealEls = $$("[data-reveal]");
    if (revealEls.length) {
      if ("IntersectionObserver" in window) {
        const io = new IntersectionObserver((entries, obs) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            const el = entry.target;
            const delay = Number(el.dataset.revealDelay || 0);
            setTimeout(() => el.classList.add("is-visible"), delay);
            obs.unobserve(el);
          });
        }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });

        revealEls.forEach((el) => io.observe(el));
      } else {
        // Navegador sin soporte: mostramos todo directamente.
        revealEls.forEach((el) => el.classList.add("is-visible"));
      }

      // Red de seguridad: si por lo que sea el observer no llegó a
      // revelar algo (fuentes que tardan, layout que cambia, etc.),
      // forzamos la visibilidad para que nada quede oculto para siempre.
      setTimeout(() => {
        revealEls.forEach((el) => el.classList.add("is-visible"));
      }, 2500);
    }
  } catch (err) {
    console.error("[R-TECH] Error en Scroll Reveal:", err);
    // Si algo falla igual mostramos el contenido en vez de dejarlo invisible.
    $$("[data-reveal]").forEach((el) => el.classList.add("is-visible"));
  }

  /* ============================================================
     3. CURSOR INTERACTIVO
  ============================================================ */
  try {
    const dot  = $("[data-cursor-dot]");
    const glow = $("[data-cursor-glow]");

    if (dot && glow && !isTouch && !prefersReduced) {
      let mx = window.innerWidth / 2, my = window.innerHeight / 2;   // posición real del mouse
      let gx = mx, gy = my;                                          // posición suavizada del glow

      window.addEventListener("mousemove", (e) => { mx = e.clientX; my = e.clientY; });

      // El punto sigue exacto; el aro sigue con inercia (más premium)
      const renderCursor = () => {
        dot.style.transform  = `translate(${mx}px, ${my}px) translate(-50%,-50%)`;
        gx = lerp(gx, mx, 0.18);
        gy = lerp(gy, my, 0.18);
        glow.style.transform = `translate(${gx}px, ${gy}px) translate(-50%,-50%)`;
        requestAnimationFrame(renderCursor);
      };
      renderCursor();

      // El aro crece sobre elementos interactivos
      const hoverables = "a, button, .card, .ba, .faq__q, input, textarea";
      $$(hoverables).forEach((el) => {
        el.addEventListener("mouseenter", () => glow.classList.add("is-hover"));
        el.addEventListener("mouseleave", () => glow.classList.remove("is-hover"));
      });
    }
  } catch (err) {
    console.error("[R-TECH] Error en Cursor interactivo:", err);
  }

  /* ============================================================
     4. PARTÍCULAS (canvas)
  ============================================================ */
  try {
    const canvas = $("#particles");
    if (canvas && !prefersReduced) {
      const ctx = canvas.getContext("2d");
      let w, h, particles = [];
      const mouse = { x: -9999, y: -9999 };

      const resize = () => {
        w = canvas.width  = window.innerWidth;
        h = canvas.height = window.innerHeight;
        // densidad proporcional a la pantalla (menos en móvil = mejor rendimiento)
        const count = Math.min(90, Math.floor((w * h) / 22000));
        particles = Array.from({ length: count }, () => ({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          r: Math.random() * 1.6 + 0.4
        }));
      };

      window.addEventListener("mousemove", (e) => { mouse.x = e.clientX; mouse.y = e.clientY; });
      window.addEventListener("resize", resize);
      resize();

      const draw = () => {
        ctx.clearRect(0, 0, w, h);

        for (const p of particles) {
          // Movimiento base
          p.x += p.vx; p.y += p.vy;
          if (p.x < 0 || p.x > w) p.vx *= -1;
          if (p.y < 0 || p.y > h) p.vy *= -1;

          // Repulsión suave respecto al mouse
          const dx = p.x - mouse.x, dy = p.y - mouse.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 120) {
            p.x += (dx / dist) * 0.8;
            p.y += (dy / dist) * 0.8;
          }

          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(0,212,255,0.6)";
          ctx.fill();
        }

        // Líneas entre partículas cercanas (efecto constelación)
        for (let i = 0; i < particles.length; i++) {
          for (let j = i + 1; j < particles.length; j++) {
            const a = particles[i], b = particles[j];
            const d = Math.hypot(a.x - b.x, a.y - b.y);
            if (d < 120) {
              ctx.beginPath();
              ctx.moveTo(a.x, a.y);
              ctx.lineTo(b.x, b.y);
              ctx.strokeStyle = `rgba(0,175,255,${0.12 * (1 - d / 120)})`;
              ctx.lineWidth = 1;
              ctx.stroke();
            }
          }
        }
        requestAnimationFrame(draw);
      };
      draw();
    }
  } catch (err) {
    console.error("[R-TECH] Error en Partículas:", err);
  }

  /* ============================================================
     5. PARALLAX DE LA AURORA (reacciona al mouse)
  ============================================================ */
  try {
    const auroras = $$(".aurora");
    if (auroras.length && !isTouch && !prefersReduced) {
      window.addEventListener("mousemove", (e) => {
        const cx = (e.clientX / window.innerWidth - 0.5);
        const cy = (e.clientY / window.innerHeight - 0.5);
        auroras.forEach((a, i) => {
          const depth = (i + 1) * 14;
          a.style.marginLeft = `${cx * depth}px`;
          a.style.marginTop  = `${cy * depth}px`;
        });
      });
    }
  } catch (err) {
    console.error("[R-TECH] Error en Parallax de la aurora:", err);
  }

  /* ============================================================
     6. NAVBAR
  ============================================================ */
  try {
    const nav = $("[data-nav]");
    const burger = $("[data-burger]");
    const mobileMenu = $("[data-mobile-menu]");
    const progress = $("[data-scroll-progress]");

    const onScroll = () => {
      // Fondo glass al bajar
      if (nav) nav.classList.toggle("is-scrolled", window.scrollY > 30);
      // Barra de progreso
      if (progress) {
        const scrolled = window.scrollY / (document.body.scrollHeight - window.innerHeight);
        progress.style.width = `${Math.min(scrolled * 100, 100)}%`;
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    // Menú móvil
    if (burger && mobileMenu) {
      const toggleMenu = (open) => {
        burger.classList.toggle("is-open", open);
        mobileMenu.classList.toggle("is-open", open);
        burger.setAttribute("aria-expanded", String(open));
      };
      burger.addEventListener("click", () => toggleMenu(!burger.classList.contains("is-open")));
      $$("a", mobileMenu).forEach((a) => a.addEventListener("click", () => toggleMenu(false)));
    }
  } catch (err) {
    console.error("[R-TECH] Error en Navbar:", err);
  }

  /* ============================================================
     7. CONTADORES ANIMADOS
  ============================================================ */
  try {
    const counterWrap = $("[data-counters]");
    if (counterWrap) {
      const nums = $$("[data-count]", counterWrap);
      const runCounters = () => {
        nums.forEach((el) => {
          const target = Number(el.dataset.count);
          const suffix = el.dataset.suffix || "";
          const duration = 1800;
          const start = performance.now();

          const tick = (now) => {
            const t = Math.min((now - start) / duration, 1);
            // easeOutExpo para que frene suave
            const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
            const value = Math.floor(eased * target);
            el.textContent = value.toLocaleString("es-AR") + suffix;
            if (t < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        });
      };

      const cio = new IntersectionObserver((entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) { runCounters(); obs.disconnect(); }
        });
      }, { threshold: 0.4 });
      cio.observe(counterWrap);
    }
  } catch (err) {
    console.error("[R-TECH] Error en Contadores animados:", err);
  }

  /* ============================================================
     8. TILT 3D + GLOW QUE SIGUE AL MOUSE
  ============================================================ */
  try {
    if (!isTouch && !prefersReduced) {
      $$("[data-tilt]").forEach((el) => {
        const isHero = el.classList.contains("hero__stage");
        const inner = $("[data-tilt-inner]", el) || el;   // en el hero, inclinamos el laptop
        const max = isHero ? 8 : 10;                       // grados máximos de inclinación

        el.addEventListener("mousemove", (e) => {
          const rect = el.getBoundingClientRect();
          const px = (e.clientX - rect.left) / rect.width;   // 0..1 horizontal
          const py = (e.clientY - rect.top) / rect.height;   // 0..1 vertical

          // Posición del glow radial dentro de las cards
          el.style.setProperty("--mx", `${px * 100}%`);
          el.style.setProperty("--my", `${py * 100}%`);

          const rx = (0.5 - py) * max;   // rotación en X
          const ry = (px - 0.5) * max;   // rotación en Y

          // El laptop parte de una rotación base (12/-14); modulamos alrededor de ella.
          // (La animación de flotado usa la propiedad `translate`, así que no choca con `transform`.)
          inner.style.transform = isHero
            ? `rotateX(${12 + rx}deg) rotateY(${-14 + ry}deg)`
            : `perspective(700px) rotateX(${rx}deg) rotateY(${ry}deg) translateZ(6px)`;
        });

        el.addEventListener("mouseleave", () => {
          inner.style.transform = isHero ? "rotateX(12deg) rotateY(-14deg)" : "";
        });
      });
    }
  } catch (err) {
    console.error("[R-TECH] Error en Tilt 3D:", err);
  }

  /* ============================================================
     9. SLIDER DE TESTIMONIOS
  ============================================================ */
  try {
    const slider = $("[data-slider]");
    if (slider) {
      const track = $("[data-slider-track]", slider);
      const dotsWrap = $("[data-slider-dots]", slider);
      const slides = $$(".quote", track);
      const perView = () => (window.innerWidth >= 860 ? 2 : 1);
      let index = 0;
      let timer;

      const buildDots = () => {
        dotsWrap.innerHTML = "";
        const pages = Math.max(1, slides.length - perView() + 1);
        for (let i = 0; i < pages; i++) {
          const b = document.createElement("button");
          b.setAttribute("aria-label", `Ir al testimonio ${i + 1}`);
          b.addEventListener("click", () => { goTo(i); resetAuto(); });
          dotsWrap.appendChild(b);
        }
      };

      const goTo = (i) => {
        const pages = Math.max(1, slides.length - perView() + 1);
        index = (i + pages) % pages;
        const slideW = slides[0].getBoundingClientRect().width;
        track.style.transform = `translateX(-${index * slideW}px)`;
        $$("button", dotsWrap).forEach((d, di) => d.classList.toggle("is-active", di === index));
      };

      const next = () => goTo(index + 1);
      const resetAuto = () => { clearInterval(timer); if (!prefersReduced) timer = setInterval(next, 4500); };

      buildDots();
      goTo(0);
      resetAuto();

      // Pausa al pasar el mouse
      slider.addEventListener("mouseenter", () => clearInterval(timer));
      slider.addEventListener("mouseleave", resetAuto);
      window.addEventListener("resize", () => { buildDots(); goTo(0); });
    }
  } catch (err) {
    console.error("[R-TECH] Error en Slider de testimonios:", err);
  }

  /* ============================================================
     10. ACORDEÓN FAQ
  ============================================================ */
  try {
    const accordion = $("[data-accordion]");
    if (accordion) {
      $$(".faq__q", accordion).forEach((btn) => {
        btn.addEventListener("click", () => {
          const item = btn.closest(".faq__item");
          const answer = $(".faq__a", item);
          const isOpen = btn.getAttribute("aria-expanded") === "true";

          // Cierra los demás (comportamiento acordeón)
          $$(".faq__q", accordion).forEach((b) => {
            b.setAttribute("aria-expanded", "false");
            $(".faq__a", b.closest(".faq__item")).style.maxHeight = null;
          });

          if (!isOpen) {
            btn.setAttribute("aria-expanded", "true");
            answer.style.maxHeight = answer.scrollHeight + "px";
          }
        });
      });
    }
  } catch (err) {
    console.error("[R-TECH] Error en Acordeón FAQ:", err);
  }

  /* ============================================================
     11. FORMULARIO
  ============================================================ */
  try {
    const form = $("#contactForm");
    if (form) {
      const note = $("[data-form-note]", form);
      const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      // Email que recibe las consultas (se usa como respaldo en el mensaje de confirmación)
      const EMAIL = "rtech.solucionesinformatica@gmail.com";
      // WhatsApp del negocio (mismo número que el botón flotante de la página)
      const WHATSAPP = "5493813399196";

      form.addEventListener("submit", (e) => {
        e.preventDefault();
        let ok = true;

        $$("input, textarea", form).forEach((f) => {
          const invalid = !f.value.trim() || (f.type === "email" && !emailRx.test(f.value));
          f.classList.toggle("is-invalid", invalid);
          if (invalid) ok = false;
        });

        if (!ok) {
          note.textContent = "Revisá los campos marcados antes de enviar.";
          note.className = "form__note is-err";
          return;
        }

        // Armamos el mensaje con los datos del formulario
        const datos = {
          nombre:   $("#nombre", form).value.trim(),
          telefono: $("#telefono", form).value.trim(),
          email:    $("#email", form).value.trim(),
          mensaje:  $("#mensaje", form).value.trim()
        };

        const intro = form.dataset.intro || "quiero solicitar un diagnóstico";
        const cuerpo =
          `Hola R-TECH, ${intro}.\n\n` +
          `Nombre: ${datos.nombre}\n` +
          `Teléfono: ${datos.telefono}\n` +
          `Email: ${datos.email}\n` +
          `Consulta: ${datos.mensaje}`;

        // Enviamos la consulta por WhatsApp (llega directo, sin depender de que el
        // visitante tenga un cliente de correo configurado en el celular).
        const waUrl = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(cuerpo)}`;
        window.open(waUrl, "_blank", "noopener,noreferrer");

        note.textContent = `Te abrimos WhatsApp con tu consulta lista para enviar. Si preferís, también podés escribirnos a ${EMAIL}.`;
        note.className = "form__note is-ok";
        form.reset();
      });

      // Limpia el estado de error al escribir
      $$("input, textarea", form).forEach((f) =>
        f.addEventListener("input", () => f.classList.remove("is-invalid"))
      );
    }
  } catch (err) {
    console.error("[R-TECH] Error en Formulario:", err);
  }

  /* ============================================================
     12. DETALLES FINALES
  ============================================================ */
  try {
    // Año dinámico en el footer
    const yearEl = $("[data-year]");
    if (yearEl) yearEl.textContent = new Date().getFullYear();
  } catch (err) {
    console.error("[R-TECH] Error en Detalles finales:", err);
  }

})();
