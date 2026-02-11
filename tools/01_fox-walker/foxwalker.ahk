; ==========================================================
; Fox Walker v1.1 - WASD Edition
; Description: Keyboard-centric navigation suite for Firefox
; Target: Users of Tree Style Tab, Sidebery, Container Tab Groups
; ==========================================================
#Requires AutoHotkey v2.0
#SingleInstance Force

; --- Configuration: Match these with your Browser/Extension shortcuts ---
global KEY_NEXT_TAB     := "^{PgDn}" ; Ctrl + PgDn (Next Tab)
global KEY_PREV_TAB     := "^{PgUp}" ; Ctrl + PgUp (Prev Tab)
global KEY_CLOSE_TAB    := "^w"      ; Ctrl + W (Close Tab)
global KEY_UNDO_CLOSE   := "^+t"     ; Ctrl + Shift + T (Undo Close)
global KEY_MUTE_TAB     := "^m"      ; Ctrl + M (Mute/Unmute Toggle)
global KEY_FOCUS_URL    := "^l"      ; Ctrl + L (Focus Address Bar)
global KEY_RELOAD       := "^r"      ; Ctrl + R (Reload)

; [Extension Dependencies]
; Requires 'Auto Tab Discard' mapped to Ctrl+Alt+D
global KEY_DISCARD      := "^!d"
; Requires 'Close Tab Shortcuts' mapped to Alt+W (Optional)
global KEY_CLOSE_OTHER  := "!w"
; Requires 'Go to First Tab' mapped to Ctrl+1 (Native)
global KEY_FIRST_TAB    := "^1"
; Requires Extension shortcut for Tree Toggle (Example: F1)
global KEY_TREE_TOGGLE  := "{F1}" 

; --- Appearance Settings ---
global HUD_Color        := "00FF00"  ; Neon Green
global HUD_BgColor      := "101010"  ; Background
global HUD_Transparent  := 220       ; Opacity (0-255)
global HUD_FontSize     := 12

; --- State Variables ---
global WalkerMode := false
global HUD_Gui := ""
global HUD_Text_Status := ""
global HUD_Text_Info := ""
global Cheat_Gui := ""

; ==========================================================
; 🎮 Activation: Double-Tap [ESC] to Toggle
; ==========================================================
#HotIf WinActive("ahk_class MozillaWindowClass")

$Esc::
{
    if (WalkerMode) {
        DeactivateWalker()
        return
    }
    if (KeyWait("Esc", "T0.2") && KeyWait("Esc", "D T0.2")) {
        ActivateWalker()
    } else {
        Send "{Esc}"
    }
}

#HotIf

; ==========================================================
; ⌨️ Walker Keymap (Active only in Walker Mode)
; ==========================================================
#HotIf WinActive("ahk_class MozillaWindowClass") and WalkerMode

; --- WASD Navigation ---

; W -> Page Up (Scroll Up)
w:: {
    Send "{PgUp}"
    UpdateHUD("⬆️ Scroll Up")
}

; S -> Page Down (Scroll Down)
s:: {
    Send "{PgDn}"
    UpdateHUD("⬇️ Scroll Down")
}

; A -> Previous Tab
a:: {
    Send KEY_PREV_TAB
    UpdateHUD("⏪ Prev Tab")
}

; D -> Next Tab
d:: {
    Send KEY_NEXT_TAB
    UpdateHUD("⏩ Next Tab")
}

; Space -> Next Tab (Alternative / Legacy)
Space:: {
    Send KEY_NEXT_TAB
    UpdateHUD("⏩ Next Tab")
}

; Shift+Space -> Prev Tab (Alternative / Legacy)
+Space:: {
    Send KEY_PREV_TAB
    UpdateHUD("⏪ Prev Tab")
}


; --- Double-Tap Actions ---

; G (x2) -> Discard Tab (Memory Purge)
$g:: {
    if (KeyWait("g", "T0.25") && KeyWait("g", "D T0.25")) {
        Send KEY_DISCARD
        UpdateHUD("🗑️ Discarded")
        KeyWait "g"
    } else {
        Send "g"
    }
}

; X (x2) -> Close Tab
$x:: {
    if (KeyWait("x", "T0.25") && KeyWait("x", "D T0.25")) {
        Send KEY_CLOSE_TAB
        UpdateHUD("❌ Closed")
        KeyWait "x"
    } else {
        Send "x"
    }
}

; Z (x2) -> Undo Close
$z:: {
    if (KeyWait("z", "T0.25") && KeyWait("z", "D T0.25")) {
        Send KEY_UNDO_CLOSE
        UpdateHUD("↩️ Undo")
        KeyWait "z"
    } else {
        Send "z"
    }
}

; 0 (x2) -> Close Others (Extension)
$0:: {
    if (KeyWait("0", "T0.25") && KeyWait("0", "D T0.25")) {
        Send KEY_CLOSE_OTHER
        UpdateHUD("🧹 Cleaned")
        KeyWait "0"
    } else {
        Send "0"
    }
}

; 9 (x2) -> Jump First
$9:: {
    if (KeyWait("9", "T0.25") && KeyWait("9", "D T0.25")) {
        Send KEY_FIRST_TAB
        UpdateHUD("⏮️ First Tab")
        KeyWait "9"
    } else {
        Send "9"
    }
}

; M (x2) -> Mute Tab (Toggle)
$m:: {
    if (KeyWait("m", "T0.25") && KeyWait("m", "D T0.25")) {
        Send KEY_MUTE_TAB
        UpdateHUD("🔇 Mute Toggle")
        KeyWait "m"
    } else {
        Send "m"
    }
}

; L (x2) -> Search / Focus URL (Moved from S)
$l:: {
    if (KeyWait("l", "T0.25") && KeyWait("l", "D T0.25")) {
        Send KEY_FOCUS_URL
        UpdateHUD("🔍 Search")
        ; Auto-exit walker mode when searching
        DeactivateWalker()
        KeyWait "l"
    } else {
        Send "l"
    }
}

; R (x2) -> Reload
$r:: {
    if (KeyWait("r", "T0.25") && KeyWait("r", "D T0.25")) {
        Send KEY_RELOAD
        UpdateHUD("🔄 Reload")
        KeyWait "r"
    } else {
        Send "r"
    }
}

; T (x2) -> Tree Toggle (Example)
$t:: {
    if (KeyWait("t", "T0.25") && KeyWait("t", "D T0.25")) {
        Send KEY_TREE_TOGGLE
        UpdateHUD("🌲 Tree Toggle")
        KeyWait "t"
    } else {
        Send "t"
    }
}

; ? -> Cheat Sheet
?:: {
    ShowCheatSheet()
    KeyWait "?"
    HideCheatSheet()
}

#HotIf

; ==========================================================
; ⚙️ Core Logic
; ==========================================================

ActivateWalker() {
    global WalkerMode := true
    CreateHUD()
    UpdateHUD("🚀 Walker: ON")
    SoundBeep 1000, 150
    ; Update Loop (50ms interval for smooth tracking)
    SetTimer UpdateLoop, 50
}

DeactivateWalker() {
    global WalkerMode := false
    SetTimer UpdateLoop, 0
    if (HUD_Gui) {
        HUD_Gui.Destroy()
        global HUD_Gui := ""
    }
    SoundBeep 800, 150
}

; --- HUD ---
CreateHUD() {
    global HUD_Gui, HUD_Text_Status, HUD_Text_Info
    if (HUD_Gui)
        HUD_Gui.Destroy()

    HUD_Gui := Gui("+AlwaysOnTop -Caption +ToolWindow +E0x20")
    HUD_Gui.BackColor := HUD_BgColor
    HUD_Gui.SetFont("s" HUD_FontSize " w600", "Segoe UI")
    
    ; Compact Width (300px)
    HUD_Text_Status := HUD_Gui.Add("Text", "c" HUD_Color " Center w300 vStatus", "Initialized")
    
    HUD_Gui.SetFont("s" (HUD_FontSize - 2) " w400", "Segoe UI")
    HUD_Text_Info := HUD_Gui.Add("Text", "cWhite Center w300 vInfo", "...")

    WinSetTransparent(HUD_Transparent, HUD_Gui.Hwnd)
    
    ; Initial Show (Correct position will be set by UpdateLoop instantly)
    HUD_Gui.Show("x0 y0 NoActivate")
}

UpdateHUD(msg) {
    if (!WalkerMode || !HUD_Gui)
        return
    HUD_Text_Status.Value := msg
    SetTimer ResetStatus, -1500
}

ResetStatus() {
    if (WalkerMode && HUD_Gui)
        HUD_Text_Status.Value := "👁️ Ready"
}

; --- Main Loop: Position & Content Update ---
UpdateLoop() {
    if (!WalkerMode || !HUD_Gui || !WinActive("ahk_class MozillaWindowClass"))
        return

    ; 1. Position Tracking (Bottom Right)
    try {
        WinGetPos &WinX, &WinY, &WinW, &WinH, "A"
        
        ; Target: Bottom Right (Right margin 360px, Bottom margin 80px)
        TargetX := WinX + WinW - 360
        TargetY := WinY + WinH - 80
        
        HUD_Gui.GetPos(&CurX, &CurY)
        
        ; Only move if position changed (Anti-Jitter)
        if (CurX != TargetX || CurY != TargetY)
            HUD_Gui.Move(TargetX, TargetY)
    }

    ; 2. Content Updating (Anti-Flicker)
    try {
        FullTitle := WinGetTitle("A")
        CleanTitle := StrReplace(FullTitle, " - Mozilla Firefox", "")
        CleanTitle := StrReplace(CleanTitle, " — Mozilla Firefox", "")
        
        parts := StrSplit(CleanTitle, [" - ", " — "]) 
        
        if (parts.Length > 1) {
            Container := parts[parts.Length]
            Title := StrReplace(CleanTitle, " - " Container, "")
            ; Compact Length Limit
            if (StrLen(Title) > 30) 
                Title := SubStr(Title, 1, 28) "..."
            DisplayStr := "[" Container "] " Title
        } else {
            if (StrLen(CleanTitle) > 35)
                CleanTitle := SubStr(CleanTitle, 1, 33) "..."
            DisplayStr := CleanTitle
        }
        
        ; Only update text if changed (Anti-Flicker)
        if (HUD_Text_Info.Value != DisplayStr)
            HUD_Text_Info.Value := DisplayStr
    }
}

; --- Cheat Sheet ---
ShowCheatSheet() {
    global Cheat_Gui
    if (Cheat_Gui)
        return

    Cheat_Gui := Gui("+AlwaysOnTop -Caption +ToolWindow +E0x20")
    Cheat_Gui.BackColor := "000000"
    Cheat_Gui.SetFont("s10", "Consolas")
    
    HelpText := "[ FOX WALKER MAP ]`n"
    HelpText .= "------------------`n"
    HelpText .= "[ESC] (x2) Toggle ON/OFF`n"
    HelpText .= "[W]        Scroll Up`n"
    HelpText .= "[S]        Scroll Down`n"
    HelpText .= "[A]        Prev Tab`n"
    HelpText .= "[D]        Next Tab`n"
    HelpText .= "[G] (x2)   Discard (Mem)`n"
    HelpText .= "[L] (x2)   Search URL`n"
    HelpText .= "[M] (x2)   Mute Toggle`n"
    HelpText .= "[R] (x2)   Reload`n"
    HelpText .= "[0] (x2)   Close Others`n"
    HelpText .= "[X] (x2)   Close Tab`n"
    HelpText .= "[Z] (x2)   Undo Close`n"
    HelpText .= "[?]        Hold Help"
    
    Cheat_Gui.Add("Text", "c00FF00", HelpText)
    WinSetTransparent(220, Cheat_Gui.Hwnd)
    Cheat_Gui.Show("NoActivate")
}

HideCheatSheet() {
    global Cheat_Gui
    if (Cheat_Gui) {
        Cheat_Gui.Destroy()
        Cheat_Gui := ""
    }
}
