/* ============================================================
   Purawepa hero truck — a real cutout photo of the truck (true
   alpha transparency, no background to blend or feather) mapped
   onto a plane positioned in an actual 3D scene, with a camera
   that genuinely flies through space toward it. The truck reads
   as fully photorealistic (it IS the photo) while still getting
   real perspective/parallax against the separately-depth-
   positioned street photo behind it as the camera moves — not a
   flat 2D scale/zoom, and no pasted-rectangle edge since the
   source image is already a clean cutout.
   ============================================================ */
(function () {
  "use strict";

  var PLANE_ASPECT = 1200 / 670;
  var PLANE_WIDTH = 6.4;
  var PLANE_HEIGHT = PLANE_WIDTH / PLANE_ASPECT;
  var PLANE_ROTATION_Y = 0.3; // radians — angles the photo in 3D so the camera's approach reads as real depth, not a flat billboard

  // serving window's position as a fraction of the source image
  var WINDOW_FRACTION = { x: 0.25, y: 0.33 };

  function buildScene(scene, onPlaneReady) {
    var group = new THREE.Group();
    scene.add(group);

    // window position in the plane's local space (origin at plane center)
    var localX = PLANE_WIDTH * (WINDOW_FRACTION.x - 0.5);
    var localY = PLANE_HEIGHT * (0.5 - WINDOW_FRACTION.y);
    var cos = Math.cos(PLANE_ROTATION_Y), sin = Math.sin(PLANE_ROTATION_Y);
    var planePos = new THREE.Vector3(0, 1.6, 0);
    var windowWorld = new THREE.Vector3(
      planePos.x + localX * cos,
      planePos.y + localY,
      planePos.z + -localX * sin
    );
    var normal = new THREE.Vector3(sin, 0, cos); // plane's face normal after the Y rotation

    var loader = new THREE.TextureLoader();
    loader.load("assets/img/food-truck-cutout.png", function (tex) {
      if ("colorSpace" in tex) tex.colorSpace = THREE.SRGBColorSpace;
      else tex.encoding = THREE.sRGBEncoding;
      var plane = new THREE.Mesh(
        new THREE.PlaneGeometry(PLANE_WIDTH, PLANE_HEIGHT),
        new THREE.MeshBasicMaterial({ map: tex, transparent: true })
      );
      plane.position.copy(planePos);
      plane.rotation.y = PLANE_ROTATION_Y;
      group.add(plane);
      onPlaneReady();
    });

    // soft contact shadow so the truck reads as grounded
    var shadowGroup = new THREE.Group();
    [
      { r: 3.0, o: 0.1 },
      { r: 2.2, o: 0.12 },
      { r: 1.5, o: 0.14 }
    ].forEach(function (ring, i) {
      var disc = new THREE.Mesh(
        new THREE.CircleGeometry(ring.r, 32),
        new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: ring.o, depthWrite: false })
      );
      disc.rotation.x = -Math.PI / 2;
      disc.position.set(0, 0.02 + i * 0.002, 0.5);
      shadowGroup.add(disc);
    });
    group.add(shadowGroup);

    return { windowWorld: windowWorld, normal: normal };
  }

  function init(canvas) {
    var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);

    var layout = buildScene(scene, function () { render(); });

    var cameraStart = { pos: new THREE.Vector3(2.6, 3.2, 8.6), look: new THREE.Vector3(0, 1.7, 0) };
    var cameraEnd = {
      pos: layout.windowWorld.clone().addScaledVector(layout.normal, 1.35),
      look: layout.windowWorld.clone()
    };

    function resize() {
      var w = canvas.clientWidth, h = canvas.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    resize();

    function render() { renderer.render(scene, camera); }

    function setProgress(t) {
      t = Math.max(0, Math.min(1, t));
      camera.position.lerpVectors(cameraStart.pos, cameraEnd.pos, t);
      var look = new THREE.Vector3().lerpVectors(cameraStart.look, cameraEnd.look, t);
      camera.lookAt(look);
      render();
    }

    setProgress(0);

    return { setProgress: setProgress, resize: resize, render: render };
  }

  window.PuraWepaTruck = { init: init };
})();
