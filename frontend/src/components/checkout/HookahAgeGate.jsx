import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import HookahAgeConfirmModal from './HookahAgeConfirmModal'
import { isHookahAgeConfirmed, setHookahAgeConfirmed } from '../../lib/hookahAgeGate'

/**
 * Blocks Hookah/Sheesha pages until the customer confirms they are 18+.
 * After confirm, localStorage keeps it — listing and PDP will not ask again.
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
