// ==UserScript==
// @name         Red Mode automat — 5 moduri
// @homepage     https://raw.githubusercontent.com/ucnaisnxisis/-/refs/heads/main/red
// @namespace    local.redmode
// @version      5.1.0
// @description  Alege automat tema roșie în funcție de site.
// @match        *://*/*
// @run-at       document-start
// @grant        none
// @require      https://cdn.jsdelivr.net/npm/darkreader@4.9.96/darkreader.min.js
// ==/UserScript==

(() => {
    'use strict';

    const RED = '#8b0000';
    const MODE_4_BACKGROUND = '#3b1010';
    const MODE_5_BACKGROUND = '#3b1010';
    const MARK = 'data-tm-red-bg';
    const MODE_4_MARK = 'data-tm-red-mode-4-bg';

     const host = location.hostname.toLowerCase();

    function normalizeHost(value) {
        return value.toLowerCase().replace(/^www\./, '');
    }

    function matchesHost(domains) {
        const currentHost = normalizeHost(host);

        return domains.some(domain => {
            const normalizedDomain = normalizeHost(domain);

            return currentHost === normalizedDomain ||
                currentHost.endsWith('.' + normalizedDomain);
        });
    }

    const isMode5 = matchesHost([
        'archive.org',
        'www.archive.org',

    ]);

    const MODE_2_HOSTS = [
        'www.xnxx.com',
        'porngameshub.com',
        'itch.io',
        'www.xvideos.com',
        'hanime.tv',
        'hentaihaven.xxx',
        'henvids.com',
        'hentaiocean.com',
        'e-hentai.org',
        'hanime.red',
        'www.fakku.net',
        'hstream.moe',
        'hentai2read.com',
        'hentai.guru',
        'www.hentai-foundry.com',
        'myanimelist.net',
        'haho.moe',
        'hentai.io',
        'www.porn.com',
        'www.porndig.com',
        'hentaihorizon.com',
        'www.tiava.com',
        'www.accuweather.com',
        'www.meteoblue.com',
        'meteofor.ro',
        'ziare.com',
        'www.biziday.ro',
        'newsweek.ro',
        'www.ziuanews.ro',
        'www.capital.ro',
        'www.e-politic.ro',
        'video.mediafax.ro',
        'www.xda-developers.com',
        'orchard.tomathouse.com',
        'www.emag.ro',
        'www.marcoser.ro',
        'www.libertatea.ro',
        'ipinfo.io',
        '2ip.io',
        'ipmeu.ro',
        'checkip.me',
        'ipaddress.to',
        'whatsmyip.net',
        'myip-address.com',
        'whatismyip.live',
        'www.virustotal.com',
        'github.com',
        'proton.me',
        'proton.com',
        'www.pewresearch.org',
        'breezevpn.com',
        'www.bangkokpost.com',
        'ublockdns.com',
        'pornone.com',
        'www.best-hentai-games.com',
        'www.comdotgame.com',
        'basilica.ro',

    ];

    const MODE_3_HOSTS = [
        'www.libertatea.ro',
        'www.allergyzen.ro',
        'www.polti.ro',
        'www.patulmeu.ro',
        'www.agrinin.ro',
        'www.plaiurimioritice.ro',
        'www.academia.edu',
        'www.cel.ro',
        'adblocktester.pages.dev',

    ];

    const MODE_4_HOSTS = [
        'stiripesurse.ro',
        'www.stiripesurse.ro',
        'superadblocktest.com',
        'getblocktest.com',

    ];

    const THEME = {
        mode: 1,
        brightness: 100,
        contrast: 80,
        sepia: 0,
        darkSchemeBackgroundColor: RED,
        darkSchemeTextColor: '#ffffff',
        lightSchemeBackgroundColor: RED,
        lightSchemeTextColor: '#ff6b6b'
    };

    const MODE_2_CSS = `
        :root {
            color-scheme: dark !important;
            background: ${RED} !important;
            color: #f5e6e6 !important;
        }

        html, body {
            background: ${RED} !important;
            background-color: ${RED} !important;
            color: #f5e6e6 !important;
        }

        body * {
            border-color: #704343 !important;
        }

        body :not(img):not(video):not(canvas):not(iframe):not(svg):not(path) {
            color: #f5e6e6 !important;
            background-color: transparent !important;
        }

        body, main, article, section, header, footer, nav, aside,
        [role="main"], [role="dialog"], .container, .content, .card,
        .panel, .modal, .dropdown-menu, .popover {
            background-color: #3b1010 !important;
        }

        input, textarea, select, button {
            background: #4d1919 !important;
            color: #faf0f0 !important;
            border: 1px solid #875757 !important;
        }

        input::placeholder, textarea::placeholder {
            color: #d0b3b3 !important;
        }

        a, a * {
            color: #ff9a9a !important;
        }

        img, video, canvas, iframe, svg, picture {
            background-color: transparent !important;
        }

        table, th, td, hr {
            border-color: #704343 !important;
        }

        ::selection {
            background: #8a3030 !important;
            color: #fff !important;
        }
    `;

    const MODE_4_CSS = `
        :root,
        html {
            color-scheme: dark !important;
            background-color: ${RED} !important;
        }

        body,
        main,
        article,
        section,
        header,
        footer,
        nav,
        aside,
        [role="main"] {
            background-color: ${MODE_4_BACKGROUND} !important;
        }

        body {
            color: #ffffff !important;
        }

        body *:not(img):not(video):not(canvas):not(iframe):not(svg):not(path) {
            color: #ffffff !important;
            -webkit-text-fill-color: #ffffff !important;
            border-color: #704343 !important;
        }

        img,
        video,
        canvas,
        iframe,
        picture,
        svg {
            background-color: transparent !important;
        }

        input,
        textarea,
        select,
        button {
            background-color: #4d1919 !important;
            color: #ffffff !important;
            -webkit-text-fill-color: #ffffff !important;
            border-color: #875757 !important;
        }

        input::placeholder,
        textarea::placeholder {
            color: #d0b3b3 !important;
            -webkit-text-fill-color: #d0b3b3 !important;
            opacity: 1 !important;
        }

        a,
        a * {
            color: #ff9a9a !important;
            -webkit-text-fill-color: #ff9a9a !important;
        }

        ::selection {
            background: #8a3030 !important;
            color: #ffffff !important;
        }
    `;

    const MODE_5_CSS = `
        :host {
            color-scheme: dark !important;
            background-color: ${MODE_5_BACKGROUND} !important;
            color: #f5e6e6 !important;
        }

        :host(*) {
            color: #f5e6e6 !important;
            border-color: #704343 !important;
        }

        :host,
        :host(*) {
            background-color: ${MODE_5_BACKGROUND} !important;
        }

        *:not(img):not(video):not(canvas):not(iframe):not(svg):not(path):not(picture) {
            background-color: ${MODE_5_BACKGROUND} !important;
            color: #f5e6e6 !important;
            border-color: #704343 !important;
        }

        a,
        a * {
            color: #ff9a9a !important;
        }

        input,
        textarea,
        select,
        button {
            background-color: #4d1919 !important;
            color: #faf0f0 !important;
            border-color: #875757 !important;
        }

        input::placeholder,
        textarea::placeholder {
            color: #d0b3b3 !important;
            opacity: 1 !important;
        }

        img,
        video,
        canvas,
        iframe,
        svg,
        picture {
            background-color: transparent !important;
        }

        ::selection {
            background: #8a3030 !important;
            color: #ffffff !important;
        }
    `;

    function isLightBackground(color) {
        const values = color.match(/[\\d.]+/g);
        if (!values || values.length < 3) return false;

        const [r, g, b] = values.slice(0, 3).map(Number);
        const alpha = values.length >= 4 ? Number(values[3]) : 1;

        if (alpha < 0.15) return false;

        return (0.2126 * r + 0.7152 * g + 0.0722 * b) > 155;
    }

    function isMediaOrInsideMedia(el) {
        return el.matches(
            'img, video, canvas, picture, svg, iframe, object, embed'
        ) || Boolean(el.closest(
            'img, video, canvas, picture, svg, iframe, object, embed'
        ));
    }

    function colorLightBackground(el) {
        if (!(el instanceof Element) || el.hasAttribute(MARK)) return;
        if (isMediaOrInsideMedia(el)) return;

        if (isLightBackground(getComputedStyle(el).backgroundColor)) {
            el.setAttribute(MARK, '1');
            el.style.setProperty('background-color', RED, 'important');
        }
    }

    function scan(root) {
        if (root instanceof Element) colorLightBackground(root);
        root.querySelectorAll?.('*').forEach(colorLightBackground);
    }

    function colorMode4LightBackground(el) {
        if (!(el instanceof Element) || el.hasAttribute(MODE_4_MARK)) return;
        if (isMediaOrInsideMedia(el)) return;

        if (isLightBackground(getComputedStyle(el).backgroundColor)) {
            el.setAttribute(MODE_4_MARK, '1');
            el.style.setProperty(
                'background-color',
                MODE_4_BACKGROUND,
                'important'
            );
        }
    }

    function scanMode4(root) {
        if (root instanceof Element) colorMode4LightBackground(root);
        root.querySelectorAll?.('*').forEach(colorMode4LightBackground);
    }

    function installPersistentStyle(id, css) {
        function addStyle() {
            if (document.getElementById(id)) return;

            const style = document.createElement('style');
            style.id = id;
            style.textContent = css;

            (document.head || document.documentElement).appendChild(style);
        }

        addStyle();

        const observer = new MutationObserver(addStyle);
        observer.observe(document.documentElement, {
            childList: true,
            subtree: true
        });
    }

    function startMode4() {
        installPersistentStyle(
            'tm-red-mode-4-stiripesurse',
            MODE_4_CSS
        );

        scanMode4(document.documentElement);

        const observer = new MutationObserver(records => {
            for (const record of records) {
                if (record.type === 'childList') {
                    for (const node of record.addedNodes) {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            scanMode4(node);
                        }
                    }
                } else if (
                    record.type === 'attributes' &&
                    record.target instanceof Element
                ) {
                    colorMode4LightBackground(record.target);
                }
            }
        });

        observer.observe(document.documentElement, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['class', 'style']
        });
    }

    function installMode5Style(root, id) {
        if (!root || root.querySelector(`#${id}`)) return;

        const style = document.createElement('style');
        style.id = id;
        style.textContent = MODE_5_CSS;

        if (root instanceof Document) {
            (root.head || root.documentElement)?.appendChild(style);
        } else {
            root.appendChild(style);
        }
    }

    function installMode5InShadowRoot(root) {
        if (isMode5 && root) {
            installMode5Style(root, 'tm-red-mode-5-archive-shadow');
        }
    }

    function scanMode5ShadowRoots(root) {
        if (!isMode5 || !root) return;

        if (root instanceof Element && root.shadowRoot) {
            installMode5InShadowRoot(root.shadowRoot);
            scanMode5ShadowRoots(root.shadowRoot);
        }

        if (root instanceof ShadowRoot) {
            installMode5InShadowRoot(root);
        }

        root.querySelectorAll?.('*').forEach(element => {
            if (element.shadowRoot) {
                installMode5InShadowRoot(element.shadowRoot);
                scanMode5ShadowRoots(element.shadowRoot);
            }
        });
    }

    function startMode5() {
        installMode5Style(
            document,
            'tm-red-mode-5-archive-document'
        );

        scanMode5ShadowRoots(document);

        const observer = new MutationObserver(records => {
            for (const record of records) {
                for (const node of record.addedNodes) {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        scanMode5ShadowRoots(node);
                    }
                }
            }
        });

        function observeDocument() {
            if (document.documentElement) {
                observer.observe(document.documentElement, {
                    childList: true,
                    subtree: true
                });
            }
        }

        if (document.documentElement) {
            observeDocument();
        } else {
            document.addEventListener('DOMContentLoaded', () => {
                installMode5Style(
                    document,
                    'tm-red-mode-5-archive-document'
                );
                scanMode5ShadowRoots(document);
                observeDocument();
            }, { once: true });
        }
    }

    // Aplică stilul imediat în Shadow Root-urile deschise create ulterior.
    if (isMode5 && Element.prototype.attachShadow) {
        const originalAttachShadow = Element.prototype.attachShadow;

        Element.prototype.attachShadow = function(init) {
            const shadowRoot = originalAttachShadow.call(this, init);

            if (init && init.mode === 'open') {
                installMode5InShadowRoot(shadowRoot);
            }

            return shadowRoot;
        };
    }

    function applyMode() {
        const useMode5 = isMode5;
        const useMode4 = !useMode5 && matchesHost(MODE_4_HOSTS);
        const useMode2 = !useMode5 && !useMode4 &&
            matchesHost(MODE_2_HOSTS);
        const useMode3 = !useMode5 && !useMode4 && !useMode2 &&
            matchesHost(MODE_3_HOSTS);

        if (useMode5) {
            startMode5();
            return;
        }

        if (useMode4) {
            startMode4();
            return;
        }

        if (useMode2) {
            const style = document.createElement('style');
            style.id = 'tm-aggressive-red-mode';
            style.textContent = MODE_2_CSS;

            (document.head || document.documentElement).appendChild(style);

            const observer = new MutationObserver(() => {
                if (!document.getElementById('tm-aggressive-red-mode')) {
                    (document.head || document.documentElement)
                        .appendChild(style);
                }
            });

            observer.observe(document.documentElement, {
                childList: true,
                subtree: true
            });

            return;
        }

        if (useMode3) {
            scan(document.documentElement);

            const observer = new MutationObserver(records => {
                for (const record of records) {
                    for (const node of record.addedNodes) {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            scan(node);
                        }
                    }
                }
            });

            observer.observe(document.documentElement, {
                childList: true,
                subtree: true
            });

            return;
        }

        // Modul 1: DarkReader pentru site-urile care nu sunt în listele speciale.
        DarkReader.enable(THEME);
    }

    if (document.documentElement) {
        applyMode();
    } else {
        document.addEventListener('DOMContentLoaded', applyMode, {
            once: true
        });
    }
})();
