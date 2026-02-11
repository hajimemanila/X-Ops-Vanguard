; ==========================================================
; AutoHotKey Script: Fox Walker v3.0
; Description: Keyboard navigation for Firefox. HUD display, tab management.
; Author: X Ops Architect
; ==========================================================
#Requires AutoHotkey v2.0
#SingleInstance Force

; ==========================================================
; 🏗️ Initialization
; ==========================================================
Global Config := {}
Config.HudColor := "1d1d1d"
Config.HudText := "00ba7c"
Config.FontSize := 12

Global HudGui := ""
Global HudText := ""

CreateHud()

; ==========================================================
; 🎮 Key Bindings (Firefox Only)
; ==========================================================
#HotIf WinActive("ahk_exe firefox.exe")

; --- Navigation ---
!j::Send("{Down}")
!k::Send("{Up}")
!h::Send("!{Left}") ; Back
!l::Send("!{Right}") ; Forward

; --- Tabs ---
!q::TxPrevTab()
!w::TxNextTab()
!x::TxCloseTab()
!t::TxNewTab()
!r::TxReload()

; --- Zoom ---
!=::Send("^{=}")
!-::Send("^{-}")
!0::Send("^{0}")

; --- Scroll ---
+j::Send("{PgDn}")
+k::Send("{PgUp}")

#HotIf

; ==========================================================
; 🛠️ Functions
; ==========================================================

CreateHud() {
    Global HudGui, HudText
    HudGui := Gui("+AlwaysOnTop -Caption +ToolWindow +E0x20")
    HudGui.BackColor := Config.HudColor
    HudGui.SetFont("s" Config.FontSize " c" Config.HudText, "Segoe UI")
    HudText := HudGui.Add("Text", "Center w200", "")
    WinSetTransparent(200, HudGui.Hwnd)
}

ShowHud(Message) {
    Global HudGui, HudText
    HudText.Value := Message
    
    ; Center on active window
    try {
        WinGetPos(&X, &Y, &W, &H, "A")
        TargetX := X + (W / 2) - 100
        TargetY := Y + H - 100
        HudGui.Show("x" TargetX " y" TargetY " NoActivate")
        SetTimer(HideHud, -1000)
    }
}

HideHud() {
    HudGui.Hide()
}

TxPrevTab() {
    Send("^{PgUp}")
    ShowHud("<< Prev Tab")
}

TxNextTab() {
    Send("^{PgDn}")
    ShowHud("Next Tab >>")
}

TxCloseTab() {
    Send("^{w}")
    ShowHud("Close Tab")
}

TxNewTab() {
    Send("^{t}")
    ShowHud("New Tab")
}

TxReload() {
    Send("^{r}")
    ShowHud("Reload")
}