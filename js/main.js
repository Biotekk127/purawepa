(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion) document.body.classList.add("reduced-motion");

  /* -----------------------------------------------------------
     nav visibility — toggles once Act 2 (menu) begins
     ----------------------------------------------------------- */
  gsap.registerPlugin(ScrollTrigger);

  ScrollTrigger.create({
    trigger: "#menu",
    start: "top top",
    onEnter: function () { document.getElementById("site-nav").classList.add("nav--visible"); },
    onLeaveBack: function () { document.getElementById("site-nav").classList.remove("nav--visible"); }
  });

  /* -----------------------------------------------------------
     Act 2 emerges like it's coming into focus through the window
     (continuous motion, rather than a hard cut) — skipped for
     reduced-motion, where the un-animated section is just visible.
     ----------------------------------------------------------- */
  if (!reduceMotion) {
    var menuSection = document.getElementById("menu");
    gsap.fromTo(menuSection,
      { scale: 1.06, filter: "blur(6px)" },
      {
        scale: 1,
        filter: "blur(0px)",
        ease: "power1.out",
        scrollTrigger: {
          trigger: menuSection,
          start: "top bottom",
          end: "top 60%",
          scrub: 0.5
        }
      }
    );
  }

  /* -----------------------------------------------------------
     menu card hover spotlight — hovered card comes forward and
     its photo zooms in, siblings within the same category dim
     back (bianco-bianco-style focus interaction). Each category
     is its own grid, so hovering a burger only dims other
     burgers, not the whole menu.
     ----------------------------------------------------------- */
  document.querySelectorAll(".dish-grid").forEach(function (grid) {
    var cards = grid.querySelectorAll(".dish-card");
    cards.forEach(function (card) {
      card.addEventListener("mouseenter", function () {
        grid.classList.add("is-hovering");
        card.classList.add("is-hovered");
      });
      card.addEventListener("mouseleave", function () {
        grid.classList.remove("is-hovering");
        card.classList.remove("is-hovered");
      });
    });
  });

  /* -----------------------------------------------------------
     scroll-reveal for everything after the pinned hero
     ----------------------------------------------------------- */
  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
    );
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  }

  /* -----------------------------------------------------------
     the approach sequence — pinned camera flight through a real
     3D truck model toward its serving window (see truck-scene.js)
     ----------------------------------------------------------- */
  var canvas = document.getElementById("truck-canvas");
  var bgScene = document.getElementById("bg-scene");
  var windowCover = document.getElementById("truck-window-cover");
  var truckScene = window.PuraWepaTruck.init(canvas);

  // remaps raw scroll progress (0-1) to the camera-flight's own 0-1
  // range, with a smoothstep ease, so the flight has room to start
  // after the headline fades and finish before the whiteout begins
  function cameraProgress(t) {
    var start = 0.08, end = 0.82;
    var p = (t - start) / (end - start);
    p = Math.max(0, Math.min(1, p));
    return p * p * (3 - 2 * p);
  }

  if (reduceMotion) {
    // static, intentional single frame — no scrub, no pin
    truckScene.setProgress(0.22);
    gsap.set(bgScene, { scale: 1, filter: "blur(0px) brightness(1)" });
  } else {
    var st; // holds the current ScrollTrigger instance so we can kill/rebuild on resize

    var build = function () {
      if (st) st.kill();
      gsap.killTweensOf([bgScene, windowCover, ".hero-copy", ".scroll-cue"]);

      truckScene.resize();
      truckScene.setProgress(0);
      gsap.set(bgScene, { scale: 1, filter: "blur(0px) brightness(1)" });
      gsap.set(windowCover, { opacity: 0, scale: 0.6 });
      gsap.set(".hero-copy, .scroll-cue", { opacity: 1, y: 0 });

      var tl = gsap.timeline({ paused: true, defaults: { ease: "none" } });

      tl.to(".hero-copy, .scroll-cue", { opacity: 0, y: -40, duration: 0.12 }, 0.1);

      tl.fromTo(bgScene,
        { scale: 1, filter: "blur(0px) brightness(1)" },
        { scale: 1.22, filter: "blur(16px) brightness(0.42)", duration: 0.68 },
        0.1
      );

      // window cover eases in as an expanding disc (an "iris" opening into
      // Act 2) rather than a hard rectangle snap — reads as continuous motion
      tl.fromTo(windowCover,
        { opacity: 0, scale: 0.6 },
        { opacity: 1, scale: 1, duration: 0.18, ease: "power1.in" },
        0.72
      );

      st = ScrollTrigger.create({
        trigger: "#hero-pin",
        start: "top top",
        end: "bottom bottom",
        pin: ".pin-inner",
        scrub: 1,
        animation: tl,
        onUpdate: function (self) {
          truckScene.setProgress(cameraProgress(self.progress));
        }
      });
    };

    build();

    var resizeTimer;
    window.addEventListener("resize", function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        build();
        ScrollTrigger.refresh();
      }, 200);
    });
  }
})();
