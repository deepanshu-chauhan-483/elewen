import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

function normalizeOptions(options = []) {
  return options.map(option =>
    typeof option === 'string' ? { value: option, label: option } : option
  )
}

export default function CustomSelect({
  value = '',
  options = [],
  onChange,
  onBlur,
  disabled = false,
  placeholder = 'Select',
  buttonClassName = '',
  menuClassName = '',
  optionClassName = '',
  selectedOptionClassName = '',
  arrowClassName = '',
  renderArrow,
  menuOffset = 2,
  ariaLabel,
}) {
  const normalizedOptions = useMemo(() => normalizeOptions(options), [options])
  const selectedOption = normalizedOptions.find(option => option.value === value) ?? null
  const displayLabel = selectedOption?.label ?? placeholder

  const [isOpen, setIsOpen] = useState(false)
  const [menuStyle, setMenuStyle] = useState(null)
  const wrapperRef = useRef(null)
  const buttonRef = useRef(null)
  const menuRef = useRef(null)
  const blurHandledRef = useRef(false)

  useEffect(() => {
    if (!isOpen) {
      blurHandledRef.current = false
      return undefined
    }

    const updateMenuPosition = () => {
      const rect = buttonRef.current?.getBoundingClientRect()
      if (!rect) return

      setMenuStyle({
        top: rect.bottom + menuOffset,
        left: rect.left,
        minWidth: rect.width,
        width: 'max-content',
      })
    }

    updateMenuPosition()

    window.addEventListener('resize', updateMenuPosition)
    window.addEventListener('scroll', updateMenuPosition, true)

    return () => {
      window.removeEventListener('resize', updateMenuPosition)
      window.removeEventListener('scroll', updateMenuPosition, true)
    }
  }, [isOpen, menuOffset])

  useEffect(() => {
    if (!isOpen) return undefined

    const triggerBlur = () => {
      if (blurHandledRef.current) return
      blurHandledRef.current = true
      onBlur?.()
    }

    const handlePointerDown = event => {
      if (!wrapperRef.current?.contains(event.target) && !menuRef.current?.contains(event.target)) {
        triggerBlur()
        setIsOpen(false)
      }
    }

    const handleEscape = event => {
      if (event.key === 'Escape') {
        triggerBlur()
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onBlur])

  const handleSelect = nextValue => {
    blurHandledRef.current = true
    onChange?.({ target: { value: nextValue } })
    onBlur?.()
    setIsOpen(false)
  }

  return (
    <div ref={wrapperRef} className="relative w-full">
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={ariaLabel ?? placeholder}
        onClick={() => setIsOpen(open => !open)}
        className={buttonClassName}
      >
        <span className="truncate">{displayLabel}</span>
      </button>

      {renderArrow ? (
        <span className={arrowClassName}>{renderArrow({ isOpen })}</span>
      ) : (
        <svg
          viewBox="0 0 12 12"
          className={arrowClassName}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <path d="m2.5 4.5 3.5 3 3.5-3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}

      {isOpen && !disabled && menuStyle
        ? createPortal(
            <div ref={menuRef} className={menuClassName} style={menuStyle}>
              <ul role="listbox" aria-label={ariaLabel ?? placeholder}>
                {normalizedOptions.map(option => {
                  const isSelected = option.value === value

                  return (
                    <li key={option.value}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        onClick={() => handleSelect(option.value)}
                        className={`${optionClassName} ${isSelected ? selectedOptionClassName : ''}`.trim()}
                      >
                        {option.label}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>,
            document.body
          )
        : null}
    </div>
  )
}
