import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { createServer as createNetServer } from 'node:net'
import { fileURLToPath } from 'node:url'
import { setTimeout as delay } from 'node:timers/promises'
import { createServer as createViteServer } from 'vite'

if (process.env.APP_ENV !== 'test' || !/^lanthit_phase1_[a-z0-9]+_test$/.test(process.env.DB_NAME || '')) {
  throw new Error('HTTP checks require APP_ENV=test and the isolated phase-1 test database.')
}
const php = process.env.PHP_BINARY || 'php'
const children = []
let vite
async function start(extra = {}) {
  const probe = createNetServer()
  await new Promise(resolve => probe.listen(0, '127.0.0.1', resolve))
  const port = probe.address().port
  await new Promise(resolve => probe.close(resolve))
  const child = spawn(php, ['-S', `127.0.0.1:${port}`, '-t', fileURLToPath(new URL('../public', import.meta.url))], { env: { ...process.env, ...extra }, stdio: 'ignore' })
  children.push(child)
  let spawnError
  child.on('error', error => { spawnError = error })
  const base = `http://127.0.0.1:${port}/index.php`
  for (let i = 0; i < 50; i++) {
    if (spawnError) throw spawnError
    try { await fetch(base, { signal: AbortSignal.timeout(1000) }); return base } catch { await delay(100) }
  }
  throw new Error('PHP test server did not become ready.')
}
let checks = 0
function check(condition, message) { assert.ok(condition, message); checks++; console.log(`PASS: ${message}`) }
try {
  const base = await start()
  const good = await fetch(`${base}?route=health`)
  check(good.status === 200, 'health succeeds with the imported schema')
  check(JSON.stringify(await good.json()) === '{"status":"ok"}', 'health response contains no database metadata')
  check(good.headers.get('cache-control') === 'no-store', 'health response is not cached')
  check(/^[a-f0-9]{32}$/.test(good.headers.get('x-request-id')), 'responses include a request identifier')
  check((await fetch(`${base}?route=health`, { method: 'POST' })).status === 405, 'health rejects unsupported methods')
  check((await fetch(`${base}?route[]=health`)).status === 404, 'array route parameters are rejected safely')
  check((await fetch(`${base}?route=students`)).status === 404, 'unimplemented endpoints stay unavailable')
  const broken = await start({ DB_NAME: 'lanthit_phase1_missing_test' })
  const failed = await fetch(`${broken}?route=health`)
  const failure = await failed.json()
  check(failed.status === 503 && failure.error.code === 'SERVICE_UNAVAILABLE', 'database failures produce controlled JSON errors')
  check(!JSON.stringify(failure).includes('missing_test') && !JSON.stringify(failure).includes('PDO'), 'errors do not disclose DSN, schema names, or exception internals')

  vite = await createViteServer({ server: { host: '127.0.0.1', port: 0, hmr: false } })
  await vite.listen()
  const port = vite.httpServer.address().port
  for (const path of ['/backend/config/config.example.php', '/backend/database/schema.sql', '/backend/src/Database.php']) {
    const response = await fetch(`http://127.0.0.1:${port}${path}`)
    check(response.status === 403, `Vite blocks private backend source: ${path}`)
  }
  console.log(`${checks} HTTP/privacy checks passed.`)
} finally {
  await vite?.close()
  for (const child of children) {
    if (child.exitCode === null) {
      const closed = new Promise(resolve => child.once('exit', resolve))
      child.kill()
      await closed
    }
  }
}
