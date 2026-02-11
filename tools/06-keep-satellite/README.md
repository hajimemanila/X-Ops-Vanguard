# 🛰️ Keep Satellite

> *Your second brain, orbiting your current context.*

**Keep Satellite** is a UserScript that injects a persistent **Google Keep** overlay into *any* website.
It allows you to reference notes, copy code snippets, or perform searches without switching tabs or losing context.

## ⚡ Features

*   **📺 Satellite Overlay**: A toggleable sidebar (Right side) containing your Keep notes.
*   **🔍 Context Filtering (Scope)**:
    *   Type a keyword in the **Blue Input** (`◎ Scope Filter`) to instantly filter notes.
    *   Great for keeping project-specific notes visible while browsing related docs.
*   **⛔ Exclude Filter**: Hide sensitive or cluttering notes (Red Input).
*   **⏬ Remote Scroll**: Control the actual Google Keep host tab from the satellite (useful if the host is on another monitor).

## 🎮 Controls

| Interaction | Action |
| :--- | :--- |
| **Click `◀`** | Open the Satellite Sidebar. |
| **Click `▶`** | Collapse the Sidebar. |
| **Hover Note** | Preview full text. |
| **Click Note** | **Copy** text to clipboard instantly. |

## 📦 Installation

1.  **Install UserScript**: Add `keep-satellite.user.js` to Tampermonkey.
2.  **Open Host**: You must have **one** tab open to `https://keep.google.com/` for the satellite to receive data.
    *   *The script syncs data between the Host Keep tab and the Satellite overlay.*

## 🔧 Configuration
The script uses `GM_setValue` / `GM_getValue` to sync data across tabs. No external server required.
You can customize the width and colors in the `CONFIG` object:

```javascript
const CONFIG = {
    width: '350px',
    color: '#00ba7c', // Main Green
    scope: '#00d4ff', // Cyan for Scope (Context)
};
```
