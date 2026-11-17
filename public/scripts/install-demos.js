// The install page's demo recordings (src/components/InstallDemo.astro).
//
// Each recording is silent and loops. It plays only while it is on screen, and
// never by itself for a visitor who asks for reduced motion: they see the
// still and can press Play. The Pause / Play button replaces the browser's own
// controls, which cover the bottom of the recording; a recording someone
// paused stays paused.
(function () {
  var videos = document.querySelectorAll('video[data-install-demo]');
  if (!videos.length) return;
  var still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var stopped = new WeakSet();

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

  if (still || !('IntersectionObserver' in window)) return;
  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        var video = entry.target;
        if (!entry.isIntersecting) video.pause();
        else if (!stopped.has(video)) play(video);
      });
    },
    { threshold: 0.5 },
  );
  videos.forEach(function (video) {
    observer.observe(video);
  });
})();
