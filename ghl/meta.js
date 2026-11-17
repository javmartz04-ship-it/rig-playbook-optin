/* Meta pixel for Johnny's funnels (Book A Call VSL + Playbook Lead Magnet). Hand-written, not generated.
   Load once per page:
     <script async src="https://javmartz04-ship-it.github.io/rig-playbook-optin/ghl/meta.js" data-funnel="call|playbook"></script>

   Dataset "Insurance Agent Webinar Pixel" 2168290846910321 sits under Meta's CORE SETUP (insurance category):
   Meta drops custom parameters, URL paths AND custom events (verified in Test Events 2026-11-16: trackCustom
   never arrived). Only standard events plus value/currency get through. So the funnel and the qualification are
   encoded in the standard event type and a small VALUE CODE, and the custom conversions are rules on those.

   Events (browser), value in USD as a code, not money:
     every page ............ PageView
     CALL survey submit .... SubmitApplication, value = revenue tier 1-5
                             (1 Under $100K, 2 $100K-$250K, 3 $250K-$500K, 4 $500K-$1M, 5 Over $1M; qualified = value >= 3)
     CALL booking done ..... Schedule, value = 10 + tier (11-15; qualified booked = value >= 13)
     PLAYBOOK opt-in ....... Lead, value = 1   (old webinar Leads carry no value)
     PLAYBOOK booking done . Schedule, value = 1
   Lead / booking events fire only from a real submit or the calendar's booking-complete message, never on page load.
   Every event carries an eventID; the same id goes to the GHL webhook (event_id, fbp, fbc) for CAPI dedup.
   The webhook payload also carries the ad attribution (utm_*, utm_id, fb_adset_id, fb_ad_id, fb_placement, fb_site,
   fbclid, landing_page; first_* = first touch), captured on the landing page and kept 90 days. */
(function () {
  if (window.rigMeta) return;
  var PIXEL = '2168290846910321';
  var TIERS = ['Under $100K', '$100K To $250K', '$250K To $500K', '$500K To $1M', 'Over $1M'];   // survey options, in order
  var me = document.currentScript;
  var FUNNEL = (me && me.getAttribute('data-funnel')) || window.RIG_FUNNEL || 'call';
  var AM_KEY = 'rig_meta_am', TIER_KEY = 'rig_meta_tier', CONTACT_KEY = 'rig_contact', DAY = 864e5;

  function store(k, v) { try { localStorage.setItem(k, JSON.stringify({ v: v, t: Date.now() })); } catch (e) {} }
  function read(k, maxAge) {
    try { var o = JSON.parse(localStorage.getItem(k) || 'null'); return o && Date.now() - o.t < maxAge ? o.v : null; } catch (e) { return null; }
  }

  /* Base pixel (standard Meta snippet). */
  !function (f, b, e, v, n, t, s) {
    if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
    if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = [];
    t = b.createElement(e); t.async = !0; t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
  }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');

  // Advanced matching from an earlier step (hashed, 30 days), so booking events match the person too.
  fbq('init', PIXEL, read(AM_KEY, 30 * DAY) || {});
  fbq('track', 'PageView');

  function eid() { return 'ev_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 10); }
  function cookie(n) { var m = document.cookie.match('(?:^|; )' + n + '=([^;]*)'); return m ? decodeURIComponent(m[1]) : ''; }
  function fbc() {
    var c = cookie('_fbc'); if (c) return c;
    var id = new URLSearchParams(location.search).get('fbclid');
    return id ? 'fb.1.' + Date.now() + '.' + id : '';
  }

  /* Attribution. The ad's URL parameters are only on the landing page; the form can be several pages later.
     Saved on landing (90 days): LAST touch overwrites every time a tagged URL is opened, FIRST touch is kept once.
     Both go to GHL with the lead (lead() below). */
  var ATTR_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'utm_id',
                   'fb_adset_id', 'fb_ad_id', 'fb_placement', 'fb_site', 'fbclid'];
  var LAST_KEY = 'rig_attr_last', FIRST_KEY = 'rig_attr_first';
  (function captureAttribution() {
    var q = new URLSearchParams(location.search), a = {}, any = false;
    ATTR_KEYS.forEach(function (k) { var v = q.get(k); if (v) { a[k] = v.slice(0, 200); any = true; } });
    if (!any) return;
    a.landing_page = location.origin + location.pathname;
    a.landed_at = new Date().toISOString();
    store(LAST_KEY, a);
    if (!read(FIRST_KEY, 90 * DAY)) store(FIRST_KEY, a);
  })();
  function attribution() {
    var last = read(LAST_KEY, 90 * DAY) || {}, first = read(FIRST_KEY, 90 * DAY) || {}, out = {};
    ATTR_KEYS.concat(['landing_page', 'landed_at']).forEach(function (k) {
      out[k] = last[k] || '';
      out['first_' + k] = first[k] || '';
    });
    out.form_page = location.origin + location.pathname;
    return out;
  }

  // SHA-256 hex, so nothing raw sits in localStorage. Meta accepts pre-hashed values.
  function sha(s) {
    if (!s || !window.crypto || !crypto.subtle) return Promise.resolve('');
    return crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)).then(function (b) {
      return Array.prototype.map.call(new Uint8Array(b), function (x) { return ('0' + x.toString(16)).slice(-2); }).join('');
    }).catch(function () { return ''; });
  }
  function matchKeys(p) {
    var ph = String(p.phone || '').replace(/\D/g, ''); if (ph.length === 10) ph = '1' + ph;
    var raw = {
      em: String(p.email || '').trim().toLowerCase(),
      ph: ph,
      fn: String(p.first_name || '').trim().toLowerCase(),
      ln: String(p.last_name || '').trim().toLowerCase(),
      country: 'us'
    };
    var keys = Object.keys(raw);
    return Promise.all(keys.map(function (k) { return sha(raw[k]); })).then(function (h) {
      var am = {}; keys.forEach(function (k, i) { if (h[i]) am[k] = h[i]; }); return am;
    });
  }

  /* Call on a real form submit, BEFORE the webhook POST. Returns ids to send with the webhook payload.
     p = { email, phone, first_name, last_name, annual_revenue } */
  function lead(p) {
    p = p || {};
    var id = eid();
    var tier = TIERS.indexOf(p.annual_revenue) + 1;            // 0 = not answered
    var out = attribution();
    out.event_id = id; out.fbp = cookie('_fbp'); out.fbc = fbc();
    out.meta_tier = tier; out.meta_qualified = tier >= 3 ? 'yes' : 'no';
    // Sticky contact: the booking calendar pre-fills from this (see prefill()), so nobody types it twice.
    // Kept on the visitor's own device only, 7 days.
    var full = String(p.full_name || '').trim().split(/\s+/);
    store(CONTACT_KEY, {
      first_name: String(p.first_name || full[0] || '').trim(),
      last_name: String(p.last_name || full.slice(1).join(' ') || '').trim(),
      email: String(p.email || '').trim(),
      phone: String(p.phone || '').replace(/\D/g, '').slice(-10)
    });
    function fire(am) {
      if (am && am.em) { store(AM_KEY, am); fbq('init', PIXEL, am); }
      if (FUNNEL === 'call') {
        store(TIER_KEY, tier);
        fbq('track', 'SubmitApplication', { value: tier || 1, currency: 'USD' }, { eventID: id });
      } else {
        fbq('track', 'Lead', { value: 1, currency: 'USD' }, { eventID: id });
      }
    }
    // Hashing is fast; never let it hold the event back more than 400 ms.
    var done = false;
    matchKeys(p).then(function (am) { if (!done) { done = true; fire(am); } });
    setTimeout(function () { if (!done) { done = true; fire(null); } }, 400);
    return out;
  }

  /* Booking finished in the GHL calendar on this page. Fires once per page view. */
  var bookedOnce = false;
  function booked() {
    if (bookedOnce) return; bookedOnce = true;
    var id = eid(), v = FUNNEL === 'call' ? 10 + (read(TIER_KEY, 30 * DAY) || 0) : 1;
    fbq('track', 'Schedule', { value: v, currency: 'USD' }, { eventID: id });
  }
  addEventListener('message', function (e) {
    var d = e.data, name = Array.isArray(d) ? d[0] : (d && (d.type || d.event || d));
    if (typeof name === 'string' && /booking-complete|appointment-booked/i.test(name)) booked();
  });

  window.rigMeta = { lead: lead, booked: booked, funnel: FUNNEL, pixel: PIXEL };
})();
