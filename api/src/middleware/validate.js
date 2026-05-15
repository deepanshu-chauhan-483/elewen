export const validate = schema => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false, stripUnknown: true })
  if (!error) return next()

  const fields = {}
  error.details.forEach(d => {
    fields[d.path[0]] = d.message.replace(/['"]/g, '')
  })

  return res.status(400).json({ error: 'Validation failed', fields })
}
