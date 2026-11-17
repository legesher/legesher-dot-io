// The install page's demo recordings (src/components/InstallDemo.astro).
//
// Each recording is silent and loops. It plays only while it is on screen and
// pauses when it leaves, whoever started it. It never starts by itself for a
// visitor who asks for reduced motion: they see the still and can press Play.
// The Pause / Play button replaces the browser's own controls, which cover the
// bottom of the recording; a recording someone paused stays paused.
(function () {
  var videos = document.querySelectorAll('video[data-install-demo]');
  if (!videos.length) return;
  var reduce = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  var stopped = new WeakSet();

  // Read at the moment it matters, so a setting changed after load is honoured.
  function still() {
    return !!(reduce && reduce.matches);
  }

  function play(video) {
    var playing = video.play();
    if (playing && playing.catch) playing.catch(function () {});
  }

  videos.forEach(function (video) {
    var button = video.parentElement.querySelector('[data-install-demo-toggle]');
    if (!button) return;
    video.removeAttribute('controls');
    button.hidden = false;
    function show() {
      button.querySelector('[data-when="playing"]').hidden = video.paused;
      button.querySelector('[data-when="paused"]').hidden = !video.paused;
    }
    video.addEventListener('play', show);
    video.addEventListener('pause', show);
    button.addEventListener('click', function () {
      if (video.paused) {
        stopped.delete(video);
        play(video);
      } else {
        stopped.add(video);
        video.pause();
      }
    });
    show();
  });

  if (reduce) {
    var onChange = function () {
      if (still()) videos.forEach(function (video) { video.pause(); });
    };
    if (reduce.addEventListener) reduce.addEventListener('change', onChange);
    else if (reduce.addListener) reduce.addListener(onChange);
  }

  if (!('IntersectionObserver' in window)) return;
  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        var video = entry.target;
        if (!entry.isIntersecting) video.pause();
        else if (!still() && !stopped.has(video)) play(video);
      });
    },
    { threshold: 0.5 },
  );
  videos.forEach(function (video) {
    observer.observe(video);
  });
})();
