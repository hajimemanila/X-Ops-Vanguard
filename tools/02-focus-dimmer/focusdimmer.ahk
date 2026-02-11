; ==========================================================
; AutoHotKey Script: Focus Dimmer v14.19 (Smart Switching)
; Description: Optimize behavior during window switching
;              - Smart Switch: Always use Light Buffer when active window changes
;              - Passive Heavy: Use Heavy Buffer only when hole changes without user interaction
;              - Manual Ready: Detailed user configuration comments
; Author: X Ops Architect
; ==========================================================
#Requires AutoHotkey v2.0
#SingleInstance Force
DllCall("SetThreadDpiAwarenessContext", "ptr", -4)

; ==========================================================
; 🏗️ Initialization Area
; ==========================================================
Global Config := {}

; --- Feature Toggles ---
Config.EnablePeek         := True
Config.EnableColorChange := True
Config.EnableKeepBright   := True
Config.EnableBorders      := True
Config.DebugMode          := False

; --- Maintenance Settings ---
Config.MaintenanceIntervalMin := 60

; --- Dimmer Settings ---
Config.DimColor := "000000"
Config.DimLevel := 150
Config.PeekDelay := 0.4

; ✨ Adaptive Stabilizer Settings (User Preferences)
; [Cinematic Mode] 2000-2500: Merges video transition flashes into one (Higher latency)
; [Snappy Mode]    800-1000:  Prioritize tempo for multitasking (Allows 2 flashes)
Config.BufferTime_Heavy := 800  ; Default: Balanced
Config.BufferTime_Light := 50   ; For window movement (No change needed)

; Variable Definitions
Config.MaxLevel := 255
Config.MinLevel := 20

Config.HoleTopAdjust := 5

; --- Neon Borders ---
Config.BaseGlowColor := "00D0FF" 
Config.PathColorMap := Map()
Config.PathColorMap["\FFP1\"] := "BD00FF"
Config.PathColorMap["\FFP2\"] := "CCFF00"
Config.PathColorMap["\FFP3\"] := "FF0040"

Config.TitleColorMap := Map()
Config.TitleColorMap["X (Twitter)"] := "000000"

Config.CoreThickness := 2
Config.CoreMaxAlpha  := 180
Config.CoreMinAlpha  := 100

Config.OuterThickness := 12
Config.OuterMaxAlpha  := 60
Config.OuterMinAlpha  := 10

Config.GlowSpeed   := 50
Config.RefreshRate := 50
Config.PaddingTop  := 2
Config.PaddingSide := 0

Config.KeepBrightExe := "chrome.exe"
Config.KeepBrightKey := "[▶]"

; --- State Variables ---
Global State := {}
State.IsDimmed     := False
State.GlowProgress := 0.0
State.GlowStep     := 0.02
State.LastActiveID := 0
State.LastGlowColor:= Config.BaseGlowColor
State.AltPressTime := 0
State.IsPeeking    := False
State.LastX := 0
State.LastY := 0
State.LastW := 0
State.LastH := 0
State.DetectedYT := 0
State.LastDetectedYT := 0
State.CurrentTitle := ""
State.CurrentPath  := ""
State.LastHash     := "" 
State.BufferActive := False
State.FadingOut    := False

Global VScreen := {}
GetScreenMetrics()

; --- GUI Variable Declarations ---
Global DimGui := ""
Global BufferGui := ""
Global CoreGui := ""
Global OuterGui := ""
Global OSDGui := ""
Global OSDText := ""
Global DebugGui := ""
Global DebugText := ""

; Initialize GUIs
CreateGuis()

TrayTip "Dimmer v14.19 Active", "X Ops Dimmer"

; Maintenance Timer
SetTimer(PerformMaintenance, Config.MaintenanceIntervalMin * 60 * 1000)

; Enable on Startup
ToggleDimmer(1)

; ==========================================================
; 🎮 Key Bindings
; ==========================================================
+F5::ChangeLevel(-5)
+F6::ChangeLevel(5)
+F7::ChangeLevel(-25)
+F8::ChangeLevel(25)
+F9::ToggleDimmer(1)
+F10::ToggleDimmer(0)
+F12::ToggleDebug()

; ==========================================================
; 🛠️ Logic Functions
; ==========================================================

GetScreenMetrics() {
    try {
        VScreen.X := SysGet(76)
        VScreen.Y := SysGet(77)
        VScreen.W := SysGet(78)
        VScreen.H := SysGet(79)
    } catch {
        VScreen.X := 0
        VScreen.Y := 0
        VScreen.W := A_ScreenWidth
        VScreen.H := A_ScreenHeight
    }
}

CreateGuis() {
    Global DimGui, BufferGui, CoreGui, OuterGui, OSDGui, OSDText, DebugGui, DebugText
    
    DimGui := Gui("+AlwaysOnTop +ToolWindow -Caption +E0x20")
    DimGui.BackColor := Config.DimColor
    WinSetTransparent(0, DimGui.Hwnd)

    ; Buffer Layer
    BufferGui := Gui("+AlwaysOnTop +ToolWindow -Caption +E0x20")
    BufferGui.BackColor := Config.DimColor
    WinSetTransparent(0, BufferGui.Hwnd)

    CoreGui := Gui("+AlwaysOnTop +ToolWindow -Caption +E0x20")
    CoreGui.BackColor := Config.BaseGlowColor
    WinSetTransparent(0, CoreGui.Hwnd)

    OuterGui := Gui("+AlwaysOnTop +ToolWindow -Caption +E0x20")
    OuterGui.BackColor := Config.BaseGlowColor
    WinSetTransparent(0, OuterGui.Hwnd)

    OSDGui := Gui("+AlwaysOnTop -Caption +ToolWindow +E0x20")
    OSDGui.BackColor := "1d1d1d"
    OSDGui.SetFont("s12 w600", "Segoe UI")
    OSDText := OSDGui.Add("Text", "c00d0ff Center w200", "Init")

    DebugGui := Gui("+AlwaysOnTop -Caption +ToolWindow +E0x20")
    DebugGui.BackColor := "000000"
    DebugGui.SetFont("s10 cLime", "Meiryo UI")
    DebugText := DebugGui.Add("Text", "w600 h200", "Debug Ready")
    WinSetTransparent(220, DebugGui.Hwnd)
}

PerformMaintenance() {
    Global DimGui, BufferGui, CoreGui, OuterGui, OSDGui, DebugGui
    if (!State.IsDimmed || State.IsPeeking) {
        return 
    }
    
    SetTimer(UpdateRegionGDI, 0)
    SetTimer(PulseGlow, 0)
    
    try {
        DimGui.Destroy()
        BufferGui.Destroy()
        CoreGui.Destroy()
        OuterGui.Destroy()
        OSDGui.Destroy()
        DebugGui.Destroy()
    }
    
    GetScreenMetrics()
    CreateGuis()
    State.LastHash := "RESET"
    
    WinSetTransparent(Integer(Config.DimLevel), DimGui.Hwnd)
    WinSetTransparent(0, BufferGui.Hwnd) 

    WinSetTransparent(Integer(Config.CoreMinAlpha), CoreGui.Hwnd)
    WinSetTransparent(Integer(Config.OuterMinAlpha), OuterGui.Hwnd)
    
    DimGui.Show("x" VScreen.X " y" VScreen.Y " w" VScreen.W " h" VScreen.H " NoActivate")
    BufferGui.Show("x" VScreen.X " y" VScreen.Y " w" VScreen.W " h" VScreen.H " NoActivate")

    if (Config.EnableBorders) {
        CoreGui.Show("x" VScreen.X " y" VScreen.Y " w" VScreen.W " h" VScreen.H " NoActivate")
        OuterGui.Show("x" VScreen.X " y" VScreen.Y " w" VScreen.W " h" VScreen.H " NoActivate")
        SetTimer(PulseGlow, Config.GlowSpeed)
    }
    SetTimer(UpdateRegionGDI, Config.RefreshRate)
}

ToggleDebug() {
    Global DebugGui
    Config.DebugMode := !Config.DebugMode
    if (Config.DebugMode) {
        DebugGui.Show("x0 y0 NoActivate")
    } else {
        DebugGui.Hide()
    }
}

ToggleDimmer(targetState) {
    Global DimGui, CoreGui, OuterGui, BufferGui
    
    State.IsDimmed := targetState
    if (State.IsDimmed) {
        if (!IsNumber(Config.DimLevel) || Config.DimLevel < Config.MinLevel) {
            Config.DimLevel := 150
        }

        WinSetTransparent(Integer(Config.DimLevel), DimGui.Hwnd)
        WinSetTransparent(0, BufferGui.Hwnd)
        WinSetTransparent(Integer(Config.CoreMinAlpha), CoreGui.Hwnd)
        WinSetTransparent(Integer(Config.OuterMinAlpha), OuterGui.Hwnd)

        DimGui.Show("x" VScreen.X " y" VScreen.Y " w" VScreen.W " h" VScreen.H " NoActivate")
        BufferGui.Show("x" VScreen.X " y" VScreen.Y " w" VScreen.W " h" VScreen.H " NoActivate")
        
        if (Config.EnableBorders) {
            CoreGui.Show("x" VScreen.X " y" VScreen.Y " w" VScreen.W " h" VScreen.H " NoActivate")
            OuterGui.Show("x" VScreen.X " y" VScreen.Y " w" VScreen.W " h" VScreen.H " NoActivate")
            SetTimer(PulseGlow, Config.GlowSpeed)
        }
        SetTimer(UpdateRegionGDI, Config.RefreshRate)
        ShowOSD("Dimmer: ON")
    } else {
        DimGui.Hide()
        BufferGui.Hide()
        CoreGui.Hide()
        OuterGui.Hide()
        SetTimer(UpdateRegionGDI, 0)
        SetTimer(PulseGlow, 0)
        ShowOSD("Dimmer: OFF")
    }
}

ChangeLevel(amount) {
    Global Config, DimGui, State 
    local newLevel := Config.DimLevel + amount
    if (newLevel > Config.MaxLevel) 
        newLevel := Config.MaxLevel
    if (newLevel < Config.MinLevel) 
        newLevel := Config.MinLevel
    Config.DimLevel := newLevel
    if (State.IsDimmed) {
        try {
            WinSetTransparent(Integer(newLevel), DimGui.Hwnd)
            if (State.BufferActive) {
                WinSetTransparent(Integer(newLevel), BufferGui.Hwnd)
            }
            ShowOSD("Level: " . newLevel)
        } catch {
        }
    } else {
        ShowOSD("(OFF) Set: " . newLevel)
    }
}

UpdateRegionGDI() {
    Global DimGui, BufferGui, CoreGui, OuterGui, OSDGui, DebugGui
    
    ; Peek
    if (Config.EnablePeek) {
        if (GetKeyState("Alt", "P")) {
            if (State.AltPressTime == 0) {
                State.AltPressTime := A_TickCount
            } else if (A_TickCount - State.AltPressTime > (Config.PeekDelay * 1000)) {
                if (!State.IsPeeking) {
                    WinSetTransparent(0, DimGui.Hwnd)
                    WinSetTransparent(0, BufferGui.Hwnd)
                    WinSetTransparent(0, CoreGui.Hwnd)
                    WinSetTransparent(0, OuterGui.Hwnd)
                    State.IsPeeking := True
                }
                return
            }
        } else {
            State.AltPressTime := 0
            if (State.IsPeeking) {
                try {
                    WinSetTransparent(Integer(Config.DimLevel), DimGui.Hwnd)
                }
                State.IsPeeking := False
            }
        }
    }

    try {
        active_id := WinGetID("A")
    } catch {
        return
    }

    try {
        active_class := WinGetClass(active_id)
        State.CurrentTitle := WinGetTitle(active_id)
        
        if (active_id != State.LastActiveID) {
             State.CurrentPath := WinGetProcessPath(active_id)
             CheckColorChange() 
        }
    } catch {
        return
    }

    if (active_class == "Progman" || active_class == "WorkerW" 
        || active_class == "Shell_TrayWnd" 
        || active_class == "Shell_SecondaryTrayWnd" 
        || active_class == "Windows.UI.Core.CoreWindow" 
        || active_class == "NotifyIconOverflowWindow" 
        || active_id == DimGui.Hwnd || active_id == CoreGui.Hwnd || active_id == OuterGui.Hwnd 
        || active_id == OSDGui.Hwnd || active_id == DebugGui.Hwnd || active_id == BufferGui.Hwnd) {
        
        if (State.LastActiveID != "Desktop") {
             WinSetRegion("", DimGui.Hwnd)
             WinSetRegion("0-0 0-0", CoreGui.Hwnd)
             WinSetRegion("0-0 0-0", OuterGui.Hwnd)
             State.LastActiveID := "Desktop"
             State.LastHash := "RESET"
        }
        return
    }

    WinGetPos(&X, &Y, &W, &H, active_id)
    winStyle := WinGetStyle(active_id)
    IsMaximized := (winStyle & 0x800000)
    
    if (IsMaximized) {
        X += 8, Y += 8, W -= 16, H -= 16
        AdjTop := 0
    } else {
        X -= Config.PaddingSide
        Y -= Config.PaddingTop
        W += (Config.PaddingSide * 2)
        H += (Config.PaddingTop + Config.PaddingSide)
        AdjTop := Config.HoleTopAdjust
    }

    RelX := X - VScreen.X
    RelY := Y - VScreen.Y
    HoleY := RelY + AdjTop
    HoleH := H - AdjTop

    CurrentHash := RelX "." HoleY "." W "." HoleH
    
    State.DetectedYT := 0
    YT_List := []
    if (Config.EnableKeepBright) {
        try {
            ids := WinGetList("ahk_exe " Config.KeepBrightExe)
            For this_id in ids {
                if (this_id == active_id) {
                    continue
                }
                if InStr(WinGetTitle(this_id), Config.KeepBrightKey) {
                    State.DetectedYT += 1
                    WinGetPos(&kX, &kY, &kW, &kH, this_id)
                    kRelX := kX - VScreen.X
                    kRelY := kY - VScreen.Y
                    YT_List.Push({X: kRelX, Y: kRelY, W: kW, H: kH})
                    CurrentHash .= "|" kRelX ":" kRelY ":" kW ":" kH
                }
            }
        }
    }

    ; --- ✨ Liquid Stabilizer (Smart Switching) ---
    if (CurrentHash != State.LastHash) {
        
        if (State.LastHash == "" || State.LastHash == "RESET") {
            ; No Buffer (Startup)
        } else {
            ; Buffer ON
            if (!State.IsPeeking && !State.BufferActive) {
                WinSetTransparent(Integer(Config.DimLevel), BufferGui.Hwnd)
                State.BufferActive := True
            }

            ; ⚡ Smart Switching Logic
            ; Default is Light (50ms) = Snappy
            TargetHoldTime := Config.BufferTime_Light
            
            ; Heavy Conditions:
            ; 1. Hole count (YouTube) changed
            ; 2. And active window hasn't changed (Hole changed without user interaction = Video ended/started)
            if (State.DetectedYT != State.LastDetectedYT) {
                if (active_id == State.LastActiveID) {
                    TargetHoldTime := Config.BufferTime_Heavy ; ✨ Enforce Heavy Buffer here
                }
            }
            
            ; Fade Out Timer
            State.FadingOut := False 
            SetTimer(FadeOutBuffer, -TargetHoldTime)
        }

        hRgnScreen := DllCall("CreateRectRgn", "Int", 0, "Int", 0, "Int", VScreen.W, "Int", VScreen.H, "Ptr")
        hRgnHole := DllCall("CreateRectRgn", "Int", RelX, "Int", HoleY, "Int", RelX+W, "Int", HoleY+HoleH, "Ptr")
        DllCall("CombineRgn", "Ptr", hRgnScreen, "Ptr", hRgnScreen, "Ptr", hRgnHole, "Int", 4)
        For rect in YT_List {
            hRgnYT := DllCall("CreateRectRgn", "Int", rect.X, "Int", rect.Y, "Int", rect.X+rect.W, "Int", rect.Y+rect.H, "Ptr")
            DllCall("CombineRgn", "Ptr", hRgnScreen, "Ptr", hRgnScreen, "Ptr", hRgnYT, "Int", 4)
            DllCall("DeleteObject", "Ptr", hRgnYT)
        }
        
        DllCall("SetWindowRgn", "Ptr", DimGui.Hwnd, "Ptr", hRgnScreen, "Int", 1)
        DllCall("DeleteObject", "Ptr", hRgnHole)

        if (Config.EnableBorders) {
            DrawPolyBorder(CoreGui.Hwnd, RelX, HoleY, W, HoleH, Config.CoreThickness, 1)
            DrawPolyBorder(OuterGui.Hwnd, RelX, HoleY, W, HoleH, Config.OuterThickness, 0)
        }

        State.LastHash := CurrentHash
    }

    State.LastX := X
    State.LastY := Y
    State.LastW := W
    State.LastH := H
    State.LastActiveID := active_id
    State.LastDetectedYT := State.DetectedYT 

    if (Config.DebugMode) {
        info := "Engine: Smart Stabilizer`n"
        info .= "Buffer: " (State.BufferActive ? "ON" : "OFF") "`n"
        DebugText.Value := info
    }
}

; ✨ Silky Fade Out
FadeOutBuffer() {
    Global BufferGui, State
    if (!State.BufferActive)
        return

    State.FadingOut := True
    startAlpha := Config.DimLevel
    steps := 20 
    interval := 15
    
    Loop steps {
        if (!State.FadingOut || !State.BufferActive) 
            return
        alpha := startAlpha - (startAlpha * (A_Index / steps))
        try {
            WinSetTransparent(Integer(alpha), BufferGui.Hwnd)
        }
        Sleep interval
    }
    
    WinSetTransparent(0, BufferGui.Hwnd)
    State.BufferActive := False
    State.FadingOut := False
}

CheckColorChange() {
    if (!Config.EnableColorChange) {
        return
    }
    targetColor := Config.BaseGlowColor
    matched := False
    
    For key, color in Config.PathColorMap {
        if InStr(State.CurrentPath, key) {
            targetColor := color
            matched := True
            break
        }
    }
    if (!matched) {
        For key, color in Config.TitleColorMap {
            if InStr(State.CurrentTitle, key) {
                targetColor := color
                break
            }
        }
    }
    if (targetColor != State.LastGlowColor) {
        CoreGui.BackColor := targetColor
        OuterGui.BackColor := targetColor
        State.LastGlowColor := targetColor
    }
}

DrawPolyBorder(hwnd, x, y, w, h, thick, overlap) {
    BX := x - thick + overlap
    BY := y - thick + overlap
    BW := w + (thick*2) - (overlap*2)
    BH := h + (thick*2) - (overlap*2)
    BR := BX + BW
    BB := BY + BH
    IX := x + overlap
    IY := y + overlap
    IW := w - (overlap*2)
    IH := h - (overlap*2)
    IR := IX + IW
    IB := IY + IH
    OuterPoly := BX "-" BY " " BR "-" BY " " BR "-" BB " " BX "-" BB " " BX "-" BY
    InnerPoly := IX "-" IY " " IX "-" IB " " IR "-" IB " " IR "-" IY " " IX "-" IY
    WinSetRegion(OuterPoly "    " InnerPoly, hwnd)
}

PulseGlow() {
    Global CoreGui, OuterGui
    State.GlowProgress += State.GlowStep
    if (State.GlowProgress >= 1.0 || State.GlowProgress <= 0.0) {
        State.GlowStep *= -1
    }
    coreA := Config.CoreMinAlpha + (Config.CoreMaxAlpha - Config.CoreMinAlpha) * State.GlowProgress
    outerA := Config.OuterMinAlpha + (Config.OuterMaxAlpha - Config.OuterMinAlpha) * State.GlowProgress
    try {
        WinSetTransparent(Integer(coreA), CoreGui.Hwnd)
        WinSetTransparent(Integer(outerA), OuterGui.Hwnd)
    }
}

ShowOSD(Text) {
    Global OSDGui, OSDText
    OSDText.Value := Text
    TargetX := State.LastX + (State.LastW / 2) - 100
    TargetY := State.LastY + State.LastH - 100
    if (TargetX < VScreen.X) TargetX := VScreen.X + 100
    if (TargetY > VScreen.Y + VScreen.H) TargetY := VScreen.Y + VScreen.H - 100
    OSDGui.Show("x" TargetX " y" TargetY " NoActivate")
    SetTimer(HideOSD, -1000)
}
HideOSD() {
    Global OSDGui
    OSDGui.Hide()
}