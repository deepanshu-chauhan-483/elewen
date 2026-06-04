/**
 * Ensures port 5173 is free for the website (frontend/vite).
 * Stops Strapi admin HMR / stray Strapi develop that blocks the port.
 */
import { execSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const PORT = Number(process.env.VITE_DEV_PORT || 5173)
const __dirname = path.dirname(fileURLToPath(import.meta.url))

function run(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim()
  } catch {
    return ''
  }
}

function getListeners(port) {
  const out = run(`netstat -ano | findstr ":${port}" | findstr LISTENING`)
  if (!out) return []
  const pids = new Set()
  for (const line of out.split(/\r?\n/)) {
    const m = line.trim().match(/\s+(\d+)\s*$/i)
    if (m) pids.add(Number(m[1]))
  }
  return [...pids]
}

function getCommandLine(pid) {
  return run(`wmic process where processid=${pid} get CommandLine /format:list`)
    .replace(/^CommandLine=/m, '')
    .trim()
}

function shouldStop(cmd) {
  const c = cmd.toLowerCase()
  if (!c.includes('node')) return false
  if (c.includes('strapi')) return true
  if (c.includes('vite') && c.includes('elewen\\frontend')) return false
  if (c.includes('elewen\\frontend') && c.includes('vite')) return false
  return false
}

const pids = getListeners(PORT)
if (!pids.length) {
  console.log(`[claim-port] ${PORT} is free for frontend.`)
  process.exit(0)
}

let stopped = 0
for (const pid of pids) {
  const cmd = getCommandLine(pid)
  if (shouldStop(cmd)) {
    console.log(`[claim-port] Stopping PID ${pid} (Strapi blocked port ${PORT})`)
    run(`taskkill /PID ${pid} /F`)
    stopped++
  } else {
    console.error(
      `[claim-port] Port ${PORT} is used by PID ${pid}:\n  ${cmd.slice(0, 200)}\n` +
        `Stop that process manually, then run npm run dev again.`
    )
    process.exit(1)
  }
}

if (stopped > 0) {
  console.log(`[claim-port] Freed port ${PORT}. Use "npm run develop" in strapi (not npx strapi develop).`)
}
