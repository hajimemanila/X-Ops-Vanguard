# 🦊 Fox Walker

**The "Zero-Lag" Navigation Suite for Firefox Power Users.**

Fox Walker is an AutoHotkey script designed specifically for users of **Tree Style Tab**, **Sidebery**, or **Container Tab Groups**.
It creates a transparent "Operation Layer" over your browser, allowing you to navigate, close, and discard tabs using keyboard shortcuts that **completely bypass the heavy sidebar DOM**.

![Fox Walker HUD Demo](assets/hud-demo.png)
*(Recommended: Add a screenshot of the HUD overlay here)*

## 🛑 The Problem
If you are a "Tab Hoarder" with 500+ tabs in a vertical sidebar, you know the pain:
1.  **UI Lag:** Clicking a tab in the sidebar triggers heavy DOM rendering.
2.  **Memory Leaks:** Interaction with the sidebar prevents garbage collection.
3.  **Mouse Fatigue:** Constantly moving the cursor to the edge of the screen.

## ⚡ The Solution: "Stop Clicking"
Fox Walker intercepts your key presses and sends native commands directly to Firefox's background process.
* **Bypass the Sidebar:** Navigate tabs without triggering sidebar repaints.
* **Head-Up Display (HUD):** See your current container and tab title on a transparent overlay.
* **Memory Discipline:** Double-tap `G` to discard tabs via extensions instantly.

## 🎮 Controls (WASD Layout)
Activate **Walker Mode** by double-tapping `[ESC]`.

| Key | Action | Note |
| :--- | :--- | :--- |
| **ESC (x2)** | **Toggle ON/OFF** | Double-tap to enter/exit Walker Mode. |
| **W / S** | Scroll Up / Down | Standard PageUp/Down behavior. |
| **A / D** | Prev / Next Tab | Instant switching. |
| **Space** | Next Tab | Alternative navigation. |
| **Shift+Space** | Prev Tab | Alternative navigation. |
| **G (x2)** | **Discard Tab** | Triggers 'Auto Tab Discard' (Ctrl+Alt+D). |
| **X (x2)** | Close Tab | Closes current tab. |
| **Z (x2)** | Undo Close | Reopens last closed tab. |
| **0 (x2)** | Close Others | Requires 'Close Tab Shortcuts' extension. |
| **M (x2)** | Mute Toggle | Mutes/Unmutes tab. |
| **L (x2)** | Focus URL | Jumping to the address bar. |
| **?** | Cheat Sheet | Hold to see keymap. |

## ⚙️ Installation & Setup

### 1. Prerequisites
* Windows 10/11
* **[AutoHotkey v2](https://www.autohotkey.com/)** installed.
* **Firefox** (Developer Edition / Nightly / Stable).

### 2. Recommended Extensions
For the best experience, map the following shortcuts in your Firefox extension settings:

* **[Auto Tab Discard](https://addons.mozilla.org/en-US/firefox/addon/auto-tab-discard/)** -> Map "Discard current tab" to `Ctrl + Alt + D`.
* *(Optional)* **[Close Tab Shortcuts](https://addons.mozilla.org/en-US/firefox/addon/close-tab-shortcuts/)** -> Map "Close other tabs" to `Alt + W`.

### 3. Running
1.  Download `FoxWalker.ahk`.
2.  Double-click to run.
3.  Open Firefox and double-tap `ESC` to start walking.

## 🔧 Configuration
You can customize key bindings at the top of the `FoxWalker.ahk` file:

```autohotkey
global KEY_NEXT_TAB     := "^{PgDn}"
global KEY_DISCARD      := "^!d"
...