# Contributing to X-Ops-Vanguard

**The Vanguard Protocol demands efficiency.**
We welcome contributions that align with our philosophy of **Zero Latency** and **Keyboard Supremacy**.

## 🔴 The Rules of Engagement

### 1. Zero Latency Policy
*   **Do not introduce blocking code.** All heavy operations must be async or backgrounded.
*   **No heavy frameworks.** Vanilla JS and AHK only. No jQuery, no React, no Electron.
*   **Bypass the DOM.** If you can achieve a result by talking to the browser api (AHK) or data layer (JS) instead of clicking an element, do it.

### 2. Keyboard First
*   Every feature must be accessible via keyboard.
*   Mouse interaction should be optional or for "Emergency Use Only".
*   Use Vim-standard bindings (`H` `J` `K` `L`) where applicable.

### 3. The "Phantom" Principle
*   **Do not trigger engagement metrics.** Scripts should allow reading/viewing without notifying the host server (e.g., prevent "Seen" receipts, prevent "View Count" increments where possible).

## 🛠️ Development Setup

### UserScripts
1.  Use `eslint` with the provided config (clean code is fast code).
2.  Test on both Firefox (Gecko) and Chrome (Blink).

### AutoHotkey
1.  Code for **AHK v2**.
2.  Keep global pollers (`SetTimer`) to a minimum. Use Event Hooks (`WinWait`, `OnMessage`) where possible.

## 📝 Pull Request Process
1.  **Describe the tactical advantage.** What friction does this change remove?
2.  **Benchmark it.** If you claim "faster", prove it.
3.  **Update the Manual.** If you add a keybinding, add it to the README table.

---
*"Speed is life."*
