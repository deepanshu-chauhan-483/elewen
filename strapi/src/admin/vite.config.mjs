import { mergeConfig } from 'vite';

/** Website uses 5173, admin-pannel uses 5174 — Strapi admin Vite must use 5175. */
const ADMIN_DEV_PORT = 5175;

export default (config) =>
  mergeConfig(config, {
    server: {
      ...config.server,
      port: ADMIN_DEV_PORT,
      strictPort: true,
      hmr: {
        ...(config.server?.hmr ?? {}),
        port: ADMIN_DEV_PORT,
        clientPort: ADMIN_DEV_PORT,
      },
    },
  });
