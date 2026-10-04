import { test } from 'node:test'
import assert from 'node:assert/strict'
import { checkPhone, summarize, submit } from './booking.js'

const biscuit = { dog: 'Biscuit', size: 'Medium', area: 'Mueller', days: ['Mon', 'Wed', 'Fri'], time: 'midday', visit: 'walk30', name: 'Jordan Ellis', phone: '(512) 555-0193', notes: '' }

test('phone numbers are checked before sending', () => {
  assert.equal(checkPhone('(512) 555-0193').ok, true)
  assert.equal(checkPhone('+1 512-555-0193').value, '(512) 555-0193')
  assert.equal(checkPhone('555 01').ok, false)
  assert.equal(checkPhone('(012) 555-0193').ok, false)
  const r = submit({ ...biscuit, phone: '555 01' })
  assert.equal(r.ok, false)
  assert.match(r.errors.phone, /10-digit/)
})

test('the plan box counts the walks and the price per week', () => {
  assert.deepEqual(summarize(biscuit), { walks: 3, visit: '30-minute walk', when: 'Mon, Wed, Fri midday', perWeek: 72 })
})

test('a complete request is confirmed', () => {
  const r = submit(biscuit)
  assert.equal(r.ok, true)
  assert.match(r.message, /Thanks, Jordan\. We will text \(512\) 555-0193/)
  assert.match(r.message, /\$72 a week/)
})
