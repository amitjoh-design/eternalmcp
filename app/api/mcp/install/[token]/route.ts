// GET /api/mcp/install/[token]?platform=mac|windows
// Returns a personalized install script with the user's token pre-baked.

import { NextRequest, NextResponse } from 'next/server'

function macScript(mcpUrl: string, email: string): string {
  return `#!/bin/bash
# -------------------------------------------------------
#  EternalMCP — Gmail MCP Auto-Installer (Mac / Linux)
#  Connected account: ${email}
#  Run: bash install-gmail-mcp.sh
# -------------------------------------------------------

set -e

MCP_URL="${mcpUrl}"
CONFIG_DIR="$HOME/Library/Application Support/Claude"
CONFIG_FILE="$CONFIG_DIR/claude_desktop_config.json"

echo ""
echo "  EternalMCP — Gmail MCP Installer"
echo "  ================================="
echo ""

# Create Claude config directory if it doesn't exist yet
mkdir -p "$CONFIG_DIR"

# Use Python 3 (built into macOS) to safely merge JSON
python3 - << 'PYEOF'
import json, os, sys

config_file = os.path.expanduser("$HOME/Library/Application Support/Claude/claude_desktop_config.json")
mcp_url = os.environ.get("MCP_URL", "")

# Load existing config or start fresh
if os.path.exists(config_file):
    with open(config_file, "r") as f:
        try:
            config = json.load(f)
        except json.JSONDecodeError:
            print("  Warning: existing config was invalid JSON — creating fresh copy.")
            config = {}
else:
    config = {}

# Merge in the Gmail MCP entry (npx mcp-remote works with all Claude Desktop versions)
config.setdefault("mcpServers", {})
config["mcpServers"]["gmail"] = {
    "command": "npx",
    "args": ["-y", "mcp-remote", mcp_url]
}

with open(config_file, "w") as f:
    json.dump(config, f, indent=2)

print("  Gmail MCP added to: " + config_file)
PYEOF

echo ""
echo "  ✅ Success! Gmail MCP installed."
echo ""
echo "  Next step: Quit and reopen Claude Desktop."
echo "  Then ask Claude: 'Send an email to ...'"
echo ""
`
}

function windowsScript(mcpUrl: string, email: string): string {
  // A .bat file that invokes PowerShell inline — user just double-clicks it.
  return `@echo off
:: -------------------------------------------------------
::  EternalMCP - Gmail MCP Auto-Installer (Windows)
::  Connected account: ${email}
::  Double-click this file to run.
:: -------------------------------------------------------

title EternalMCP - Gmail MCP Installer
echo.
echo   EternalMCP - Gmail MCP Installer
echo   ==================================
echo.

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$mcpUrl = '${mcpUrl}'; " ^
  "$configDir = $env:APPDATA + '\\Claude'; " ^
  "$configFile = $configDir + '\\claude_desktop_config.json'; " ^
  "if (-not (Test-Path $configDir)) { New-Item -ItemType Directory -Path $configDir | Out-Null }; " ^
  "if (Test-Path $configFile) { " ^
  "  try { $cfg = Get-Content $configFile -Raw | ConvertFrom-Json } " ^
  "  catch { Write-Host '  Warning: existing config invalid - creating fresh copy.'; $cfg = [PSCustomObject]@{} }; " ^
  "} else { $cfg = [PSCustomObject]@{} }; " ^
  "if (-not $cfg.PSObject.Properties['mcpServers']) { " ^
  "  $cfg | Add-Member -Name 'mcpServers' -Value ([PSCustomObject]@{}) -MemberType NoteProperty " ^
  "}; " ^
  "$cfg.mcpServers | Add-Member -Name 'gmail' -Value ([PSCustomObject]@{ command='npx'; args=@('-y','mcp-remote',$mcpUrl) }) -MemberType NoteProperty -Force; " ^
  "$cfg | ConvertTo-Json -Depth 10 | Set-Content $configFile -Encoding UTF8; " ^
  "Write-Host ('  Gmail MCP added to: ' + $configFile)"

echo.
echo   Success! Gmail MCP installed.
echo.
echo   Next step: Quit and reopen Claude Desktop.
echo   Then ask Claude: "Send an email to ..."
echo.
pause
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

  // Basic token format validation
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
