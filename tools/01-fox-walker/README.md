# 🦊 Fox Walker

> *The "Zero-Lag" Navigation Suite for Firefox Power Users.*

**Fox Walker** is an AutoHotkey script designed specifically for users of **Tree Style Tab**, **Sidebery**, or **Container Tab Groups**.
It creates a transparent "Operation Layer" over your browser, allowing you to navigate, close, and discard tabs using keyboard shortcuts that **completely bypass the heavy sidebar DOM**.

## ⚡ The Solution: "Stop Clicking"
Fox Walker intercepts your key presses and sends native commands directly to Firefox's background process.
*   **Bypass the Sidebar:** Navigate tabs without triggering sidebar repaints.
*   **Head-Up Display (HUD):** See your current container and tab title on a transparent overlay.
*   **Memory Discipline:** Double-tap `G` to discard tabs via extensions instantly.

## 🎮 Controls (WASD Layout)
Activate **Walker Mode** by double-tapping `[ESC]`.

| Key | Action | Note |
| :--- | :--- | :--- |
| **ESC (x2)** | **Toggle ON/OFF** | Double-tap to enter/exit Walker Mode. |
| **W / S** | Scroll Up / Down | Standard PageUp/Down behavior. |
| **A / D** | Prev / Next Tab | Instant switching. |
| **Space** | Next Tab | Alternative navigation. |
| **G (x2)** | **Discard Tab** | Triggers 'Auto Tab Discard' (Ctrl+Alt+D). |
| **X (x2)** | Close Tab | Closes current tab. |
| **Z (x2)** | Undo Close | Reopens last closed tab. |
| **?** | Cheat Sheet | Hold to see keymap. |

## 📦 Installation
1.  **Prerequisites**: Windows 10/11, [AutoHotkey v2](https://www.autohotkey.com/).
2.  **Run**: Double-click `FoxWalker.ahk`.
3.  **Engage**: Open Firefox and double-tap `ESC` to start walking.

## 🔧 Configuration
You can customize key bindings at the top of the `FoxWalker.ahk` file:

```autohotkey
global KEY_NEXT_TAB     := "^{PgDn}"
global KEY_DISCARD      := "^!d"
```