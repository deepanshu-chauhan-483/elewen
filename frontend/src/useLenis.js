import { useContext } from 'react'
import LenisContext from './LenisContext'

export function useLenis() {
  return useContext(LenisContext)
}
