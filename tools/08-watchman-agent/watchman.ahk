; ==========================================================
; AutoHotKey Script: Watchman Agent (v1.0)
; Description: Automated Tab Cycling & Activity Monitor with "Human Jitter"
; Author: X Ops Architect
; ==========================================================
#Requires AutoHotkey v2.0
#SingleInstance Force

; ==========================================================
; ⚙️ Watchman Config
; ==========================================================
global WatchmanActive := false
global SkipCount      := 0       
global MaxSkipLimit   := 30 
global WatchmanGui    := ""
global WatchmanText   := ""

; ==========================================================
; 🎮 Activation (Shift + F22)
; ==========================================================
+F22::
{
    global WatchmanActive := !WatchmanActive
    global SkipCount := 0   
    if (WatchmanActive) {
        UpdateWatchmanOSD("ON")
        SetTimer CycleNextTab, 100
        SoundBeep 1000, 200
    } else {
        UpdateWatchmanOSD("OFF")
        SetTimer CycleNextTab, 0
        SoundBeep 500, 200
    }
}

; ==========================================================
; 🛡️ Watchman Logic (With Human Jitter)
; ==========================================================
CycleNextTab()
{
    global SkipCount, MaxSkipLimit, WatchmanActive 
    if (!WatchmanActive)
        return

    if (SkipCount >= MaxSkipLimit) {
        WatchmanActive := false 
        SetTimer CycleNextTab, 0
        UpdateWatchmanOSD("FINISH")
        SoundBeep 500, 500
        Sleep 1000
        UpdateWatchmanOSD("OFF")
        return
    }

    if (WinActive("ahk_class MozillaWindowClass")) {
        Send "^{PgDn}"
        
        ; [Fix 1] Add jitter to recognition lag (600ms ~ 1200ms)
        Sleep Random(600, 1200) 
        
        CurrentTitle := WinGetTitle("A")
        
        if InStr(CurrentTitle, "[💤") || InStr(CurrentTitle, "[🌙") {
            SkipCount := 0
            UpdateWatchmanOSD("WAKE")
            Loop 10 {
                Sleep 500
                CurrentTitle := WinGetTitle("A")
                if InStr(CurrentTitle, "[♻️") || InStr(CurrentTitle, "[🚀") || InStr(CurrentTitle, "[⚡") {
                    UpdateWatchmanOSD("ACTIVE")
                    Break
                }
            }
            SetTimer CycleNextTab, 1000 
            
        } else if InStr(CurrentTitle, "[♻️") || InStr(CurrentTitle, "[🚀") || InStr(CurrentTitle, "[⚡") {
            SkipCount := 0
            UpdateWatchmanOSD("ACTIVE")
            SetTimer CycleNextTab, 3000
            
        } else if InStr(CurrentTitle, "[☕") || InStr(CurrentTitle, "[⏳") {
            SkipCount := 0
            UpdateWatchmanOSD("WAIT")
            SetTimer CycleNextTab, 1000 
            
        } else {
            ; [Important] Consecutive skips for maintenance tasks
            SkipCount += 1
            UpdateWatchmanOSD("SKIP") 
            
            ; [Fix 2] Jitter for next tab delay (300ms ~ 600ms)
            NextDelay := Random(300, 600)
            SetTimer CycleNextTab, NextDelay 
        }
    } else {
        ; Wait if Firefox is not active
        SetTimer CycleNextTab, 5000
    }
}

; ==========================================================
; 🧩 Watchman OSD (On-Screen Display)
; ==========================================================
UpdateWatchmanOSD(state) {
    global WatchmanGui, WatchmanText, SkipCount, MaxSkipLimit
    if (state == "OFF") {
        if (WatchmanGui) {
            WatchmanGui.Destroy()
            WatchmanGui := ""
        }
        return
    }
    if (!WatchmanGui) {
        WatchmanGui := Gui("+AlwaysOnTop -Caption +ToolWindow +E0x20")
        WatchmanGui.BackColor := "101010"
        WatchmanGui.SetFont("s10 w600", "Segoe UI")
        WatchmanText := WatchmanGui.Add("Text", "c00FF00 Center w200", "")
        WinSetTransparent(180, WatchmanGui.Hwnd)
    }
    
    ; Update Status Text
    if (state == "ON") {
        WatchmanText.Value := "👁️ Watchman: Started"
        WatchmanText.Opt("c00FF00")
    } else if (state == "ACTIVE") {
        WatchmanText.Value := "👁️ Monitoring..."
        WatchmanText.Opt("c00FF00")
    } else if (state == "WAKE") {
        WatchmanText.Value := "⚡ Waking Up..."
        WatchmanText.Opt("cFF8800")
    } else if (state == "WAIT") {
        WatchmanText.Value := "⏳ Standby..."
        WatchmanText.Opt("c00FFFF")
    } else if (state == "SKIP") {
        WatchmanText.Value := "⏩ Skip " SkipCount "/" MaxSkipLimit
        WatchmanText.Opt("cFFFF00")
    } else if (state == "FINISH") {
        WatchmanText.Value := "🎉 All Jobs Done!"
        WatchmanText.Opt("cFF00FF")
    }

    ; Position: Bottom Right (Below Fox Walker)
    if (WinActive("ahk_class MozillaWindowClass")) {
        try {
            WinGetPos &WinX, &WinY, &WinW, &WinH, "A"
            TargetX := WinX + WinW - 300
            TargetY := WinY + WinH - 15
            WatchmanGui.Show("x" TargetX " y" TargetY " NoActivate")
        } catch {
            WatchmanGui.Show("x" (A_ScreenWidth - 250) " y" (A_ScreenHeight - 80) " NoActivate")
        }
    } else {
        WatchmanGui.Show("x" (A_ScreenWidth/2 - 100) " y" (A_ScreenHeight - 60) " NoActivate")
    }
}
