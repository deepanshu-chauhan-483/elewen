export async function createOperationalAlert(
  db,
  { alertType, severity = 'medium', message, metadata, relatedEntityType, relatedEntityId }
) {
  const normalizedEntityId =
    relatedEntityId === null || relatedEntityId === undefined ? null : String(relatedEntityId)

  const existing = await db.alert.findFirst({
    where: {
      alertType,
      relatedEntityType: relatedEntityType ?? null,
      relatedEntityId: normalizedEntityId,
      status: { not: 'resolved' },
    },
  })

  if (existing) return existing

  return db.alert.create({
    data: {
      alertType,
      severity,
      message,
      metadata,
      relatedEntityType: relatedEntityType ?? null,
      relatedEntityId: normalizedEntityId,
      status: 'new',
    },
  })
}
