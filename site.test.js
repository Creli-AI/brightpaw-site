import { test } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const pages = readdirSync(here).filter((f) => f.endsWith('.html'))
const read = (f) => readFileSync(join(here, f), 'utf8')

test('every page is here', () => {
  for (const p of ['index.html', 'pricing.html', 'book.html', 'about.html']) assert.ok(pages.includes(p), p)
})

test('no external requests', () => {
  for (const f of pages) {
    // What a page loads (images, scripts, styles, frames) must come from this site; links people follow may go anywhere.
    for (const tag of read(f).match(/<(img|script|link|iframe|source|video|audio)\b[^>]*>/gi) ?? []) {
      assert.doesNotMatch(tag, /(src|href)\s*=\s*"(https?:)?\/\//i, `${f}: ${tag}`)
    }
  }
  assert.doesNotMatch(read('site.css'), /url\(\s*['"]?(https?:)?\/\//i, 'site.css loads nothing from outside')
  assert.doesNotMatch(read('site.css'), /@import/i, 'site.css imports nothing')
})

test('links resolve', () => {
  for (const f of pages) {
    for (const [, ref] of read(f).matchAll(/(?:href|src)="([^"]+)"/g)) {
      if (/^(#|mailto:|tel:|https?:)/.test(ref)) continue
      const path = ref.split('#')[0].split('?')[0]
      if (path) assert.ok(existsSync(join(here, path)), `${f} links to ${ref}`)
    }
  }
  for (const [, ref] of read('site.css').matchAll(/url\(\s*['"]?([^'")]+)/g)) assert.ok(existsSync(join(here, ref)), `site.css loads ${ref}`)
})
