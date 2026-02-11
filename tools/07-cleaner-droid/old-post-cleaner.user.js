// ==UserScript==
// @name         X Cleaner Droid (v2.0 Watchman)
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  Automatically deletes old posts on X (Twitter). Features jitter wait and Watchman functionality.
// @author       X Ops Architect
// @match        https://twitter.com/*/status/*
// @match        https://x.com/*/status/*
// @match        https://x.com/*/with_replies
// @match        https://twitter.com/*/with_replies
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const CONFIG = {
        daysThreshold: 60, // Delete posts older than X days
        maxDeletions: 50,  // Safety stop per session
        jitterMin: 1000,
        jitterMax: 3000,
        dryRun: false,     // If true, only highlights candidates
        myUsername: 'Predator' // ★ Change this to your handle
    };

    let deletedCount = 0;
    let isRunning = false;
    let watchmanMode = false;

    // =================================================================
    // UI
    // =================================================================
    const panel = document.createElement('div');
    panel.style.cssText = `
        position: fixed; bottom: 20px; left: 20px;
        background: rgba(0,0,0,0.9); color: #fff;
        padding: 10px; border: 1px solid #f4212e;
        border-radius: 8px; z-index: 9999;
        font-family: monospace; font-size: 12px;
        display: none;
    `;
    document.body.appendChild(panel);

    function updateStatus(msg) {
        panel.style.display = 'block';
        panel.innerHTML = `🤖 <b>Cleaner Droid</b><br>${msg}<br>Del: ${deletedCount}`;
    }

    // =================================================================
    // Logic
    // =================================================================

    function parseDate(timeStr) {
        return new Date(timeStr);
    }

    function isOld(date) {
        const now = new Date();
        const diff = now - date;
        const days = diff / (1000 * 60 * 60 * 24);
        return days > CONFIG.daysThreshold;
    }

    function getJitter() {
        return Math.floor(Math.random() * (CONFIG.jitterMax - CONFIG.jitterMin + 1)) + CONFIG.jitterMin;
    }

    async function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async function processTimeline() {
        if (isRunning) return;
        isRunning = true;
        deletedCount = 0;
        updateStatus("Scanning...");

        const articles = document.querySelectorAll('article[data-testid="tweet"]');
        for (const article of articles) {
            if (deletedCount >= CONFIG.maxDeletions) {
                updateStatus("Limit Reached. Stopping.");
                break;
            }

            // Verify User
            const userLink = article.querySelector('a[href^="/"]');
            if (!userLink || !userLink.href.includes(CONFIG.myUsername)) {
                continue; // Skip other users
            }

            const timeEl = article.querySelector('time');
            if (!timeEl) continue;

            const date = parseDate(timeEl.getAttribute('datetime'));
            if (isOld(date)) {
                article.style.border = "2px solid #f4212e";

                if (!CONFIG.dryRun) {
                    updateStatus(`Target Found. Waiting...`);
                    await sleep(getJitter());

                    // Click Menu
                    const caret = article.querySelector('[data-testid="caret"]');
                    if (caret) {
                        caret.click();
                        await sleep(500);

                        // Click Delete
                        const menu = document.querySelector('[role="menu"]');
                        if (menu) {
                            const delBtn = Array.from(menu.querySelectorAll('span')).find(el => el.innerText === 'Delete' || el.innerText === '削除'); // 'Delete' (Japanese)
                            if (delBtn) {
                                delBtn.click();
                                await sleep(500);

                                // Confirm
                                const confirmBtn = document.querySelector('[data-testid="confirmationSheetConfirm"]');
                                if (confirmBtn) {
                                    confirmBtn.click();
                                    deletedCount++;
                                    updateStatus(`Deleted! (${deletedCount})`);
                                    await sleep(2000); // Cool down
                                }
                            }
                        }
                    }
                } else {
                    updateStatus(`Dry Run: Target Found`);
                }
            }
        }

        isRunning = false;
        if (deletedCount === 0) updateStatus("Scan Complete. No targets.");
        else updateStatus("Batch Complete.");
    }

    // =================================================================
    // Watchman
    // =================================================================
    // Monitors a specific post page and deletes replies if they meet criteria (Advanced)
    // For now, simple activation.

    window.addEventListener('keydown', (e) => {
        if (e.altKey && e.code === 'Delete') {
            if (confirm('Start Cleaner Droid?')) {
                processTimeline();
            }
        }
    });

})();