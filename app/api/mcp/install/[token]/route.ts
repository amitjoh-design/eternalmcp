// GET /api/mcp/install/[token]?platform=mac|windows
// Returns a personalized install script with the user's token pre-baked.

import { NextRequest, NextResponse } from 'next/server'

function macScript(mcpUrl: string, email: string): string {
  // NOTE: Use unquoted PYEOF so bash variables ($CONFIG_FILE, $MCP_URL) are expanded
  return `#!/bin/bash
# -------------------------------------------------------
#  EternalMCP — Gmail MCP Auto-Installer (Mac / Linux)
#  Connected account: ${email}
#  Run: bash install-gmail-mcp.sh
# -------------------------------------------------------

MCP_URL="${mcpUrl}"
CONFIG_DIR="$HOME/Library/Application Support/Claude"
CONFIG_FILE="$CONFIG_DIR/claude_desktop_config.json"

echo ""
echo "  EternalMCP — Gmail MCP Installer"
echo "  ================================="
echo ""

mkdir -p "$CONFIG_DIR"

# Use Python 3 (built into macOS) to safely merge the JSON config
python3 << PYEOF
import json, os

config_file = "${CONFIG_FILE}"
mcp_url = "${MCP_URL}"

if os.path.exists(config_file):
    try:
        with open(config_file, "r") as f:
            config = json.load(f)
        print("  Loaded existing config.")
    except Exception as e:
        print("  Warning: existing config invalid (" + str(e) + ") — starting fresh.")
        config = {}
else:
    config = {}

config.setdefault("mcpServers", {})
config["mcpServers"]["gmail"] = {
    "command": "npx",
    "args": ["-y", "mcp-remote", mcp_url]
}

with open(config_file, "w") as f:
    json.dump(config, f, indent=2)

print("  Gmail MCP written to: " + config_file)
PYEOF

echo ""
echo "  ✅ Done! Gmail MCP installed."
echo ""
echo "  IMPORTANT: Fully quit Claude Desktop (Cmd+Q or right-click Dock icon → Quit)"
echo "  then reopen it."
echo ""
echo "  Then try: 'Send a test email to myself'"
echo ""
`
}

function windowsScript(mcpUrl: string, email: string): string {
  // Build the full PowerShell logic as a clean multi-line script,
  // then Base64-encode it (UTF-16LE) for -EncodedCommand.
  // This avoids ALL cmd.exe escaping issues completely.
  const ps1 = `
$mcpUrl = '${mcpUrl}'
Write-Host ""
Write-Host "  EternalMCP - Gmail MCP Installer" -ForegroundColor Cyan
Write-Host "  ==================================" -ForegroundColor Cyan
Write-Host ""

# ── Find the config file location ──────────────────────────────────────────
$configFile = $null

# Option 1: Traditional installer  (%APPDATA%\\Claude)
$tradDir    = Join-Path $env:APPDATA "Claude"
$tradConfig = Join-Path $tradDir "claude_desktop_config.json"
if (Test-Path $tradDir) {
    $configFile = $tradConfig
    Write-Host "  Found Claude Desktop (Standard install)" -ForegroundColor Green
    Write-Host ("  Config: " + $tradConfig)
}

# Option 2: Windows Store installer (%LOCALAPPDATA%\\Packages\\Claude_*\\...)
if (-not $configFile) {
    $pkg = Get-ChildItem (Join-Path $env:LOCALAPPDATA "Packages") \`
        -Filter "Claude_*" -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($pkg) {
        $storeDir    = Join-Path $pkg.FullName "LocalCache\\Roaming\\Claude"
        $storeConfig = Join-Path $storeDir "claude_desktop_config.json"
        if (-not (Test-Path $storeDir)) {
            New-Item -ItemType Directory -Path $storeDir -Force | Out-Null
        }
        $configFile = $storeConfig
        Write-Host "  Found Claude Desktop (Windows Store)" -ForegroundColor Green
        Write-Host ("  Config: " + $storeConfig)
    }
}

# Option 3: Not found — show manual instructions and ask user
if (-not $configFile) {
    Write-Host ""
    Write-Host "  Could not find Claude Desktop automatically." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  How to find your config folder:" -ForegroundColor White
    Write-Host "  1. Open Claude Desktop"
    Write-Host "  2. Click the three lines (☰) in the TOP-LEFT corner"
    Write-Host "  3. Click Settings → Developer → Edit Config"
    Write-Host "  4. A folder window opens — copy that folder path"
    Write-Host ""
    $userDir = Read-Host "  Paste the folder path here and press Enter"
    if (-not $userDir) {
        Write-Host "Cancelled." -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
    if (-not (Test-Path $userDir)) {
        New-Item -ItemType Directory -Path $userDir -Force | Out-Null
    }
    $configFile = Join-Path $userDir "claude_desktop_config.json"
}

Write-Host ""

# ── Load or create config ───────────────────────────────────────────────────
if (Test-Path $configFile) {
    try {
        $cfg = Get-Content $configFile -Raw | ConvertFrom-Json
        Write-Host "  Loaded existing config." -ForegroundColor Gray
    } catch {
        Write-Host "  Warning: existing config was invalid JSON — starting fresh." -ForegroundColor Yellow
        $cfg = [PSCustomObject]@{}
    }
} else {
    $cfg = [PSCustomObject]@{}
}

# ── Merge in the gmail MCP entry ────────────────────────────────────────────
if (-not $cfg.PSObject.Properties['mcpServers']) {
    $cfg | Add-Member -Name 'mcpServers' \`
        -Value ([PSCustomObject]@{}) -MemberType NoteProperty
}
$cfg.mcpServers | Add-Member -Name 'gmail' -Value ([PSCustomObject]@{
    command = 'npx'
    args    = @('-y', 'mcp-remote', $mcpUrl)
}) -MemberType NoteProperty -Force

# ── Save ────────────────────────────────────────────────────────────────────
$cfg | ConvertTo-Json -Depth 10 | Set-Content $configFile -Encoding UTF8

Write-Host ""
Write-Host "  Gmail MCP installed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "  IMPORTANT: Fully quit Claude Desktop first:" -ForegroundColor Yellow
Write-Host "    Right-click the Claude icon in your system tray → Quit"
Write-Host "    Then reopen Claude Desktop."
Write-Host ""
Write-Host "  Then try: 'Send a test email to myself'"
Write-Host ""
Read-Host "  Press Enter to close"
`

  // Encode as UTF-16LE Base64 for PowerShell -EncodedCommand
  const encoded = Buffer.from(ps1, 'utf16le').toString('base64')

  return `@echo off
:: -------------------------------------------------------
::  EternalMCP - Gmail MCP Auto-Installer (Windows)
::  Connected account: ${email}
::  Double-click this file to run.
:: -------------------------------------------------------
title EternalMCP - Gmail MCP Installer
powershell -NoProfile -ExecutionPolicy Bypass -EncodedCommand ${encoded}
`
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const platform = req.nextUrl.searchParams.get('platform') || 'mac'
  const email = req.nextUrl.searchParams.get('email') || 'your account'
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.eternalmcp.com'

  if (!token || !token.startsWith('emcp_')) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 400 })
  }

  const mcpUrl = `${appUrl}/api/mcp/${token}`

  if (platform === 'windows') {
    return new NextResponse(windowsScript(mcpUrl, email), {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': 'attachment; filename="install-gmail-mcp.bat"',
      },
    })
  }

  return new NextResponse(macScript(mcpUrl, email), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Content-Disposition': 'attachment; filename="install-gmail-mcp.sh"',
    },
  })
}
