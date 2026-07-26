/** True when React Router / browser history can go back one step. */
export function canNavigateBack() {
  if (typeof window === 'undefined') return false

  const historyIndex = window.history.state?.idx
  if (typeof historyIndex === 'number') return historyIndex > 0

  return window.history.length > 1
}
