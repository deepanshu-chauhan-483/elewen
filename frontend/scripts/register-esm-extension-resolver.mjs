/** Registers the .js-appending resolve hook for plain-node runs of src files. */
import { register } from 'node:module'

register('./esm-extension-resolver.mjs', import.meta.url)
