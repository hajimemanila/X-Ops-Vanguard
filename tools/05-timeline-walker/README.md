# 🦅 X Timeline Walker

> *Navigate the stream without touching the water.*

**Timeline Walker** is a hybrid AHK/JS tool designed for rapid, low-latency navigation of the X (Twitter) timeline. It decouples the "scrolling" action from the "reading" action, allowing for a detached, high-speed information intake flow.

## ⚡ Features

*   **👻 Phantom Mode**: The script highlights tweets legally but does not trigger "engagement" metrics (like view counts or read receipts) until you explicitly interact.
*   **🚀 Autopilot**: Press `Shift` (Long Press) to engage cruise control. The timeline scrolls automatically at a readable pace.
*   **🧘 Zen Mode**: Tweets not in focus are dimmed to 50% opacity, reducing visual noise and cognitive load.
*   **🎨 Age-Coded**: Timestamps change color based on tweet age:
    *   🟢 **Green**: Fresh (< 4 days)
    *   🟡 **Yellow**: Stale (< 30 days)
    *   🔴 **Red**: Ancient (> 30 days)

## 🎮 Controls

| Key | Action | Description |
| :--- | :--- | :--- |
| **W / S** | **Scroll** | Move focus Up / Down one tweet at a time. |
| **Shift (Hold)**| **Autopilot** | Engage automatic scrolling. Release to stop. |
| **D** | **Like** | Like the current tweet. |
| **A** | **Repost** | Open Repost menu (Press again to confirm). |
| **C** | **Copy** | Copy the tweet URL to clipboard. |
| **Z** | **Reset** | Scroll to top and clear focus. |
| **Space + Ctrl + Alt** | **Activate** | Toggle the Walker ON/OFF. |

## 📦 Installation

1.  **UserScript**: Install `timeline-walker.user.js` in Tampermonkey.
2.  **AutoHotkey**: Run `timeline-walker.ahk` (if available) for global key interception (Optional but recommended for smoother scrolling).

> **Note**: This tool works best when X's "Data Saver" mode is **OFF** and "Autoplay Video" is **OFF**.
