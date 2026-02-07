# X Ops Vanguard [![X Ops Vanguard - Zero Latency](https://img.shields.io/badge/X_OPS_VANGUARD-Zero_Latency-000000?style=for-the-badge&logo=rocket&logoColor=white)](https://github.com/hajimemanila/X-Ops-Vanguard)

**Experimental navigation suites and automation tools for power users.**

> *Stop clicking. Start operating.*

![Header Image](tools/01_fox-walker/assets/header-image.jpg)

## 🚀 Concept
X Ops Vanguard is a collection of tools designed to bypass UI bottlenecks.
We focus on **Zero Latency**, **Keyboard-Centric Workflows**, and **Memory Discipline**.
If you find modern GUIs sluggish or inefficient, you are in the right place.

**"Born from the trenches of heavy-duty operations."**

X Ops Vanguard originates from a massive, private monolithic environment built for high-volume workflows and rigorous account management. We are now **decoupling** the most battle-tested and essential features from this core system, refining them into standalone tools, and **releasing them sequentially** to the public.

- **Battle-Tested:** Proven in harsh, real-world environments.
    
- **Selectively Extracted:** Only the most effective tools make the cut.
    
- **Modular Release:** Rolling out powerful functions one by one.

![Concept Image](tools/01_fox-walker/assets/xops-concept.jpg)

## 🛠️ Tools

| Tool | Description | Status |
| :--- | :--- | :--- |
| **[Fox Walker](./tools/01_fox-walker)** | A "No-Click" navigation overlay for Firefox vertical tab users (TST/Sidebery). Bypasses sidebar DOM lag. | ✅ **Active** |
| **Focus Dimmer**                        | A modern, resource-efficient screen dimmer designed for multitasking and "watch-while-working" workflows.                  | 🚧 WIP       |
| **[Zero Trace](./tools/03_zero-trace)** | A heuristic timeline sanitizer designed for X (formerly Twitter) Unlike traditional "mass deletion" bots that trigger account locks. | 🚧 WIP       |
| **Keep Satellite**                      | Turn your browser into a command cockpit. Control your Google Keep context from anywhere.                                  | 🚧 WIP       |
| **Universal Chat Controller**           | Enter for New Line, Ctrl+Enter to Send. Prevent accidental message sending on sites like Gemini, ChatGPT, Claude, Discord. | 🚧 WIP       |
| **X Auto Liker**                        | (Coming Soon)                                                                                                              | 🚧 WIP       |
| **Gemini Command Module**               | (Coming Soon)                                                                                                              | 🚧 WIP       |

## 📦 Requirements

The tools in this repository are categorized into **Desktop Automation** (AHK) and **Browser Injection** (UserScripts).

### 🖥️ System & Runtime
* **Windows 10 / 11**
* **[AutoHotkey v2](https://www.autohotkey.com/)**
    * *Required for:* Fox Walker, Focus Dimmer, and system-level automation.

### 🌐 Browser Environment
* **Mozilla Firefox** (Highly recommended)
    * *Note: While UserScripts work on any browser, tools like **Fox Walker** are specifically engineered for the Firefox vertical tab ecosystem.*
* **[Tampermonkey](https://www.tampermonkey.net/)**
    * *Required for:* Universal Chat Controller, X Auto Liker, and other DOM-manipulation modules.

## 📜 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---
*Created by X Ops Architect*
