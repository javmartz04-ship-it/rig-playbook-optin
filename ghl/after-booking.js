/* Sends the visitor to a thank-you page when the GHL calendar on this page reports a finished booking.
   Usage: <script src=".../ghl/after-booking.js" data-to="/call-booked" data-funnel="call"></script>
   The calendar widget posts ["msgsndr-booking-complete", {...}] to its parent page. */
(function () {
  var s = document.currentScript, to = (s && s.getAttribute('data-to')) || '/call-booked';
  // Meta pixel for this calendar page (PageView, then Schedule + CallBooked on a finished booking).
  if (!window.rigMeta && !document.querySelector('script[src*="/ghl/meta.js"]')) {
    var m = document.createElement('script'); m.async = true; m.src = 'https://javmartz04-ship-it.github.io/rig-playbook-optin/ghl/meta.js';
    m.setAttribute('data-funnel', (s && s.getAttribute('data-funnel')) || 'call'); document.head.appendChild(m);
  }
  // This script sits in its own GHL section; collapse that empty section so it adds no blank band.
  try { var box = s && (s.closest('.c-section') || s.closest('section')); if (box && !box.querySelector('iframe,img,h1,h2,p')) box.style.display = 'none'; } catch (e) {}
  addEventListener('message', function (e) {
    var d = e.data;
    if (Array.isArray(d) && d[0] === 'msgsndr-booking-complete') setTimeout(function () { location.href = to; }, 600);
  });
})();
