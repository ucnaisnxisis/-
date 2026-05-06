// ==UserScript==
// @name         New Userscript
// @namespace    http://tampermonkey.net/
// @version      2026-05-06
// @description  try to take over the world!
// @author       You
// @match        https://*/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const rejectTexts = [
        'respinge toate', 'respinge tot', 'respinge', 'respinge tot', 'respinge cookie‑urile',
        'refuză toate', 'refuză', 'refuză cookie‑urile',
        'reject all', 'reject', 'decline', 'decline all', 'deny', 'decline cookies'
    ].map(s => s.toLowerCase());

    function normalize(s) {
        return (s || '').toLowerCase().replace(/\s+/g, ' ').trim();
    }

    function elementTextCandidates(el) {
        // texte vizibile sau atribute utile
        return [
            el.innerText,
            el.textContent,
            el.getAttribute && el.getAttribute('aria-label'),
            el.getAttribute && el.getAttribute('title'),
            el.getAttribute && el.getAttribute('value')
        ].filter(Boolean).map(normalize);
    }

    function looksLikeRejectButton(el) {
        try {
            const tag = el.tagName.toLowerCase();
            if (tag === 'button' || tag === 'a' || el.getAttribute && ['button','link'].includes(el.getAttribute('role'))) {
                const texts = elementTextCandidates(el);
                for (const t of texts) {
                    if (!t) continue;
                    for (const r of rejectTexts) {
                        if (t === r || t.includes(r) || r.includes(t)) return true;
                    }
                }
            }
            // input buttons
            if (tag === 'input') {
                const type = (el.getAttribute('type') || '').toLowerCase();
                if (['button','submit'].includes(type)) {
                    const texts = elementTextCandidates(el);
                    for (const t of texts) {
                        if (!t) continue;
                        for (const r of rejectTexts) {
                            if (t === r || t.includes(r) || r.includes(t)) return true;
                        }
                    }
                }
            }
        } catch (e) {}
        return false;
    }

    function clickElement(el) {
        if (!el) return false;
        try {
            el.focus && el.focus();
            // prefer simulated user events
            const ev = new MouseEvent('click', { view: window, bubbles: true, cancelable: true });
            el.dispatchEvent(ev);
            // fallback
            if (typeof el.click === 'function') el.click();
            return true;
        } catch (e) {
            try { el.click && el.click(); return true; } catch (e2) {}
        }
        return false;
    }

    function tryRejectOnce() {
        // Prioritize visible buttons
        const all = Array.from(document.querySelectorAll('button, a, input, [role="button"], [role="link"]'));
        // sort by visible area (rough) to prefer visible ones
        const visible = all.filter(el => {
            const rect = el.getBoundingClientRect && el.getBoundingClientRect();
            return rect && rect.width > 0 && rect.height > 0;
        });
        const candidates = visible.concat(all.filter(x => !visible.includes(x)));

        for (const el of candidates) {
            if (looksLikeRejectButton(el)) {
                if (clickElement(el)) return el;
            }
        }
        return null;
    }

    let attempts = 0;
    const maxAttempts = 10;
    const intervalMs = 1000;

    function tryLoop() {
        const found = tryRejectOnce();
        attempts++;
        if (found) {
            console.info('Reject-all button clicked by userscript', found);
            return;
        }
        if (attempts < maxAttempts) {
            setTimeout(tryLoop, intervalMs);
        }
    }

    // Run after initial load and on DOM changes (for dynamically injected banners)
    tryLoop();

    const observer = new MutationObserver(() => {
        // if not already successful, keep trying
        if (attempts < maxAttempts) tryLoop();
    });
    observer.observe(document.documentElement || document.body, { childList: true, subtree: true, attributes: false });

})();