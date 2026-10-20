/**
 * Brightpaw's booking form: it checks the phone number, keeps every choice when a field needs fixing, and shows a
 * confirmation. There is no server behind this site, so nothing is sent anywhere.
 *
 * The rules are plain functions (tested in booking.test.js); the last part wires them to the form in the browser.
 */
export const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']

export const VISITS = {
  walk30: { name: '30-minute walk', price: 24 },
  walk60: { name: '60-minute walk', price: 36 },
  dropin: { name: 'Drop-in visit', price: 20 },
  // Five 30-minute walks a week, Monday to Friday, with the same walker.
  plan: { name: 'Weekday plan', price: 105, weekly: true },
}

export const TIMES = { morning: 'morning', midday: 'midday', afternoon: 'afternoon' }

/** A US mobile number: ten digits (a leading 1 is fine), shown back as (512) 555-0148. */
export function checkPhone(raw) {
  const digits = String(raw ?? '').replace(/\D/g, '')
  const ten = digits.length === 11 && digits.startsWith('1') ? digits.slice(1) : digits
  if (ten.length !== 10) return { ok: false, error: 'Enter a 10-digit mobile number, like (512) 555-0148.' }
  if (/^[01]/.test(ten)) return { ok: false, error: 'Check the area code: a US number starts with 2 to 9.' }
  return { ok: true, value: `(${ten.slice(0, 3)}) ${ten.slice(3, 6)}-${ten.slice(6)}` }
}

/**
 * What a change to the form does to the rest of it: picking the weekday plan checks all five days, and unchecking a day
 * while on the plan moves back to single 30-minute walks.
 */
export function change(state, name, value, checked) {
  if (name === 'visit' && value === 'plan') return { ...state, visit: 'plan', days: [...DAYS] }
  if (name === 'days' && !checked && state.visit === 'plan') return { ...state, visit: 'walk30' }
  return state
}

/** The plan box beside the form: walks a week, the visit, when, and the price per week. */
export function summarize(state) {
  const days = DAYS.filter((d) => state.days.includes(d))
  const visit = VISITS[state.visit] ?? VISITS.walk30
  const when = days.length ? `${days.join(', ')}${state.time ? ` ${TIMES[state.time]}` : ''}` : 'Pick at least one day'
  const perWeek = visit.weekly ? visit.price : days.length * visit.price
  return { walks: days.length, visit: visit.name, when, perWeek }
}

/** The fields that need fixing, each with a plain line to show under it. */
export function validate(state) {
  const errors = {}
  if (!String(state.dog ?? '').trim()) errors.dog = 'Tell us your dog\'s name.'
  if (!state.days.length) errors.days = 'Pick at least one day.'
  if (!state.time) errors.time = 'Pick a time of day.'
  if (!String(state.name ?? '').trim()) errors.name = 'Tell us your name.'
  const phone = checkPhone(state.phone)
  if (!phone.ok) errors.phone = phone.error
  return errors
}

/** Send the request: the errors to show, or the confirmation. */
export function submit(state) {
  const errors = validate(state)
  // Every choice stays as it was: only the fields with an error need touching.
  if (Object.keys(errors).length) return { ok: false, errors, state }
  const s = summarize(state)
  const first = String(state.name).trim().split(/\s+/)[0]
  return {
    ok: true,
    state,
    message: `Thanks, ${first}. We will text ${checkPhone(state.phone).value} within two hours on weekdays to set up ${String(state.dog).trim()}'s free meet and greet: ${s.visit}, ${s.when}, $${s.perWeek} a week.`,
  }
}

// ---- In the browser

function read(form) {
  const data = new FormData(form)
  const get = (k) => String(data.get(k) ?? '')
  return {
    dog: get('dog'), size: get('size'), area: get('area'), days: data.getAll('days').map(String), time: data.get('time') ? get('time') : null,
    visit: get('visit') || 'walk30', name: get('name'), phone: get('phone'), notes: get('notes'),
  }
}

function write(form, state) {
  for (const box of form.querySelectorAll('input[name="days"]')) box.checked = state.days.includes(box.value)
  for (const r of form.querySelectorAll('input[name="time"]')) r.checked = r.value === state.time
  for (const r of form.querySelectorAll('input[name="visit"]')) r.checked = r.value === state.visit
}

function showErrors(form, errors) {
  for (const line of form.querySelectorAll('[data-error-for]')) {
    const msg = errors[line.dataset.errorFor]
    line.textContent = msg ?? ''
    line.hidden = !msg
  }
  for (const input of form.querySelectorAll('input[name], select[name], textarea[name]')) {
    if (errors[input.name]) input.setAttribute('aria-invalid', 'true')
    else input.removeAttribute('aria-invalid')
  }
  const first = Object.keys(errors)[0]
  if (first) form.querySelector(`[name="${first}"]`)?.focus()
}

function render(box, state) {
  if (!box) return
  const s = summarize(state)
  const put = (k, v) => { const el = box.querySelector(`[data-summary="${k}"]`); if (el) el.textContent = v }
  put('walks', String(s.walks))
  put('visit', s.visit)
  put('when', s.when)
  put('perWeek', `$${s.perWeek}`)
}

function init() {
  const form = document.querySelector('form.form')
  if (!form) return
  const box = document.querySelector('.summary')
  const done = form.querySelector('.confirm')
  const update = () => render(box, read(form))
  form.addEventListener('change', (e) => {
    const t = e.target
    if (t && t.name) write(form, change(read(form), t.name, t.value, t.checked))
    update()
  })
  form.addEventListener('input', update)
  form.addEventListener('submit', (e) => {
    e.preventDefault()
    const result = submit(read(form))
    write(form, result.state)
    showErrors(form, result.ok ? {} : result.errors)
    update()
    if (done) {
      done.textContent = result.ok ? result.message : ''
      done.hidden = !result.ok
      if (result.ok) done.focus()
    }
  })
  update()
}

if (typeof document !== 'undefined') init()
