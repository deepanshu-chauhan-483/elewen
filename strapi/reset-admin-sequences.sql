SELECT setval(
  pg_get_serial_sequence('public.admin_permissions', 'id'),
  COALESCE((SELECT MAX(id) FROM public.admin_permissions), 1),
  (SELECT COUNT(*) > 0 FROM public.admin_permissions)
);

SELECT setval(
  pg_get_serial_sequence('public.admin_permissions_role_lnk', 'id'),
  COALESCE((SELECT MAX(id) FROM public.admin_permissions_role_lnk), 1),
  (SELECT COUNT(*) > 0 FROM public.admin_permissions_role_lnk)
);

SELECT setval(
  pg_get_serial_sequence('public.admin_roles', 'id'),
  COALESCE((SELECT MAX(id) FROM public.admin_roles), 1),
  (SELECT COUNT(*) > 0 FROM public.admin_roles)
);

SELECT setval(
  pg_get_serial_sequence('public.admin_users', 'id'),
  COALESCE((SELECT MAX(id) FROM public.admin_users), 1),
  (SELECT COUNT(*) > 0 FROM public.admin_users)
);

SELECT setval(
  pg_get_serial_sequence('public.admin_users_roles_lnk', 'id'),
  COALESCE((SELECT MAX(id) FROM public.admin_users_roles_lnk), 1),
  (SELECT COUNT(*) > 0 FROM public.admin_users_roles_lnk)
);

SELECT setval(
  pg_get_serial_sequence('public.strapi_sessions', 'id'),
  COALESCE((SELECT MAX(id) FROM public.strapi_sessions), 1),
  (SELECT COUNT(*) > 0 FROM public.strapi_sessions)
);
