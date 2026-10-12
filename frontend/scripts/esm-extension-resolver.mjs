/**
 * Node ESM resolve hook: appends .js to extensionless relative imports so
 * plain `node` can run scripts against Vite-style src files.
 * Enable with:  node --import ./scripts/register-esm-extension-resolver.mjs <script>
 */
export async function resolve(specifier, context, next) {
  const isRelative = specifier.startsWith('.') && !specifier.endsWith('.js')

  if (isRelative) {
    try {
      return await next(`${specifier}.js`, context)
    } catch {
      // Fall through (e.g. a directory index or genuinely missing file).
    }
  }

  return next(specifier, context)
}
