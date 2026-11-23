/* TEST BUILD ONLY (DEV-4 CMP-on preview). A MOCK of Google's Privacy &
   messaging European regulations message, so Legal can read the CMP-on page
   flow without any request to Google. It is NOT Google's message: Google's
   real text, purposes and vendor list come from the AdSense account. Never
   shipped in a dino.game build (added only by scripts/package_cmp_mock_preview.py). */
(function () {
  var KEY = 'dino.mockcmp.choice';
  var gdpr = !/[?&]mockregion=row\b/.test(location.search);
  var listeners = [];
  var status = 'stub';
  var choice = null;
  try { choice = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { choice = null; }
  var PURPOSES = [
    [1, 'Store and/or access information on a device'],
    [2, 'Use limited data to select advertising'],
    [7, 'Measure advertising performance'],
    [8, 'Measure content performance'],
    [10, 'Develop and improve services']
  ];
  function tcData() {
    var c = {};
    PURPOSES.forEach(function (p) { c[p[0]] = !!(choice && choice[p[0]]); });
    return {gdprApplies: gdpr, eventStatus: status, cmpId: 0, tcString: 'MOCK', purpose: {consents: c}, listenerId: 1};
  }
  function emit() { listeners.forEach(function (cb) { try { cb(tcData(), true); } catch (e) {} }); }
  window.__tcfapi = function (cmd, v, cb) {
    if (cmd === 'addEventListener' || cmd === 'getTCData') {
      if (cmd === 'addEventListener') { listeners.push(cb); }
      setTimeout(function () { cb(tcData(), true); }, 0);
    } else if (cmd === 'ping') {
      cb({gdprApplies: gdpr, cmpLoaded: true, cmpStatus: 'loaded', displayStatus: 'hidden'});
    }
  };
  // Mirrors the recommended account setting: Consent Mode for advertising
  // purposes on, for analytics purposes off (our own banner decides analytics).
  function sendConsentMode() {
    var p1 = !!(choice && choice[1]), p7 = !!(choice && choice[7]);
    if (window.gtag) {
      window.gtag('consent', 'update', {ad_storage: p1 ? 'granted' : 'denied',
        ad_user_data: p1 && p7 ? 'granted' : 'denied', ad_personalization: 'denied'});
    }
  }
  var root = null;
  function close(newChoice) {
    choice = newChoice;
    try { localStorage.setItem(KEY, JSON.stringify(choice)); } catch (e) {}
    if (root) { root.remove(); root = null; }
    sendConsentMode();
    status = 'useractioncomplete';
    emit();
  }
  function all(v) { var c = {}; PURPOSES.forEach(function (p) { c[p[0]] = v; }); return c; }
  function show() {
    status = 'cmpuishown';
    root = document.createElement('div');
    root.id = 'mock-cmp';
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-modal', 'false');
    root.setAttribute('aria-labelledby', 'mock-cmp-title');
    root.style.cssText = 'position:fixed;left:50%;bottom:16px;transform:translateX(-50%);z-index:2147483000;' +
      'width:min(560px,calc(100vw - 24px));max-height:calc(100vh - 32px);overflow:auto;background:#fff;color:#1b1b19;' +
      'border:3px dashed #b3261e;border-radius:10px;padding:16px 18px;font:15px/1.45 system-ui,sans-serif;box-shadow:0 6px 24px rgba(0,0,0,.25)';
    var list = PURPOSES.map(function (p) {
      return '<li><label style="display:flex;gap:8px;align-items:flex-start;min-height:28px"><input type="checkbox" data-p="' + p[0] + '"> ' +
        'Purpose ' + p[0] + ': ' + p[1] + '</label></li>';
    }).join('');
    root.innerHTML =
      '<p style="margin:0 0 8px;font-weight:700;color:#b3261e">TEST BUILD: MOCK consent message. This is not Google\u2019s message.</p>' +
      '<h2 id="mock-cmp-title" style="font-size:17px;margin:0 0 6px">dino.game asks for your consent to use your personal data to:</h2>' +
      '<p style="margin:0 0 10px">Placeholder text. Google\u2019s real European regulations message (text, purposes and partners) will come from the AdSense account once it is reactivated.</p>' +
      '<div id="mock-cmp-manage" hidden><ul style="list-style:none;padding:0;margin:0 0 10px">' + list + '</ul></div>' +
      '<div style="display:flex;flex-wrap:wrap;gap:8px">' +
      '<button type="button" id="mock-consent" style="min-height:44px;padding:0 16px">Consent</button>' +
      '<button type="button" id="mock-noconsent" style="min-height:44px;padding:0 16px">Do not consent</button>' +
      '<button type="button" id="mock-manage" style="min-height:44px;padding:0 16px">Manage options</button>' +
      '<button type="button" id="mock-confirm" hidden style="min-height:44px;padding:0 16px">Confirm choices</button></div>';
    document.body.appendChild(root);
    root.querySelector('#mock-consent').onclick = function () { close(all(true)); };
    root.querySelector('#mock-noconsent').onclick = function () { close(all(false)); };
    root.querySelector('#mock-manage').onclick = function () {
      root.querySelector('#mock-cmp-manage').hidden = false;
      root.querySelector('#mock-confirm').hidden = false;
    };
    root.querySelector('#mock-confirm').onclick = function () {
      var c = {};
      root.querySelectorAll('input[data-p]').forEach(function (i) { c[i.getAttribute('data-p')] = i.checked; });
      close(c);
    };
    emit();
  }
  window.googlefc = window.googlefc || {};
  var q = window.googlefc.callbackQueue = window.googlefc.callbackQueue || [];
  window.googlefc.showRevocationMessage = function () {
    try { localStorage.removeItem(KEY); } catch (e) {}
    choice = null;
    if (!root && gdpr) { show(); }
  };
  function runQ() {
    while (q.length) {
      var f = q.shift();
      try { if (typeof f === 'function') { f(); } else if (f && f.CONSENT_API_READY) { f.CONSENT_API_READY(); } } catch (e) {}
    }
  }
  q.push = function (f) { Array.prototype.push.call(q, f); runQ(); return q.length; };
  function start() {
    runQ();
    if (!gdpr) { status = 'tcloaded'; emit(); return; }
    if (choice) { sendConsentMode(); status = 'tcloaded'; emit(); } else { show(); }
  }
  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', start); } else { start(); }
})();
