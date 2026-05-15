import { requireAuth } from './auth.js'
import { requireAdmin } from './admin.js'

export function requireAdminAccess(req, res, next) {
  return requireAuth(req, res, err => {
    if (err) return next(err)
    return requireAdmin(req, res, next)
  })
}
