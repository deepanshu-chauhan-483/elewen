#!/usr/bin/env node
import { buildExcludeDateSet } from '../src/lib/dateInput.js'

function assert(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

function isPickerDayDisabled(dayValue, min, excludeDates) {
  const excludeDateSet = buildExcludeDateSet(excludeDates)
  return Boolean((min && dayValue < min) || excludeDateSet.has(dayValue))
}

const excluded = buildExcludeDateSet(['2026-08-20', 42, null, '2026-08-21'])
assert(excluded.has('2026-08-20'), 'string dates should be excluded')
assert(excluded.has('2026-08-21'), 'second string date should be excluded')
assert(!excluded.has('2026-08-22'), 'unlisted dates should stay available')
assert(!excluded.has('42'), 'non-string entries should be ignored')

assert(buildExcludeDateSet(null).size === 0, 'null should disable nothing')
assert(buildExcludeDateSet(undefined).size === 0, 'undefined should disable nothing')
assert(buildExcludeDateSet({}).size === 0, 'non-array should disable nothing')
assert(buildExcludeDateSet([]).size === 0, 'empty array should disable nothing')

const min = '2026-08-17'
assert(
  isPickerDayDisabled('2026-08-16', min, ['2026-08-20']) === true,
  'dates before min should stay disabled'
)
assert(
  isPickerDayDisabled('2026-08-20', min, ['2026-08-20']) === true,
  'blocked dates on or after min should be disabled'
)
assert(
  isPickerDayDisabled('2026-08-18', min, ['2026-08-20']) === false,
  'unblocked dates on or after min should stay enabled'
)
assert(
  isPickerDayDisabled('2026-08-20', min, null) === false,
  'malformed blocked_dates should not disable extra days'
)

console.log('assert-blocked-dates: ok')
