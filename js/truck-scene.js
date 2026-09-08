/* ============================================================
   Purawepa hero truck — an actual 3D model (Three.js primitives
   + canvas decals), not a photo being scaled. The camera flies
   through real geometry toward the serving window, so parallax
   between the cab, wheels and window frame is real, not faked
   by a 2D pan/zoom on a flat image.
   ============================================================ */
(function () {
  "use strict";

  function makeWordmarkTexture() {
    var canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 512;
    var ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#f7f2e7";
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.font = "800 168px Arial, sans-serif";
    ctx.fillText("PURA", 40, 230);
    ctx.fillText("WEPA", 40, 420);
    var tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  }

  function makeFlameTexture() {
    var canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 256;
    var ctx = canvas.getContext("2d");
    var grad = ctx.createLinearGradient(0, 256, 0, 0);
    grad.addColorStop(0, "#ff2d6b");
    grad.addColorStop(0.5, "#ff7a1a");
    grad.addColorStop(1, "#ffce45");
    ctx.strokeStyle = grad;
    ctx.lineWidth = 12;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(130, 236);
    ctx.bezierCurveTo(58, 200, 55, 118, 112, 60);
    ctx.bezierCurveTo(98, 104, 132, 108, 126, 50);
    ctx.bezierCurveTo(172, 92, 196, 156, 152, 198);
    ctx.bezierCurveTo(192, 186, 204, 144, 198, 104);
    ctx.bezierCurveTo(224, 148, 214, 210, 150, 234);
    ctx.closePath();
    ctx.stroke();
    var tex = new THREE.CanvasTexture(canvas);
    return tex;
  }

  function buildTruck() {
    var group = new THREE.Group();

    var bodyMat = new THREE.MeshStandardMaterial({ color: 0x18150f, metalness: 0.12, roughness: 0.65 });
    var trimMat = new THREE.MeshStandardMaterial({ color: 0x0e0c09, metalness: 0.15, roughness: 0.6 });
    var chromeMat = new THREE.MeshStandardMaterial({ color: 0x9a9a9a, metalness: 0.9, roughness: 0.25 });
    var tireMat = new THREE.MeshStandardMaterial({ color: 0x0b0b0b, roughness: 0.9 });
    var glassMat = new THREE.MeshPhysicalMaterial({ color: 0x2a3550, roughness: 0.15, metalness: 0, transparent: true, opacity: 0.82 });
    var interiorGlowMat = new THREE.MeshBasicMaterial({ color: 0xffd9a0 });
    var interiorWallMat = new THREE.MeshStandardMaterial({ color: 0x2c2c2c, roughness: 0.85 });
    var ledMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

    // cargo body: width 2.2 (x), height 2.2 (y), length 5.0 (z)
    var body = new THREE.Mesh(new THREE.BoxGeometry(2.2, 2.2, 5.0), bodyMat);
    body.position.set(0, 2.1, -0.1);
    group.add(body);

    var roofTrim = new THREE.Mesh(new THREE.BoxGeometry(2.22, 0.16, 5.02), trimMat);
    roofTrim.position.set(0, 3.26, -0.1);
    group.add(roofTrim);

    // cab
    var cab = new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.7, 1.6), bodyMat);
    cab.position.set(0, 1.55, 3.2);
    group.add(cab);

    var hood = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.5, 0.9), trimMat);
    hood.position.set(0, 0.95, 4.0);
    group.add(hood);

    var windshield = new THREE.Mesh(new THREE.BoxGeometry(1.7, 1.0, 0.05), glassMat);
    windshield.position.set(0, 1.9, 3.98);
    windshield.rotation.x = -0.18;
    group.add(windshield);

    [-1, 1].forEach(function (side) {
      var w = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.8, 1.1), glassMat);
      w.position.set(1.01 * side, 1.85, 3.15);
      group.add(w);
    });

    // wheels
    var wheelGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.32, 20);
    var hubGeo = new THREE.CylinderGeometry(0.16, 0.16, 0.34, 14);
    [
      [-1.16, 0.42, 1.7], [1.16, 0.42, 1.7],
      [-1.16, 0.42, -1.9], [1.16, 0.42, -1.9]
    ].forEach(function (pos) {
      var wheel = new THREE.Mesh(wheelGeo, tireMat);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(pos[0], pos[1], pos[2]);
      group.add(wheel);
      var hub = new THREE.Mesh(hubGeo, chromeMat);
      hub.rotation.z = Math.PI / 2;
      hub.position.set(pos[0] * 1.02, pos[1], pos[2]);
      group.add(hub);
    });

    // ---- serving window, +X face ----
    var winW = 1.5, winH = 0.85;
    var winCenter = new THREE.Vector3(1.1, 2.15, 0.9);

    var interiorBack = new THREE.Mesh(new THREE.BoxGeometry(0.5, winH, winW), interiorWallMat);
    interiorBack.position.set(0.75, winCenter.y, winCenter.z);
    group.add(interiorBack);

    var glow = new THREE.Mesh(new THREE.PlaneGeometry(winW * 0.94, winH * 0.94), interiorGlowMat);
    glow.rotation.y = Math.PI / 2;
    glow.position.set(1.06, winCenter.y, winCenter.z);
    // always draws on top — it represents the truck's own interior light,
    // and depth-sorting it against the thin frame/back-wall geometry at
    // grazing angles was unreliable
    interiorGlowMat.depthTest = false;
    glow.renderOrder = 10;
    group.add(glow);

    var frameThickness = 0.06;
    var frameTop = new THREE.Mesh(new THREE.BoxGeometry(0.06, frameThickness, winW + 0.08), chromeMat);
    frameTop.position.set(1.13, winCenter.y + winH / 2, winCenter.z);
    group.add(frameTop);
    var frameBottom = frameTop.clone();
    frameBottom.position.set(1.13, winCenter.y - winH / 2, winCenter.z);
    group.add(frameBottom);
    var frameLeft = new THREE.Mesh(new THREE.BoxGeometry(0.06, winH + 0.08, frameThickness), chromeMat);
    frameLeft.position.set(1.13, winCenter.y, winCenter.z - winW / 2);
    group.add(frameLeft);
    var frameRight = frameLeft.clone();
    frameRight.position.set(1.13, winCenter.y, winCenter.z + winW / 2);
    group.add(frameRight);

    var awning = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.06, winW + 0.5), trimMat);
    awning.position.set(1.3, winCenter.y + winH / 2 + 0.22, winCenter.z);
    awning.rotation.z = -0.12;
    group.add(awning);

    var led = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, winW + 0.3), ledMat);
    led.position.set(1.15, winCenter.y + winH / 2 + 0.08, winCenter.z);
    group.add(led);

    var shelf = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.05, winW + 0.1), trimMat);
    shelf.position.set(1.3, winCenter.y - winH / 2 - 0.1, winCenter.z);
    group.add(shelf);

    // ---- decals ----
    var wordTex = makeWordmarkTexture();
    var wordMat = new THREE.MeshBasicMaterial({ map: wordTex, transparent: true });
    var wordPlane = new THREE.Mesh(new THREE.PlaneGeometry(1.05, 0.55), wordMat);
    wordPlane.rotation.y = Math.PI / 2;
    wordPlane.position.set(1.111, 2.05, -1.55);
    group.add(wordPlane);

    var flameTex = makeFlameTexture();
    var flameMat = new THREE.MeshBasicMaterial({ map: flameTex, transparent: true });
    var flamePlane = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.5), flameMat);
    flamePlane.rotation.y = Math.PI / 2;
    flamePlane.position.set(1.111, 2.65, -1.9);
    group.add(flamePlane);

    // neon diagonal stripes along the lower body
    [0xff7a1a, 0xff2166, 0x8ee000].forEach(function (color, i) {
      var stripe = new THREE.Mesh(
        new THREE.BoxGeometry(0.02, 0.1, 3.4),
        new THREE.MeshBasicMaterial({ color: color })
      );
      stripe.position.set(1.111, 1.15 - i * 0.16, -0.3);
      stripe.rotation.x = 0.42;
      group.add(stripe);
    });

    // soft contact shadow so the truck reads as grounded, not floating —
    // three stacked rings of falling opacity fake a soft radial falloff
    // (a canvas-gradient texture rendered far dimmer than authored here,
    // so this uses flat-opacity discs instead, confirmed to render correctly)
    var shadowGroup = new THREE.Group();
    [
      { r: 2.6, o: 0.12 },
      { r: 1.9, o: 0.14 },
      { r: 1.3, o: 0.16 }
    ].forEach(function (ring, i) {
      var disc = new THREE.Mesh(
        new THREE.CircleGeometry(ring.r, 32),
        new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: ring.o, depthWrite: false })
      );
      disc.rotation.x = -Math.PI / 2;
      disc.position.set(0, 0.02 + i * 0.002, 0.3);
      shadowGroup.add(disc);
    });
    group.add(shadowGroup);

    return { group: group, windowCenter: winCenter };
  }

  function init(canvas) {
    var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);

    scene.add(new THREE.HemisphereLight(0xfff2df, 0x1a1410, 0.95));
    var key = new THREE.DirectionalLight(0xfff0d0, 1.15);
    key.position.set(4, 6, 5);
    scene.add(key);
    var rim = new THREE.DirectionalLight(0xff6fa8, 0.22);
    rim.position.set(-4, 2, -3);
    scene.add(rim);
    var fill = new THREE.DirectionalLight(0xffffff, 0.35);
    fill.position.set(-3, 3, 4);
    scene.add(fill);

    var built = buildTruck();
    scene.add(built.group);

    var cameraStart = { pos: new THREE.Vector3(11.5, 4.8, 12.9), look: new THREE.Vector3(0, 1.5, 0.2) };
    var cameraEnd = {
      pos: new THREE.Vector3(built.windowCenter.x + 1.42, built.windowCenter.y, built.windowCenter.z),
      look: new THREE.Vector3(built.windowCenter.x - 2.0, built.windowCenter.y, built.windowCenter.z)
    };

    function resize() {
      var w = canvas.clientWidth, h = canvas.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    resize();

    function setProgress(t) {
      t = Math.max(0, Math.min(1, t));
      camera.position.lerpVectors(cameraStart.pos, cameraEnd.pos, t);
      var look = new THREE.Vector3().lerpVectors(cameraStart.look, cameraEnd.look, t);
      camera.lookAt(look);
      renderer.render(scene, camera);
    }

    setProgress(0);

    return {
      setProgress: setProgress,
      resize: resize,
      render: function () { renderer.render(scene, camera); }
    };
  }

  window.PuraWepaTruck = { init: init };
})();
