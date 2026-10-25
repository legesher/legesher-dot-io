// PostHog loader for the newsletter funnel (CORE-1948).
//
// Layout.astro renders this script only when the build ran with
// PUBLIC_POSTHOG_KEY set and passes the key on data-posthog-key; without a key
// the script returns before touching the page. Vercel Web Analytics answers
// how much traffic arrived and from where; this answers how many people
// reached the subscribe form and dropped, and joins the session to the
// subscriber once they confirm the form.
//
// The configuration keeps the privacy page true, option by option:
// `persistence: 'memory'` (zero cookies, zero client-side storage),
// `respect_dnt` (Do Not Track honoured), `disable_session_recording` (no
// session reconstruction), `autocapture: false` (no behavioural profiling).
// src/lib/analytics-loader.test.ts pins each of these to the sentence on the
// privacy page that promises it; change both or neither.
(function () {
  const script = document.currentScript;
  const key = script && script.dataset.posthogKey;
  if (!key) return;

  // Five events answer the funnel. Fifty answer nothing and cost a schema
  // nobody maintains. The ticket named the first three for a waitlist; the
  // live call to action is the newsletter form, so they are named for what
  // they measure, and a waitlist gets its own three when one exists.
  const EVENTS = {
    cta_viewed: 'newsletter_cta_viewed',
    cta_clicked: 'newsletter_cta_clicked',
    completed: 'newsletter_completed',
    corpus_link_clicked: 'corpus_link_clicked',
    docs_visited: 'docs_visited',
  };

  // Calls made before the vendor script has loaded are queued and replayed
  // from the `loaded` callback, so an event fired early is not lost.
  const queue = [];
  let client = null;
  function call(method, args) {
    if (client) client[method].apply(client, args);
    else queue.push([method, args]);
  }

  const analytics = {
    events: EVENTS,
    capture(event, properties) {
      call('capture', properties ? [event, properties] : [event]);
    },
    // The join: the anonymous session becomes the person who subscribed. The
    // email is the distinct id and the only person property, so the
    // views-to-signups ratio is computable and nothing else is stored.
    identify(email) {
      call('identify', [email, { email: email }]);
    },
  };
  window.legesherAnalytics = analytics;

  const vendor = document.createElement('script');
  vendor.src = 'https://us-assets.i.posthog.com/static/array.js';
  vendor.async = true;
  vendor.addEventListener('load', function () {
    if (!window.posthog || typeof window.posthog.init !== 'function') return;
    window.posthog.init(key, {
      api_host: 'https://us.i.posthog.com',
      persistence: 'memory',
      respect_dnt: true,
      disable_session_recording: true,
      autocapture: false,
      capture_pageview: false,
      capture_pageleave: false,
      disable_surveys: true,
      person_profiles: 'identified_only',
      loaded: function (instance) {
        client = instance;
        queue.splice(0).forEach(function (entry) {
          client[entry[0]].apply(client, entry[1]);
        });
      },
    });
  });
  document.head.appendChild(vendor);

  // The form in view, once per page: the top of the funnel.
  const form = document.getElementById('newsletter');
  if (form && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(function (entries) {
      if (!entries.some(function (entry) { return entry.isIntersecting; })) return;
      analytics.capture(EVENTS.cta_viewed);
      observer.disconnect();
    }, { threshold: 0.25 });
    observer.observe(form);
  }

  // Links opt in with data-track="<event>"; the href is the only property, so
  // the event says which door was taken and nothing about who took it.
  document.addEventListener('click', function (event) {
    const target = event.target instanceof Element ? event.target.closest('a[data-track]') : null;
    if (!target) return;
    const name = target.dataset.track;
    const known = Object.keys(EVENTS).some(function (k) { return EVENTS[k] === name; });
    if (known) analytics.capture(name, { href: target.href });
  });
})();
