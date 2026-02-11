; ==========================================================
; AutoHotKey Script: Window Velocity (v1.0)
; Description: FFP Instance Manager & Window Layout Engine
; Author: X Ops Architect
; ==========================================================
#Requires AutoHotkey v2.0
#SingleInstance Force

; ==========================================================
; ⚙️ Configuration
; ==========================================================
global FFP_Configs := [
    "C:\Users\Predator\Desktop\FFP\FFP1\FirefoxPortable",
    "C:\Users\Predator\Desktop\FFP\FFP2\FirefoxPortable",
    "C:\Users\Predator\Desktop\FFP\FFP3\FirefoxPortable",
    "C:\Users\Predator\Desktop\FFP\FFP4\FirefoxPortable",
    "C:\Users\Predator\Desktop\FFP\FFP5\FirefoxPortable"   
]
global FFP_Windows := [] 

; Zone Definitions
global Coords_ABC := {X:1020, Y:5, W:1305, H:1029}
global Zone_Center   := {X:1020, Y:5, W:1305, H:1029}
global Zone_LeftTop  := {X:5, Y:5, W:1018, H:584}
global Zone_LeftBtm  := {X:-2, Y:589, W:1032, H:444}
global Zone_LeftFull := {X:-2, Y:5, W:1032, H:1029}
global Zone_Custom   := {X:400, Y:50, W:1700, H:950}
global Zone_Laptop   := {X:2553, Y:-288, W:1721, H:1033}

; StreamDeck Overlay Enforcer
global VSD_Process := "ahk_exe StreamDeck.exe"
GroupAdd "VSD_Group", VSD_Process
SetTimer EnforceVSDAlwaysOnTop, 2000

; ==========================================================
; 🎮 Key Bindings (Function Keys)
; ==========================================================

; [F1] Identity: Scan all running FFP instances and map them
F1::Execute_Identity()

; [F2] Coordinates: Copy current window size/position to clipboard
F2::
{
    try {
        WinGetPos &X, &Y, &W, &H, "A"
        CopyText := "{X:" X ", Y:" Y ", W:" W ", H:" H "}"
        A_Clipboard := CopyText
        MsgBox "Coordinates Copied!`n" . CopyText, "Velocity Info"
    }
}

; [F13] Move All FFP: Force move all recognized FFP windows to default zone
F13::Execute_MoveFFP()

; [F21] Scan & Move: Auto-Identify and then Move
F21::
{
    Execute_Identity()
    Sleep 200
    Execute_MoveFFP()
}

; [F14] Cycle Stack: Move current window to bottom or bring top managed window to front
F14::
{
    try {
        ActiveID := WinGetID("A")
        if IsWindowManaged(ActiveID) {
            WinMoveBottom "ahk_id " ActiveID
            Sleep 50 
            ActivateTopManagedWindow()
        } else {
            ActivateTopManagedWindow()
        }
    }
}

; Zone Movement Shortcuts
F15::MoveActiveWindow(Zone_Center)
F16::MoveActiveWindow(Zone_LeftTop)
F17::MoveActiveWindow(Zone_LeftBtm)
F18::MoveActiveWindow(Zone_LeftFull)
F19::MoveActiveWindow(Zone_Custom)
F20::MoveActiveWindow(Zone_Laptop)

; [F22] PWA/App Selector: Cycle through specific apps (YouTube, Gmail, Keep)
F22::
{
    ExcludeApps := ["YouTube", "Gmail", "Google Keep"] 
    IDs := WinGetList("ahk_exe chrome.exe")
    For id in IDs {
        try {
            TargetTitle := WinGetTitle("ahk_id " id)
            IsPWA := False
            For AppName in ExcludeApps {
                if InStr(TargetTitle, AppName) {
                    IsPWA := True
                    break
                }
            }
            if (!IsPWA) {
                MoveSpecificWindow(id, Zone_Custom)
                WinActivate "ahk_id " id
                return
            }
        }
    }
}

; [Ctrl+Shift+Alt+Y] Launch/Focus YouTube
^+!y::
{
    ShortcutPath := A_Desktop "\YouTube.lnk"
    TargetTitle := "YouTube ahk_exe chrome.exe"
    if WinExist(TargetTitle) {
        WinActivate
        WinWaitActive TargetTitle, , 1
        Send "k"
    } else {
        try Run ShortcutPath
    }
}

; Broadcast Keys
F23::BroadcastKey("{F23}")
F24::BroadcastKey("{F24}")

; Tab Navigation (Mapped to F11/F10 for external control)
F11::Send "^{Tab}"
F10::Send "^+{Tab}"

; [Ctrl+Alt+Shift+Esc] Keyboard Reset Force
^!+Esc::
{
    Send "{Alt down}{Alt up}{Ctrl down}{Ctrl up}{Shift down}{Shift up}{LWin down}{LWin up}"
    ToolTip "🔄 Keyboard Input Reset"
    SetTimer () => ToolTip(), -1000
}

; ==========================================================
; 🛠️ Core Functions
; ==========================================================

Execute_Identity() {
    global FFP_Windows := []
    Loop FFP_Configs.Length
        FFP_Windows.Push([]) 
    IDs := WinGetList("ahk_exe firefox.exe")
    Count := 0
    For this_id in IDs {
        try {
            if (WinGetTitle("ahk_id " this_id) = "")
                continue
            this_path := WinGetProcessPath("ahk_id " this_id)
            For index, config_path in FFP_Configs {
                if InStr(this_path, config_path) {
                    FFP_Windows[index].Push(this_id)
                    Count++
                    break
                }
            }
        }
    }
    Msg := "ID Scan Complete (Total: " Count ")\n"
    Loop FFP_Windows.Length
        Msg .= "FFP" A_Index ": " FFP_Windows[A_Index].Length " windows\n"
    MsgBox Msg, "Velocity Scan", "T1.5"
}

Execute_MoveFFP() {
    For index, window_list in FFP_Windows {
        For hwnd in window_list {
            if WinExist("ahk_id " hwnd)
                MoveSpecificWindow(hwnd, Coords_ABC)
        }
    }
}

MoveSpecificWindow(targetID, targetZone) {
    try {
        WinRestore "ahk_id " targetID
        WinMove targetZone.X, targetZone.Y, targetZone.W, targetZone.H, "ahk_id " targetID
        Sleep 50
        WinMove targetZone.X, targetZone.Y, targetZone.W, targetZone.H, "ahk_id " targetID
    }
}

MoveActiveWindow(targetZone) {
    try {
        ActiveID := WinGetID("A")
        MoveSpecificWindow(ActiveID, targetZone)
    }
}

BroadcastKey(keyName) {
    For index, window_list in FFP_Windows {
        For hwnd in window_list {
            if WinExist("ahk_id " hwnd)
                try ControlSend keyName,, "ahk_id " hwnd
        }
    }
}

IsWindowManaged(targetID) {
    For index, window_list in FFP_Windows {
        For hwnd in window_list {
            if (hwnd = targetID)
                return true
        }
    }
    return false
}

ActivateTopManagedWindow() {
    AllWins := WinGetList()
    For id in AllWins {
        if IsWindowManaged(id) {
            try WinActivate "ahk_id " id
            return
        }
    }
}

EnforceVSDAlwaysOnTop() {
    try {
        VSD_List := WinGetList(VSD_Process)
        For this_vsd_id in VSD_List {
            Style := WinGetStyle("ahk_id " this_vsd_id)
            if !(Style & 0x10000000)
                continue
            if (Style & 0x40000 || Style & 0x20000)
                WinSetAlwaysOnTop 0, "ahk_id " this_vsd_id
            else
                WinSetAlwaysOnTop 1, "ahk_id " this_vsd_id
        }
    }
}
