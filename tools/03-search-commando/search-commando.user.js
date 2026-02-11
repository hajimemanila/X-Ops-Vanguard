// ==UserScript==
// @name         Search Commando (v0.8 Control UI)
// @namespace    http://tampermonkey.net/
// @version      0.8
// @description  Toggle ON/OFF with ESC, added top-right switch, click indicator for help. Fully ported Walker's operational feel.
// @author       X Ops Architect
// @match        https://www.google.com/search*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    // =================================================================
    // ⚙️ Config & State
    // =================================================================
    const CONFIG = {
        scrollOffset: -150,
        colors: {
            focusBorder: '#00D0FF', // Cyan
            focusBg: 'rgba(0, 208, 255, 0.05)',
            focusText: '#00ba7c',
            blockedText: '#777',
            blockedBg: '#222',
            star: '#ffd400',
            starBg: 'rgba(255, 212, 0, 0.1)',
            uiBg: 'rgba(0,0,0,0.9)',
            uiBorder: '#00D0FF',
            off: '#555',
            on: '#00ba7c'
        },
        keys: {
            block: 'search_commando_blocked_domains',
            star: 'search_commando_starred_urls',
            enabled: 'search_commando_enabled' // Save ON/OFF state
        }
    };

    const HELP_MAP = [
        { key: 'W / S', desc: 'Select Result' },
        { key: 'Q / E', desc: 'Change Page' },
        { key: 'Enter', desc: 'Open Direct' },
        { key: 'S+Enter', desc: 'New Tab' },
        { key: 'X', desc: 'Block Domain' },
        { key: 'V', desc: 'Star Result' },
        { key: 'C', desc: 'Copy URL' },
        { key: 'T', desc: 'Time Warp' },
        { key: 'F', desc: 'Toggle Map' },
        { key: 'ESC', desc: 'ON / OFF' },
    ];

    // State
    let isActive = true;
    let results = [];
    let currentIndex = -1;
    let blockedDomains = new Set();
    let starredUrls = new Set();
    let currentTimeLabel = 'All Time';

    // =================================================================
    // 🎨 CSS
    // =================================================================
    const style = document.createElement('style');
    style.textContent = `
        /* Focus */
        .sc-focus {
            border-left: 5px solid ${CONFIG.colors.focusBorder} !important;
            background-color: ${CONFIG.colors.focusBg} !important;
            box-shadow: -2px 0 10px rgba(0, 208, 255, 0.1);
            transition: all 0.1s ease-out;
        }
        .sc-focus h3, .sc-focus a h3 { color: ${CONFIG.colors.focusText} !important; }

        /* Blocked */
        .sc-blocked {
            opacity: 0.6; height: 28px !important; overflow: hidden !important;
            background-color: ${CONFIG.colors.blockedBg} !important;
            border-left: 5px solid #555 !important;
            cursor: pointer !important; margin-bottom: 8px !important;
            padding: 0 10px !important; display: flex !important; align-items: center !important;
            border-radius: 4px;
        }
        .sc-blocked * {
            font-size: 12px !important; color: ${CONFIG.colors.blockedText} !important;
            pointer-events: none; white-space: nowrap; margin: 0 !important; padding: 0 !important; line-height: 28px !important;
        }
        .sc-blocked > *:not(h3):not(.sc-status) { display: none !important; }
        .sc-blocked h3 { display: inline-block !important; margin-right: 10px !important; max-width: 60%; overflow: hidden; text-overflow: ellipsis; }
        .sc-blocked::after { content: "🚫 BLOCKED"; font-size: 10px; color: #f4212e; margin-left: auto; font-weight: bold; }
        .sc-blocked.sc-peek { height: auto !important; opacity: 0.9; background-color: rgba(0,0,0,0.1) !important; }
        .sc-blocked.sc-peek::after { content: "👁️ PEEKING"; color: #00ba7c; }

        /* Starred */
        .sc-starred { border-left: 5px solid ${CONFIG.colors.star} !important; background-color: ${CONFIG.colors.starBg} !important; }
        .sc-starred h3::before { content: "★ "; color: ${CONFIG.colors.star}; }

        /* Indicator */
        #sc-indicator {
            position: fixed; bottom: 20px; right: 20px;
            background: ${CONFIG.colors.uiBg}; color: ${CONFIG.colors.focusBorder};
            padding: 6px 12px; border-radius: 6px;
            font-family: monospace; font-size: 13px; font-weight: bold;
            z-index: 9999; cursor: pointer; user-select: none;
            border: 1px solid ${CONFIG.colors.focusBorder};
            box-shadow: 0 0 10px rgba(0,0,0,0.5);
            display: flex; gap: 10px; transition: opacity 0.3s;
        }
        #sc-indicator:hover { background: rgba(0, 208, 255, 0.2); }
        #sc-indicator .sep { opacity: 0.5; }
        #sc-indicator .time { color: #aaa; }
        #sc-indicator.error { border-color: #f4212e; color: #f4212e; }
        #sc-indicator.success { border-color: #00ba7c; color: #00ba7c; }
        #sc-indicator.disabled { opacity: 0.5; filter: grayscale(100%); }

        /* Cheat Sheet */
        #sc-cheatsheet {
            position: fixed; bottom: 65px; right: 20px;
            background: ${CONFIG.colors.uiBg};
            border: 1px solid ${CONFIG.colors.focusBorder};
            border-radius: 8px; padding: 15px;
            z-index: 10000; color: #fff;
            font-family: monospace; font-size: 12px;
            display: none; box-shadow: 0 10px 30px rgba(0,0,0,0.8);
            backdrop-filter: blur(5px);
        }
        #sc-cheatsheet.visible { display: block; }
        .sc-cs-row { display: flex; justify-content: space-between; margin-bottom: 5px; gap: 20px; }
        .sc-cs-key { color: ${CONFIG.colors.focusBorder}; font-weight: bold; text-align: right; min-width: 80px; }
        .sc-cs-desc { color: #ccc; }
        .sc-cs-header { border-bottom: 1px solid #444; padding-bottom: 5px; margin-bottom: 10px; font-weight: bold; color: #fff; text-align: center; }

        /* Top Right Switch */
        #sc-switch-container {
            position: fixed; top: 80px; right: 30px; z-index: 9999;
            background: rgba(0, 0, 0, 0.8); border: 1px solid #333;
            border-radius: 20px; padding: 6px 12px;
            display: flex; align-items: center; gap: 10px;
            backdrop-filter: blur(4px);
            box-shadow: 0 4px 10px rgba(0,0,0,0.3);
            cursor: pointer;
        }
        #sc-switch-label { font-size: 12px; font-weight: 700; color: #ccc; font-family: sans-serif; user-select: none; }
        .sc-toggle { width: 36px; height: 20px; background: ${CONFIG.colors.off}; border-radius: 99px; position: relative; transition: background 0.3s; }
        .sc-toggle::after { content: ''; position: absolute; top: 2px; left: 2px; width: 16px; height: 16px; background: white; border-radius: 50%; transition: transform 0.3s; }
        #sc-switch-container.active .sc-toggle { background: ${CONFIG.colors.on}; }
        #sc-switch-container.active .sc-toggle::after { transform: translateX(16px); }
    `;
    document.head.appendChild(style);

    // =================================================================
    // 🧠 Logic
    // =================================================================

    function loadData() {
        try {
            const blocked = localStorage.getItem(CONFIG.keys.block);
            if (blocked) blockedDomains = new Set(JSON.parse(blocked));
            const starred = localStorage.getItem(CONFIG.keys.star);
            if (starred) starredUrls = new Set(JSON.parse(starred));

            // Load Active State
            const savedState = localStorage.getItem(CONFIG.keys.enabled);
            isActive = savedState === null ? true : (savedState === 'true');
        } catch (e) { }
    }

    function saveData() {
        localStorage.setItem(CONFIG.keys.block, JSON.stringify([...blockedDomains]));
        localStorage.setItem(CONFIG.keys.star, JSON.stringify([...starredUrls]));
        localStorage.setItem(CONFIG.keys.enabled, isActive);
    }

    function toggleCommando() {
        isActive = !isActive;
        saveData();
        updateUIState();

        if (!isActive) {
            // Remove focus when turned OFF
            if (currentIndex !== -1 && results[currentIndex]) {
                results[currentIndex].classList.remove('sc-focus');
            }
            showToast("Commando: OFF", 'error');
        } else {
            showToast("Commando: ON", 'success');
            // Refocus if necessary
            if (currentIndex !== -1 && results[currentIndex]) {
                results[currentIndex].classList.add('sc-focus');
            }
        }
    }

    function initTimeLabel() {
        const params = new URLSearchParams(window.location.search);
        const tbs = params.get('tbs') || '';
        if (tbs.includes('qdr:y')) currentTimeLabel = 'Past Year';
        else if (tbs.includes('qdr:m')) currentTimeLabel = 'Past Month';
        else if (tbs.includes('qdr:w')) currentTimeLabel = 'Past Week';
        else currentTimeLabel = 'All Time';
    }

    function updateResults() {
        const titles = document.querySelectorAll('#rso h3');
        const newResults = [];
        titles.forEach(h3 => {
            let container = h3.closest('.g');
            if (!container) container = h3.closest('div[data-hveid]');
            if (container && !newResults.includes(container) && container.offsetParent !== null) {
                newResults.push(container);
            }
        });
        results = newResults;
        applyStyles();
        updateIndicator();
    }

    function getDomain(el) {
        const link = el.querySelector('a');
        if (!link) return null;
        try { return new URL(link.href).hostname; } catch (e) { return null; }
    }

    function getUrl(el) {
        const link = el.querySelector('a');
        return link ? (link.getAttribute('data-url') || link.href) : null;
    }

    function applyStyles() {
        // Design choice: Keep visual effects (Block/Star) even when OFF, but disable operations (Focus).

        results.forEach(el => {
            const domain = getDomain(el);
            const url = getUrl(el);

            // Block
            if (domain && blockedDomains.has(domain)) {
                if (!el.classList.contains('sc-blocked')) {
                    el.classList.add('sc-blocked');
                    // Click event always active (for mouse operation)
                    el.onclick = (e) => { e.stopPropagation(); el.classList.toggle('sc-peek'); };
                }
            } else {
                el.classList.remove('sc-blocked', 'sc-peek');
                el.onclick = null;
            }

            // Star
            if (url && starredUrls.has(url)) el.classList.add('sc-starred');
            else el.classList.remove('sc-starred');
        });
    }

    function focusResult(index) {
        if (!isActive) return; // Guard
        if (results.length === 0) return;
        if (index < 0) index = 0;
        if (index >= results.length) index = results.length - 1;

        if (currentIndex !== -1 && results[currentIndex]) {
            results[currentIndex].classList.remove('sc-focus');
        }

        currentIndex = index;
        const target = results[currentIndex];
        target.classList.add('sc-focus');

        const rect = target.getBoundingClientRect();
        const absoluteTop = window.scrollY + rect.top;
        window.scrollTo({ top: absoluteTop + CONFIG.scrollOffset, behavior: 'smooth' });

        updateIndicator();
    }

    function triggerClick(element, isNewTab) {
        if (!element) return;
        const clickEvent = new MouseEvent('click', {
            bubbles: true, cancelable: true, view: window,
            ctrlKey: isNewTab, metaKey: isNewTab
        });
        element.dispatchEvent(clickEvent);
    }

    function navigatePage(direction) {
        const nextBtn = document.getElementById('pnnext');
        const prevBtn = document.getElementById('pnprev');
        if (direction > 0) {
            if (nextBtn) { showToast('Next Page >>', 'success'); nextBtn.click(); }
            else { showToast('No Next Page', 'error'); }
        } else {
            if (prevBtn) { showToast('<< Prev Page', 'success'); prevBtn.click(); }
            else { showToast('No Prev Page', 'error'); }
        }
    }

    function toggleBlock() {
        if (currentIndex === -1 || !results[currentIndex]) return;
        const target = results[currentIndex];
        const domain = getDomain(target);
        if (!domain) return;

        if (blockedDomains.has(domain)) {
            blockedDomains.delete(domain);
            showToast(`Restore: ${domain}`, 'success');
        } else {
            blockedDomains.add(domain);
            showToast(`Kill: ${domain}`, 'error');
        }
        saveData();
        applyStyles();
    }

    function toggleStar() {
        if (currentIndex === -1 || !results[currentIndex]) return;
        const url = getUrl(results[currentIndex]);
        if (!url) return;

        if (starredUrls.has(url)) {
            starredUrls.delete(url);
            showToast(`Unstar`, 'default');
        } else {
            starredUrls.add(url);
            showToast(`★ Starred!`, 'success');
        }
        saveData();
        applyStyles();
    }

    function copyUrl() {
        if (currentIndex === -1 || !results[currentIndex]) return;
        const url = getUrl(results[currentIndex]);
        if (url) {
            navigator.clipboard.writeText(url);
            showToast(`Copied!`, 'success');
        }
    }

    function toggleTimeWarp() {
        const url = new URL(window.location.href);
        const params = new URLSearchParams(url.search);
        let tbs = params.get('tbs') || '';
        let nextMode = '';

        if (tbs.includes('qdr:y')) nextMode = 'qdr:m';
        else if (tbs.includes('qdr:m')) nextMode = 'qdr:w';
        else if (tbs.includes('qdr:w')) nextMode = '';
        else nextMode = 'qdr:y';

        if (nextMode) params.set('tbs', nextMode); else params.delete('tbs');
        showToast(`Time Warp...`, 'default');
        url.search = params.toString();
        window.location.href = url.toString();
    }

    // --- UI Helpers ---
    function createUI() {
        // 1. Indicator
        const ind = document.createElement('div');
        ind.id = 'sc-indicator';
        ind.onclick = (e) => { e.stopPropagation(); toggleCheatSheet(); };
        document.body.appendChild(ind);

        // 2. Cheat Sheet
        const cs = document.createElement('div');
        cs.id = 'sc-cheatsheet';
        let html = '<div class="sc-cs-header">COMMANDO MAP</div>';
        HELP_MAP.forEach(item => { html += `<div class="sc-cs-row"><span class="sc-cs-key">${item.key}</span><span class="sc-cs-desc">${item.desc}</span></div>`; });
        cs.innerHTML = html;
        document.body.appendChild(cs);

        // 3. Top Right Switch
        const swContainer = document.createElement('div');
        swContainer.id = 'sc-switch-container';
        swContainer.innerHTML = `<div id="sc-switch-label">Commando</div><div class="sc-toggle"></div>`;
        swContainer.onclick = (e) => { e.stopPropagation(); toggleCommando(); };
        document.body.appendChild(swContainer);

        updateUIState();
        updateIndicator();
    }

    function updateUIState() {
        const sw = document.getElementById('sc-switch-container');
        const ind = document.getElementById('sc-indicator');

        if (isActive) {
            if (sw) sw.classList.add('active');
            if (ind) ind.classList.remove('disabled');
        } else {
            if (sw) sw.classList.remove('active');
            if (ind) ind.classList.add('disabled');
        }
    }

    function updateIndicator() {
        const div = document.getElementById('sc-indicator');
        if (div && !div.dataset.toast) {
            const count = results.length;
            const stateText = isActive ? `CMD: ${currentIndex + 1} / ${count}` : `CMD: OFF`;
            div.innerHTML = `${stateText} <span class="sep">|</span> <span class="time">${currentTimeLabel}</span>`;
            if (!isActive) div.className = 'disabled';
            else div.className = count === 0 ? 'error' : '';
        }
    }

    function toggleCheatSheet() {
        const cs = document.getElementById('sc-cheatsheet');
        if (cs) cs.classList.toggle('visible');
    }

    function showToast(msg, type = 'default') {
        const div = document.getElementById('sc-indicator');
        if (div) {
            div.dataset.toast = "true";
            div.textContent = msg;
            div.className = type;
            setTimeout(() => {
                delete div.dataset.toast;
                div.className = '';
                updateUIState(); // Restore state class
                updateIndicator();
            }, 1500);
        }
    }

    // =================================================================
    // 🎮 Input Handler
    // =================================================================
    window.addEventListener('keydown', (e) => {
        // Ignore during input (except ESC)
        if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName) || document.activeElement.isContentEditable) {
            if (e.key === 'Escape') {
                e.preventDefault();
                document.activeElement.blur(); // Blur focus
                showToast("Input Blurred", 'default');
            }
            return;
        }

        if (e.metaKey || e.altKey) return;

        const key = e.key.toLowerCase();

        // ★ ESC Toggle (Highest Priority)
        if (key === 'escape') {
            e.preventDefault();
            e.stopPropagation();
            toggleCommando();
            return;
        }

        // ★ Exit here if OFF (Return to native operation)
        if (!isActive) return;

        // Disable Keys
        if (['j', 'k', 'x', 't', '/', 'e', 'q', 'v', 'c', 'z', 'f', 's', 'w'].includes(key) || key === 'enter') {
            e.stopPropagation();
            e.stopImmediatePropagation();
        }

        switch (key) {
            case 's': case 'j': updateResults(); focusResult(currentIndex + 1); break;
            case 'w': case 'k': updateResults(); focusResult(currentIndex - 1); break;
            case 'e': navigatePage(1); break;
            case 'q': navigatePage(-1); break;
            case 'enter':
                if (currentIndex !== -1 && results[currentIndex]) {
                    const link = results[currentIndex].querySelector('a');
                    if (link) {
                        e.preventDefault();
                        triggerClick(link, e.shiftKey || e.ctrlKey);
                    }
                }
                break;
            case 'x': toggleBlock(); break;
            case 'v': toggleStar(); break;
            case 'c': copyUrl(); break;
            case 't': toggleTimeWarp(); break;
            case 'f': toggleCheatSheet(); break;
            case 'z':
                window.scrollTo({ top: 0, behavior: 'smooth' });
                if (results[currentIndex]) results[currentIndex].classList.remove('sc-focus');
                currentIndex = -1;
                updateIndicator();
                break;
            case '/':
                e.preventDefault();
                const input = document.querySelector('textarea[name="q"]') || document.querySelector('input[name="q"]');
                if (input) { input.focus(); input.select(); }
                break;
        }
    }, true);

    // =================================================================
    // 🚀 Init
    // =================================================================
    loadData();
    initTimeLabel();
    window.addEventListener('load', () => {
        createUI();
        updateResults();
    });
    setInterval(updateResults, 1500);

})();