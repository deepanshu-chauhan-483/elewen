import jwt from 'jsonwebtoken'

/**
 * Verifies the Strapi JWT from the Authorization header.
 * Attaches req.user = { id: <strapi integer id>, ... } on success.
 * Strapi signs JWTs with STRAPI_JWT_SECRET — we verify locally, no round-trip needed.
 */
export const requireAuth = (req, res, next) => {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' })
  }

  const token = header.slice(7)
  try {
    const payload = jwt.verify(token, process.env.STRAPI_JWT_SECRET)
    req.user = payload   // { id: <int>, iat, exp }
    req.token = token
    next()
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' })
  }
}
