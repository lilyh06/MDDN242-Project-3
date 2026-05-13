/* =============================================
   shoes — sketch.js
   ============================================= */

/* ─────────────────────────────────────────────
   SHOE PART MODAL
───────────────────────────────────────────── */
var partData = {
  sole: {
    tag: 'Outsole',
    heading: 'The Foundation',
    body: 'The outsole is typically made from vulcanised rubber or thermoplastic rubber (TPR). Natural rubber is harvested from Hevea brasiliensis trees, primarily in Southeast Asia. Synthetic alternatives are petroleum-derived. The outsole accounts for roughly 20–30% of a shoe\'s total weight and is one of the hardest components to recycle due to its density and chemical cross-linking.'
  },
  canvas: {
    tag: 'Upper / Canvas',
    heading: 'Wrapped in Fabric',
    body: 'The canvas upper is usually cotton or a cotton-polyester blend. Cotton cultivation is water-intensive — producing a single kilogram requires around 10,000 litres of water. Many brands are transitioning to organic or recycled cotton. The upper also includes the tongue, collar, and lining, which may use foam padding derived from polyurethane.'
  },
  laces: {
    tag: 'Laces',
    heading: 'The Smallest Detail',
    body: 'Shoelaces are commonly made from polyester, cotton, or a blend of both. Though small, they represent a snapshot of the shoe\'s full supply chain — spun, dyed, and finished in facilities that consume water and energy. Aglets (the plastic tips) are usually PVC, which is difficult to recycle. Some sustainable brands now use natural cotton laces with metal or cornstarch aglets.'
  }
};

var modal    = document.getElementById('partModal');
var backdrop = document.getElementById('modalBackdrop');
var closeBtn = document.getElementById('modalClose');

function openModal(part) {
  var d = partData[part];
  if (!d) return;
  document.getElementById('modalTag').textContent     = d.tag;
  document.getElementById('modalHeading').textContent = d.heading;
  document.getElementById('modalBody').textContent    = d.body;
  modal.style.display    = 'block';
  backdrop.style.display = 'block';
}
function closeModal() {
  modal.style.display    = 'none';
  backdrop.style.display = 'none';
}
if (closeBtn) closeBtn.addEventListener('click', closeModal);
if (backdrop) backdrop.addEventListener('click', closeModal);
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') closeModal();
});

/* ─────────────────────────────────────────────
   CANVAS SHOE — pixel-accurate click detection
───────────────────────────────────────────── */
var shoeCanvas = document.getElementById('shoeCanvas');
if (shoeCanvas) {
  var ctx = shoeCanvas.getContext('2d');
  var W = 0;
  var H = 0;

  var layers = [
    { src: 'shoesole.png',   part: 'sole'   },
    { src: 'shoecanvas.png', part: 'canvas' },
    { src: 'shoelaces.png',  part: 'laces'  }
  ];

  var loadCount = 0;

  function tryDraw() {
    loadCount++;
    if (loadCount === layers.length) drawAll();
  }

  for (var i = 0; i < layers.length; i++) {
    (function(layer) {
      var img = new Image();
      img.onload = function() {
        layer.img = img;
        /* Size canvas to natural image dimensions on first load */
        if (W === 0 && img.naturalWidth > 0) {
          W = img.naturalWidth;
          H = img.naturalHeight;
          shoeCanvas.width  = W;
          shoeCanvas.height = H;
        }
        /* Offscreen canvas for hit-testing */
        var off    = document.createElement('canvas');
        off.width  = W || img.naturalWidth;
        off.height = H || img.naturalHeight;
        var offCtx = off.getContext('2d');
        offCtx.drawImage(img, 0, 0, off.width, off.height);
        layer.offscreen = off;
        layer.offCtx    = offCtx;
        tryDraw();
      };
      img.onerror = function() {
        console.warn('Could not load: ' + layer.src);
        tryDraw();
      };
      /* cache-bust so GitHub Pages always serves fresh */
      img.src = layer.src + '?v=' + Date.now();
    })(layers[i]);
  }

  function drawAll() {
    if (W === 0 || H === 0) return;
    ctx.clearRect(0, 0, W, H);
    for (var i = 0; i < layers.length; i++) {
      if (layers[i].img) ctx.drawImage(layers[i].img, 0, 0, W, H);
    }
  }

  function getHitLayer(e) {
    if (W === 0) return null;
    var rect   = shoeCanvas.getBoundingClientRect();
    var scaleX = W / rect.width;
    var scaleY = H / rect.height;
    var x = Math.round((e.clientX - rect.left) * scaleX);
    var y = Math.round((e.clientY - rect.top)  * scaleY);
    for (var i = layers.length - 1; i >= 0; i--) {
      if (!layers[i].offCtx) continue;
      var px = layers[i].offCtx.getImageData(x, y, 1, 1).data;
      if (px[3] > 20) return layers[i].part;
    }
    return null;
  }

  shoeCanvas.addEventListener('click', function(e) {
    var hit = getHitLayer(e);
    if (hit) openModal(hit);
  });

  shoeCanvas.addEventListener('mousemove', function(e) {
    shoeCanvas.style.cursor = getHitLayer(e) ? 'pointer' : 'default';
  });
}

/* ─────────────────────────────────────────────
   HORIZONTAL SCROLL — lerp for fluid motion
   
   Instead of directly setting translateX to the
   scroll position, we lerp (linearly interpolate)
   the current position toward the target each
   animation frame. This gives a smooth, organic
   trailing feel rather than a rigid 1:1 lock.
───────────────────────────────────────────── */
var journey     = document.getElementById('journey');
var track       = document.getElementById('journey-track');
var fillEl      = document.getElementById('journey-fill');
var nudge       = document.getElementById('scroll-nudge');
var dots        = document.querySelectorAll('.jdot');
var panels      = document.querySelectorAll('.panel');
var PANEL_COUNT = panels.length;

var currentX    = 0;   /* current rendered position */
var targetX     = 0;   /* where we want to be */
var LERP        = 0.09; /* 0.05=very slow/dreamy, 0.12=snappier */
var nudgeHidden = false;
var rafId       = null;

function getScrollProgress() {
  if (!journey) return 0;
  var rect    = journey.getBoundingClientRect();
  var total   = journey.offsetHeight - window.innerHeight;
  var scrolled = -rect.top;
  if (scrolled < 0) scrolled = 0;
  if (scrolled > total) scrolled = total;
  return total > 0 ? scrolled / total : 0;
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function tick() {
  var progress = getScrollProgress();
  var maxShift = (PANEL_COUNT - 1) * window.innerWidth;
  targetX = progress * maxShift;

  /* lerp toward target */
  currentX = lerp(currentX, targetX, LERP);

  /* snap to exact when very close (avoids endless micro-updates) */
  if (Math.abs(currentX - targetX) < 0.5) currentX = targetX;

  if (track) {
    track.style.transform = 'translateX(-' + currentX + 'px)';
  }

  /* progress bar */
  if (fillEl) fillEl.style.width = (progress * 100) + '%';

  /* active dot */
  var activeIdx = Math.round(progress * (PANEL_COUNT - 1));
  for (var i = 0; i < dots.length; i++) {
    dots[i].classList.toggle('active', i === activeIdx);
  }

  /* hide nudge after first scroll into journey */
  if (!nudgeHidden && progress > 0.01) {
    nudgeHidden = true;
    if (nudge) nudge.classList.add('hide');
  }

  rafId = requestAnimationFrame(tick);
}

/* start the loop */
if (journey && track) {
  rafId = requestAnimationFrame(tick);
}

/* dot click → jump to that panel */
for (var d = 0; d < dots.length; d++) {
  (function(dot, index) {
    dot.addEventListener('click', function() {
      if (!journey) return;
      var total      = journey.offsetHeight - window.innerHeight;
      var target     = (index / (PANEL_COUNT - 1)) * total;
      var journeyTop = journey.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top: journeyTop + target, behavior: 'smooth' });
    });
  })(dots[d], d);
}