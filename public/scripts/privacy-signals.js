// Do Not Track and Global Privacy Control for Vercel's analytics.
//
// The Cookie Policy says that when your browser sends either signal, our
// analytics send nothing. The PostHog loader (analytics.js) keeps that for
// PostHog. Vercel Web Analytics and Speed Insights check neither signal, so
// this script gives each of them a beforeSend that drops every event while a
// signal is present. Their Astro components read window.webAnalyticsBeforeSend
// and window.speedInsightsBeforeSend when they start, so Layout.astro renders
// this script before both. src/lib/privacy-signals.test.ts runs this file
// against each signal and checks the order in the layout.
(function () {
  var nav = window.navigator || {};
  var optedOut =
    nav.globalPrivacyControl === true ||
    nav.doNotTrack === '1' ||
    nav.doNotTrack === 'yes' ||
    nav.msDoNotTrack === '1' ||
    window.doNotTrack === '1';

  function beforeSend(event) {
    return optedOut ? null : event;
  }

  window.webAnalyticsBeforeSend = beforeSend;
  window.speedInsightsBeforeSend = beforeSend;
})();
