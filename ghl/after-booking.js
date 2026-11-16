/* Sends the visitor to a thank-you page when the GHL calendar on this page reports a finished booking.
   Usage: <script src=".../ghl/after-booking.js" data-to="/call-booked"></script>
   The calendar widget posts ["msgsndr-booking-complete", {...}] to its parent page. */
(function () {
  var s = document.currentScript, to = (s && s.getAttribute('data-to')) || '/call-booked';
  addEventListener('message', function (e) {
    var d = e.data;
    if (Array.isArray(d) && d[0] === 'msgsndr-booking-complete') setTimeout(function () { location.href = to; }, 600);
  });
})();
