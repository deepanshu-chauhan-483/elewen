import { useEffect, useReducer } from 'react'
import { useNavigate } from 'react-router-dom'
import HookahAgeConfirmModal from './HookahAgeConfirmModal'
import {
  isHookahAgeConfirmed,
  setHookahAgeConfirmed,
  subscribeHookahAgeConfirmation,
} from '../../lib/hookahAgeGate'

/**
 * One shared 18+ gate for Hookah/Sheesha.
 * Shows once per browser (search, listing, PDP, Most Loved links). Never again after confirm.
 */
export default function HookahAgeGate({ children, cancelTo = '/' }) {
  const navigate = useNavigate()
  const [, bumpConfirmed] = useReducer(count => count + 1, 0)

  useEffect(() => subscribeHookahAgeConfirmation(bumpConfirmed), [])

  const handleConfirm = () => {
    setHookahAgeConfirmed()
  }

  const handleCancel = () => {
    navigate(cancelTo, { replace: true })
  }

  if (!isHookahAgeConfirmed()) {
    return (
      <HookahAgeConfirmModal open onClose={handleCancel} onConfirm={handleConfirm} />
    )
  }

  return children
}
