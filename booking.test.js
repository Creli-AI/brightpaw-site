import { test } from 'node:test'
import assert from 'node:assert/strict'
import { change, checkPhone, summarize, submit } from './booking.js'

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

test('days and time stay chosen after a field error', () => {
  const r = submit({ ...biscuit, days: ['Tue', 'Thu'], time: 'afternoon', phone: '555 01' })
  assert.equal(r.ok, false)
  assert.ok(r.errors.phone)
  assert.deepEqual(r.state.days, ['Tue', 'Thu'])
  assert.equal(r.state.time, 'afternoon')
})

test('weekday plan picks all five days', () => {
  const s = change(biscuit, 'visit', 'plan', true)
  assert.equal(s.visit, 'plan')
  assert.deepEqual(s.days, ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'])
})

test('summary shows $105 a week', () => {
  const s = summarize(change(biscuit, 'visit', 'plan', true))
  assert.equal(s.visit, 'Weekday plan')
  assert.equal(s.walks, 5)
  assert.equal(s.perWeek, 105)
  assert.match(submit({ ...biscuit, visit: 'plan', days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] }).message, /\$105 a week/)
})

test('single walks still work', () => {
  assert.equal(summarize({ ...biscuit, visit: 'walk60', days: ['Tue', 'Thu'] }).perWeek, 72)
  assert.equal(summarize({ ...biscuit, visit: 'dropin' }).perWeek, 60)
  // Unchecking a day while on the plan moves back to single 30-minute walks.
  const plan = change(biscuit, 'visit', 'plan', true)
  const back = change({ ...plan, days: ['Mon', 'Tue', 'Wed', 'Thu'] }, 'days', 'Fri', false)
  assert.equal(back.visit, 'walk30')
  assert.equal(summarize(back).perWeek, 96)
})
