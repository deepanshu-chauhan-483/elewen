import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import HookahAgeConfirmModal from './HookahAgeConfirmModal'
import { isHookahAgeConfirmed, setHookahAgeConfirmed } from '../../lib/hookahAgeGate'

/**
 * Blocks Hookah/Sheesha pages until the customer confirms they are 18+.
 * Confirmation is stored for the browser tab/session — listing and PDP share it
 * so the disclaimer is only shown once.
 */
export default function HookahAgeGate({ children, cancelTo = '/' }) {
  const navigate = useNavigate()
  const [confirmed, setConfirmed] = useState(() => isHookahAgeConfirmed())

  // Re-read shared confirmation when landing on listing or PDP.
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
