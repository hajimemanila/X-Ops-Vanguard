// ==UserScript==
// @name         X Timeline Walker (v5.0 AHK-Led Edition)
// @namespace    http://tampermonkey.net/
// @version      5.0
// @description  AHK integration edition. Delegates key control externally, specialized in display and DOM manipulation.
// @author       X Ops Architect
// @match        https://twitter.com/*
// @match        https://x.com/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const CONFIG = {
        skipReposts: true,
        skipAds: true,
        scrollOffset: -150,
        autoLoadDelay: 1500,
        colors: { recent: '#00ba7c', old: '#ffd400', ancient: '#f4212e', copied: 'rgba(0, 255, 255, 0.2)' },
        zenOpacity: 0.5,
        autopilotSpeed: 4,
        autopilotInterval: 20,
        longPressDelay: 400
    };

    // G key removed from list
    const SHORTCUTS = [
        { cat: 'NAV', key: 'W / S', func: 'Scroll', desc: 'Up / Down' },
        { cat: 'NAV', key: 'Q / E', func: 'Target', desc: 'Prev / Next Post' },
        { cat: 'NAV', key: 'R', func: 'Reload', desc: 'Page Reload' },
        { cat: 'NAV', key: 'T', func: 'Profile', desc: 'Go to My Profile' },
        { cat: 'ACT', key: 'D', func: 'Like', desc: 'Like Post' },
        { cat: 'ACT', key: 'A', func: 'Repost', desc: 'Repost Menu' },
        { cat: 'ACT', key: 'X', func: 'Delete', desc: 'Double Tap to Delete' },
        { cat: 'ACT', key: 'C', func: 'Copy', desc: 'Copy Post URL' },
        { cat: 'STR', key: 'V', func: 'Star', desc: 'Toggle Highlight' },
        { cat: 'STR', key: 'B', func: 'Jump ★', desc: 'Next Starred User' },
        { cat: 'SYS', key: '1-5', func: 'Jump', desc: 'Home/Notif/Menu/Detail/Set' },
        { cat: 'SYS', key: 'Z', func: 'Reset', desc: 'Scroll Top & Unfocus' },
        { cat: 'SYS', key: 'Shift', func: 'Auto', desc: 'Long: ON / Tap: OFF' },
        { cat: 'SYS', key: 'F', func: 'Smart Key', desc: 'Dismiss / Show Map' },
    ];

    const CONFLICT_HASHES = ['auto', 'liker', 'clean_at'];
    const STORAGE_KEY = 'x_walker_session_enabled';

    let isActive = false;
    let currentIndex = -1;
    let targetArticles = [];
    let indicatorDiv = null;
    let cheatSheetDiv = null;
    let autopilotTimer = null;
    let alertTimer = null;
    let titleObserver = null;
    let titleInterval = null;
    const MARKER = '【🎮】 ';
    let lastEnforceTime = 0;
    const ENFORCE_THROTTLE_MS = 200;

    let shiftPressTime = 0;
    let shiftLongPressTimer = null;
    let otherKeyPressed = false;

    const style = document.createElement('style');
    style.textContent = `
        body.x-walker-active article[data-testid="tweet"] { opacity: ${CONFIG.zenOpacity}; transition: opacity 0.2s ease, box-shadow 0.2s ease; }
        body.x-walker-active article[data-testid="tweet"].x-walker-focused { opacity: 1 !important; background-color: rgba(255, 255, 255, 0.03); }

        #x-walker-indicator {
            position: fixed; bottom: 20px; right: 20px;
            background: rgba(0, 0, 0, 0.9); color: #00ba7c;
            border: 1px solid #00ba7c; padding: 8px 16px; border-radius: 20px;
            font-weight: bold; font-size: 14px;
            z-index: 9999;
            pointer-events: auto; cursor: pointer; box-shadow: 0 4px 10px rgba(0,0,0,0.5);
            opacity: 0; transform: translateY(10px); transition: opacity 0.3s ease, transform 0.3s ease, background 0.2s; display: none;
            user-select: none;
        }
        #x-walker-indicator:hover { background: rgba(0, 186, 124, 0.2); }
        #x-walker-indicator.visible { display: block; opacity: 1; transform: translateY(0); }
        #x-walker-indicator.autopilot-on { background: rgba(0, 186, 124, 0.2); box-shadow: 0 0 15px #00ba7c; border-color: #fff; color: #fff; }

        /* Changed warning color from Red to Orange */
        #x-walker-indicator.warning { border-color: #ff9800; color: #ff9800; background: rgba(0, 0, 0, 0.95); box-shadow: 0 0 15px rgba(255, 152, 0, 0.4); }

        #x-walker-cheatsheet {
            position: fixed; bottom: 70px; right: 20px;
            background: rgba(0, 0, 0, 0.95);
            border: 1px solid #00ba7c;
            border-radius: 12px;
            padding: 16px;
            z-index: 10000;
            color: #fff;
            font-family: monospace;
            font-size: 12px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.8);
            display: none;
            opacity: 0; transform: translateY(10px);
            transition: opacity 0.15s ease-out, transform 0.15s ease-out;
            backdrop-filter: blur(5px);
            min-width: 300px;
        }
        #x-walker-cheatsheet.visible { display: block; opacity: 1; transform: translateY(0); }

        .xw-cs-header { border-bottom: 1px solid #333; padding-bottom: 8px; margin-bottom: 8px; font-weight: bold; color: #00ba7c; display:flex; justify-content:space-between; }
        .xw-cs-close-hint { font-size: 10px; color: #666; font-weight: normal; }
        .xw-cs-grid { display: grid; grid-template-columns: 50px 70px 1fr; gap: 6px 12px; align-items: center; }
        .xw-cs-key { color: #00ba7c; font-weight: bold; text-align: right; }
        .xw-cs-func { color: #fff; font-weight: bold; }
        .xw-cs-desc { color: #888; font-size: 11px; }
        .xw-cs-cat { grid-column: 1 / -1; margin-top: 6px; padding-top: 6px; border-top: 1px dashed #333; font-size: 10px; color: #444; text-align: center; letter-spacing: 2px; }
        .xw-cs-cat:first-child { border-top: none; margin-top: 0; padding-top: 0; }
    `;
    document.head.appendChild(style);

    function isEmergencyMode() {
        const path = window.location.pathname;
        const isLoginPath = path.includes('/i/flow/login') || path === '/login' || path === '/logout';
        const hasLoginModal = !!document.querySelector('[data-testid="sheetDialog"]') || !!document.querySelector('[data-testid="login"]');
        return isLoginPath || hasLoginModal;
    }

    function emergencyHide() {
        if (indicatorDiv) indicatorDiv.style.display = 'none';
        if (cheatSheetDiv) cheatSheetDiv.style.display = 'none';
        if (isActive) {
            stopAutopilot();
            document.body.classList.remove('x-walker-active');
            stopTitleObserver();
        }
    }

    function createIndicator() {
        if (document.getElementById('x-walker-indicator')) return;
        indicatorDiv = document.createElement('div');
        indicatorDiv.id = 'x-walker-indicator';
        indicatorDiv.innerHTML = '🎮 Walker (Phantom)';
        indicatorDiv.addEventListener('click', (e) => { e.stopPropagation(); toggleCheatSheet(); });
        document.body.appendChild(indicatorDiv);
    }
    createIndicator();

    function createCheatSheet() {
        if (document.getElementById('x-walker-cheatsheet')) return;
        cheatSheetDiv = document.createElement('div');
        cheatSheetDiv.id = 'x-walker-cheatsheet';
        let html = `<div class="xw-cs-header">PHANTOM OPS MAP<span class="xw-cs-close-hint">Press F to Close</span></div><div class="xw-cs-grid">`;
        let lastCat = '';
        SHORTCUTS.forEach(item => {
            if (item.cat !== lastCat) { html += `<div class="xw-cs-cat">- ${item.cat} -</div>`; lastCat = item.cat; }
            html += `<div class="xw-cs-key">${item.key}</div><div class="xw-cs-func">${item.func}</div><div class="xw-cs-desc">${item.desc}</div>`;
        });
        html += `</div>`;
        cheatSheetDiv.innerHTML = html;
        document.body.appendChild(cheatSheetDiv);
    }
    createCheatSheet();

    function toggleCheatSheet() {
        if (isEmergencyMode()) return;
        if (!cheatSheetDiv) return;
        if (cheatSheetDiv.classList.contains('visible')) cheatSheetDiv.classList.remove('visible');
        else cheatSheetDiv.classList.add('visible');
    }

    function closeCheatSheet() {
        if (cheatSheetDiv && cheatSheetDiv.classList.contains('visible')) {
            cheatSheetDiv.classList.remove('visible');
            return true;
        }
        return false;
    }

    function showIndicator() {
        if (isEmergencyMode()) { emergencyHide(); return; }
        if (!indicatorDiv) return;
        indicatorDiv.style.display = '';
        indicatorDiv.classList.add('visible');
    }

    function hideIndicator() {
        if (!indicatorDiv) return;
        indicatorDiv.classList.remove('visible');
        closeCheatSheet();
    }

    function resetIndicator() {
        if (isEmergencyMode()) { emergencyHide(); return; }
        if (!indicatorDiv) return;
        if (alertTimer !== null) return;
        indicatorDiv.classList.remove('warning');
        if (isActive && !isConflictState()) {
            indicatorDiv.innerHTML = autopilotTimer ? '🚀 Autopilot Engaged' : '🎮 Walker (Phantom)';
            showIndicator();
        } else {
            hideIndicator();
        }
    }

    function showTemporaryAlert(msg, duration = 3000, isError = true) {
        if (isEmergencyMode()) return;
        if (!indicatorDiv) return;
        if (alertTimer) clearTimeout(alertTimer);
        indicatorDiv.innerHTML = msg;
        if (isError) indicatorDiv.classList.add('warning');
        else indicatorDiv.classList.remove('warning');
        showIndicator();
        alertTimer = setTimeout(() => {
            alertTimer = null;
            resetIndicator();
        }, duration);
    }

    function isConflictState() { return CONFLICT_HASHES.some(keyword => window.location.hash.toLowerCase().includes(keyword)); }

    function enforceTitle() {
        if (!isActive) return;
        const now = Date.now();
        if (now - lastEnforceTime < ENFORCE_THROTTLE_MS) return;
        lastEnforceTime = now;
        if (document.title.startsWith(MARKER)) {
            if (!document.title.substring(MARKER.length).includes(MARKER)) return;
        }
        document.title = MARKER + document.title.replaceAll(MARKER, '');
    }

    function forceSync() {
        if (isEmergencyMode()) { emergencyHide(); return; }
        if (document.hidden) {
            if (targetArticles.length > 0) { targetArticles = []; currentIndex = -1; }
            if (autopilotTimer) stopAutopilot();
            return;
        }
        const stored = sessionStorage.getItem(STORAGE_KEY) === 'true';
        if (!stored) { isActive = false; hideIndicator(); document.body.classList.remove('x-walker-active'); stopTitleObserver(); return; }
        if (isConflictState()) {
            if (isActive) { showTemporaryAlert('⚠️ Auto-Op Conflict (Walker Paused)'); stopAutopilot(); document.body.classList.remove('x-walker-active'); stopTitleObserver(); }
            isActive = true; return;
        }
        syncFromStorage();
        if (isActive) {
            enforceTitle();
            if (!indicatorDiv.classList.contains('warning') && alertTimer === null) resetIndicator();
            if (targetArticles.length === 0) { updateTargets(); findClosestIndex(); }
        }
    }

    function startTitleObserver() {
        if (titleObserver) return;
        const titleTag = document.querySelector('title'); if (!titleTag) return;
        enforceTitle();
        titleObserver = new MutationObserver(() => { if (isActive) enforceTitle(); });
        titleObserver.observe(titleTag, { childList: true });
        titleInterval = setInterval(() => { if (isActive) enforceTitle(); }, 1500);
    }
    function stopTitleObserver() {
        if (titleObserver) { titleObserver.disconnect(); titleObserver = null; }
        if (titleInterval) { clearInterval(titleInterval); titleInterval = null; }
        if (document.title.includes(MARKER)) document.title = document.title.replaceAll(MARKER, '');
    }

    function setWalkerState(enabled) {
        if (enabled && isConflictState()) { showTemporaryAlert('⚠️ Conflict Detected'); return; }
        if (isActive === enabled) { if (isActive) { enforceTitle(); resetIndicator(); } return; }
        isActive = enabled; sessionStorage.setItem(STORAGE_KEY, isActive);
        if (isActive) {
            resetIndicator();
            document.body.classList.add('x-walker-active'); startTitleObserver(); updateTargets();
            if (window.scrollY < 200) currentIndex = -1; else findClosestIndex();
        } else {
            stopAutopilot(); hideIndicator(); document.body.classList.remove('x-walker-active'); forceClearFocus(); currentIndex = -1; targetArticles = []; stopTitleObserver();
        }
    }
    function syncFromStorage() { const stored = sessionStorage.getItem(STORAGE_KEY) === 'true'; setWalkerState(stored); }
    function toggleWalker() { setWalkerState(!isActive); }
    function ensureWalkerOn() { if (!isActive) setWalkerState(true); else enforceTitle(); }

    window.addEventListener('focus', forceSync);
    window.addEventListener('visibilitychange', () => { forceSync(); });
    window.addEventListener('storage', (e) => { if (e.key === STORAGE_KEY && e.storageArea === sessionStorage) syncFromStorage(); });
    window.addEventListener('hashchange', forceSync);

    function toggleAutopilot() { if (!isActive) return; if (autopilotTimer) stopAutopilot(); else startAutopilot(); }
    function startAutopilot() { if (autopilotTimer) return; indicatorDiv.classList.add('autopilot-on'); indicatorDiv.innerHTML = '🚀 Autopilot Engaged'; autopilotTimer = setInterval(() => { window.scrollBy(0, CONFIG.autopilotSpeed); }, CONFIG.autopilotInterval); }
    function stopAutopilot() { if (!autopilotTimer) return; clearInterval(autopilotTimer); autopilotTimer = null; indicatorDiv.classList.remove('autopilot-on'); resetIndicator(); updateTargets(); findClosestIndex(); }

    function forceClearFocus() { document.querySelectorAll('.x-walker-focused').forEach(el => { el.classList.remove('x-walker-focused'); el.style.boxShadow = ''; }); }
    function utilityReset() { stopAutopilot(); window.scrollTo({ top: 0, behavior: 'smooth' }); currentIndex = -1; forceClearFocus(); }
    function utilityCopyUrl() {
        resyncCurrentIndex(); if (currentIndex === -1 || !targetArticles[currentIndex]) return;
        const article = targetArticles[currentIndex];
        const linkEl = article.querySelector('time')?.closest('a');
        if (linkEl?.href) navigator.clipboard.writeText(linkEl.href).then(() => flashFeedback(article, CONFIG.colors.copied));
    }

    function findClosestIndex() {
        if (targetArticles.length === 0) return;
        let minDiff = Infinity; let bestIdx = 0;
        const center = window.scrollY + (window.innerHeight * 0.20);
        targetArticles.forEach((article, i) => {
            if (!article.isConnected) return;
            const rect = article.getBoundingClientRect();
            const diff = Math.abs(center - (window.scrollY + rect.top + rect.height / 2));
            if (diff < minDiff) { minDiff = diff; bestIdx = i; }
        });
        currentIndex = bestIdx;
    }

    function updateTargets() {
        if (document.hidden) { targetArticles = []; return; }
        targetArticles = Array.from(document.querySelectorAll('article[data-testid="tweet"]')).filter(article => {
            if (!article.isConnected) return false;
            if (CONFIG.skipAds && (article.innerText.includes('プロモーション') || article.innerText.includes('Promoted'))) return false; // 'Promoted' (Japanese)
            if (CONFIG.skipReposts && article.querySelector('[data-testid="socialContext"]')?.innerText.match(/リポスト|Reposted/)) return false; // 'Repost' (Japanese)
            return true;
        });
    }

    function resyncCurrentIndex() {
        const focused = document.querySelector('.x-walker-focused');
        if (focused?.isConnected) {
            updateTargets();
            const newIdx = targetArticles.indexOf(focused);
            if (newIdx !== -1) { if (currentIndex !== newIdx) currentIndex = newIdx; } else findClosestIndex();
        } else if (isActive && currentIndex !== -1) findClosestIndex();
    }

    function focusArticle(index) {
        if (!isActive || document.hidden) return;
        stopAutopilot();
        updateTargets();

        if (index < 0) {
            if (targetArticles.length === 0) {
                window.scrollBy(0, -window.innerHeight * 1.5);
                showTemporaryAlert('🔭 Scanning up...', 1000, false);
                setTimeout(() => { updateTargets(); findClosestIndex(); }, 300);
            } else {
                window.scrollBy(0, -500);
                setTimeout(() => { updateTargets(); findClosestIndex(); }, 200);
            }
            return;
        }

        if (targetArticles.length === 0 || index >= targetArticles.length) {
            window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
            showTemporaryAlert('🔭 Scanning...', CONFIG.autoLoadDelay, false);
            setTimeout(() => {
                updateTargets();
                if (index < targetArticles.length) {
                    focusArticle(index);
                } else {
                    showTemporaryAlert('⏳ End of Stream', 3000, true);
                }
            }, CONFIG.autoLoadDelay);
            return;
        }

        forceClearFocus();
        const target = targetArticles[index];
        if (target?.isConnected) {
            target.classList.add('x-walker-focused');
            const color = (function (a) {
                const t = a.querySelector('time'); if (!t) return CONFIG.colors.recent;
                const d = (new Date() - new Date(t.getAttribute('datetime'))) / (86400000);
                return d >= 30 ? CONFIG.colors.ancient : d >= 4 ? CONFIG.colors.old : CONFIG.colors.recent;
            })(target);
            target.style.boxShadow = `-4px 0 0 0 ${color}, 0 0 20px ${color}33`;
            const rect = target.getBoundingClientRect();
            window.scrollTo({ top: window.pageYOffset + rect.top - (window.innerHeight / 2) + (rect.height / 2) - CONFIG.scrollOffset, behavior: 'smooth' });
            currentIndex = index;
        } else findClosestIndex();
    }

    function flashFeedback(article, color) {
        if (!article?.isConnected) return;
        const originalBg = article.style.backgroundColor; article.style.backgroundColor = color;
        setTimeout(() => { if (article.isConnected) article.style.backgroundColor = originalBg; }, 200);
    }

    function executeAction(actionType) {
        if (!isActive) return;
        resyncCurrentIndex();
        const article = targetArticles[currentIndex];
        if (!article?.isConnected) return;
        if (actionType === 'like') article.querySelector('[data-testid="like"], [data-testid="unlike"]')?.click() || flashFeedback(article, 'rgba(249, 24, 128, 0.1)');
        else if (actionType === 'repost') {
            const btn = article.querySelector('[data-testid="retweet"], [data-testid="unretweet"]');
            if (btn) { btn.click(); waitAndClick(btn.getAttribute('data-testid') === 'retweet' ? '[data-testid="retweetConfirm"]' : '[data-testid="unretweetConfirm"]', () => flashFeedback(article, 'rgba(0, 186, 124, 0.1)')); }
        }
    }

    function waitAndClick(selector, callback) {
        let attempts = 0; const interval = setInterval(() => {
            const el = typeof selector === 'function' ? selector() : document.querySelector(selector);
            if (el) { clearInterval(interval); el.click(); callback?.(el); }
            else if (++attempts > 40) clearInterval(interval);
        }, 50);
    }

    function xOpsOpenMenu(article) {
        if (!article) return;
        const caret = article.querySelector('[data-testid="caret"]');
        if (caret) caret.click();
    }

    function xOpsOpenDetail(article) {
        if (!article) return;
        const timeLink = article.querySelector('time')?.closest('a');
        if (timeLink) timeLink.click();
    }

    // [Reserved] Account Switcher (Removed from G key, for future use)
    function xOpsOpenSwitcher() {
        document.querySelector('[data-testid="SideNav_AccountSwitcher_Button"]')?.click();
    }

    function xOpsOpenSettings() {
        window.open('https://x.com/settings/account', '_blank');
    }

    function xOpsCancel() {
        if (closeCheatSheet()) return true;
        const confirmCancel = document.querySelector('[data-testid="confirmationSheetCancel"]');
        if (confirmCancel) { confirmCancel.click(); return true; }
        return false;
    }

    function xOpsHandleDelete(article) {
        const confirmBtn = document.querySelector('[data-testid="confirmationSheetConfirm"]');
        if (confirmBtn) {
            confirmBtn.click();
            if (article) flashFeedback(article, 'rgba(244, 33, 46, 0.3)');
            setTimeout(() => {
                updateTargets();
                if (currentIndex >= targetArticles.length) {
                    currentIndex = Math.max(0, targetArticles.length - 1);
                }
                focusArticle(currentIndex);
            }, 500);
            return;
        }

        if (!article) return;
        const caret = article.querySelector('[data-testid="caret"]');
        if (!caret) return;
        caret.click();
        setTimeout(() => {
            const menu = document.querySelector('[role="menu"]');
            if (!menu) return;
            const deleteItem = Array.from(menu.querySelectorAll('[role="menuitem"]')).find(el => el.textContent.match(/削除|Delete/));
            if (deleteItem) { deleteItem.click(); }
        }, 100);
    }

    window.addEventListener('keyup', (e) => {
        if (['ShiftLeft', 'ShiftRight'].includes(e.code)) {
            if (shiftLongPressTimer) { clearTimeout(shiftLongPressTimer); shiftLongPressTimer = null; }
            otherKeyPressed = false;
            if (isActive && autopilotTimer && (Date.now() - shiftPressTime < CONFIG.longPressDelay)) {
                stopAutopilot();
            }
        }
    });

    window.addEventListener('keydown', (e) => {
        // Shift+Space is hooked by AHK, so JS does nothing (Scroll suppression also handled by AHK)

        // Escape
        if (e.code === 'Escape') {
            e.preventDefault();
            if (!closeCheatSheet()) {
                if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName) || document.activeElement.isContentEditable) {
                    document.activeElement.blur();
                    showTemporaryAlert('📉 Input Blurred (Walker Ready)', 1000, false);
                } else {
                    toggleWalker();
                }
            }
            return;
        }

        // Activation (Ctrl+Alt+Space)
        if (e.code === 'Space' && e.ctrlKey && e.altKey) {
            e.preventDefault(); e.stopPropagation();
            setWalkerState(true);
            return;
        }

        if (!isActive || isEmergencyMode()) return;

        // Ignore during input form
        if (['INPUT', 'TEXTAREA'].includes(e.target.tagName) || e.target.isContentEditable) return;

        // Do not interfere when modifier keys are held
        if (e.ctrlKey || e.altKey || e.metaKey) return;

        // Shift Processing
        if (['ShiftLeft', 'ShiftRight'].includes(e.code)) {
            if (e.repeat) return;
            shiftPressTime = Date.now();
            otherKeyPressed = false;
            shiftLongPressTimer = setTimeout(() => {
                if (!otherKeyPressed && isActive && !autopilotTimer) {
                    startAutopilot();
                }
            }, CONFIG.longPressDelay);
            return;
        } else {
            otherKeyPressed = true;
            if (shiftLongPressTimer) { clearTimeout(shiftLongPressTimer); shiftLongPressTimer = null; }
        }

        // Key Disable List (Excluding character input keys)
        if (['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5'].includes(e.code)) e.preventDefault();
        // G, 0, 9 come as characters when single-pressed in AHK, so do not preventDefault here
        if (['KeyW', 'KeyS', 'KeyA', 'KeyD', 'KeyE', 'KeyQ', 'KeyX', 'KeyZ', 'KeyR', 'KeyT', 'KeyF', 'KeyC', 'KeyV', 'KeyB'].includes(e.code)) {
            e.preventDefault(); e.stopPropagation();
        }

        switch (e.code) {
            case 'KeyW': resyncCurrentIndex(); focusArticle(currentIndex - 1); break;
            case 'KeyS': resyncCurrentIndex(); focusArticle(currentIndex + 1); break;
            case 'KeyQ': if (window.xOpsPrevTarget) window.xOpsPrevTarget(); break;
            case 'KeyE': if (window.xOpsNextTarget) window.xOpsNextTarget(); break;
            case 'KeyD': executeAction('like'); break;
            case 'KeyA': executeAction('repost'); break;
            case 'KeyX': resyncCurrentIndex(); xOpsHandleDelete(targetArticles[currentIndex]); break;
            case 'KeyF': if (!xOpsCancel()) toggleCheatSheet(); break;
            case 'KeyC': utilityCopyUrl(); break;
            case 'KeyV': if (window.xOpsToggleStar) window.xOpsToggleStar(); break;
            case 'KeyB': if (window.xOpsNextStar) window.xOpsNextStar(); break;
            case 'KeyZ': utilityReset(); break;
            case 'KeyR': location.reload(); break;
            case 'KeyT': if (window.xOpsGoProfile) window.xOpsGoProfile(); break;

            // G Key: Handled by AHK, so JS assignment removed (Function saved as xOpsOpenSwitcher)
            // case 'KeyG': ...

            case 'Digit1': window.location.href = 'https://x.com/home'; break;
            case 'Digit2': window.location.href = 'https://x.com/notifications'; break;
            case 'Digit3': resyncCurrentIndex(); xOpsOpenMenu(targetArticles[currentIndex]); break;
            case 'Digit4': resyncCurrentIndex(); xOpsOpenDetail(targetArticles[currentIndex]); break;
            case 'Digit5': xOpsOpenSettings(); break;
        }
    }, true);

    setInterval(syncFromStorage, 500); syncFromStorage();
})();