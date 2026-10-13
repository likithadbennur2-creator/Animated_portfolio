(function(){
  "use strict";

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isCoarse = window.matchMedia('(pointer:coarse)').matches;

  /* ---------- Intro veil ---------- */
  window.addEventListener('load', function(){
    setTimeout(function(){
      document.getElementById('intro-veil').classList.add('hidden');
      document.body.classList.remove('is-loading');
    }, 180);
  });

  /* ---------- Custom cursor + trailing glow ---------- */
  if(!isCoarse && !reduceMotion){
    var dot = document.getElementById('cursor-dot');
    var ring = document.getElementById('cursor-ring');
    var glow = document.getElementById('cursor-glow');
    var mx=0,my=0, rx=0, ry=0, gx=0, gy=0;
    window.addEventListener('mousemove', function(e){
      mx = e.clientX; my = e.clientY;
      dot.style.left = mx+'px'; dot.style.top = my+'px';
      glow.style.opacity = '1';
    });
    function loop(){
      rx += (mx-rx)*0.32;   // snappier ring (was 0.18)
      ry += (my-ry)*0.32;
      gx += (mx-gx)*0.16;   // shorter trailing glow (was 0.065)
      gy += (my-gy)*0.16;
      ring.style.left = rx+'px'; ring.style.top = ry+'px';
      glow.style.left = gx+'px'; glow.style.top = gy+'px';
      requestAnimationFrame(loop);
    }
    loop();
    document.addEventListener('mouseover', function(e){
      if(e.target.closest('a, button, .cursor-hover')) ring.classList.add('hovered');
    });
    document.addEventListener('mouseout', function(e){
      if(e.target.closest('a, button, .cursor-hover')) ring.classList.remove('hovered');
    });
    document.addEventListener('mouseleave', function(){ glow.style.opacity='0'; });
  } else {
    document.getElementById('cursor-dot').style.display='none';
    document.getElementById('cursor-ring').style.display='none';
    document.getElementById('cursor-glow').style.display='none';
  }

  /* ---------- Smooth scroll engine (light touch) ----------
  
  

  /* ---------- Scroll progress + header state ---------- */
  var header = document.getElementById('site-header');
  var progressBar = document.getElementById('scroll-progress');
  function onScroll(){
    var h = document.documentElement;
    var scrolled = h.scrollTop;
    var max = h.scrollHeight - h.clientHeight;
    progressBar.style.width = (max>0 ? (scrolled/max*100) : 0) + '%';
    header.classList.toggle('scrolled', scrolled > 40);
  }
  document.addEventListener('scroll', onScroll, {passive:true});
  onScroll();

  /* ---------- Marquees ---------- */
  var skills = ["ART DIRECTION","UX RESEARCH","INTERACTION DESIGN","CREATIVE LEADERSHIP","ROI-DRIVEN DESIGN","DESIGN SYSTEMS"];
  var clients = ["FULL STACK DEVELOPMENT","CLOUD COMPUTING","DESIGNING","VIDEO EDITOR","SOFTWARE DEVELOPMENT","GOOGLE ARCADE RANGER "];
  function buildMarquee(el, items){
    var html = '';
    for(var r=0;r<2;r++){
      items.forEach(function(t){ html += '<span>'+t+'</span><span class="slash">//</span>'; });
    }
    el.innerHTML = html;
  }
  buildMarquee(document.getElementById('marquee1'), skills);
  buildMarquee(document.getElementById('marquee2'), clients);

  /* ---------- Anchor navigation routed through the smooth-scroll engine ---------- */
  function goToSection(id){

    const el = document.getElementById(id);

    if (!el) return;

    const header =
        document.getElementById('site-header');

    const headerHeight =
        header ? header.offsetHeight : 0;

    const y =
        el.getBoundingClientRect().top +
        window.scrollY -
        headerHeight;

    window.scrollTo({
        top: y,
        behavior: 'smooth'
    });
}
  document.querySelectorAll('a[href^="#"]').forEach(function(a){
    a.addEventListener('click', function(e){
      var id = a.getAttribute('href').slice(1);
      if(!id || !document.getElementById(id)) return;
      e.preventDefault();
      goToSection(id);
    });
  });

  /* ---------- Scrollspy (top nav + side dots) ---------- */
  var navLinks = document.querySelectorAll('nav.main-nav a');
  var sideDots = document.querySelectorAll('#side-nav button');
  var sections = ['home','work','experience','about','contact'].map(function(id){ return document.getElementById(id); });
  var spy = new IntersectionObserver(function(entries){
    entries.forEach(function(entry){
      if(entry.isIntersecting){
        var id = entry.target.id;
        navLinks.forEach(function(a){
          a.classList.toggle('active', a.getAttribute('href') === '#'+id);
        });
        sideDots.forEach(function(d){
          d.classList.toggle('active', d.getAttribute('data-target') === id);
        });
      }
    });
  }, { rootMargin:'-45% 0px -45% 0px', threshold:0 });
  sections.forEach(function(s){ if(s) spy.observe(s); });

  sideDots.forEach(function(d){
    d.addEventListener('click', function(){ goToSection(d.getAttribute('data-target')); });
  });

  /* ---------- Number counters ---------- */
  var counters = document.querySelectorAll('.counter');
  var counterObs = new IntersectionObserver(function(entries, obs){
    entries.forEach(function(entry){
      if(!entry.isIntersecting) return;
      var el = entry.target;
      var target = parseInt(el.getAttribute('data-target'), 10);
      var start = null;
      var duration = 900;
      function step(ts){
        if(!start) start = ts;
        var progress = Math.min((ts-start)/duration, 1);
        var eased = 1 - Math.pow(1-progress, 3);
        el.textContent = Math.round(eased*target);
        if(progress < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
      obs.unobserve(el);
    });
  }, { threshold:0.6 });
  counters.forEach(function(c){ counterObs.observe(c); });

/* =========================================================
   WORK — REALISTIC SCROLL STACK
   ========================================================= */

/* =========================================================
   WORK — STICKY CARD STACK  (Page 3)
   ========================================================= */

var workSection = document.getElementById('work');
var workStack = workSection ? workSection.querySelector('.work-stack') : null;
var workItems = workStack ? Array.prototype.slice.call(workStack.querySelectorAll('.stack-item')) : [];
var workCards = workStack ? Array.prototype.slice.call(workStack.querySelectorAll('.work-card')) : [];
var dotsWrap = document.getElementById('case-dots');
var countEl = document.getElementById('case-count');

if (workSection && workStack && workItems.length && workCards.length) {

  var STEP = 15;
  var SHRINK = 0.030;
  var MAX_DEPTH = 5;
  var ticking = false;
  var workActive = 0;

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  /* dot navigation */
  if (dotsWrap) {
    dotsWrap.innerHTML = '';
    workItems.forEach(function (item, index) {
      var dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'case-dot';
      if (index === 0) dot.classList.add('active');
      dot.setAttribute('aria-label', 'Go to project ' + (index + 1));
      dot.addEventListener('click', function () {
        var itemRect = item.getBoundingClientRect();
        var target = window.scrollY + itemRect.top - (window.innerHeight * 0.17);
        window.scrollTo({ top: target, behavior: 'smooth' });
      });
      dotsWrap.appendChild(dot);
    });
  }

  var workDots = dotsWrap ? Array.prototype.slice.call(dotsWrap.querySelectorAll('.case-dot')) : [];

  function paintWorkStack() {
    ticking = false;

    var stickTop = window.innerHeight * 0.17;
    var firstCard = workCards[0];
    if (!firstCard) return;

    var travel = firstCard.getBoundingClientRect().height;
    if (!travel) return;

    var coverage = [];
    workItems.forEach(function (item) {
      var rect = item.getBoundingClientRect();
      var d = rect.top - stickTop;
      var value = clamp(1 - d / travel, 0, 1);
      coverage.push(value);
    });

    var activeIndex = 0;
    for (var i = 0; i < coverage.length; i++) {
      if (coverage[i] < 1) { activeIndex = i; break; }
      activeIndex = i;
    }

    if (activeIndex !== workActive) {
      workActive = activeIndex;
      if (countEl) {
        countEl.textContent = String(workActive + 1).padStart(2, '0') + ' / ' + String(workItems.length).padStart(2, '0');
      }
      workDots.forEach(function (dot, index) {
        dot.classList.toggle('active', index === workActive);
      });
    }

    workItems.forEach(function (item, index) {
      var card = item.querySelector('.work-card');
      if (!card) return;

      var depth = 0;
      for (var k = index + 1; k < workItems.length; k++) depth += coverage[k];
      depth = Math.min(depth, MAX_DEPTH);

      var translateY = -depth * STEP;
      var scale = 1 - depth * SHRINK;
      card.style.transform = 'translate3d(0, ' + translateY + 'px, 0) scale(' + scale + ')';

      var content = card.querySelector('.work-card-content');
      var number = card.querySelector('.work-card-number');
      var label = card.querySelector('.work-card-label');
      var contentOpacity = clamp(1 - depth * 1.8, 0, 1);

      if (content) content.style.opacity = contentOpacity;
      if (number) number.style.opacity = contentOpacity;
      if (label) label.style.opacity = contentOpacity;
    });
  }

  function requestWorkPaint() {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(paintWorkStack);
    }
  }

  window.addEventListener('scroll', requestWorkPaint, { passive: true });
  window.addEventListener('resize', requestWorkPaint);

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () { requestWorkPaint(); });
  }

  requestWorkPaint();
}

  /* ---------- Experience timeline ---------- */
  var experience = [
    
  ];
  var timeline = document.getElementById('timeline');
  timeline.innerHTML = experience.map(function(e){
    return '<div class="timeline-card">'+
      '<div class="idx">'+e.idx+'</div>'+
      '<div>'+
        '<div class="role-row"><h3>'+e.company+'</h3><span class="role">'+e.role+'</span></div>'+
        '<p>'+e.desc+'</p>'+
        '<div class="tags">'+e.tags.map(function(t){return '<span>'+t+'</span>';}).join('')+'</div>'+
      '</div>'+
      '<div class="period">'+e.period+'</div>'+
    '</div>';
  }).join('');

  var cardObs = new IntersectionObserver(function(entries){
    entries.forEach(function(entry){
      if(entry.isIntersecting) entry.target.classList.add('in-view');
    });
  }, { threshold:0.2 });
  document.querySelectorAll('.timeline-card').forEach(function(c, i){
    c.style.transitionDelay = (i*0.05)+'s';
    cardObs.observe(c);
  });

  /* ---------- Contact reveal ---------- */
  var revealObs = new IntersectionObserver(function(entries){
    entries.forEach(function(entry){
      var el = entry.target;
      if(entry.isIntersecting){
        el.classList.add('lit', el.getAttribute('data-color'));
      }
    });
  }, { threshold:0.55 });
  document.querySelectorAll('.reveal-line').forEach(function(l){ revealObs.observe(l); });

  /* ---------- Hero parallax (toned down) ---------- */
  if(!reduceMotion){
    var heroInner = document.querySelector('.hero-inner');
    var heroPortrait = document.querySelector('.hero-portrait');
    document.addEventListener('scroll', function(){
      var y = window.scrollY;
      if(y < window.innerHeight){
        heroInner.style.transform = 'translateY('+(y*0.12)+'px)';
        heroInner.style.opacity = Math.max(1 - y/500, 0);
        heroPortrait.style.transform = 'translateY('+(y*0.05)+'px,0)';
      }
    }, {passive:true});
  }

  /* ---------- Scroll hint jumps to next section ---------- */
  var scrollHint = document.getElementById('scroll-hint');
  scrollHint.addEventListener('click', function(){
    var idx = sections.findIndex(function(s){
      if(!s) return false;
      var r = s.getBoundingClientRect();
      return r.top > -40;
    });
    var next = sections[idx+1] || sections[idx];
    if(next) goToSection(next.id);
  });

  window.addEventListener('scroll', function(){
    var atBottom = (window.innerHeight + window.scrollY) >= document.body.scrollHeight - 40;
    scrollHint.style.opacity = atBottom ? '0' : '1';
  }, {passive:true});

})();

/* =========================================================
   HERO IMAGE FRAGMENT REVEAL
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    const reveal = document.getElementById("heroReveal");

    if (!reveal) return;

    const source = reveal.querySelector(".reveal-source");
    const tilesContainer = reveal.querySelector(".reveal-tiles");

    if (!source || !tilesContainer) return;

    const imageURL = source.getAttribute("src");

    /*
     * Number of fragments
     *
     * More columns/rows = smaller pieces
     *
     * The video uses irregular rectangular pieces,
     * so we start with a 7 × 8 grid.
     */

    const columns = 7;
    const rows = 8;

    const tileWidth = 100 / columns;
    const tileHeight = 100 / rows;

    /*
     * Create image fragments
     */

    for (let row = 0; row < rows; row++) {

        for (let col = 0; col < columns; col++) {

            const tile = document.createElement("div");

            tile.className = "reveal-tile";

            tile.style.width = `${tileWidth + 0.15}%`;
            tile.style.height = `${tileHeight + 0.15}%`;

            tile.style.left = `${col * tileWidth}%`;
            tile.style.top = `${row * tileHeight}%`;

            /*
             * Every tile uses the same image,
             * but background-position shows only
             * its own section.
             */

            tile.style.backgroundImage =
                `url("${imageURL}")`;

            tile.style.backgroundSize =
                `${columns * 100}% ${rows * 100}%`;

            const backgroundX =
                columns === 1
                    ? 0
                    : (col / (columns - 1)) * 100;

            const backgroundY =
                rows === 1
                    ? 0
                    : (row / (rows - 1)) * 100;

            tile.style.backgroundPosition =
                `${backgroundX}% ${backgroundY}%`;

            /*
             * Random starting position
             */

            const distance = 420;

            const startX =
                (Math.random() - 0.5) * distance;

            const startY =
                (Math.random() - 0.5) * distance;

            const rotation =
                (Math.random() - 0.5) * 24;

            tile.style.setProperty(
                "--start-x",
                `${startX}px`
            );

            tile.style.setProperty(
                "--start-y",
                `${startY}px`
            );

            /*
             * Mobile starting positions
             */

            tile.style.setProperty(
                "--start-x-mobile",
                `${startX * 0.55}px`
            );

            tile.style.setProperty(
                "--start-y-mobile",
                `${startY * 0.55}px`
            );

            tile.style.setProperty(
                "--rotation",
                `${rotation}deg`
            );

            /*
             * Each piece arrives at a slightly
             * different time.
             */

            const delay =
                Math.random() * 0.55;

            tile.style.transitionDelay =
                `${delay}s`;

            tilesContainer.appendChild(tile);
        }
    }


    /*
     * Start the effect after the page intro.
     *
     * Your website already has #intro-veil,
     * so we wait slightly before revealing.
     */

    setTimeout(() => {

        reveal.classList.add("revealed");

    }, 850);

    /* =====================================================
   PAGE 4 — ENVELOPE SCROLL ANIMATION
===================================================== */

const pageFour = document.querySelector("#page-four");

if (pageFour) {

    const envelope = pageFour.querySelector(".envelope");
    const envelopeFlap = pageFour.querySelector(".envelope-flap");
    const envelopePaper = pageFour.querySelector(".envelope-paper");

    function updatePageFourEnvelope() {

        const rect = pageFour.getBoundingClientRect();
        const vh = window.innerHeight;

        /*
         * Start when Page 4 enters the viewport.
         * Finish after the envelope has opened.
         */
        let progress =
            (vh - rect.top) /
            (vh + rect.height);

        progress = Math.max(0, Math.min(1, progress));


        /* ---------------------------------------------
           ENVELOPE TILT
        --------------------------------------------- */

        const rotateX =
            -8 * progress;

        const rotateZ =
            -10 * progress;

        const scale =
            0.82 +
            (0.18 * progress);


        envelope.style.transform =
            `
            perspective(1200px)
            rotateX(${rotateX}deg)
            rotateZ(${rotateZ}deg)
            scale(${scale})
            `;


        /* ---------------------------------------------
           FLAP OPENS
        --------------------------------------------- */

        let flapProgress =
            (progress - 0.22) /
            0.30;

        flapProgress =
            Math.max(
                0,
                Math.min(1, flapProgress)
            );

        envelopeFlap.style.transform =
            `
            rotateX(
                ${180 * flapProgress}deg
            )
            `;


        /* ---------------------------------------------
           PAPER COMES OUT
        --------------------------------------------- */

        let paperProgress =
            (progress - 0.45) /
            0.55;

        paperProgress =
            Math.max(
                0,
                Math.min(1, paperProgress)
            );


        /*
         * Ease the paper movement.
         */
        const paperEase =
            paperProgress *
            paperProgress *
            (3 - 2 * paperProgress);


        const paperY =
            8 -
            (55 * paperEase);

        const paperScale =
            0.92 +
            (0.12 * paperEase);

        const paperRotate =
            -4 +
            (4 * paperEase);


        envelopePaper.style.transform =
            `
            translateY(${paperY}%)
            rotateZ(${paperRotate}deg)
            scale(${paperScale})
            `;


        /* ---------------------------------------------
           PAPER SHADOW
        --------------------------------------------- */

        envelopePaper.style.boxShadow =
            `
            0
            ${15 + 20 * paperEase}px
            ${35 + 35 * paperEase}px
            rgba(0,0,0,${0.18 + 0.10 * paperEase})
            `;

    }


    let pageFourTicking = false;

    function requestPageFourUpdate() {

        if (pageFourTicking) return;

        pageFourTicking = true;

        requestAnimationFrame(() => {

            updatePageFourEnvelope();

            pageFourTicking = false;

        });

    }


    window.addEventListener(
        "scroll",
        requestPageFourUpdate,
        { passive: true }
    );

    window.addEventListener(
        "resize",
        requestPageFourUpdate
    );

    updatePageFourEnvelope();

}

});

/* =========================================================
   likitha — FRAGMENT IMAGE HOVER
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    const area = document.getElementById("heroNameReveal");
    const canvas = document.getElementById("nameRevealCanvas");

    if (!area || !canvas) return;

    const ctx = canvas.getContext("2d");

    /*
     * IMAGE USED FOR THE EFFECT
     *
     * Change this if your image has another filename.
     */
    const image = new Image();
    image.src = "purple.png";

    /*
     * Number of fragments
     *
     * Increase for smaller pieces.
     */
    const COLS = 9;
    const ROWS = 7;

    let fragments = [];

    let animationFrame = null;

    let hovering = false;

    let startTime = 0;


    /* =====================================================
       RESIZE CANVAS
       ===================================================== */

    function resizeCanvas() {

    const dpr = window.devicePixelRatio || 1;

    /*
     * Portrait size
     * 9:16 aspect ratio
     */
    const width = 450;
    const height = width * (16 / 9);

    /*
     * Set the canvas display size
     */
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";

    /*
     * Set actual canvas resolution
     */
    canvas.width = width * dpr;
    canvas.height = height * dpr;

    /*
     * Keep drawing coordinates in CSS pixels
     */
    ctx.setTransform(
        dpr,
        0,
        0,
        dpr,
        0,
        0
    );

    /*
     * Recreate fragments if currently hovering
     */
    if (hovering) {
        createFragments();
    }
}


    /* =====================================================
       IMAGE COVER CALCULATION
       ===================================================== */

    function getImageCover() {

        const width = canvas.clientWidth;
        const height = canvas.clientHeight;

        const imageRatio =
            image.width / image.height;

        const canvasRatio =
            width / height;

        let drawWidth;
        let drawHeight;
        let offsetX;
        let offsetY;

        if (imageRatio > canvasRatio) {

            /*
             * Image is wider
             */
            drawHeight = height;
            drawWidth = height * imageRatio;

            offsetX =
                (width - drawWidth) / 2;

            offsetY = 0;

        } else {

            /*
             * Image is taller
             */
            drawWidth = width;
            drawHeight = width / imageRatio;

            offsetX = 0;

            offsetY =
                (height - drawHeight) / 2;
        }

        return {
            drawWidth,
            drawHeight,
            offsetX,
            offsetY
        };
    }


    /* =====================================================
       CREATE FRAGMENTS
       ===================================================== */

    function createFragments() {

        fragments = [];

        const width = canvas.clientWidth;
        const height = canvas.clientHeight;

        const tileWidth = width / COLS;
        const tileHeight = height / ROWS;

        for (let row = 0; row < ROWS; row++) {

            for (let col = 0; col < COLS; col++) {

                /*
                 * Final position
                 */

                const finalX =
                    col * tileWidth;

                const finalY =
                    row * tileHeight;


                /*
                 * Random scattered starting position
                 */

                const spread = 260;

                const startX =
                    finalX +
                    (Math.random() - 0.5) * spread;

                const startY =
                    finalY +
                    (Math.random() - 0.5) * spread;


                /*
                 * Slight rotation
                 */

                const rotation =
                    (Math.random() - 0.5) *
                    0.45;


                /*
                 * Random animation delay
                 */

                const delay =
                    Math.random() * 500;


                fragments.push({

                    col,
                    row,

                    x: startX,
                    y: startY,

                    targetX: finalX,
                    targetY: finalY,

                    width: tileWidth + 1,
                    height: tileHeight + 1,

                    rotation,

                    currentRotation: rotation,

                    opacity: 0,

                    targetOpacity: 1,

                    delay
                });
            }
        }
    }


    /* =====================================================
       EASING
       ===================================================== */

    function easeOutCubic(t) {

        return 1 -
            Math.pow(1 - t, 3);
    }


    /* =====================================================
       DRAW IMAGE FRAGMENTS
       ===================================================== */

    function drawFragments(time) {

        const width = canvas.clientWidth;
        const height = canvas.clientHeight;

        ctx.clearRect(
            0,
            0,
            width,
            height
        );

        if (!image.complete || !image.naturalWidth) {
            return;
        }

        const cover =
            getImageCover();


        const tileWidth =
            width / COLS;

        const tileHeight =
            height / ROWS;


        fragments.forEach(fragment => {

            /*
             * Delay
             */

            const elapsed =
                time -
                startTime -
                fragment.delay;


            let progress =
                Math.max(
                    0,
                    Math.min(
                        elapsed / 950,
                        1
                    )
                );


            progress =
                easeOutCubic(progress);


            /*
             * Animate position
             */

            const x =
                fragment.x +
                (
                    fragment.targetX -
                    fragment.x
                ) * progress;


            const y =
                fragment.y +
                (
                    fragment.targetY -
                    fragment.y
                ) * progress;


            /*
             * Animate rotation
             */

            const rotation =
                fragment.rotation *
                (1 - progress);


            /*
             * Fade in
             */

            const opacity =
                Math.min(
                    1,
                    progress * 2
                );


            /*
             * Source image coordinates
             */

            const sx =
                (
                    fragment.col /
                    COLS
                ) *
                image.naturalWidth;

            const sy =
                (
                    fragment.row /
                    ROWS
                ) *
                image.naturalHeight;


            const sw =
                image.naturalWidth /
                COLS;

            const sh =
                image.naturalHeight /
                ROWS;


            /*
             * Draw fragment
             */

            ctx.save();

            ctx.globalAlpha = opacity;

            ctx.translate(
                x + tileWidth / 2,
                y + tileHeight / 2
            );

            ctx.rotate(rotation);

            ctx.drawImage(

                image,

                sx,
                sy,
                sw,
                sh,

                -tileWidth / 2,
                -tileHeight / 2,

                tileWidth + 2,
                tileHeight + 2
            );

            ctx.restore();

        });


        /*
         * Continue animation
         */

        if (hovering) {

            animationFrame =
                requestAnimationFrame(
                    drawFragments
                );

        }
    }


    /* =====================================================
       HOVER ENTER
       ===================================================== */

    function startReveal() {

        if (hovering) return;

        hovering = true;

        area.classList.add(
            "is-hovering"
        );

        createFragments();

        startTime =
            performance.now();

        cancelAnimationFrame(
            animationFrame
        );

        animationFrame =
            requestAnimationFrame(
                drawFragments
            );
    }


    /* =====================================================
       HOVER LEAVE
       ===================================================== */

    function stopReveal() {

        hovering = false;

        area.classList.remove(
            "is-hovering"
        );

        cancelAnimationFrame(
            animationFrame
        );

        /*
         * Quickly fade the canvas
         */
        canvas.style.transition =
            "opacity .35s ease";

        canvas.style.opacity = "0";

        setTimeout(() => {

            if (!hovering) {

                ctx.clearRect(
                    0,
                    0,
                    canvas.clientWidth,
                    canvas.clientHeight
                );

                canvas.style.opacity = "";

            }

        }, 350);
    }


    /* =====================================================
       EVENTS
       ===================================================== */

    area.addEventListener(
        "mouseenter",
        startReveal
    );

    area.addEventListener(
        "mouseleave",
        stopReveal
    );


    /* =====================================================
       IMAGE LOAD
       ===================================================== */

    image.onload = () => {

        resizeCanvas();

    };


    /* =====================================================
       WINDOW RESIZE
       ===================================================== */

    window.addEventListener(
        "resize",
        resizeCanvas
    );


    /*
     * Initial setup
     */

    resizeCanvas();

});

/* =========================================================
   SCROLL CURVED ARROW
   ========================================================= */


/* =========================================================
   DUST PARTICLE FIELD
   Cursor pushes particles gently
   ========================================================= */

/* =========================================================
   PARTICLE FIELD
   Particles react to the existing cursor
   ========================================================= */

(function () {

    const canvas =
        document.getElementById("particle-field");

    if (!canvas) return;

    const ctx =
        canvas.getContext("2d");

    let width;
    let height;
    let dpr;

    let particles = [];


    /* -----------------------------------------------------
       Mouse
       ----------------------------------------------------- */

    const mouse = {
    x: -1000,
    y: -1000,

    lastX: -1000,
    lastY: -1000,

    velocityX: 0,
    velocityY: 0,

    active: false
};


    /* -----------------------------------------------------
       Settings
       ----------------------------------------------------- */

    const SETTINGS = {
    density: 0.0022,

    mouseRadius: 280,

    mouseForce: 1.8,

    friction: 0.94,

    returnForce: 0.000008,

    drift: 0.08
};


    /* -----------------------------------------------------
       Resize
       ----------------------------------------------------- */

    function resize() {

        width =
            window.innerWidth;

        height =
            window.innerHeight;

        dpr =
            Math.min(
                window.devicePixelRatio || 1,
                2
            );


        canvas.width =
            width * dpr;

        canvas.height =
            height * dpr;

        canvas.style.width =
            width + "px";

        canvas.style.height =
            height + "px";


        ctx.setTransform(
            dpr,
            0,
            0,
            dpr,
            0,
            0
        );


        createParticles();
    }


    /* -----------------------------------------------------
       Create particles
       ----------------------------------------------------- */

    function createParticles() {

        particles = [];


        const count =
            Math.floor(
                width *
                height *
                SETTINGS.density
            );


        for (
            let i = 0;
            i < count;
            i++
        ) {

            const x =
                Math.random() *
                width;

            const y =
                Math.random() *
                height;


            particles.push({

                x: x,

                y: y,

                homeX: x,

                homeY: y,

                vx:
                    (Math.random() - 0.5)
                    * 0.12,

                vy:
                    (Math.random() - 0.5)
                    * 0.12,

                size:
    Math.random() *
    0.7 +
    0.15,

                opacity:
                    Math.random() *
                    0.45 +
                    0.08,

                phase:
                    Math.random() *
                    Math.PI *
                    2,

                speed:
                    Math.random() *
                    0.015 +
                    0.004
            });
        }
    }


    /* -----------------------------------------------------
       Mouse movement
       ----------------------------------------------------- */

    window.addEventListener(
    "mousemove",
    function (e) {

        const newX = e.clientX;
        const newY = e.clientY;

        mouse.velocityX =
            newX - mouse.x;

        mouse.velocityY =
            newY - mouse.y;

        mouse.x = newX;
        mouse.y = newY;

        mouse.active = true;

    },
    { passive: true }
);


    window.addEventListener(
        "mouseleave",
        function () {

            mouse.active =
                false;

            mouse.x = -1000;
            mouse.y = -1000;
        }
    );


    /* -----------------------------------------------------
       Update
       ----------------------------------------------------- */

    function update() {

        for (const p of particles) {


            /* ---------------------------------------------
               Natural floating movement
               --------------------------------------------- */

            p.phase +=
                p.speed;


            p.vx +=
                Math.cos(p.phase)
                * 0.002
                * SETTINGS.drift;


            p.vy +=
                Math.sin(p.phase * 0.8)
                * 0.002
                * SETTINGS.drift;


            /* ---------------------------------------------
               CURSOR FORCE
               --------------------------------------------- */

            if (mouse.active) {

    const dx =
        p.x - mouse.x;

    const dy =
        p.y - mouse.y;

    const distance =
        Math.sqrt(
            dx * dx +
            dy * dy
        );


    if (
        distance <
        SETTINGS.mouseRadius
        &&
        distance > 0
    ) {

        const power =
            1 -
            distance /
            SETTINGS.mouseRadius;


        /*
         * Push away from cursor
         */

        const push =
            power *
            power *
            SETTINGS.mouseForce;


        p.vx +=
            (dx / distance)
            * push;

        p.vy +=
            (dy / distance)
            * push;


        /*
         * IMPORTANT:
         * Transfer cursor movement
         * into the dust.
         */

        const flow =
            power * 0.16;


        p.vx +=
            mouse.velocityX *
            flow;

        p.vy +=
            mouse.velocityY *
            flow;
    }
}


            /* ---------------------------------------------
               Move
               --------------------------------------------- */

            p.x += p.vx;

            p.y += p.vy;


            /* ---------------------------------------------
               Friction
               --------------------------------------------- */

            p.vx *=
                SETTINGS.friction;

            p.vy *=
                SETTINGS.friction;


            /* ---------------------------------------------
               Return slowly to original position
               --------------------------------------------- */

            p.vx +=
                (p.homeX - p.x)
                * SETTINGS.returnForce;

            p.vy +=
                (p.homeY - p.y)
                * SETTINGS.returnForce;


            /* ---------------------------------------------
               Wrap around screen
               --------------------------------------------- */

            if (p.x < -10) {

                p.x =
                    width + 10;

                p.homeX =
                    p.x;
            }


            if (p.x > width + 10) {

                p.x = -10;

                p.homeX =
                    p.x;
            }


            if (p.y < -10) {

                p.y =
                    height + 10;

                p.homeY =
                    p.y;
            }


            if (p.y > height + 10) {

                p.y = -10;

                p.homeY =
                    p.y;
            }
        }
    }


    /* -----------------------------------------------------
       Draw
       ----------------------------------------------------- */

    function draw() {

        ctx.clearRect(
            0,
            0,
            width,
            height
        );


        for (const p of particles) {

            ctx.beginPath();


            ctx.arc(
                p.x,
                p.y,
                p.size,
                0,
                Math.PI * 2
            );


            ctx.fillStyle =
    `rgba(
        210,
        210,
        210,
        ${p.opacity * 0.7}
    )`;


            ctx.fill();
        }
    }


    /* -----------------------------------------------------
       Animation
       ----------------------------------------------------- */

    function animate() {

        update();

        draw();

        requestAnimationFrame(
            animate
        );
    }


    /* -----------------------------------------------------
       Start
       ----------------------------------------------------- */

    resize();

    animate();


    window.addEventListener(
        "resize",
        resize
    );

})();

/* =========================================
   START WEBSITE FROM HOME
   ========================================= */

if ("scrollRestoration" in history) {
    history.scrollRestoration = "manual";
}

window.addEventListener("load", () => {

    history.replaceState(
        null,
        "",
        window.location.pathname
    );

    window.scrollTo(0, 0);

});

/* =========================================================
   ABOUT ME — MAGIC SCROLL REVEAL
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    const aboutSection =
        document.querySelector(".about-me-section");

    if (!aboutSection) return;


    const aboutObserver =
        new IntersectionObserver(
            (entries) => {

                entries.forEach((entry) => {

                    if (entry.isIntersecting) {

                        aboutSection.classList.add(
                            "is-visible"
                        );

                    }

                });

            },
            {
                threshold: 0.25
            }
        );


    aboutObserver.observe(aboutSection);

});
/* =========================================================
   HOLOGRAPHIC LETTER REVEAL
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    const aboutSection =
        document.querySelector(".about-me-section");

    if (!aboutSection) return;


    const magicTexts =
        aboutSection.querySelectorAll(".magic-text");


    /* -----------------------------------------
       Split text into individual letters
       ----------------------------------------- */

    magicTexts.forEach(element => {

        /*
         * Don't split elements that contain HTML
         * such as your LIKITHA span.
         */

        if (element.children.length > 0) {

            element.childNodes.forEach(node => {

                if (node.nodeType === Node.TEXT_NODE) {

                    const text = node.textContent;

                    const fragment =
                        document.createDocumentFragment();

                    [...text].forEach(char => {

                        const span =
                            document.createElement("span");

                        span.className =
                            "magic-letter";

                        span.textContent =
                            char === " "
                                ? "\u00A0"
                                : char;

                        fragment.appendChild(span);

                    });

                    node.replaceWith(fragment);
                }

            });

        } else {

            const text = element.textContent;

            element.textContent = "";

            [...text].forEach(char => {

                const span =
                    document.createElement("span");

                span.className =
                    "magic-letter";

                span.textContent =
                    char === " "
                        ? "\u00A0"
                        : char;

                element.appendChild(span);

            });

        }

    });


    /* -----------------------------------------
       Reveal About section
       ----------------------------------------- */

    const observer =
        new IntersectionObserver(
            entries => {

                entries.forEach(entry => {

                    if (!entry.isIntersecting) return;

                    aboutSection.classList.add(
                        "is-visible"
                    );


                    /* Animate letters */

                    const letters =
                        aboutSection.querySelectorAll(
                            ".magic-letter"
                        );


                    letters.forEach((letter, index) => {

                        letter.style.setProperty(
                            "--delay",
                            `${index * 0.025}s`
                        );

                        letter.classList.add(
                            "letter-visible"
                        );

                    });


                    observer.unobserve(
                        aboutSection
                    );

                });

            },
            {
                threshold: 0.25
            }
        );


    observer.observe(aboutSection);

});

/* =========================================
   HOLOGRAM LETTER SPLITTER
   ========================================= */

document.addEventListener("DOMContentLoaded", () => {

    const title = document.querySelector(".hologram-title");

    if (!title) return;

    const words = title.querySelectorAll(".holo-word");

    let letterIndex = 0;

    words.forEach(word => {

        const text = word.textContent;

        word.textContent = "";

        [...text].forEach(character => {

            const letter = document.createElement("span");

            letter.className = "holo-letter";

            letter.textContent =
                character === " "
                    ? "\u00A0"
                    : character;

            letter.style.setProperty(
                "--letter-index",
                letterIndex
            );

            word.appendChild(letter);

            letterIndex++;
        });
    });

});

/* =========================================================
   VIEW WORK → PAGE 2 PHOTO
   MAGIC SCROLL CONNECTING ARROW
   SAME BEHAVIOUR AS PAGE 2 → PAGE 3
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    const arrowWrap =
        document.getElementById("scroll-arrow-wrap");

    const svg =
        document.getElementById("scroll-arrow-svg");

    const path =
        document.getElementById("scroll-arrow-path");

    const arrow =
        document.getElementById("scroll-arrow");

    const viewWork =
        document.getElementById("viewWorkBtn");

    const aboutPhoto =
        document.querySelector(".about-photo-wrap");

    if (
        !arrowWrap ||
        !svg ||
        !path ||
        !arrow ||
        !viewWork ||
        !aboutPhoto
    ) {
        console.warn("Page 1 → Page 2 arrow elements missing.");
        return;
    }


    

    /* =====================================================
       ARROW CANVAS
    ===================================================== */

    function resizeArrowCanvas() {

        const pageWidth =
            document.documentElement.scrollWidth;

        const pageHeight =
            document.documentElement.scrollHeight;

        arrowWrap.style.position = "absolute";
        arrowWrap.style.top = "0";
        arrowWrap.style.left = "0";

        arrowWrap.style.width =
            pageWidth + "px";

        arrowWrap.style.height =
            pageHeight + "px";

        svg.setAttribute(
            "viewBox",
            `0 0 ${pageWidth} ${pageHeight}`
        );

        svg.setAttribute(
            "width",
            pageWidth
        );

        svg.setAttribute(
            "height",
            pageHeight
        );
    }


    /* =====================================================
       ARROW DATA
    ===================================================== */

    const arrowData = {
        length: 0,
        startY: 0,
        targetY: 0
    };


    /* =====================================================
       CREATE CURVED PATH
    ===================================================== */

    function createArrowPath() {

        resizeArrowCanvas();

        const startRect =
            viewWork.getBoundingClientRect();

        const targetRect =
            aboutPhoto.getBoundingClientRect();


        /* -----------------------------------------------
           START — VIEW WORK
        ------------------------------------------------ */

        const startX =
            startRect.left +
            startRect.width / 2;

        const startY =
            startRect.top +
            window.scrollY +
            startRect.height / 2;


        /* -----------------------------------------------
           TARGET — TOP OF PAGE 2 PHOTO
        ------------------------------------------------ */

        const targetX =
            targetRect.left +
            targetRect.width / 2;

        const targetY =
            targetRect.top +
            window.scrollY;


        const distance =
            targetY - startY;


        /* -----------------------------------------------
           CURVE
        ------------------------------------------------ */

        const curve =
            Math.min(
                280,
                Math.max(
                    140,
                    window.innerWidth * 0.18
                )
            );


        /* -----------------------------------------------
           SAME S-CURVE
        ------------------------------------------------ */

        const d = `
            M ${startX} ${startY}

            C
                ${startX + curve}
                ${startY + distance * 0.18},

                ${targetX + curve}
                ${startY + distance * 0.35},

                ${targetX}
                ${startY + distance * 0.50}

            C
                ${targetX - curve}
                ${startY + distance * 0.65},

                ${targetX - curve * 0.35}
                ${startY + distance * 0.85},

                ${targetX}
                ${targetY}
        `;

        path.setAttribute("d", d);


        /* -----------------------------------------------
           ARROW HEAD
        ------------------------------------------------ */

        arrow.setAttribute(
            "d",
            "M -20 -20 L 0 0 L 20 -20"
        );


        /* -----------------------------------------------
           PATH LENGTH
        ------------------------------------------------ */

        const length =
            path.getTotalLength();

        path.style.strokeDasharray =
            "4 10";

        path.style.strokeDashoffset =
            length;


        arrowData.length =
            length;

        arrowData.startY =
            startY;

        arrowData.targetY =
            targetY;
    }


    /* =====================================================
       SCROLL ANIMATION
    ===================================================== */

    function updateArrow() {

        if (!arrowData.length) return;

        const scrollY =
            window.scrollY;


        /* -----------------------------------------------
           DRAWING START
        ------------------------------------------------ */

        const start =
            arrowData.startY -
            window.innerHeight * 0.66;


        /* -----------------------------------------------
           DRAWING END
        ------------------------------------------------ */

        const end =
            arrowData.targetY -
            window.innerHeight * 0.70;


        /* -----------------------------------------------
           PROGRESS
        ------------------------------------------------ */

        let progress =
            (scrollY - start) /
            (end - start);

        progress =
            Math.max(
                0,
                Math.min(
                    1,
                    progress
                )
            );


        /* -----------------------------------------------
           CURRENT DRAWING LENGTH
        ------------------------------------------------ */

        const drawnLength =
            arrowData.length *
            progress;


        /* =================================================
           SAME REVEAL MASK AS PAGE 2 → PAGE 3
        ================================================= */

        let mask =
            document.getElementById(
                "scroll-arrow-mask"
            );


        if (!mask) {

            const defs =
                document.createElementNS(
                    "http://www.w3.org/2000/svg",
                    "defs"
                );

            mask =
                document.createElementNS(
                    "http://www.w3.org/2000/svg",
                    "mask"
                );

            mask.setAttribute(
                "id",
                "scroll-arrow-mask"
            );


            const revealPath =
                document.createElementNS(
                    "http://www.w3.org/2000/svg",
                    "path"
                );

            revealPath.setAttribute(
                "id",
                "scroll-arrow-reveal-path"
            );

            revealPath.setAttribute(
                "fill",
                "none"
            );

            revealPath.setAttribute(
                "stroke",
                "white"
            );

            revealPath.setAttribute(
                "stroke-linecap",
                "round"
            );

            revealPath.setAttribute(
                "stroke-width",
                "12"
            );

            mask.appendChild(
                revealPath
            );

            defs.appendChild(
                mask
            );

            svg.insertBefore(
                defs,
                svg.firstChild
            );
        }


        const revealPath =
            document.getElementById(
                "scroll-arrow-reveal-path"
            );


        /* -----------------------------------------------
           KEEP MASK ON SAME CURVE
        ------------------------------------------------ */

        revealPath.setAttribute(
            "d",
            path.getAttribute("d")
        );


        revealPath.style.strokeDasharray =
            `${arrowData.length} ${arrowData.length}`;

        revealPath.style.strokeDashoffset =
            arrowData.length -
            drawnLength;


        path.setAttribute(
            "mask",
            "url(#scroll-arrow-mask)"
        );


        /* =================================================
           ARROW HEAD FOLLOWS END OF DOTS
        ================================================= */

        if (progress > 0) {

            const point =
                path.getPointAtLength(
                    drawnLength
                );

            const nextPoint =
                path.getPointAtLength(
                    Math.min(
                        drawnLength + 2,
                        arrowData.length
                    )
                );


            const angle =
                Math.atan2(
                    nextPoint.y - point.y,
                    nextPoint.x - point.x
                ) *
                180 /
                Math.PI;


            arrow.setAttribute(
                "transform",
                `
                    translate(
                        ${point.x}
                        ${point.y}
                    )
                    rotate(${angle})
                `
            );


            path.style.opacity =
                "0.9";

            arrow.style.opacity =
                "1";

        } else {

            path.style.opacity =
                "0";

            arrow.style.opacity =
                "0";
        }
    }


    /* =====================================================
       SCROLL
    ===================================================== */

    let ticking = false;

    window.addEventListener(
        "scroll",
        () => {

            if (ticking) return;

            ticking = true;

            requestAnimationFrame(() => {

                updateArrow();

                ticking = false;

            });

        },
        { passive: true }
    );


    /* =====================================================
       RESIZE
    ===================================================== */

    window.addEventListener(
        "resize",
        () => {

            createArrowPath();
            updateArrow();

        }
    );


    /* =====================================================
       INITIAL
    ===================================================== */

    requestAnimationFrame(() => {

        createArrowPath();
        updateArrow();

    });

});

/* =========================================================
   PAGE 2 → PAGE 3
   MAGIC SCROLL CONNECTING ARROW
   ========================================================= */


/* =========================================
   PAGE 2 — SMOOTH 3D BUBBLE PHYSICS
========================================= */

document.addEventListener("DOMContentLoaded", () => {

    const photo = document.querySelector(".about-me-photo");
    const field = document.querySelector(".about-physics-field");
    const hoverZone = document.querySelector(".about-photo-wrap");
    const items = [
        ...document.querySelectorAll(".about-physics-field .physics-item")
    ];

    if (!photo || !field || !items.length || !hoverZone) return;


    /* -----------------------------------------
       SETTINGS
    ----------------------------------------- */

    const CONFIG = {

        // How far bubbles can move
        padding: 45,

        // Size used for collision detection
        radius: 45,

        // Gentle bubble movement
        attraction: 0.0006,

        // Smoothness
        friction: 0.985,

        // Maximum movement speed
        maxSpeed: 2.6,

        // Soft collision
        collisionStrength: 0.035,

        // Gentle floating force
        floatStrength: 0.020,

        // Mouse pushes bubbles away
        mouseRadius: 130,
        mouseStrength: 0.045
    };


    /* -----------------------------------------
       STATE
    ----------------------------------------- */

    let running = false;
    let animationFrame = null;

    const mouse = {
        x: 0,
        y: 0,
        active: false
    };


    /* -----------------------------------------
       CREATE BUBBLES
    ----------------------------------------- */

    const bubbles = items.map((el, index) => {

        const angle =
            (Math.PI * 2 / items.length) * index;

        return {

            el,

            x: 0,
            y: 0,

            vx: 0,
            vy: 0,

            targetX: 0,
            targetY: 0,

            phase: Math.random() * Math.PI * 2,

            angle,

            depth:
                0.85 +
                Math.random() * 0.3
        };
    });


    /* -----------------------------------------
       GET FIELD SIZE
    ----------------------------------------- */

    function getFieldSize() {

        const rect =
            field.getBoundingClientRect();

        return {
            width: rect.width,
            height: rect.height
        };
    }


    /* -----------------------------------------
       POSITION BUBBLES
    ----------------------------------------- */

    function resetBubbles() {

        const { width, height } =
            getFieldSize();

        const centerX = width / 2;
        const centerY = height / 2;

        const spreadX =
            Math.min(width * 0.40, 220);

        const spreadY =
            Math.min(height * 0.38, 220);


        bubbles.forEach((bubble, index) => {

            /* -----------------------------------------
   INDIVIDUAL ICON POSITIONS
   Change X and Y values here
----------------------------------------- */

const positions = [
    { x: -170, y: -180 }, // LinkedIn
    { x:  -200, y: -140 }, // GitHub
    { x: -210, y: 100 }, // About
    { x:  -210, y: -110 }, // Achievements
    { x: -150, y:  190 }, // Certifications
    { x:  150, y:  190 }  // Arcade
];

const pos = positions[index];

bubble.targetX =
    centerX + pos.x;

bubble.targetY =
    centerY + pos.y;


            /*
             * Start slightly away from
             * target so they gently move in.
             */

            bubble.x =
                bubble.targetX +
                (Math.random() - 0.5) * 30;

            bubble.y =
                bubble.targetY +
                (Math.random() - 0.5) * 30;


            bubble.vx =
                (Math.random() - 0.5) * 0.25;

            bubble.vy =
                (Math.random() - 0.5) * 0.25;


            bubble.el.style.transition =
                "opacity .4s ease";

            bubble.el.style.opacity = "1";

            bubble.el.style.transform =
    `translate3d(
        calc(-50% + ${bubble.x}px),
        calc(-50% + ${bubble.y}px),
        0
    ) scale(1)`;
        });
    }


    /* -----------------------------------------
       LIMIT SPEED
    ----------------------------------------- */

    function limitSpeed(bubble) {

        const speed =
            Math.sqrt(
                bubble.vx * bubble.vx +
                bubble.vy * bubble.vy
            );

        if (speed > CONFIG.maxSpeed) {

            bubble.vx =
                (bubble.vx / speed) *
                CONFIG.maxSpeed;

            bubble.vy =
                (bubble.vy / speed) *
                CONFIG.maxSpeed;
        }
    }


    /* -----------------------------------------
       SMOOTH BUBBLE PHYSICS
    ----------------------------------------- */

    function animate(time) {

        if (!running) return;


        const t = time * 0.001;

        const { width, height } =
            getFieldSize();


        /* -------------------------------------
           MOVE
        ------------------------------------- */

        bubbles.forEach((bubble) => {


            /* -------------------------------
               SOFT RETURN TO TARGET
            ------------------------------- */

            const dx =
                bubble.targetX -
                bubble.x;

            const dy =
                bubble.targetY -
                bubble.y;


            bubble.vx +=
                dx *
                CONFIG.attraction;

            bubble.vy +=
                dy *
                CONFIG.attraction;


            /* -------------------------------
               NATURAL FLOAT
            ------------------------------- */

            bubble.vx +=
                Math.sin(
                    t * 0.7 +
                    bubble.phase
                ) *
                CONFIG.floatStrength;

            bubble.vy +=
                Math.cos(
                    t * 0.6 +
                    bubble.phase
                ) *
                CONFIG.floatStrength;


            /* -------------------------------
               MOUSE REPULSION
            ------------------------------- */

            if (mouse.active) {

                const dxMouse =
                    bubble.x -
                    mouse.x;

                const dyMouse =
                    bubble.y -
                    mouse.y;

                const distance =
                    Math.sqrt(
                        dxMouse * dxMouse +
                        dyMouse * dyMouse
                    );


                if (
                    distance <
                    CONFIG.mouseRadius
                    &&
                    distance > 0.001
                ) {

                    const force =
                        (1 -
                            distance /
                            CONFIG.mouseRadius);

                    bubble.vx +=
                        (dxMouse / distance) *
                        force *
                        CONFIG.mouseStrength;

                    bubble.vy +=
                        (dyMouse / distance) *
                        force *
                        CONFIG.mouseStrength;
                }
            }


            /* -------------------------------
               FRICTION
            ------------------------------- */

            bubble.vx *= CONFIG.friction;
            bubble.vy *= CONFIG.friction;


            /* -------------------------------
               SPEED LIMIT
            ------------------------------- */

            limitSpeed(bubble);


            /* -------------------------------
               POSITION
            ------------------------------- */

            bubble.x +=
                bubble.vx;

            bubble.y +=
                bubble.vy;


            /* -------------------------------
               SOFT FIELD BOUNDARIES
            ------------------------------- */

            const minX =
                -width / 2 +
                CONFIG.padding;

            const maxX =
                width / 2 -
                CONFIG.padding;

            const minY =
                -height / 2 +
                CONFIG.padding;

            const maxY =
                height / 2 -
                CONFIG.padding;


            if (bubble.x < minX) {

                bubble.x = minX;

                bubble.vx *= -0.45;
            }

            if (bubble.x > maxX) {

                bubble.x = maxX;

                bubble.vx *= -0.45;
            }

            if (bubble.y < minY) {

                bubble.y = minY;

                bubble.vy *= -0.45;
            }

            if (bubble.y > maxY) {

                bubble.y = maxY;

                bubble.vy *= -0.45;
            }
        });


        /* -------------------------------------
           BUBBLE ↔ BUBBLE COLLISIONS
        ------------------------------------- */

        for (
            let i = 0;
            i < bubbles.length;
            i++
        ) {

            for (
                let j = i + 1;
                j < bubbles.length;
                j++
            ) {

                const a = bubbles[i];
                const b = bubbles[j];


                const dx =
                    b.x -
                    a.x;

                const dy =
                    b.y -
                    a.y;


                let distance =
                    Math.sqrt(
                        dx * dx +
                        dy * dy
                    );


                if (distance < 0.001) {
                    distance = 0.001;
                }


                const minDistance =
                    CONFIG.radius * 2;


                if (
                    distance <
                    minDistance
                ) {

                    const nx =
                        dx / distance;

                    const ny =
                        dy / distance;


                    const overlap =
                        minDistance -
                        distance;


                    /*
                     * VERY SOFT PUSH
                     */

                    const push =
                        overlap *
                        CONFIG.collisionStrength;


                    a.vx -=
                        nx * push;

                    a.vy -=
                        ny * push;

                    b.vx +=
                        nx * push;

                    b.vy +=
                        ny * push;


                    /*
                     * Separate them slightly
                     * so they don't get stuck.
                     */

                    const separation =
                        overlap * 0.12;


                    a.x -=
                        nx * separation;

                    a.y -=
                        ny * separation;

                    b.x +=
                        nx * separation;

                    b.y +=
                        ny * separation;
                }
            }
        }


        /* -------------------------------------
           RENDER
        ------------------------------------- */

        bubbles.forEach((bubble) => {

            /*
             * NO CSS TRANSFORM TRANSITION HERE.
             * Physics controls transform directly.
             */

            bubble.el.style.transform =
                `translate3d(
                    calc(-50% + ${bubble.x}px),
                    calc(-50% + ${bubble.y}px),
                    0
                )`;
        });


        animationFrame =
            requestAnimationFrame(animate);
    }


    /* -----------------------------------------
       MOUSE POSITION
    ----------------------------------------- */

    photo.addEventListener(
        "mousemove",
        (event) => {

            const rect =
                field.getBoundingClientRect();


            mouse.x =
                event.clientX -
                (rect.left +
                rect.width / 2);


            mouse.y =
                event.clientY -
                (rect.top +
                rect.height / 2);
        }
    );


    /* -----------------------------------------
       PHOTO ENTER
    ----------------------------------------- */

    hoverZone.addEventListener(
        "mouseenter",
        () => {

            running = true;

            mouse.active = true;

            resetBubbles();


            if (animationFrame) {

                cancelAnimationFrame(
                    animationFrame
                );
            }


            animationFrame =
                requestAnimationFrame(
                    animate
                );
        }
    );


    /* -----------------------------------------
       PHOTO LEAVE
    ----------------------------------------- */

    hoverZone.addEventListener(
        "mouseleave",
        () => {

            running = false;

            mouse.active = false;


            if (animationFrame) {

                cancelAnimationFrame(
                    animationFrame
                );

                animationFrame = null;
            }


            bubbles.forEach((bubble) => {

                bubble.el.style.opacity =
                    "0";
            });
        }
    );


    /* -----------------------------------------
       INITIAL STATE
    ----------------------------------------- */

    bubbles.forEach((bubble) => {

        bubble.el.style.opacity = "0";

        bubble.el.style.transition =
            "opacity .4s ease";

        bubble.el.style.willChange =
            "transform";
    });

});
/* =========================================
   CLICKABLE LINKEDIN ICON

========================================= */

/* ---------- Project 1 → Page 3 ---------- */


/* =========================================================
   PAGE 4 — SCROLL ENVELOPE TRANSITION
   Adapted from Pasted text(8).txt
   ========================================================= */

(function () {
  "use strict";

  /* ---------- Page 4 elements ---------- */

  var pageFour = document.getElementById("page-four");

  /* If Page 4 is not present, stop here */
  if (!pageFour) return;

  var track = pageFour.querySelector(".page-four-track");
  var stage = pageFour.querySelector(".page-four-stage");
  var env = pageFour.querySelector(".page-four-envelope");

  var flapF = document.getElementById("page-four-flap-front");
  var flapB = document.getElementById("page-four-flap-back");

  var cm = document.getElementById("page-four-card-move");
  var card = document.getElementById("page-four-card");

  var hero = pageFour.querySelector(".page-four-hero");
  var strip = pageFour.querySelector(".page-four-strip");
  var hint = pageFour.querySelector(".page-four-hint");
  var bitsHost = pageFour.querySelector(".page-four-bits");

  /* ---------- Safety check ---------- */

  if (
    !track ||
    !stage ||
    !env ||
    !flapF ||
    !flapB ||
    !cm ||
    !card
  ) {
    return;
  }


  /* =========================================================
     HELPERS
     ========================================================= */

  var reduce =
    window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;


  var clamp = function (v, a, b) {
    return Math.min(b, Math.max(a, v));
  };


  var seg = function (p, a, b) {
    return clamp(
      (p - a) / (b - a),
      0,
      1
    );
  };


  var ease = function (x) {
    return x < 0.5
      ? 4 * x * x * x
      : 1 -
        Math.pow(
          -2 * x + 2,
          3
        ) / 2;
  };


  var lerp = function (a, b, x) {
    return a + (b - a) * x;
  };


  /* =========================================================
     MEASURE
     ========================================================= */

  var H;
  var W;
  var cH;
  var vw;
  var vh;
  var max;


  function measure() {

    vw = window.innerWidth;
    vh = window.innerHeight;

    W = env.offsetWidth;
    H = env.offsetHeight;

    cH = card.offsetHeight;

    max = Math.max(
      1,
      track.offsetHeight - vh
    );
  }


  window.addEventListener(
    "resize",
    measure
  );


  /* =========================================================
     SCROLL READING
     ========================================================= */

  var target = 0;
  var cur = -1;


  function read() {

    /*
      Page 4 progress:

      0 = Page 4 just starts
      1 = Page 4 transition finished
    */

    target = clamp(
      -track.getBoundingClientRect().top / max,
      0,
      1
    );
  }


  window.addEventListener(
    "scroll",
    read,
    {
      passive: true
    }
  );


  /* =========================================================
     RENDER PAGE 4
     ========================================================= */

  function render(p) {

    /*
      Same four animation phases
      from the reference:

      rise → envelope comes up
      flap → envelope opens
      out  → paper comes out
      fin  → final movement
    */

    var rise = ease(
      seg(p, 0, 0.3)
    );

    var flap = seg(
      p,
      0.24,
      0.46
    );

    var out = ease(
      seg(p, 0.42, 0.8)
    );

    var fin = ease(
      seg(p, 0.76, 1)
    );


    /* =====================================================
       ENVELOPE MOVEMENT
       ===================================================== */

    var y =
      lerp(
        0.62 * vh,
        0.06 * vh,
        rise
      ) +
      fin * 0.15 * vh;


    var rot =
      lerp(
        0,
        -8,
        rise
      ) +
      fin * 5;


    var sc =
      lerp(
        0.9,
        1,
        rise
      );


    env.style.transform =
      "translate(-50%, -50%) " +
      "translate3d(0, " +
      y +
      "px, 0) " +
      "rotate(" +
      rot +
      "deg) " +
      "scale(" +
      sc +
      ")";


    /* =====================================================
       FRONT + BACK FLAP
       ===================================================== */

    var a = ease(
      clamp(
        flap * 2,
        0,
        1
      )
    );


    var b = ease(
      clamp(
        flap * 2 - 1,
        0,
        1
      )
    );


    /* Front flap opens */

    flapF.style.transform =
      "perspective(900px) " +
      "rotateX(" +
      (-90 * a) +
      "deg)";


    flapF.style.visibility =
      a >= 1
        ? "hidden"
        : "visible";


    /* Back flap */

    flapB.style.transform =
      "perspective(900px) " +
      "rotateX(" +
      (90 * (1 - b)) +
      "deg)";


    flapB.style.visibility =
      b <= 0
        ? "hidden"
        : "visible";


    /* =====================================================
       PAPER / CARD COMES OUT
       ===================================================== */

    var cy =
      lerp(
        cH - 0.9 * H,
        0.38 * cH - H,
        out
      );


    var cs =
      1 +
      0.16 * fin;


    cm.style.transform =
      "translate3d(0, " +
      cy +
      "px, 0) " +
      "scale(" +
      cs +
      ")";


    /* =====================================================
       FINAL STAGE
       ===================================================== */

    stage.classList.toggle(
      "live",
      p > 0.9
    );


    /* =====================================================
       HERO TEXT LEAVES
       ===================================================== */

    if (hero) {

      var opacity =
        1 -
        seg(
          p,
          0,
          0.16
        );


      hero.style.opacity =
        opacity;


      hero.style.transform =
        "translate3d(0, " +
        (-p * vh * 0.9) +
        "px, 0)";
    }


    /* =====================================================
       MARQUEE LEAVES
       ===================================================== */

    if (strip) {

      strip.style.opacity =
        1 -
        seg(
          p,
          0.02,
          0.2
        );


      strip.style.transform =
        "rotate(-2deg) " +
        "translate3d(0, " +
        (-p * vh * 1.4) +
        "px, 0)";
    }


    /* =====================================================
       SCROLL HINT
       ===================================================== */

    if (hint) {

      hint.style.opacity =
        1 -
        seg(
          p,
          0,
          0.08
        );
    }


    /* =====================================================
       SMALL FLOATING SCRAPS
       ===================================================== */

    pageFourBits.forEach(
      function (s) {

        var by =
          (s.y / 100) *
            vh -
          p *
            vh *
            s.sp *
            1.1;


        s.el.style.transform =
          "translate3d(" +
          (s.x / 100) *
            vw +
          "px, " +
          by +
          "px, 0) " +
          "rotate(" +
          (s.r +
            p * s.rs) +
          "deg)";
      }
    );
  }


  /* =====================================================
   FLOATING SCRAPS — DISABLED
   ===================================================== */

var pageFourBits = [];
  /* =========================================================
     ANIMATION LOOP
     ========================================================= */

  function frame() {

    cur =
      cur < 0
        ? target
        : cur +
          (target - cur) *
            (reduce
              ? 1
              : 0.085);


    if (
      Math.abs(
        target - cur
      ) < 0.0002
    ) {

      cur = target;
    }


    render(cur);


    requestAnimationFrame(
      frame
    );
  }


  /* =========================================================
     START
     ========================================================= */

  measure();

  read();

  cur = target;

  frame();


  window.addEventListener(
    "load",
    function () {

      measure();

      read();
    }
  );

})();

// =========================================================
// FLOATING MENU — OPEN / CLOSE
// =========================================================

(function () {
  "use strict";

  const menuToggle = document.getElementById("menuToggle");
  const menuPanel = document.getElementById("menuPanel");
  const menuClose = document.getElementById("menuClose");

  if (!menuToggle || !menuPanel || !menuClose) return;

  function openMenu() {
    menuPanel.classList.add("active");
    menuToggle.setAttribute("aria-expanded", "true");
  }

  function closeMenu() {
    menuPanel.classList.remove("active");
    menuToggle.setAttribute("aria-expanded", "false");
  }

  menuToggle.addEventListener("click", function () {
    if (menuPanel.classList.contains("active")) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  menuClose.addEventListener("click", closeMenu);

  // Close menu when a navigation link is clicked
  menuPanel.querySelectorAll("a").forEach(function (link) {
    link.addEventListener("click", function () {
      closeMenu();
    });
  });

  // Close with Escape key
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      closeMenu();
    }
  });

    // Hover reveal on desktop
  if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {

    menuToggle.addEventListener("mouseenter", openMenu);

    menuPanel.addEventListener("mouseleave", function (event) {
      if (!menuPanel.contains(event.relatedTarget)) {
        closeMenu();
      }
    });

  }
})();

// =========================================================
// MENU BALL — FLOAT AROUND ENTIRE SCREEN
// =========================================================

(function () {

  const ball = document.getElementById("menuToggle");

  if (!ball) return;

  let x = window.innerWidth - 120;
  let y = 80;

  let vx = 1.8;
  let vy = 1.4;

  let rotation = 0;

  function animateMenuBall() {

    const ballWidth = ball.offsetWidth;
    const ballHeight = ball.offsetHeight;

    x += vx;
    y += vy;

    // Bounce from left / right
    if (x <= 10) {
      x = 10;
      vx = Math.abs(vx);
    }

    if (x >= window.innerWidth - ballWidth - 10) {
      x = window.innerWidth - ballWidth - 10;
      vx = -Math.abs(vx);
    }

    // Bounce from top / bottom
    if (y <= 10) {
      y = 10;
      vy = Math.abs(vy);
    }

    if (y >= window.innerHeight - ballHeight - 10) {
      y = window.innerHeight - ballHeight - 10;
      vy = -Math.abs(vy);
    }

    // Continuous spinning
    rotation += 3;

    ball.style.left = x + "px";
    ball.style.top = y + "px";

    ball.style.transform =
      "rotate(" + rotation + "deg)";

    requestAnimationFrame(animateMenuBall);
  }

  animateMenuBall();

})();
  

// =========================================================
// ABOUT ME — PARAGRAPH TEXT REVEAL
// =========================================================

(function () {
  "use strict";

  const aboutContent = document.querySelector(
    "#about-me .about-me-content"
  );

  if (!aboutContent) return;

  const observer = new IntersectionObserver(
    function (entries) {

      entries.forEach(function (entry) {

        if (entry.isIntersecting) {

          aboutContent.classList.add("about-text-visible");

          observer.unobserve(aboutContent);
        }

      });

    },
    {
      threshold: 0.2
    }
  );

  observer.observe(aboutContent);

})();

/* =========================================================
   AI AGENT — IDLE + MOUSE REACTION
========================================================= */

(function () {

  const aiAgent = document.querySelector('.hero-ai-agent');
  const aiReact = document.querySelector('.hero-ai-react');

  if (!aiAgent || !aiReact) return;

  let targetX = 0;
  let targetY = 0;
  let targetRotateX = 0;
  let targetRotateY = 0;

  let currentX = 0;
  let currentY = 0;
  let currentRotateX = 0;
  let currentRotateY = 0;

  document.addEventListener('mousemove', function (e) {

    const rect = aiAgent.getBoundingClientRect();

    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dx = e.clientX - centerX;
    const dy = e.clientY - centerY;

    const distance = Math.sqrt(
      dx * dx + dy * dy
    );

    /* Only react when mouse is reasonably close */
    if (distance < 600) {

      /* Small position movement */
      targetX = Math.max(
        -12,
        Math.min(12, dx / 45)
      );

      targetY = Math.max(
        -10,
        Math.min(10, dy / 55)
      );

      /*
        Very small lean.

        rotateY = left/right lean
        rotateX = up/down lean

        These values are deliberately tiny
        so the character NEVER spins.
      */

      targetRotateY = Math.max(
        -5,
        Math.min(5, dx / 120)
      );

      targetRotateX = Math.max(
        -4,
        Math.min(4, -dy / 150)
      );

    } else {

      targetX = 0;
      targetY = 0;
      targetRotateX = 0;
      targetRotateY = 0;

    }

  });

  function animateAIAgent() {

    /* Smooth movement */

    currentX +=
      (targetX - currentX) * 0.06;

    currentY +=
      (targetY - currentY) * 0.06;

    currentRotateX +=
      (targetRotateX - currentRotateX) * 0.06;

    currentRotateY +=
      (targetRotateY - currentRotateY) * 0.06;


    /* Apply movement */

    aiReact.style.setProperty(
      '--ai-x',
      currentX + 'px'
    );

    aiReact.style.setProperty(
      '--ai-y',
      currentY + 'px'
    );


    /* Apply subtle lean */

    aiReact.style.setProperty(
      '--ai-rotate-x',
      currentRotateX + 'deg'
    );

    aiReact.style.setProperty(
      '--ai-rotate-y',
      currentRotateY + 'deg'
    );


    requestAnimationFrame(
      animateAIAgent
    );
  }

  animateAIAgent();

})();

/* =========================================================
   AI ASSISTANT — OPEN AI AGENT
========================================================= */


/* =========================================================
   AI ASSISTANT — CLICK TO OPEN CARD
========================================================= */

/* =========================================================
   AI ASSISTANT — OPEN AGENT
========================================================= */

const aiAssistant = document.getElementById('aiAssistant');
const aiChatOverlay = document.getElementById('aiChatOverlay');
const aiChatClose = document.getElementById('aiChatClose');
const aiChatFrame = document.getElementById('aiChatFrame');

if (aiAssistant && aiChatOverlay && aiChatFrame) {

  aiAssistant.addEventListener('click', function () {

    if (!aiChatFrame.getAttribute('src')) {
      aiChatFrame.src = 'http://localhost:3000/agent.html';
    }

    aiChatOverlay.classList.add('ai-chat-open');

  });

}

if (aiChatClose && aiChatOverlay) {

  aiChatClose.addEventListener('click', function (event) {

    event.stopPropagation();

    aiChatOverlay.classList.remove('ai-chat-open');

  });

}

if (aiChatOverlay) {

  aiChatOverlay.addEventListener('click', function (event) {

    if (event.target === aiChatOverlay) {
      aiChatOverlay.classList.remove('ai-chat-open');
    }

  });

}

(function () {

    const resumeCard =
        document.getElementById("page-four-card");

    if (!resumeCard) return;

    resumeCard.addEventListener("click", function () {

        window.open(
            "likitha db.pdf",
            "_blank"
        );

    });

})();



const themeToggle = document.getElementById("themeToggle");

themeToggle.addEventListener("click", function () {

  document.body.classList.toggle("light-theme");

  if (document.body.classList.contains("light-theme")) {
    themeToggle.querySelector(".theme-icon").textContent = "☀";
    themeToggle.querySelector(".theme-text").textContent = "LIGHT";
  } else {
    themeToggle.querySelector(".theme-icon").textContent = "☾";
    themeToggle.querySelector(".theme-text").textContent = "DARK";
  }

});