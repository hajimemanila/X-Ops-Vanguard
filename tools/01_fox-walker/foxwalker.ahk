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
    SetTimer UpdateInfo, 500
}

DeactivateWalker() {
    global WalkerMode := false
    SetTimer UpdateInfo, 0
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
    
    HUD_Text_Status := HUD_Gui.Add("Text", "c" HUD_Color " Center w400 vStatus", "Initialized")
    
    HUD_Gui.SetFont("s" (HUD_FontSize - 2) " w400", "Segoe UI")
    HUD_Text_Info := HUD_Gui.Add("Text", "cWhite Center w400 vInfo", "...")

    WinSetTransparent(HUD_Transparent, HUD_Gui.Hwnd)
    
    ; Position: Bottom Center
    X_Pos := (A_ScreenWidth / 2) - 200
    Y_Pos := A_ScreenHeight - 120
    HUD_Gui.Show("x" X_Pos " y" Y_Pos " NoActivate")
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

; --- Info Updater (Parses Window Title) ---
UpdateInfo() {
    if (!WalkerMode || !HUD_Gui)
        return
    try {
        FullTitle := WinGetTitle("A")
        ; Remove standard suffixes
        CleanTitle := StrReplace(FullTitle, " - Mozilla Firefox", "")
        CleanTitle := StrReplace(CleanTitle, " — Mozilla Firefox", "")
        
        ; Extract Container (Assumes "Page Title - ContainerName")
        parts := StrSplit(CleanTitle, [" - ", " — "]) 
        
        if (parts.Length > 1) {
            Container := parts[parts.Length]
            Title := StrReplace(CleanTitle, " - " Container, "")
            if (StrLen(Title) > 40)
                Title := SubStr(Title, 1, 38) "..."
            DisplayStr := "[" Container "] " Title
        } else {
            if (StrLen(CleanTitle) > 45)
                CleanTitle := SubStr(CleanTitle, 1, 43) "..."
            DisplayStr := CleanTitle
        }
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
    
    HelpText := "
    (
    [ FOX WALKER MAP ]
    ------------------
    [ESC] (x2) Toggle ON/OFF
    [W]        Scroll Up
    [S]        Scroll Down
    [A]        Prev Tab
    [D]        Next Tab
    [G] (x2)   Discard (Mem)
    [L] (x2)   Search URL
    [M] (x2)   Mute Toggle
    [R] (x2)   Reload
    [0] (x2)   Close Others
    [X] (x2)   Close Tab
    [Z] (x2)   Undo Close
    [?]        Hold Help
    )"
    
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