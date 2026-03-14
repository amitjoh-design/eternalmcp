// GET /api/mcp/install/[token]?platform=mac|windows&slug=gmail|company-research
// Returns a personalized install script with the user's token pre-baked.

import { NextRequest, NextResponse } from 'next/server'

interface McpMeta {
  serverKey: string  // key in mcpServers JSON
  displayName: string
  testPrompt: string
}

const MCP_META: Record<string, McpMeta> = {
  gmail: {
    serverKey: 'gmail',
    displayName: 'Gmail MCP',
    testPrompt: "Send a test email to myself",
  },
  'company-research': {
    serverKey: 'company-research',
    displayName: 'Company Research MCP',
    testPrompt: "Research Reliance Industries on NSE and give me the PDF",
  },
  'storage-manager': {
    serverKey: 'storage-manager',
    displayName: 'Storage Manager MCP',
    testPrompt: "Use tool list_files to show my stored files",
  },
  'pdf-creator': {
    serverKey: 'pdf-creator',
    displayName: 'PDF Creator MCP',
    testPrompt: "Use tool create_pdf to convert this text to a PDF: Hello World",
  },
}

function macScript(mcpUrl: string, meta: McpMeta): string {
  return `#!/bin/bash
# -------------------------------------------------------
#  EternalMCP — ${meta.displayName} Auto-Installer (Mac / Linux)
#  Run: bash install-script.sh
# -------------------------------------------------------

MCP_URL="${mcpUrl}"
CONFIG_DIR="$HOME/Library/Application Support/Claude"
CONFIG_FILE="$CONFIG_DIR/claude_desktop_config.json"

echo ""
echo "  EternalMCP — ${meta.displayName} Installer"
echo "  ================================="
echo ""

mkdir -p "$CONFIG_DIR"

# Use Python 3 (built into macOS) to safely merge the JSON config
python3 << PYEOF
import json, os

config_file = "\${CONFIG_FILE}"
mcp_url = "\${MCP_URL}"

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
config["mcpServers"]["${meta.serverKey}"] = {
    "command": "npx",
    "args": ["-y", "mcp-remote", mcp_url],
    "timeout": 300000
}

with open(config_file, "w") as f:
    json.dump(config, f, indent=2)

print("  ${meta.displayName} written to: " + config_file)
PYEOF

echo ""
echo "  ✅ Done! ${meta.displayName} installed."
echo ""
echo "  IMPORTANT: Fully quit Claude Desktop (Cmd+Q or right-click Dock icon → Quit)"
echo "  then reopen it."
echo ""
echo "  Then try: '${meta.testPrompt}'"
echo ""
`
}

function windowsScript(mcpUrl: string, meta: McpMeta): string {
  const ps1 = `
$mcpUrl = '${mcpUrl}'
Write-Host ""
Write-Host "  EternalMCP - ${meta.displayName} Installer" -ForegroundColor Cyan
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

# ── Merge in the MCP entry ────────────────────────────────────────────────
if (-not $cfg.PSObject.Properties['mcpServers']) {
    $cfg | Add-Member -Name 'mcpServers' \`
        -Value ([PSCustomObject]@{}) -MemberType NoteProperty
}
$cfg.mcpServers | Add-Member -Name '${meta.serverKey}' -Value ([PSCustomObject]@{
    command = 'npx'
    args    = @('-y', 'mcp-remote', $mcpUrl)
    timeout = 300000
}) -MemberType NoteProperty -Force

# ── Save ────────────────────────────────────────────────────────────────────
$cfg | ConvertTo-Json -Depth 10 | Set-Content $configFile -Encoding UTF8

Write-Host ""
Write-Host "  ${meta.displayName} installed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "  IMPORTANT: Fully quit Claude Desktop first:" -ForegroundColor Yellow
Write-Host "    Right-click the Claude icon in your system tray → Quit"
Write-Host "    Then reopen Claude Desktop."
Write-Host ""
Write-Host "  Then try: '${meta.testPrompt}'"
Write-Host ""
Read-Host "  Press Enter to close"
`

  // Encode as UTF-16LE Base64 for PowerShell -EncodedCommand
  const encoded = Buffer.from(ps1, 'utf16le').toString('base64')

  return `@echo off
:: -------------------------------------------------------
::  EternalMCP - ${meta.displayName} Auto-Installer (Windows)
::  Double-click this file to run.
:: -------------------------------------------------------
title EternalMCP - ${meta.displayName} Installer
powershell -NoProfile -ExecutionPolicy Bypass -EncodedCommand ${encoded}
`
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const platform = req.nextUrl.searchParams.get('platform') || 'mac'
  const slug     = req.nextUrl.searchParams.get('slug') || 'gmail'
  const appUrl   = process.env.NEXT_PUBLIC_APP_URL || 'https://www.eternalmcp.com'

  if (!token || !token.startsWith('emcp_')) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 400 })
  }

  const meta    = MCP_META[slug] ?? MCP_META.gmail
  const mcpUrl  = `${appUrl}/api/mcp/${token}`
  const baseName = slug === 'gmail' ? 'gmail-mcp' : slug

  if (platform === 'windows') {
    return new NextResponse(windowsScript(mcpUrl, meta), {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': `attachment; filename="install-${baseName}.bat"`,
      },
    })
  }

  return new NextResponse(macScript(mcpUrl, meta), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Content-Disposition': `attachment; filename="install-${baseName}.sh"`,
    },
  })
}
