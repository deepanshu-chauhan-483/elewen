import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

const MONTH_LABELS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

function toDateInputValue(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function parseDateInput(value) {
  const [year, month, day] = String(value ?? '')
    .split('-')
    .map(Number)

  if (!year || !month || !day) return null

  const date = new Date(year, month - 1, day)
  return Number.isNaN(date.getTime()) ? null : date
}

function getCalendarDays(monthDate) {
  const year = monthDate.getFullYear()
  const month = monthDate.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  return [
    ...Array.from({ length: firstDay }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => new Date(year, month, index + 1)),
  ]
}

function buildTimeOptions() {
  return Array.from({ length: 48 }, (_, index) => {
    const hours = Math.floor(index / 2)
    const minutes = index % 2 === 0 ? '00' : '30'
    return `${String(hours).padStart(2, '0')}:${minutes}`
  })
}

function getDisplayValue(type, value, placeholder) {
  if (value) return value
  if (placeholder) return placeholder
  return type === 'time' ? 'Select time' : 'Select date'
}

export default function DateTimePicker({
  type = 'date',
  value = '',
  onChange,
  onBlur,
  className = '',
  style,
  min,
  disabled = false,
  placeholder,
  name,
  required,
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [popoverStyle, setPopoverStyle] = useState(null)
  const wrapperRef = useRef(null)
  const triggerRef = useRef(null)
  const popoverRef = useRef(null)
  const parsedValue = useMemo(() => parseDateInput(value), [value])
  const minDate = useMemo(() => parseDateInput(min), [min])
  const [visibleMonth, setVisibleMonth] = useState(() => parsedValue ?? minDate ?? new Date())
  const calendarDays = useMemo(() => getCalendarDays(visibleMonth), [visibleMonth])
  const timeOptions = useMemo(() => buildTimeOptions(), [])

  useEffect(() => {
    if (!isOpen) return undefined

    const updatePosition = () => {
      const rect = triggerRef.current?.getBoundingClientRect()
      if (!rect) return

      setPopoverStyle({
        top: rect.bottom + 8,
        left: rect.left,
        minWidth: Math.max(rect.width, type === 'time' ? 180 : 292),
      })
    }

    updatePosition()
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)

    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [isOpen, type])

  useEffect(() => {
    if (!isOpen) return undefined

    const close = () => {
      setIsOpen(false)
      onBlur?.()
    }

    const handlePointerDown = event => {
      if (
        wrapperRef.current?.contains(event.target) ||
        popoverRef.current?.contains(event.target)
      ) {
        return
      }
      close()
    }

    const handleKeyDown = event => {
      if (event.key === 'Escape') close()
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onBlur])

  const emitChange = nextValue => {
    onChange?.({ target: { name, value: nextValue } })
    onBlur?.()
    setIsOpen(false)
  }

  const moveMonth = offset => {
    setVisibleMonth(current => new Date(current.getFullYear(), current.getMonth() + offset, 1))
  }

  const normalizedMin = minDate ? toDateInputValue(minDate) : ''
  const normalizedValue = String(value ?? '')

  return (
    <div ref={wrapperRef} className="relative w-fullhide-scrollbar " data-lenis-prevent>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-required={required}
        onClick={() => {
          if (!isOpen) {
            setVisibleMonth(parsedValue ?? minDate ?? new Date())
          }
          setIsOpen(open => !open)
        }}
        className={`${className} text-left disabled:cursor-not-allowed`.trim()}
        style={style}
      >
        <span className={value ? '' : 'text-current opacity-60'}>
          {getDisplayValue(type, value, placeholder)}
        </span>
      </button>

      {isOpen && !disabled && popoverStyle
        ? createPortal(
            <div
              ref={popoverRef}
              role="dialog"
              className="z-[9999] rounded-xl border border-white/15 bg-black p-3 text-white shadow-[0_18px_40px_rgba(0,0,0,0.28)] hide-scrollbar"
              data-lenis-prevent
              style={{
                position: 'fixed',
                ...popoverStyle,
              }}
            >
              {type === 'time' ? (
                <div className="max-h-64 overflow-y-auto pr-1 hide-scrollbar" data-lenis-prevent>
                  {timeOptions.map(option => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => emitChange(option)}
                      className={`block w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                        option === normalizedValue
                          ? 'bg-white text-black'
                          : 'text-white hover:bg-white/12'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              ) : (
                <div>
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => moveMonth(-1)}
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20 text-white transition hover:bg-white hover:text-black"
                      aria-label="Previous month"
                    >
                      ‹
                    </button>
                    <p className="text-sm font-medium">
                      {MONTH_LABELS[visibleMonth.getMonth()]} {visibleMonth.getFullYear()}
                    </p>
                    <button
                      type="button"
                      onClick={() => moveMonth(1)}
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20 text-white transition hover:bg-white hover:text-black"
                      aria-label="Next month"
                    >
                      ›
                    </button>
                  </div>

                  <div className="grid grid-cols-7 gap-1 text-center">
                    {WEEKDAY_LABELS.map((label, index) => (
                      <span key={`${label}-${index}`} className="py-1 text-[11px] text-white/55">
                        {label}
                      </span>
                    ))}
                    {calendarDays.map((day, index) => {
                      if (!day) return <span key={`blank-${index}`} className="h-9" />

                      const dayValue = toDateInputValue(day)
                      const isDisabled = normalizedMin && dayValue < normalizedMin
                      const isSelected = dayValue === normalizedValue

                      return (
                        <button
                          key={dayValue}
                          type="button"
                          disabled={isDisabled}
                          onClick={() => emitChange(dayValue)}
                          className={`flex h-9 items-center justify-center rounded-lg text-sm transition ${
                            isSelected
                              ? 'bg-white text-black'
                              : 'text-white hover:bg-white/12 disabled:text-white/25 disabled:hover:bg-transparent'
                          }`}
                        >
                          {day.getDate()}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>,
            document.body
          )
        : null}
    </div>
  )
}
