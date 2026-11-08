// ==UserScript==
// @name         YouTube Kids Bypass banner - PC
// @namespace    http://tampermonkey.net/
// @version      0.2
// @description  Apasă automat linkul/butonul din dialogul YouTube Kids pe desktop
// @match        https://www.youtube.com/*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  const DEBUG = true;
  const DRY_RUN = false; // true = doar afișează în consolă, fără click

  const DIALOG_SELECTOR =
    'tp-yt-paper-dialog.ytd-popup-container.style-scope';

  const log = (...args) => {
    if (DEBUG) console.log('[YouTube Kids Bypass]', ...args);
  };

  function isDesktop() {
    // Nu rulează pe versiunea mobilă și nu rulează pe ecrane mici
    const isMobileHost = location.hostname === 'm.youtube.com';
    const isMobileUA = /Android|iPhone|iPad|iPod|Mobile/i.test(
      navigator.userAgent
    );

    return (
      !isMobileHost &&
      !isMobileUA &&
      window.matchMedia('(min-width: 768px)').matches
    );
  }

  function isVisible(element) {
    if (!element) return false;

    const style = window.getComputedStyle(element);
    const rect = element.getBoundingClientRect();

    return (
      style.display !== 'none' &&
      style.visibility !== 'hidden' &&
      style.opacity !== '0' &&
      rect.width > 0 &&
      rect.height > 0
    );
  }

  function getClickableElement(dialog) {
    const selectors = [
      'a[href]',
      'button',
      '[role="button"]',
      'tp-yt-paper-button',
      'yt-button-renderer',
      'input[type="button"]',
      'input[type="submit"]'
    ];

    const candidates = Array.from(
      dialog.querySelectorAll(selectors.join(','))
    ).filter(isVisible);

    if (candidates.length > 0) {
      return candidates[0];
    }

    // Uneori dialogul însuși poate fi elementul clicabil
    if (
      isVisible(dialog) &&
      (
        dialog.hasAttribute('href') ||
        dialog.getAttribute('role') === 'button' ||
        typeof dialog.click === 'function'
      )
    ) {
      return dialog;
    }

    return null;
  }

  function clickElement(element) {
    if (!element || !isVisible(element)) return false;

    log('Element găsit:', element);

    if (DRY_RUN) {
      log('DRY_RUN activ — nu se execută click-ul.');
      return true;
    }

    try {
      element.scrollIntoView({
        block: 'center',
        inline: 'center',
        behavior: 'auto'
      });
    } catch (_) {}

    try {
      element.focus();
    } catch (_) {}

    try {
      element.click();
      log('Click executat.');
      return true;
    } catch (error) {
      log('Eroare la click:', error);
      return false;
    }
  }

  function checkDialog() {
    if (!isDesktop()) return;

    const dialogs = document.querySelectorAll(DIALOG_SELECTOR);

    for (const dialog of dialogs) {
      if (!isVisible(dialog)) continue;

      const clickable = getClickableElement(dialog);

      if (clickable && clickElement(clickable)) {
        // Oprim verificările pentru scurt timp după un click
        setTimeout(checkDialog, 1500);
        return;
      }
    }
  }

  let timeoutId = null;

  const observer = new MutationObserver(() => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(checkDialog, 150);
  });

  function start() {
    if (!isDesktop()) {
      log('Versiunea mobilă sau ecran sub 768px — script dezactivat.');
      return;
    }

    checkDialog();

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class', 'hidden']
    });

    log('Script activ pe desktop.');
  }

  start();

  // Verifică și la redimensionarea ferestrei
  window.addEventListener('resize', checkDialog);
})();
