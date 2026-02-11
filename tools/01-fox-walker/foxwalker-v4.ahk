; ==========================================================
; AutoHotKey Script: Fox Walker v4.0 (Decoupled)
; Description: Dedicated Firefox Navigation & HUD System. 
;              No dependencies on Watchman or Window Velocity.
; Author: X Ops Architect
; ==========================================================
#Requires AutoHotkey v2.0
#SingleInstance Force

; ==========================================================
; 🦊 Fox Walker Config
; ==========================================================
global FW_Color         := "00FF00"  ; Neon Green
global FW_BgColor       := "101010"
global FW_Transparent   := 220
global FW_FontSize      := 12
global WalkerMode       := false     ; Global Toggle Switch
global IsTransitioning  := false     ; Transition Flag

; Key Bindings
global KEY_FW_NEXT      := "^{PgDn}"
global KEY_FW_PREV      := "^{PgUp}"
global KEY_FW_CLOSE     := "^w"
global KEY_FW_UNDO      := "^+t"
global KEY_FW_MUTE      := "^m"
global KEY_FW_URL       := "^l"
global KEY_FW_RELOAD    := "^r"
global KEY_FW_DISCARD   := "^!d"     ; Auto Tab Discard
global KEY_FW_OTHERS    := "!w"      ; Close Other Tabs
global KEY_FW_FIRST     := "^1"

; GUI Variables
global FW_Gui           := ""
global FW_BarGui        := ""
global FW_Text_Status   := ""
global FW_Text_Info     := ""
global FW_Cheat_Gui     := ""

; ==========================================================
; 🎮 Context Monitor
; ==========================================================
SetTimer ContextMonitor, 100

UpdateFoxHUDPos() {
    if (!FW_Gui || !WinActive("ahk_class MozillaWindowClass"))
        return

    try {
        WinGetPos &WinX, &WinY, &WinW, &WinH, "A"
        TargetX := WinX + WinW - 360 
        TargetY := WinY + WinH - 80
        
        FW_Gui.GetPos(&CurX, &CurY)
        if (CurX != TargetX || CurY != TargetY) {
            FW_Gui.Move(TargetX, TargetY)
        }
    }
}

ContextMonitor() {
    if !WinActive("ahk_class MozillaWindowClass") || !WalkerMode {
        RemoveFoxVisuals()
        return
    }

    try {
        Title := WinGetTitle("A")
        
        ; [Priority 1] X Timeline Walker (【🎮】)
        if InStr(Title, "【🎮】") {
            global IsTransitioning := false
            RemoveFoxVisuals()
        } 
        ; [Priority 2] Transitioning (Lag Masking)
        else if (IsTransitioning) {
            RemoveFoxVisuals()
        }
        ; [Priority 3] Normal Tab
        else {
            ShowFoxVisuals()
            UpdateFoxInfo(Title)
            UpdateFoxHUDPos() 
        }
    }
}

ShowFoxVisuals() {
    if (!FW_Gui) {
        CreateFoxHUD()
        CreateFoxBar()
    }
}

RemoveFoxVisuals() {
    global FW_Gui, FW_BarGui
    if (FW_Gui) {
        FW_Gui.Destroy()
        FW_Gui := ""
    }
    if (FW_BarGui) {
        FW_BarGui.Destroy()
        FW_BarGui := ""
    }
}

; ==========================================================
; ⌨️ Global Toggle (ESC Double Tap)
; ==========================================================
#HotIf WinActive("ahk_class MozillaWindowClass")
$Esc::
{
    if (WalkerMode) {
        global WalkerMode := false
        global IsTransitioning := false
        RemoveFoxVisuals()
        SoundBeep 800, 150
        return
    }
    if (KeyWait("Esc", "T0.2") && KeyWait("Esc", "D T0.2")) {
        ActivateWalker()
    } else {
        Send "{Esc}"
    }
}
#HotIf

; ==============================================================================
; 🛑 Emergency Suspend (Safe Mode)
; Win+Esc to toggle script suspend.
; ==============================================================================
#Esc::
{
    Suspend(-1) 
    
    if (A_IsSuspended) {
        ToolTip("💤 Fox Walker: SLEEPING (Safe Mode)")
        SoundBeep(500, 200)
    } else {
        ToolTip("⚡ Fox Walker: ACTIVE")
        SoundBeep(1000, 200)
    }
    SetTimer(RemoveToolTip, -1500)
}

RemoveToolTip() {
    ToolTip()
}

; ==========================================================
; 🎮 [Priority 1] X Timeline Walker Context
; ==========================================================
#HotIf WinActive("ahk_class MozillaWindowClass") and (InStr(WinGetTitle("A"), "【🎮】") or IsTransitioning)

Space::
{
    Send "^{Tab}"
    global IsTransitioning := true
    global WalkerMode := true
    SetTimer EndTransition, -1500
    SetTimer SendWakeUpSignal, -150 
}

+Space::
{
    Send "^+{Tab}"
    global IsTransitioning := true
    global WalkerMode := true
    SetTimer EndTransition, -1500
    SetTimer SendWakeUpSignal, -150
}

SendWakeUpSignal() {
    if WinActive("ahk_class MozillaWindowClass") {
        ; Wake up Tampermonkey script (Ctrl+Alt+Space)
        Send "^!{Space}"
    }
}

EndTransition() {
    global IsTransitioning := false
}

#HotIf

; ==========================================================
; 🦊 [Priority 2] Fox Walker Context (WASD)
; ==========================================================
#HotIf WinActive("ahk_class MozillaWindowClass") and WalkerMode and !InStr(WinGetTitle("A"), "【🎮】") and !IsTransitioning

w:: {
    Send "{PgUp}"
    UpdateFoxStatus("⬆️ Scroll Up")
}
s:: {
    Send "{PgDn}"
    UpdateFoxStatus("⬇️ Scroll Down")
}
a:: {
    Send KEY_FW_PREV
    UpdateFoxStatus("⏪ Prev Tab")
}
d:: {
    Send KEY_FW_NEXT
    UpdateFoxStatus("⏩ Next Tab")
}
Space:: {
    Send KEY_FW_NEXT
    UpdateFoxStatus("⏩ Next Tab")
}
+Space:: {
    Send KEY_FW_PREV
    UpdateFoxStatus("⏪ Prev Tab")
}

; Double Tap Actions
$g::HandleFWDouble("g", KEY_FW_DISCARD, "🗑️ Discarded")
$x::HandleFWDouble("x", KEY_FW_CLOSE, "❌ Closed")
$z::HandleFWDouble("z", KEY_FW_UNDO, "↩️ Undo")
$0::HandleFWDouble("0", KEY_FW_OTHERS, "🧹 Cleaned")
$9::HandleFWDouble("9", KEY_FW_FIRST, "⏮️ First Tab")
$m::HandleFWDouble("m", KEY_FW_MUTE, "🔇 Mute")
$l::HandleFWDouble("l", KEY_FW_URL, "🔍 Search")
$r::HandleFWDouble("r", KEY_FW_RELOAD, "🔄 Reload")

?::ShowFWCheatSheet()

#HotIf

; ==========================================================
; 🛠️ Core Activation Logic
; ==========================================================
ActivateWalker() {
    if (WalkerMode) {
        return 
    }
    global WalkerMode := true
    SoundBeep 1000, 150
}

; ==========================================================
; 🧩 Fox Walker Visuals & Helpers
; ==========================================================
CreateFoxHUD() {
    global FW_Gui, FW_Text_Status, FW_Text_Info
    FW_Gui := Gui("+AlwaysOnTop -Caption +ToolWindow +E0x20")
    FW_Gui.BackColor := FW_BgColor
    FW_Gui.SetFont("s" FW_FontSize " w600", "Segoe UI")
    FW_Text_Status := FW_Gui.Add("Text", "c" FW_Color " Center w320 vStatus", "Walker Ready")
    FW_Gui.SetFont("s" (FW_FontSize - 2) " w400", "Segoe UI")
    FW_Text_Info := FW_Gui.Add("Text", "cWhite Center w320 vInfo", "...")
    WinSetTransparent(FW_Transparent, FW_Gui.Hwnd)
    FW_Gui.Show("x" (A_ScreenWidth/2 - 200) " y" (A_ScreenHeight - 120) " NoActivate")
}

CreateFoxBar() {
    global FW_BarGui
    FW_BarGui := Gui("+AlwaysOnTop -Caption +ToolWindow +E0x20")
    FW_BarGui.BackColor := FW_Color
    FW_BarGui.Show("x0 y0 w6 h" A_ScreenHeight " NoActivate")
    WinSetTransparent(150, FW_BarGui.Hwnd)
}

UpdateFoxStatus(msg) {
    if (!FW_Gui)
        return
    FW_Text_Status.Value := msg
    SetTimer () => (FW_Gui ? FW_Text_Status.Value := "👁️ Walker Active" : ""), -1500
}

UpdateFoxInfo(Title) {
    if (!FW_Gui)
        return
    
    CleanTitle := StrReplace(Title, " - Mozilla Firefox", "")
    CleanTitle := StrReplace(CleanTitle, " — Mozilla Firefox", "")
    parts := StrSplit(CleanTitle, [" - ", " — "]) 
    
    if (parts.Length > 1) {
        Container := parts[parts.Length]
        Title := StrReplace(CleanTitle, " - " Container, "")
        if (StrLen(Title) > 30) 
            Title := SubStr(Title, 1, 28) "..."
        DisplayStr := "[" Container "] " Title
    } else {
        if (StrLen(CleanTitle) > 35)
            CleanTitle := SubStr(CleanTitle, 1, 33) "..."
        DisplayStr := CleanTitle
    }
    
    if (FW_Text_Info.Value != DisplayStr) {
        FW_Text_Info.Value := DisplayStr
    }
}

HandleFWDouble(key, actionKey, msg) {
    if (KeyWait(key, "T0.25") && KeyWait(key, "D T0.25")) {
        Send actionKey
        UpdateFoxStatus(msg)
        KeyWait key
    } else {
        Send key
    }
}

ShowFWCheatSheet() {
    global FW_Cheat_Gui
    if (FW_Cheat_Gui)
        return
    FW_Cheat_Gui := Gui("+AlwaysOnTop -Caption +ToolWindow +E0x20")
    FW_Cheat_Gui.BackColor := "000000"
    FW_Cheat_Gui.SetFont("s10", "Consolas")
    
    HelpText := "[ FOX WALKER ]`n"
    HelpText .= "--------------`n"
    HelpText .= "[W/S] Scroll`n"
    HelpText .= "[A/D] Tab Nav`n"
    HelpText .= "[G]x2 Discard`n"
    HelpText .= "[0]x2 Clean`n"
    
    FW_Cheat_Gui.Add("Text", "c00FF00", HelpText)
    WinSetTransparent(220, FW_Cheat_Gui.Hwnd)
    FW_Cheat_Gui.Show("NoActivate")
    KeyWait "?"
    FW_Cheat_Gui.Destroy()
    FW_Cheat_Gui := ""
}
