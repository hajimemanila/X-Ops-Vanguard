// ==UserScript==
// @name         Gemini Command Module (X Ops Vanguard)
// @namespace    http://tampermonkey.net/
// @version      4.9.43
// @description  Transform Gemini into a keyboard-centric command cockpit. Zero-latency Obsidian extraction.
// @author       X Ops Architect
// @match        https://gemini.google.com/*
// @match        https://gemini.google.com/app/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Prevent Double Loading
    if (window.GCM_LOADED) return;
    window.GCM_LOADED = true;

    console.log("X Ops: Gemini Command Module v4.9.43 Loaded.");

    const CONFIG = {
        targetTopMargin: 120,
        storageKey: 'gcm_starred_signatures_v1',
        doubleTapThreshold: 500,

        // [USER CONFIGURATION]
        // Set your Obsidian Vault name here.
        // If empty (""), the system default vault selector will open.
        // Example: "MyNotes" or "Personal_Vault"
        obsidianVault: "",

        colors: {
            focusBorder: '#00D0FF', // Cyan
            focusBg: 'rgba(0, 208, 255, 0.05)',
            star: '#ffd400',        // Gold
            starMarker: '4px solid #ffd400',
            uiBg: 'rgba(0,0,0,0.9)',
            text: '#00ba7c',
            modeOn: '#00ba7c',      // Green
            modeOff: '#777',        // Gray
            editModeText: '#ccc'
        }
    };
    

    let isCommandMode = true;
    let isGlobalFolded = false;
    let messageList = [];
    let currentFocusedElement = null;
    let sidebarList = [];
    let sbIndex = -1;
    let scrollContainer = null;
    let historyObserver = null;
    let updateTimeout = null;

    let lastRPressTime = 0;
    let lastEPressTime = 0; // 追加
    let lastQPressTime = 0; // 追加
    let starredSignatures = new Set();
    const processedMessages = new WeakSet();
    let userInteractedInput = false;

    function getSignature(el) {
        const text = el.innerText.trim();
        if (!text) return null;
        const head = text.substring(0, 30).replace(/\s/g, '');
        const tail = text.slice(-30).replace(/\s/g, '');
        return `${text.length}:${head}:${tail}`;
    }

    function loadStars() {
        try {
            const data = localStorage.getItem(CONFIG.storageKey);
            if (data) starredSignatures = new Set(JSON.parse(data));
        } catch (e) { console.error('GCM: Load Error', e); }
    }

    function saveStars() {
        try {
            localStorage.setItem(CONFIG.storageKey, JSON.stringify([...starredSignatures]));
        } catch (e) { console.error('GCM: Save Error', e); }
    }

    function isInputContext(target) {
        if (!target) return false;
        if (target.tagName === 'INPUT' && target.type !== 'range' && target.type !== 'checkbox') return true;
        if (target.tagName === 'TEXTAREA') return true;
        if (target.getAttribute && target.getAttribute('role') === 'textbox') return true;
        if (target.getAttribute && target.getAttribute('contenteditable') === 'true') return true;
        if (target.closest && target.closest('[contenteditable="true"]')) return true;
        return false;
    }

    window.addEventListener('mousedown', (e) => {
        const target = e.target;
        if (target.closest('#gcm-panel') || target.closest('#gcm-indicator')) return;

        if (isInputContext(target)) {
            userInteractedInput = true;
            if (isCommandMode) toggleCommandMode(false);
        } else {
            if (!isCommandMode) toggleCommandMode(true);
        }
    }, true);

    // ★ v4.8 Logic: Focus Shield (The "Steal" Logic)
    function focusShieldHandler(e) {
        if (userInteractedInput) return;
        if (!isCommandMode) return;

        if (isInputContext(e.target)) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            e.target.blur();
            return false;
        }
    }
    // Capture phase true is critical here
    window.addEventListener('focus', focusShieldHandler, true);

    // ★ Patch: TrustedHTML Safe Styles
    function injectStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .gcm-focus {
                border-left: 4px solid ${CONFIG.colors.focusBorder} !important;
                background-color: ${CONFIG.colors.focusBg} !important;
                transition: background-color 0.1s;
                outline: none !important;
            }
            .gcm-starred {
                border-right: ${CONFIG.colors.starMarker} !important;
                position: relative;
            }
            .gcm-starred::before {
                content: "★"; position: absolute; right: 5px; top: 5px;
                color: ${CONFIG.colors.star}; font-weight: bold; pointer-events: none;
                z-index: 10;
            }
            .gcm-folded { height: 150px !important; overflow: hidden !important; mask-image: linear-gradient(to bottom, black 60%, transparent 100%); border-bottom: 1px dotted #555; }
            .gcm-hide-temp { display: none !important; }
            #gcm-indicator {
                position: fixed; bottom: 20px; right: 20px;
                background: ${CONFIG.colors.uiBg}; color: ${CONFIG.colors.focusBorder};
                padding: 6px 12px; border-radius: 6px;
                font-family: monospace; font-size: 13px; font-weight: bold;
                z-index: 2147483647 !important;
                border: 1px solid ${CONFIG.colors.focusBorder};
                display: flex; gap: 10px; cursor: default; user-select: none;
                transition: all 0.2s; min-width: 100px; justify-content: center; white-space: nowrap;
            }
            #gcm-indicator.edit-mode {
                border-color: ${CONFIG.colors.modeOff}; color: ${CONFIG.colors.editModeText};
                background: rgba(0,0,0,0.6);
            }
            /* 修正：#gcm-panel の位置とレイアウト */
            #gcm-panel {
                position: fixed;
                top: 68px; /* ヘッダー(約60px)の少し下に配置 */
                right: 16px; /* 標準UIの右端アイコンのインデントに合わせる */
                z-index: 2147483647 !important;
                display: flex;
                gap: 8px;
                flex-direction: row;
                align-items: center;
            }
            .gcm-switch-btn {
                background: rgba(0,0,0,0.8); padding: 4px 10px; border-radius: 20px;
                border: 1px solid #333; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: all 0.2s;
            }
            .gcm-orb { width: 10px; height: 10px; border-radius: 50%; background: #555; transition: background 0.3s, transform 0.3s; }
            .gcm-label { font-size: 10px; color: #ccc; font-family: sans-serif; font-weight: bold; user-select: none; }
            .gcm-switch-btn.active .gcm-orb { background: ${CONFIG.colors.modeOn}; box-shadow: 0 0 5px ${CONFIG.colors.modeOn}; }
            .gcm-switch-btn.active { border-color: ${CONFIG.colors.focusBorder}; }
        `;
        document.head.appendChild(style);
    }

    function findScrollContainer(element) {
        if (!element) return document.documentElement;
        let parent = element.parentElement;
        while (parent) {
            const style = window.getComputedStyle(parent);
            if (style.overflowY === 'auto' || style.overflowY === 'scroll') return parent;
            parent = parent.parentElement;
        }
        return document.documentElement;
    }

    function scheduleUpdate() {
        if (updateTimeout) clearTimeout(updateTimeout);
        updateTimeout = setTimeout(() => {
            updateTargets();
            if (isCommandMode && messageList.length > 0) {
                validateAndRepairFocus();
            }
        }, 150);
    }

    function updateTargets() {
        // セレクタをさらに一般化。メッセージを包む可能性のある全てのコンテナを対象に。
        const baseSelector = 'user-message, model-response, .user-message, .model-response, [data-test-id*="message"], [data-test-id*="response"]';
        let candidates = Array.from(document.querySelectorAll(baseSelector));

        // バックアップスキャン：標準的なセレクタで漏れる場合、特定の構造を持つdivを拾う
        if (candidates.length === 0) {
            candidates = Array.from(document.querySelectorAll('.conversation-container > div, div[role="article"]'));
        }

        messageList = candidates.filter(el => {
            const text = el.innerText.trim();
            // 意味のある長さがあり、かつサイドバー等のシステム要素ではないもの
            return text.length > 0 && !el.closest('nav') && !el.closest('header');
        });

        messageList.forEach(el => {
            if (!processedMessages.has(el)) {
                processedMessages.add(el);
                if (isGlobalFolded) el.classList.add('gcm-folded');
            }
        });

        if (messageList.length > 0 && !scrollContainer) {
            scrollContainer = findScrollContainer(messageList[0]);
        }
        updateIndicator();
    }

    function validateAndRepairFocus() {
        if (currentFocusedElement && !document.body.contains(currentFocusedElement)) {
            currentFocusedElement = null;
            return;
        }
        if (currentFocusedElement && !currentFocusedElement.classList.contains('gcm-focus')) {
            currentFocusedElement.classList.add('gcm-focus');
        }
    }

    function getCurrentIndex() {
        if (!currentFocusedElement || messageList.length === 0) return -1;
        let idx = messageList.indexOf(currentFocusedElement);
        if (idx === -1) {
            updateTargets();
            idx = messageList.indexOf(currentFocusedElement);
        }
        return idx;
    }

    function focusMessage(indexOrElement, isSilent = false) {
        let target = null;
        if (typeof indexOrElement === 'number') {
            let index = indexOrElement;
            if (messageList.length === 0) return;
            if (index < 0) index = 0;
            if (index >= messageList.length) index = messageList.length - 1;
            target = messageList[index];
        } else {
            target = indexOrElement;
        }

        if (currentFocusedElement && currentFocusedElement !== target) {
            if(document.body.contains(currentFocusedElement)){
                currentFocusedElement.classList.remove('gcm-focus');
                currentFocusedElement.removeAttribute('tabindex');
            }
        }

        currentFocusedElement = target;
        if (target) {
            target.classList.add('gcm-focus');

            if (isCommandMode) {
                target.setAttribute('tabindex', '-1');
                target.focus({ preventScroll: true });
            }

            if (!isSilent) {
                if (!scrollContainer) scrollContainer = findScrollContainer(target);
                if (scrollContainer === document.documentElement) {
                    const rect = target.getBoundingClientRect();
                    const absoluteTop = window.pageYOffset + rect.top;
                    window.scrollTo({ top: absoluteTop - CONFIG.targetTopMargin, behavior: 'smooth' });
                } else {
                    const rect = target.getBoundingClientRect();
                    const diff = rect.top - CONFIG.targetTopMargin;
                    scrollContainer.scrollBy({ top: diff, behavior: 'smooth' });
                }
            }
        }
        updateIndicator();
    }

    function moveFocus(dir) {
        updateTargets();
        let currIdx = getCurrentIndex();
        if (currIdx === -1) {
            if (messageList.length > 0) {
               currIdx = (dir > 0) ? 0 : messageList.length - 1;
            }
            focusMessage(currIdx);
        } else {
            focusMessage(currIdx + dir);
        }
    }

    function loadHistoryWithAnchor() {
        updateTargets();
        if (messageList.length === 0) return;

        const anchorText = messageList[0].innerText.substring(0, 50).trim();
        if (!anchorText) return;

        focusMessage(messageList[0]);
        showToast("Loading...");

        if (!scrollContainer) scrollContainer = findScrollContainer(messageList[0]);
        if (historyObserver) historyObserver.disconnect();

        historyObserver = new MutationObserver((mutations) => {
            if (mutations.some(m => m.addedNodes.length > 0)) {
                updateTargets();
                const newAnchor = messageList.find(el => el.innerText.includes(anchorText));
                if (newAnchor) {
                    focusMessage(newAnchor, false);
                    showToast("History Loaded");
                    historyObserver.disconnect();
                    historyObserver = null;
                }
            }
        });

        historyObserver.observe(scrollContainer, { childList: true, subtree: true });
        scrollContainer.scrollTo({ top: 0, behavior: "auto" });
    }

    function toggleGlobalFold() {
        updateTargets();
        isGlobalFolded = !isGlobalFolded;
        messageList.forEach(el => {
            if (isGlobalFolded) el.classList.add('gcm-folded');
            else el.classList.remove('gcm-folded');
        });
        updateSwitches();
        showToast(isGlobalFolded ? "Fold All" : "Expand All");
        if (currentFocusedElement) focusMessage(currentFocusedElement);
    }

    function getVisibleSidebarLinks() {
        const nav = document.querySelector('nav') || document.querySelector('[role="navigation"]');
        if (!nav) return [];
        return Array.from(nav.querySelectorAll('a[href]'))
            .filter(el => {
                const rect = el.getBoundingClientRect();
                return rect.height > 0 && el.offsetParent !== null;
            })
            .sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top);
    }

    function navSidebar(dir, isNewTab) {
        sidebarList = getVisibleSidebarLinks();
        if (sidebarList.length === 0) return;

        if (sbIndex === -1) {
            const currentPath = window.location.pathname;
            sbIndex = sidebarList.findIndex(a => {
                const href = a.getAttribute('href');
                return href && href.includes(currentPath);
            });
            if (sbIndex === -1) sbIndex = 0;
        }

        sbIndex += dir;
        if (sbIndex < 0) sbIndex = 0;
        if (sbIndex >= sidebarList.length) sbIndex = sidebarList.length - 1;

        const target = sidebarList[sbIndex];
        const url = target.href;

        target.focus();
        target.scrollIntoView({ block: 'center' });

        let label = target.innerText.trim() || "Chat";
        if(label.length > 15) label = label.substring(0, 15) + "...";

        if (isNewTab) {
            showToast(`Open Tab: ${label}`);
            window.open(url, '_blank');
        } else {
            showToast(`Go: ${label}`);
            setTimeout(() => { window.location.href = url; }, 300);
        }
    }

    function toggleSidebar() {
        const selectors = [
            'button[aria-label*="Expand menu"]',
            'button[aria-label*="Collapse menu"]',
            'button[aria-label="Main menu"]',
            'button[data-test-id="expansion-panel-button"]',
            '.mat-mdc-button-base[aria-label*="menu" i]'
        ];
        for (const sel of selectors) {
            const btn = document.querySelector(sel);
            if (btn && btn.offsetParent !== null) {
                btn.click();
                showToast("Toggle Sidebar");
                return;
            }
        }
    }

    function jumpBottom() {
        updateTargets();
        if (messageList.length > 0) {
            focusMessage(messageList.length - 1);
            showToast('Bottom');
        }
    }

    function toggleStar() {
        if (!currentFocusedElement) return;
        const sig = getSignature(currentFocusedElement);
        if (!sig) return;

        if (starredSignatures.has(sig)) {
            starredSignatures.delete(sig);
            currentFocusedElement.classList.remove('gcm-starred');
            showToast('Unstar');
        } else {
            starredSignatures.add(sig);
            currentFocusedElement.classList.add('gcm-starred');
            showToast('★ Starred');
        }
        saveStars();
    }

    function jumpStar(dir) {
        updateTargets();
        const starIndices = messageList.map((el, idx) => el.classList.contains('gcm-starred') ? idx : -1).filter(idx => idx !== -1);
        if (starIndices.length === 0) { showToast('No Stars'); return; }
        let currIdx = getCurrentIndex();
        if (currIdx === -1) currIdx = 0;
        let nextIdx = -1;
        if (dir > 0) {
            nextIdx = starIndices.find(idx => idx > currIdx);
            if (nextIdx === undefined) nextIdx = starIndices[0];
        } else {
            const reversed = [...starIndices].reverse();
            nextIdx = reversed.find(idx => idx < currIdx);
            if (nextIdx === undefined) nextIdx = starIndices[starIndices.length - 1];
        }
        if (nextIdx !== -1) focusMessage(nextIdx);
    }

    function toggleFold() {
        if (!currentFocusedElement) return;
        currentFocusedElement.classList.toggle('gcm-folded');
        setTimeout(() => focusMessage(currentFocusedElement), 50);
    }


// ★ 改修: クリーンなテキスト抽出 (指示文のコード改行乱れを徹底除去)
    function extractCleanText(element) {
        if (!element) return "";
        const target = element.querySelector('markdown-renderer') || element;

        // Geminiのコードブロック装飾（コピーボタンや言語ラベル、隠し要素）をすべて除外対象に
        const garbageSelectors = 'button, a[href], svg, img, [role="button"], .mat-icon, [aria-hidden="true"], [data-test-id*="button"], .sr-only, .code-block-decoration, .copy-code-button, .bottom-container';
        const garbage = target.querySelectorAll(garbageSelectors);

        const originalStyles = [];
        garbage.forEach(g => {
            originalStyles.push({ el: g, display: g.style.display });
            g.style.setProperty('display', 'none', 'important');
        });

        // プレーンテキストを取得
        let text = target.innerText.trim();

        // ユーザー指示文の場合、レンダリング時に混入する「3つ以上の連続する改行」を「1つ」に圧縮
        // AI回答側のMarkdown構造（## 見出しなど）には影響を与えないよう判定を厳密化
        const isUserMessage = element.tagName.toLowerCase() === 'user-message' ||
                             element.classList.contains('user-message') ||
                             (!element.closest('model-response') && !element.classList.contains('model-response'));

        if (isUserMessage) {
            // ソースコードの1行おきの空行（\n\n\n）を通常の改行（\n）に修正
            // trim()で全体の前後を整えた後、内部の過剰な空行のみをターゲットにします
            text = text.replace(/\n{2,}/g, '\n');
            // // 等で始まるコードブロックの直前に改行を1つ挿入する例
            text = text.replace(/(\n)(\/\/ ==UserScript==)/, '\n\n$2');
        }

        // 復元
        originalStyles.forEach(s => s.el.style.display = s.display);
        return text;
    }

// ★ 改修: 回答に対応する指示文を特定するロジック (物理DOMスキャン方式を導入)
function getLinkedPrompt(currentEl) {
    // AIの回答かどうかを判定する基準
    const isAI = (el) => {
        if (!el) return false;
        return el.tagName.toLowerCase() === 'model-response' ||
               el.classList.contains('model-response') ||
               el.querySelector('markdown-renderer') !== null ||
               el.getAttribute('data-test-id') === 'model-response';
    };

    // 方法A: messageListの配列内を遡る (既存仕様の維持)
    const currIdx = messageList.indexOf(currentEl);
    if (currIdx > 0) {
        for (let i = currIdx - 1; i >= 0; i--) {
            const candidate = messageList[i];
            if (!isAI(candidate)) {
                const text = extractCleanText(candidate);
                if (text.length > 0) return text;
            }
        }
    }

    // 方法B: 物理的なDOM階層を上に遡る (フォールバック: 配列の不整合対策)
    // AI回答コンテナの親（親階層のさらに兄弟要素）を辿る必要があるため、while文で親を遡る
    let searchEl = currentEl;
    while (searchEl && searchEl !== document.body) {
        let prev = searchEl.previousElementSibling;
        while (prev) {
            // ユーザー投稿の可能性が高い要素（user-messageタグ、または特定のクラス）を探す
            if (prev.tagName.toLowerCase() === 'user-message' ||
               (prev.innerText.trim().length > 0 && !isAI(prev))) {
                const text = extractCleanText(prev);
                if (text.length > 0) return text;
            }
            prev = prev.previousElementSibling;
        }
        searchEl = searchEl.parentElement; // 1つ上の階層へ移動して再検索
    }

    return "";
}

    function copyContent(isMarkdown) {
        if (!currentFocusedElement) return;
        const timestamp = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

        let responseText = "";
        let promptText = "";

        const isAI = currentFocusedElement.tagName.toLowerCase() === 'model-response' ||
                     currentFocusedElement.classList.contains('model-response') ||
                     currentFocusedElement.querySelector('markdown-renderer') !== null;

        if (isAI) {
            responseText = extractCleanText(currentFocusedElement);
            promptText = getLinkedPrompt(currentFocusedElement);
        } else {
            promptText = extractCleanText(currentFocusedElement);
        }

        let clipboardText = "";
        if (isMarkdown) {
            if (promptText) clipboardText += `## 👤 User Prompt (${timestamp})\n\n${promptText}\n\n`;
            if (responseText) clipboardText += `## 🤖 AI Response (${timestamp})\n\n${responseText}\n\n`;
            if (clipboardText) clipboardText += "---\n";
        } else {
            const sep = "--------------------------------------------------";
            if (promptText) clipboardText += `[USER PROMPT] ${timestamp}\n${sep}\n${promptText}\n\n`;
            if (responseText) clipboardText += `[GEMINI RESPONSE] ${timestamp}\n${sep}\n${responseText}\n\n`;
        }

        if (clipboardText) {
            navigator.clipboard.writeText(clipboardText);
            showToast(promptText && responseText ? "Context Linked Copy" : "Copied");
        } else {
            showToast("No content found", "error");
        }
    }

    function smartObsidianSave() {
        // 1. フォールバック: フォーカスが失われている場合は最新メッセージを自動再取得
        if (!currentFocusedElement) {
            updateTargets();
            if (messageList.length > 0) focusMessage(messageList.length - 1, true);
        }
        if (!currentFocusedElement) { showToast("No Target"); return; }

        const timestamp = new Date().toLocaleString();
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const sourceUrl = window.location.href; // Geminiスレッドへのリンク

        let responseText = "";
        let promptText = "";

        const isAI = currentFocusedElement.tagName.toLowerCase() === 'model-response' ||
                     currentFocusedElement.classList.contains('model-response') ||
                     currentFocusedElement.querySelector('markdown-renderer') !== null;

        if (isAI) {
            responseText = extractCleanText(currentFocusedElement);
            promptText = getLinkedPrompt(currentFocusedElement);
        } else {
            promptText = extractCleanText(currentFocusedElement);
        }

        // タイトル生成
        const titleBase = promptText || responseText || "Gemini Clip";
        const safeTitle = titleBase.replace(/[\r\n]+/g, " ").replace(/[\\/:*?"<>|]/g, "").substring(0, 30).trim();
        const titleCandidate = `[Gemini] ${dateStr} ${safeTitle}`;

        // --- 修正箇所: Compact Layout Construction (元の仕様を完全維持) ---

        // ヘッダー: 余計な改行を排除し、コンパクトに
        let headerInfo = `> Captured: ${timestamp} | [Open Thread](${sourceUrl})\n\n`;
        let contentBody = "";
        if (promptText) contentBody += `## 👤 User Prompt\n${promptText}\n\n`;
        if (responseText) contentBody += `## 🤖 AI Response\n${responseText}\n\n`;

        // フッター: ハッシュタグの前に1行だけ空ける
        let footerInfo = "---\n#Gemini #X_Ops";

        // 2. 文字数制限と結合処理 (LIMIT: 4000)
        const LIMIT = 4000;
        // 結合時の区切り文字を考慮した長さ計算
        const combinedLength = headerInfo.length + contentBody.length + footerInfo.length;

        let finalBody = "";

        if (combinedLength > LIMIT) {
            // トリム発生時のバナー (上部配置用に調整)
            const trimBanner = `> [!warning] **TRIMMED** ([Full Text](${sourceUrl}))\n\n`;
            const endMarker = "\n\n... (Trimmed)";

            // 許容サイズ計算
            const availableSpace = LIMIT - (headerInfo.length + trimBanner.length + endMarker.length + footerInfo.length);

            // ★ Patch: Markdown保護 & 余計な改行の完全除去 (安定版ロジック)
            let trimmedContent = contentBody.substring(0, availableSpace);
            const lastNewLine = trimmedContent.lastIndexOf('\n');

            if (lastNewLine > 0) {
                trimmedContent = trimmedContent.substring(0, lastNewLine);
            }

            // 末尾の空白/改行を全て削除
            trimmedContent = trimmedContent.replace(/\s+$/, '');

            // 結合順序の変更 (ヘッダー -> バナー -> 本文 -> マーカー -> フッター)
            finalBody = headerInfo + trimBanner + trimmedContent + endMarker + "\n" + footerInfo;

            showToast("⚠️ Content Trimmed", "error");
        } else {
            // 通常時: 末尾の余計な改行を削除してからフッターを結合
            finalBody = headerInfo + contentBody.replace(/\s+$/, '') + "\n\n" + footerInfo;
        }

        // URIエンコードと起動
        const uri = `obsidian://new?name=${encodeURIComponent(titleCandidate)}&content=${encodeURIComponent(finalBody)}${CONFIG.obsidianVault ? `&vault=${encodeURIComponent(CONFIG.obsidianVault)}` : ''}`;

        window.location.href = uri;
        showToast(promptText && responseText ? 'Context Linked eXport' : 'eXport to Obsidian');
    }

    // ★ Patch: TrustedHTML Safe UI
    function createUI() {
        if (document.getElementById('gcm-indicator')) return;

        const ind = document.createElement('div');
        ind.id = 'gcm-indicator';
        ind.textContent = "COMMAND MODE";
        document.body.appendChild(ind);

        const panel = document.createElement('div');
        panel.id = 'gcm-panel';

        // Helper
        const createBtn = (id, label, onClick) => {
            const btn = document.createElement('div');
            btn.id = id;
            btn.className = 'gcm-switch-btn';
            const orb = document.createElement('div');
            orb.className = 'gcm-orb';
            const txt = document.createElement('div');
            txt.className = 'gcm-label';
            txt.textContent = label;
            btn.appendChild(orb);
            btn.appendChild(txt);
            btn.onclick = (e) => { e.stopPropagation(); onClick(); };
            return btn;
        };

        const modeSw = createBtn('gcm-mode-sw', 'CMD MODE', () => toggleCommandMode(!isCommandMode));
        const foldSw = createBtn('gcm-fold-sw', 'FOLD ALL', () => toggleGlobalFold());

        panel.appendChild(modeSw);
        panel.appendChild(foldSw);
        document.body.appendChild(panel);

        updateSwitches();
    }

    function toggleCommandMode(state) {
        isCommandMode = state;
        updateSwitches();
        updateIndicator();

        if (!isCommandMode) {
            if (currentFocusedElement) currentFocusedElement.removeAttribute('tabindex');
            showToast("EDIT MODE");
        } else {
            showToast("COMMAND MODE");
            if (document.activeElement && isInputContext(document.activeElement)) {
                document.activeElement.blur();
            }
            if (currentFocusedElement) {
                currentFocusedElement.setAttribute('tabindex', '-1');
                currentFocusedElement.focus({ preventScroll: true });
            } else {
                document.body.focus();
                validateAndRepairFocus();
            }
        }
    }

    function updateSwitches() {
        const modeSw = document.getElementById('gcm-mode-sw');
        const foldSw = document.getElementById('gcm-fold-sw');
        const ind = document.getElementById('gcm-indicator');
        if(!modeSw || !foldSw || !ind) return;

        if (isCommandMode) {
            modeSw.classList.add('active');
            ind.classList.remove('off');
        } else {
            modeSw.classList.remove('active');
            ind.classList.add('off');
        }
        if (isGlobalFolded) foldSw.classList.add('active');
        else foldSw.classList.remove('active');
    }

    function updateIndicator() {
        const div = document.getElementById('gcm-indicator');
        if (!div || div.dataset.toast) return;

        if (!isCommandMode) {
            div.innerText = "EDIT MODE";
            div.className = "edit-mode";
            return;
        }

        div.className = "";

        if (messageList.length === 0) {
            div.innerText = "COMMAND MODE";
        } else {
            let idx = -1;
            if (currentFocusedElement && messageList.length > 0) {
                idx = messageList.indexOf(currentFocusedElement);
            }
            const idxDisplay = idx === -1 ? "-" : (idx + 1);
            div.innerText = `MSG: ${idxDisplay} / ${messageList.length}`;
        }
    }

    function showToast(msg, type='default') {
        const div = document.getElementById('gcm-indicator'); if(!div) return;
        div.dataset.toast = "true"; div.innerText = msg;
        div.style.color = type === 'success' ? '#00ba7c' : CONFIG.colors.focusBorder;
        setTimeout(() => {
            delete div.dataset.toast;
            div.style.color = "";
            updateIndicator();
        }, 1500);
    }

    window.addEventListener('keydown', (e) => {
        if (!isCommandMode) {
            if (e.key === 'Escape') {
                e.preventDefault();
                toggleCommandMode(true);
            }
            return;
        }

        if (e.ctrlKey || e.metaKey || e.altKey) return;

        const selection = window.getSelection();
        if (selection && selection.toString().length > 0) return;

        const key = e.key.toUpperCase();
        if (key === 'ESCAPE') { toggleCommandMode(false); return; }

        if (['W','S','D','X','A','Q','E','V','B','C','O','F','Z','T','G','R'].includes(key)) e.preventDefault();

        switch (key) {
            case 'S': moveFocus(1); break;
            case 'W': moveFocus(-1); break;
            case 'A': loadHistoryWithAnchor(); break;
            case 'Z': jumpBottom(); break;
            case 'D': toggleFold(); break;
            case 'T': toggleGlobalFold(); break;
            case 'G': toggleSidebar(); break;
            case 'E': {
                const now = Date.now();
                if (now - lastEPressTime < CONFIG.doubleTapThreshold) {
                    navSidebar(1, e.shiftKey);
                    lastEPressTime = 0; // 発動後はリセット
                } else {
                    showToast("Press E again");
                    lastEPressTime = now;
                }
                break;
            }
            case 'Q': {
                const now = Date.now();
                if (now - lastQPressTime < CONFIG.doubleTapThreshold) {
                    navSidebar(-1, e.shiftKey);
                    lastQPressTime = 0; // 発動後はリセット
                } else {
                    showToast("Press Q again");
                    lastQPressTime = now;
                }
                break;
            }
            case 'V': toggleStar(); break;
            case 'B': jumpStar(e.shiftKey ? -1 : 1); break;

            case 'C': copyContent(e.shiftKey); break;

            case 'X':
            case 'O':
                smartObsidianSave();
                break;

            case 'R': {
                const now = Date.now();
                if (now - lastRPressTime < CONFIG.doubleTapThreshold) {
                    showToast("Reloading...");
                    location.reload();
                } else {
                    showToast("Press R again");
                    lastRPressTime = now;
                }
                break;
            }

            case '/': {
                e.preventDefault();
                toggleCommandMode(false);
                const input = document.querySelector('div[contenteditable="true"]');
                if (input) setTimeout(() => input.focus(), 50);
                break;
            }
        }
    }, true);

    const waitForBody = setInterval(() => {
        if (document.body) {
            clearInterval(waitForBody);
            loadStars();
            injectStyles();
            createUI();

            const observer = new MutationObserver(() => scheduleUpdate());
            observer.observe(document.body, { childList: true, subtree: true });

            updateTargets();
            showToast('GCM Ready');

            // ★ Patch: Force Steal Focus on Load
            if (document.activeElement && isInputContext(document.activeElement)) {
                document.activeElement.blur();
                console.log("GCM: Initial Focus Stolen");
            }
        }
    }, 50);

})();