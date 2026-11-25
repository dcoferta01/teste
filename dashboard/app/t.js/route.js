// Script de rastreamento que vai na página de vendas:
// <script src="https://SEU-DASHBOARD/t.js" data-versao="v1" defer></script>
// Marque as seções com data-secao="nome" e os botões de compra com data-cta (opcional:
// links para pay.hotmart.com já são reconhecidos sozinhos).
const SCRIPT = String.raw`(function () {
  try {
    var s = document.currentScript;
    if (!s) return;
    var endpoint = new URL('/api/collect', s.src).toString();
    var version = s.getAttribute('data-versao') || 'v1';
    function store(kind, k, v) { try { var st = window[kind]; if (v === undefined) return st.getItem(k); st.setItem(k, v); } catch (e) { return null; } }
    function rid() { return Math.random().toString(36).slice(2) + Date.now().toString(36); }
    var vid = store('localStorage', '_dvid') || rid(); store('localStorage', '_dvid', vid);
    var sid = store('sessionStorage', '_dsid') || rid(); store('sessionStorage', '_dsid', sid);
    var params = new URLSearchParams(location.search);
    var utm = {};
    ['utm_source', 'utm_campaign', 'utm_content'].forEach(function (k) {
      var v = params.get(k) || store('sessionStorage', '_d' + k);
      if (v) { utm[k] = v; store('sessionStorage', '_d' + k, v); }
    });
    function send(type, value) {
      var body = JSON.stringify({ v: vid, s: sid, t: type, val: value == null ? null : String(value), pv: version, p: location.pathname,
        us: utm.utm_source || null, uc: utm.utm_campaign || null, ut: utm.utm_content || null });
      try { if (navigator.sendBeacon && navigator.sendBeacon(endpoint, body)) return; } catch (e) {}
      try { fetch(endpoint, { method: 'POST', body: body, keepalive: true, mode: 'no-cors' }); } catch (e) {}
    }
    send('pageview');
    var marks = [25, 50, 75, 100], hit = {};
    function onScroll() {
      var h = document.documentElement, b = document.body;
      var total = Math.max(h.scrollHeight, b.scrollHeight) - window.innerHeight;
      var pct = total <= 0 ? 100 : ((window.scrollY || h.scrollTop) / total) * 100;
      marks.forEach(function (m) { if (pct >= m - 1 && !hit[m]) { hit[m] = 1; send('scroll', m); } });
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    setTimeout(onScroll, 1500);
    var secs = document.querySelectorAll('[data-secao]');
    if ('IntersectionObserver' in window && secs.length) {
      var seen = {};
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (!e.isIntersecting) return;
          var i = Array.prototype.indexOf.call(secs, e.target);
          var name = e.target.getAttribute('data-secao');
          if (seen[name]) return; seen[name] = 1;
          send('secao', (i < 9 ? '0' : '') + (i + 1) + '|' + name);
        });
      }, { threshold: 0.4 });
      secs.forEach(function (el) { io.observe(el); });
    }
    function isCheckout(a) { return a && a.href && /pay\.hotmart\.com|hotmart\.com\/.*checkout/i.test(a.href); }
    function tagLinks() {
      document.querySelectorAll('a[href]').forEach(function (a) {
        if (!isCheckout(a) || a.getAttribute('data-dtag')) return;
        try { var u = new URL(a.href); u.searchParams.set('sck', vid); u.searchParams.set('src', version); a.href = u.toString(); a.setAttribute('data-dtag', '1'); } catch (e) {}
      });
    }
    tagLinks(); setTimeout(tagLinks, 2000);
    document.addEventListener('click', function (ev) {
      var el = ev.target.closest ? ev.target.closest('[data-cta], a[href]') : null;
      if (!el) return;
      if (el.hasAttribute('data-cta') || isCheckout(el)) send('cta_click', (el.getAttribute('data-cta') || el.textContent || '').trim().slice(0, 60));
    }, true);
    var start = Date.now();
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'hidden') send('tempo', Math.round((Date.now() - start) / 1000));
    });
  } catch (e) {}
})();`;

export function GET() {
  return new Response(SCRIPT, {
    headers: {
      'content-type': 'application/javascript; charset=utf-8',
      'cache-control': 'public, max-age=300',
      'access-control-allow-origin': '*',
    },
  });
}
