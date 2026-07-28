import { useMemo, useState } from 'react'
import {
  buildRulesLabel,
  canSelectMenuDish,
  ensureMenuRow,
  getDishesForMenuRow,
  isAllVegSelectionMode,
  resolveRulesForVegPreference,
  serializeSelection,
  validateMenuSelection,
} from '../../lib/cateringMenuSelection'

function DishCheckbox({ dish, checked, disabled, onToggle }) {
  return (
    <label
      className={`flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2.5 transition-colors ${
        checked
          ? 'border-[#591902] bg-[#FBF6ED]'
          : 'border-[#591902]/15 bg-white hover:border-[#591902]/35'
      } ${disabled && !checked ? 'cursor-not-allowed opacity-50' : ''}`}
    >
      <input
        type="checkbox"
        className="mt-1 h-4 w-4 accent-[#591902]"
        checked={checked}
        disabled={disabled && !checked}
        onChange={() => onToggle(dish.name)}
      />
      <span className="min-w-0">
        <span className="block text-[13px] font-medium text-[#591902]">{dish.name}</span>
        {dish.description ? (
          <span className="mt-0.5 block text-[11px] leading-[1.45] text-[#591902]/60">
            {dish.description}
          </span>
        ) : null}
      </span>
    </label>
  )
}

function parseInitialSelection(initialSelection) {
  return String(initialSelection ?? '')
    .split(',')
    .map(part => part.trim())
    .filter(Boolean)
}

function CateringMenuChooseModalContent({
  row,
  menuByCategory = {},
  vegPreference = '',
  packageLevelSlug = '',
  initialSelection = '',
  onClose,
  onConfirm,
}) {
  const [selected, setSelected] = useState(() => parseInitialSelection(initialSelection))
  const [error, setError] = useState('')

  const resolvedRow = useMemo(() => ensureMenuRow(row), [row])

  const dishes = useMemo(
    () =>
      resolvedRow
        ? getDishesForMenuRow(resolvedRow, menuByCategory, vegPreference, packageLevelSlug)
        : [],
    [menuByCategory, packageLevelSlug, resolvedRow, vegPreference]
  )

  const rules = useMemo(
    () => resolveRulesForVegPreference(resolvedRow?.rules ?? { maxPick: 1 }, vegPreference),
    [resolvedRow?.rules, vegPreference]
  )
  const rulesLabel = buildRulesLabel(rules, vegPreference)

  const showSplit = Boolean(rules.vegPick && rules.nonvegPick && !String(vegPreference ?? '').trim())
  const allVegMode = isAllVegSelectionMode(selected, dishes, rules)

  const vegDishes = useMemo(
    () => dishes.filter(dish => dish.dietary === 'veg' || dish.dietary === 'both'),
    [dishes]
  )
  const nonvegDishes = useMemo(() => dishes.filter(dish => dish.dietary === 'non_veg'), [dishes])

  if (!resolvedRow) return null

  const toggleDish = name => {
    setError('')

    setSelected(prev => {
      if (prev.includes(name)) {
        return prev.filter(item => item !== name)
      }

      if (!canSelectMenuDish(name, prev, dishes, rules)) return prev
      return [...prev, name]
    })
  }

  const isDishDisabled = name => !canSelectMenuDish(name, selected, dishes, rules)

  const handleConfirm = () => {
    const validation = validateMenuSelection(selected, dishes, rules)
    if (!validation.ok) {
      setError(validation.message)
      return
    }

    onConfirm?.(serializeSelection(selected))
    onClose?.()
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-end justify-center bg-black/45 p-4 sm:items-center">
      <div
        className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-[#F8F4ED] shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="catering-menu-modal-title"
      >
        <div className="border-b border-[#591902]/15 px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2
                id="catering-menu-modal-title"
                className="text-[18px] font-semibold text-[#591902]"
                style={{ fontFamily: "'Poppins', sans-serif" }}
              >
                {resolvedRow.title}
              </h2>
              <p className="mt-1 text-[12px] text-[#591902]/70">{rulesLabel}</p>
              {resolvedRow.chooseHint ? (
                <p className="mt-1 text-[11px] text-[#591902]/50">{resolvedRow.chooseHint}</p>
              ) : null}
              {allVegMode ? (
                <p className="mt-1 text-[11px] font-medium text-[#591902]/70">
                  All-vegetarian selection ({rules.maxPick} items)
                </p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full px-2 py-1 text-[22px] leading-none text-[#591902]/70 hover:bg-[#591902]/10"
              aria-label="Close"
            >
              ×
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 hide-scrollbar" data-lenis-prevent>
          {!dishes.length ? (
            <p className="text-[13px] text-[#591902]/60">
              Menu items for this section are not loaded yet. Check Strapi catering-menu and Public
              permissions.
            </p>
          ) : showSplit ? (
            <div className="space-y-5">
              <div>
                <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-[#591902]/80">
                  Vegetarian ({rules.vegPick})
                </p>
                <div className="space-y-2">
                  {vegDishes.map(dish => (
                    <DishCheckbox
                      key={`veg-${dish.name}`}
                      dish={dish}
                      checked={selected.includes(dish.name)}
                      disabled={isDishDisabled(dish.name)}
                      onToggle={toggleDish}
                    />
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-[#591902]/80">
                  Non-vegetarian ({rules.nonvegPick})
                </p>
                <div className="space-y-2">
                  {nonvegDishes.map(dish => (
                    <DishCheckbox
                      key={`nv-${dish.name}`}
                      dish={dish}
                      checked={selected.includes(dish.name)}
                      disabled={isDishDisabled(dish.name)}
                      onToggle={toggleDish}
                    />
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {dishes.map(dish => (
                <DishCheckbox
                  key={dish.name}
                  dish={dish}
                  checked={selected.includes(dish.name)}
                  disabled={isDishDisabled(dish.name)}
                  onToggle={toggleDish}
                />
              ))}
            </div>
          )}
        </div>

        {error ? <p className="px-5 text-[12px] text-red-700">{error}</p> : null}

        <div className="flex gap-3 border-t border-[#591902]/15 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-full border border-[#591902] px-4 py-2.5 text-[13px] font-medium text-[#591902]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="flex-1 rounded-full bg-[#591902] px-4 py-2.5 text-[13px] font-medium text-white hover:bg-[#4B1501]"
          >
            Confirm ({selected.length}/{Number(rules.maxPick) > 0 ? rules.maxPick : 1})
          </button>
        </div>
      </div>
    </div>
  )
}

export default function CateringMenuChooseModal({
  open,
  row,
  menuByCategory = {},
  vegPreference = '',
  packageLevelSlug = '',
  initialSelection = '',
  onClose,
  onConfirm,
}) {
  const resolvedRow = useMemo(() => ensureMenuRow(row), [row])

  if (!open || !resolvedRow) return null

  return (
    <CateringMenuChooseModalContent
      key={`${resolvedRow.title}-${initialSelection}-${vegPreference}-${packageLevelSlug}`}
      row={row}
      menuByCategory={menuByCategory}
      vegPreference={vegPreference}
      packageLevelSlug={packageLevelSlug}
      initialSelection={initialSelection}
      onClose={onClose}
      onConfirm={onConfirm}
    />
  )
}
