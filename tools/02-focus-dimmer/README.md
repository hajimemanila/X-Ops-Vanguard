# 🌑 Focus Dimmer

> *The world is noisy. Your screen shouldn't be.*

**Focus Dimmer** is an AutoHotkey utility that creates a "Cinematic Focus" environment. It dims everything on your screen *except* the active window, effectively punching a hole through the darkness.

## ⚡ Features

*   **🔦 Hole-Punch Dimming**: Only the active window remains bright. Everything else fades to black (or your chosen color).
*   **🌈 Neon Borders**: The active window is highlighted with a subtle, pulsing neon border to give instant visual feedback of focus state.
    *   **Context Aware**: Border color changes based on the application (e.g., Purple for `FFP1`, Green for `FFP2`).
*   **🧠 Smart Buffering**:
    *   **Light Buffer (50ms)**: Instant switching for rapid workflow.
    *   **Heavy Buffer (800ms)**: Delays dimming changes when a video player (like YouTube) loads, preventing screen flashing.
*   **👀 Peek Mode**: Hold `Alt` to temporarily see through the darkness and check background windows.

## 🎮 Controls

| Key | Action |
| :--- | :--- |
| **Shift + F9** | **Toggle ON** |
| **Shift + F10** | **Toggle OFF** |
| **Shift + F5 / F6** | Decrease / Increase Dimming Level (±5) |
| **Shift + F7 / F8** | Decrease / Increase Dimming Level (±25) |
| **Alt (Hold)** | **Peek Mode** (Temporarily turn off dimming) |

## 📦 Installation

1.  Download `focusdimmer.ahk`.
2.  Run with **AutoHotkey v2**.
3.  The script starts automatically in **ON** mode.

## 🔧 Configuration
You can tweak the physics of the dimmer at the top of the script:

```autohotkey
Config.DimColor := "000000"   ; Background color
Config.DimLevel := 150        ; Opacity (0-255)
Config.BufferTime_Heavy := 800 ; Stabilization delay for video
Config.BaseGlowColor := "00D0FF" ; Default neon border color
```
