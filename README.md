# ⚔️ X-Ops-Vanguard

> **"Latency is the enemy. The mouse is a crutch."**

![Status](https://img.shields.io/badge/Status-Active-success?style=for-the-badge) ![Platform](https://img.shields.io/badge/Platform-Windows%20%7C%20Firefox%20%7C%20Chrome-blue?style=for-the-badge) ![License](https://img.shields.io/badge/License-MIT-orange?style=for-the-badge)

**X-Ops-Vanguard** is a suite of military-grade navigation tools and "Operator" scripts designed for the modern power user. It transforms passive web browsing into an active, keyboard-centric command environment.

> *"Born from the trenches of heavy-duty operations."*

## 🧬 The Vanguard Doctrine
**X-Ops Vanguard** originates from a private, monolithic ecosystem built for high-volume workflows and rigorous account management. We are now **decoupling** the most battle-tested features from this core system.

We reject the "passive consumption" of modern UIs. We embrace the **Tech Ronin** aesthetic:
*   **Zero Latency**: Bypass heavy DOM rendering. Speed is life.
*   **Keyboard Supremacy**: The mouse is a backup. Vim-bindings are the standard.
*   **Memory Discipline**: Aggressively purge bloat. Keep the footprint zero.

## 🎯 The Mission
Modern web interfaces are designed for **retention**—slowing you down to show you ads.
**Vanguard** is designed for **extraction**—getting you what you need, instantly.

*   🚫 **No Mouse**: Vim-style navigation everywhere.
*   ⚡ **No Lag**: Bypass heavy DOM rendering with direct injection.
*   🛡️ **No Noise**: Aggressively sanitize ads, engagement traps, and clutter.

---

## 📂 The Arsenal

### 🔴 X (Twitter) Ops
| Tool | Description | Tech |
| :--- | :--- | :--- |
| **[Timeline Walker](tools/05-timeline-walker)** | Keyboard-driven navigation, "Zen" mode, and autopilot scrolling. | `.user.js` + `.ahk` |
| **[Cleaner Droid](tools/07-cleaner-droid)** | Automated post deletion with "Human Jitter" to evade bot detection. | `.user.js` |

### 🔵 Google Ops
| Tool | Description | Tech |
| :--- | :--- | :--- |
| **[Gemini Command](tools/04-gemini-command)** | Turn Gemini into a Vim-like command cockpit. Export to Obsidian. | `.user.js` |
| **[Search Commando](tools/03-search-commando)** | Domain blocking, result starring, and time-warp toggles (Past Year/Month). | `.user.js` |
| **[Keep Satellite](tools/06-keep-satellite)** | Persistent Keep overlay for any website. | `.user.js` |

### 🦊 System Ops
| Tool | Description | Tech |
| :--- | :--- | :--- |
| **[Fox Walker](tools/01-fox-walker)** | Bypass Firefox sidebar lag with a transparent HUD overlay. | `.ahk` |
| **[Focus Dimmer](tools/02-focus-dimmer)** | "Hole-punch" screen dimmer with Neon Borders and Smart Buffering for cinematic focus. | `.ahk` |

---

## ⚡ Quick Start (Global Keymap)

While each tool has specific bindings, the **Vanguard Protocol** shares a common DNA:

| Key | Function |
| :--- | :--- |
| **W / S** | Navigate Up / Down (Item by Item) |
| **A / D** | Previous / Next (Tab or Page) |
| **X** | **Execute / Destroy** (Close Tab, Block Domain, Delete Post) |
| **Space** | Trigger / Expand |
| **Esc** | **Toggle Command Mode** (ON/OFF) |

> **Note**: Most scripts start in **Command Mode**. Press `Esc` to toggle "Insert Mode" when you need to type in a search bar.

## 🛡️ Unverified Notice (Beta Tools)
> [!WARNING]
> **Experimental Modules**: The following tools are currently in **Beta** after being decoupled from the core system. They are undergoing independent verification.
> *   `tools/01-fox-walker/foxwalker-v4.ahk`
> *   `tools/08-watchman-agent/watchman.ahk`
> *   `tools/09-window-velocity/velocity.ahk`
>
> Please report any issues or regressions in the Issues tab.

---

## 🏗️ Recommended Stacks (Best Practices)

To maximize efficiency, combine tools based on your mission profile:

| Mission Profile | Tools | Use Case |
| :--- | :--- | :--- |
| **Deep Research** | `Fox Walker` + `Search Commando` + `Keep Satellite` | High-speed information gathering, tab management, and note-taking. |
| **Social Ops** | `Timeline Walker` + `Cleaner Droid` + `Fox Walker` | managing multiple X accounts, cleaning history, and rapid timeline navigation. |
| **Command Center** | `Window Velocity` + `Focus Dimmer` + `Gemini Command` | Managing multiple browser instances (FFP), layout control, and AI command execution. |
| **The Watchman** | `Watchman Agent` + `Fox Walker` | Automated tab cycling and monitoring with "Human Jitter". |

---


## 📦 Installation

### Prerequisites
1.  **UserScript Manager**: [Tampermonkey](https://www.tampermonkey.net/) (Recommended).
2.  **AutoHotkey**: [AutoHotkey v2](https://www.autohotkey.com/) (For `.ahk` tools).

### Setup
1.  Clone this repository.
2.  **For JS Tools**: Open the `.user.js` file in your browser -> Tampermonkey will ask to install.
3.  **For AHK Tools**: Right-click the `.ahk` file -> "Run Script".

---

## 🤝 Contributing
The Vanguard Codebase follows strict **"Zero-Latency"** guidelines.
*   **PRs must not increase input latency.**
*   **No external dependencies** (jQuery, etc.) unless absolutely necessary.
*   **Dark Mode First.**

## 📄 License
MIT License. See [LICENSE](LICENSE) for details.
