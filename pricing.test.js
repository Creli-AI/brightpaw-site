import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const read = (f) => readFileSync(join(here, f), 'utf8')

test('pricing page shows $105 a week', () => {
  const html = read('pricing.html')
  assert.match(html, /<h3>Weekday plan<\/h3>/)
  assert.match(html, /\$105<span class="per"> a week<\/span>/)
  assert.match(html, /\$21 a walk/)
})

test('pack panel removed everywhere', () => {
  for (const f of readdirSync(here).filter((x) => x.endsWith('.html'))) {
    assert.doesNotMatch(read(f), /10-walk pack|\$210|packs? (are|is) charged/i, f)
  }
})
