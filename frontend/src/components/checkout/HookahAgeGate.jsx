import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import HookahAgeConfirmModal from './HookahAgeConfirmModal'
import { isHookahAgeConfirmed, setHookahAgeConfirmed } from '../../lib/hookahAgeGate'

/**
 * One shared 18+ gate for Hookah/Sheesha.
 * Shows once (search, listing, or PDP). After confirm, never again in this browser.
 */
export default function HookahAgeGate({ children, cancelTo = '/' }) {
  const navigate = useNavigate()
  const [confirmed, setConfirmed] = useState(() => isHookahAgeConfirmed())

  useEffect(() => {
    if (isHookahAgeConfirmed()) setConfirmed(true)
  }, [])

  const handleConfirm = () => {
    setHookahAgeConfirmed()
    setConfirmed(true)
  }

  const handleCancel = () => {
    navigate(cancelTo, { replace: true })
  }

  if (!confirmed) {
    return (
      <HookahAgeConfirmModal open onClose={handleCancel} onConfirm={handleConfirm} />
    )
  }

  return children
}
