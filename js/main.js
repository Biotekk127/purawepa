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
     the approach sequence — pinned zoom toward the window
     ----------------------------------------------------------- */
  var truckRig = document.getElementById("truck-rig");
  var bgScene = document.getElementById("bg-scene");
  var windowCover = document.getElementById("truck-window-cover");

  // local center of the serving window within the 600x360 truck-rig art
  var WX = 410, WY = 190;

  function frame(scale, targetXRatio, targetYRatio) {
    var vw = window.innerWidth;
    var vh = window.innerHeight;
    var targetX = vw * targetXRatio;
    var targetY = vh * targetYRatio;
    return {
      scale: scale,
      x: targetX - WX * scale,
      y: targetY - WY * scale
    };
  }

  function computeEndScale() {
    var vw = window.innerWidth;
    var vh = window.innerHeight;
    var overshoot = 1.15;
    var scaleForWidth = (vw * overshoot) / 160;
    var scaleForHeight = (vh * overshoot) / 100;
    return Math.max(scaleForWidth, scaleForHeight);
  }

  if (reduceMotion) {
    // static, intentional single frame — no scrub, no pin
    var still = frame(computeEndScale() * 0.16, 0.62, 0.56);
    gsap.set(truckRig, { x: still.x, y: still.y, scale: still.scale, transformOrigin: "0px 0px" });
    gsap.set(bgScene, { scale: 1, filter: "blur(0px) brightness(1)" });
  } else {
    var st; // holds the current ScrollTrigger instance so we can kill/rebuild on resize

    var build = function () {
      if (st) st.kill();
      gsap.killTweensOf([truckRig, bgScene, windowCover, ".hero-copy", ".scroll-cue"]);

      var start = frame(0.34, 0.66, 0.58);
      var end = frame(computeEndScale(), 0.5, 0.5);

      gsap.set(truckRig, { x: start.x, y: start.y, scale: start.scale, transformOrigin: "0px 0px" });
      gsap.set(bgScene, { scale: 1, filter: "blur(0px) brightness(1)" });
      gsap.set(windowCover, { opacity: 0 });
      gsap.set(".hero-copy, .scroll-cue", { opacity: 1, y: 0 });

      var tl = gsap.timeline({ paused: true, defaults: { ease: "none" } });

      tl.to(".hero-copy, .scroll-cue", { opacity: 0, y: -40, duration: 0.10 }, 0.15);

      tl.fromTo(truckRig,
        { x: start.x, y: start.y, scale: start.scale },
        { x: end.x, y: end.y, scale: end.scale, duration: 0.75 },
        0.15
      );

      tl.fromTo(bgScene,
        { scale: 1, filter: "blur(0px) brightness(1)" },
        { scale: 1.22, filter: "blur(16px) brightness(0.42)", duration: 0.75 },
        0.15
      );

      tl.to(windowCover, { opacity: 1, duration: 0.10 }, 0.90);

      st = ScrollTrigger.create({
        trigger: "#hero-pin",
        start: "top top",
        end: "bottom bottom",
        pin: ".pin-inner",
        scrub: 1,
        animation: tl
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
