// ==UserScript==
// @name         Keep Satellite (v1.5)
// @namespace    http://tampermonkey.net/
// @version      1.5
// @description  Adds a persistent sidebar and search functionality to Google Keep
// @author       X Ops Architect
// @match        https://keep.google.com/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const CONFIG = {
        width: 300,
        colors: {
            bg: '#202124',
            text: '#e8eaed',
            accent: '#fbbc04',
            border: '#5f6368',
            hover: '#303134'
        },
        storageKey: 'keep_satellite_pinned'
    };

    let pinedNotes = [];
    let sidebar = null;

    // =================================================================
    // 🎨 CSS
    // =================================================================
    const style = document.createElement('style');
    style.textContent = `
        #ks-sidebar {
            position: fixed; top: 0; right: 0; bottom: 0;
            width: ${CONFIG.width}px; background: ${CONFIG.colors.bg};
            border-left: 1px solid ${CONFIG.colors.border};
            z-index: 9999; display: flex; flex-direction: column;
            box-shadow: -2px 0 10px rgba(0,0,0,0.5);
            font-family: 'Roboto', sans-serif;
        }
        #ks-header {
            padding: 15px; border-bottom: 1px solid ${CONFIG.colors.border};
            display: flex; align-items: center; justify-content: space-between;
            background: ${CONFIG.colors.hover};
        }
        #ks-title { font-weight: bold; color: ${CONFIG.colors.accent}; font-size: 16px; margin: 0; }
        #ks-search-box {
            padding: 10px; border-bottom: 1px solid ${CONFIG.colors.border};
        }
        #ks-search-input {
            width: 95%; padding: 8px; border-radius: 4px;
            border: 1px solid ${CONFIG.colors.border};
            background: #000; color: #fff;
        }
        #ks-list {
            flex: 1; overflow-y: auto; padding: 10px;
        }
        .ks-item {
            padding: 10px; border-radius: 8px;
            background: #333; margin-bottom: 8px;
            cursor: pointer; transition: background 0.2s;
            border: 1px solid transparent;
        }
        .ks-item:hover { background: #444; border-color: ${CONFIG.colors.accent}; }
        .ks-item-title { font-weight: bold; color: #fff; margin-bottom: 4px; }
        .ks-item-body { font-size: 12px; color: #aaa; max-height: 40px; overflow: hidden; }
        .ks-empty { text-align: center; color: #777; margin-top: 20px; font-style: italic; }
        
        /* Adjust Main Content */
        body { margin-right: ${CONFIG.width}px !important; }
        .g-0 { margin-right: 0 !important; } /* Fix Keep Grid */
    `;
    document.head.appendChild(style);

    // =================================================================
    // 🧠 Logic
    // =================================================================

    function loadPinned() {
        try {
            const data = localStorage.getItem(CONFIG.storageKey);
            if (data) pinedNotes = JSON.parse(data);
        } catch (e) { pinedNotes = []; }
        renderList();
    }

    function savePinned() {
        localStorage.setItem(CONFIG.storageKey, JSON.stringify(pinedNotes));
    }

    function addCurrentNote() {
        // Try to find open note dialog
        const dialog = document.querySelector('[role="dialog"]');
        if (!dialog) {
            alert("Please open a note first.");
            return;
        }

        const titleEl = dialog.querySelector('[contenteditable="true"][role="textbox"]'); // Keep changes selector often
        // Fallback for title
        const title = titleEl ? titleEl.innerText : "Untitled Note";
        const bodyEl = dialog.querySelectorAll('[contenteditable="true"][role="textbox"]')[1]; // Usually body
        const body = bodyEl ? bodyEl.innerText : "";
        const url = window.location.href; // Keep doesn't update URL for modals, but we can store ID if we parse it (Hard in Keep)

        // Keep URLs are complex. For now, we store Title/Body and try to find it via Search on click.

        const note = {
            id: Date.now(),
            title: title || "No Title",
            body: body.substring(0, 100).replace(/\n/g, ' '),
            timestamp: new Date().toLocaleDateString()
        };

        pinedNotes.unshift(note);
        savePinned();
        renderList();
    }

    function removeNote(id) {
        pinedNotes = pinedNotes.filter(n => n.id !== id);
        savePinned();
        renderList();
    }

    function performSearch(query) {
        if (!query) return;
        // Keep's internal search
        const searchInput = document.querySelector('input[name="q"]');
        if (searchInput) {
            searchInput.value = query;
            searchInput.focus();
            // Enter key simulation
            searchInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', bubbles: true }));
        }
    }

    // =================================================================
    // 🖥️ UI
    // =================================================================

    function createSidebar() {
        if (document.getElementById('ks-sidebar')) return;

        sidebar = document.createElement('div');
        sidebar.id = 'ks-sidebar';
        sidebar.innerHTML = `
            <div id="ks-header">
                <h2 id="ks-title">🛰️ Satellite</h2>
                <button id="ks-add-btn" style="background:none;border:none;cursor:pointer;font-size:16px;">📌</button>
            </div>
            <div id="ks-search-box">
                <input id="ks-search-input" type="text" placeholder="Search Keep...">
            </div>
            <div id="ks-list"></div>
        `;
        document.body.appendChild(sidebar);

        // Bindings
        document.getElementById('ks-add-btn').onclick = addCurrentNote;
        document.getElementById('ks-search-input').onkeydown = (e) => {
            if (e.key === 'Enter') performSearch(e.target.value);
        };

        renderList();
    }

    function renderList() {
        const list = document.getElementById('ks-list');
        if (!list) return;
        list.innerHTML = '';

        if (pinedNotes.length === 0) {
            list.innerHTML = '<div class="ks-empty">No Pins<br><small>Open a note and click 📌</small></div>';
            return;
        }

        pinedNotes.forEach(note => {
            const item = document.createElement('div');
            item.className = 'ks-item';
            item.innerHTML = `
                <div class="ks-item-title">${note.title}</div>
                <div class="ks-item-body">${note.body}</div>
            `;
            item.onclick = () => performSearch(note.title); // Best effort to open
            item.oncontextmenu = (e) => {
                e.preventDefault();
                if (confirm('Unpin this note?')) removeNote(note.id);
            };
            list.appendChild(item);
        });
    }

    // =================================================================
    // 🚀 Init
    // =================================================================
    window.addEventListener('load', () => {
        // Wait for Keep to load
        setTimeout(() => {
            createSidebar();
            loadPinned();
        }, 1000);
    });

})();