# ♊ Gemini Command Module (GCM)

> *Don't just chat. Command.*

**Gemini Command Module** is a UserScript designed to transform the Google Gemini UI into a keyboard-centric, high-speed command cockpit. It eliminates the friction of manual scrolling and copy-pasting, enabling **"Zero Latency" context extraction** directly into your knowledge base (Obsidian).

![Status](https://img.shields.io/badge/Status-Active-success?style=for-the-badge) ![Version](https://img.shields.io/badge/Version-4.9.43-blue?style=for-the-badge)

## ⚡ Key Features

* ** Vim-Style Navigation:** Traverse chat blocks instantly with `W` (Up) and `S` (Down). No more mouse scrolling.
* ** 💎 Zero Latency Extraction:**
    * **Press `X`:** Formatting specific prompt/response pairs and send them directly to **Obsidian** via URI scheme.
    * **Press `C` / `Shift+C`:** Copy plain text or Markdown-formatted text instantly.
* ** ★ Persistent Star:** Mark important messages with `V`. Stars are saved locally and persist across reloads. Jump between stars with `B`.
* ** 🛡️ Mode Management:** Strict separation between **Command Mode** (Navigation) and **Edit Mode** (Input). Prevents accidental hotkey triggers while typing.
* ** 👁️ Focus Shield:** Automatically blurs input fields when in Command Mode to keep focus on the timeline.

（DEMO）
https://github.com/user-attachments/assets/51db0469-7494-41f0-a73a-704fbbb97909


## 🎮 Controls (Command Mode)

| Key | Action | Description |
| :--- | :--- | :--- |
| **W / S** | **Navigate** | Move focus up / down between message blocks. |
| **Z** | **Jump Bottom** | Instantly scroll to the latest message. |
| **X** | **Extract (Obsidian)** | Send focused block to Obsidian as a new note. |
| **C** | **Copy** | Copy text to clipboard. |
| **Shift+C**| **Copy Raw** | Copy text (Markdown style) for manual fallback. |
| **V** | **Star / Unstar** | Toggle "Star" on the current block. |
| **B / Shift+B** | **Jump Star** | Jump to next / previous starred message. |
| **T** | **Global Fold** | Collapse/Expand all messages for a bird's-eye view. |
| **G** | **Toggle Sidebar** | Show/Hide the sidebar to maximize screen real estate. |
| **/** | **Input** | Enter Edit Mode (Focus input box). |
| **Esc** | **Command Mode** | Exit Edit Mode / Return to Command Mode. |


## 📥 Installation (Zero Latency)

1.  Install a UserScript manager like **[Tampermonkey](https://www.tampermonkey.net/)**.
2.  **[👉 Click here to Install Script (v4.9.43)](./gemini-command-module.user.js)**
*(Requires Tampermonkey)*
3.  Open [Google Gemini](https://gemini.google.com/) and press `Esc` to engage.


### ⚠️ Troubleshooting (Chrome Users)

If the script does not load after installation:
1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Details** on Tampermonkey
4. **Turn ON "Allow access to file URLs"** (Crucial step!)
5. Reload Gemini.


## 🛠️ Configuration

To link your Obsidian Vault directly:
1. Open Tampermonkey dashboard.
2. Edit the script.
3. Locate the `CONFIG` object at the top.

```javascript
const CONFIG = {
    // Set your vault name here (e.g., "MyNotes")
    obsidianVault: "YOUR_VAULT_NAME",
    // ...
};
```

You can customize colors and URI schemes in the `CONFIG` object at the top of the script.

```javascript
const CONFIG = {
    colors: {
        focusBorder: '#00D0FF', // Cyber Blue
        star: '#ffd400',       // Gold
    }

};
```

## 📝 License 

MIT License. Feel free to modify and fork!


