/**
 * Production image optimizer — same as vite-plugin-image-optimizer, but applies
 * sharp.rotate() so EXIF orientation is baked into pixels (dev serves raw EXIF).
 */
import fs from 'fs'
import fsp from 'fs/promises'
import { basename, join, dirname, extname, sep, resolve } from 'pathe'
import ansi from 'ansi-colors'

const PLUGIN_NAME = 'vite-plugin-image-optimizer'

const SLASH_RE = /[/\\]/

function filename(path) {
  const base = path.split(SLASH_RE).pop()
  if (!base) return undefined
  const separatorIndex = base.lastIndexOf('.')
  if (separatorIndex <= 0) return base
  return base.slice(0, separatorIndex)
}

function isRegex(src) {
  return Object.prototype.toString.call(src) === '[object RegExp]'
}

function isString(src) {
  return Object.prototype.toString.call(src) === '[object String]'
}

function isArray(src) {
  return Array.isArray(src)
}

function merge(src, target) {
  const deepClone = value => {
    if (typeof value !== 'object' || isRegex(value) || value === null) return value
    const next = Array.isArray(value) ? [] : {}
    for (const key in value) next[key] = deepClone(value[key])
    return next
  }
  const clone = deepClone(src)
  for (const key in target) {
    if (clone[key] === undefined) clone[key] = target[key]
  }
  return clone
}

function readAllFiles(root) {
  let resultArr = []
  try {
    if (!fs.existsSync(root)) return resultArr
    const stat = fs.lstatSync(root)
    if (stat.isDirectory()) {
      for (const file of fs.readdirSync(root)) {
        resultArr = resultArr.concat(readAllFiles(join(root, '/', file)))
      }
    } else {
      resultArr.push(root)
    }
  } catch (error) {
    console.log(error)
  }
  return resultArr
}

function areFilesMatching(fileName, filePath, matcher) {
  if (isString(matcher)) return fileName === matcher
  if (isRegex(matcher)) return matcher.test(filePath)
  if (isArray(matcher)) return matcher.includes(fileName)
  return false
}

function decideStyle(text, enableColors) {
  return enableColors ? text : ansi.unstyle(text)
}

function getLogger(rootConfig) {
  return rootConfig?.logger ?? console
}

function getOutDir(rootConfig) {
  return rootConfig?.build?.outDir ?? 'dist'
}

function logErrors(rootConfig, errorsMap, ansiColors) {
  const logger = getLogger(rootConfig)
  errorsMap.forEach((error, filePath) => {
    logger.error(
      decideStyle(
        `${ansi.red(PLUGIN_NAME)} ${ansi.red('✗')} Failed to optimize ${ansi.cyan(filePath)}: ${error}`,
        ansiColors
      )
    )
  })
}

function logOptimizationStats(rootConfig, sizesMap, ansiColors) {
  const logger = getLogger(rootConfig)
  let totalSize = 0
  let totalOldSize = 0
  const rows = []

  sizesMap.forEach((info, filePath) => {
    totalSize += info.size
    totalOldSize += info.oldSize
    const delta = info.ratio
    const color = delta <= 0 ? ansi.green : ansi.red
    rows.push(
      decideStyle(
        `${ansi.cyan(filePath)} ${ansi.gray('→')} ${color(`${delta > 0 ? '+' : ''}${delta}%`)} ${ansi.gray(`(${info.oldSize.toFixed(1)}kb → ${info.size.toFixed(1)}kb)`)}`,
        ansiColors
      )
    )
  })

  const totalDelta = Math.floor(100 * (totalSize / totalOldSize - 1))
  logger.info(
    decideStyle(
      `\n${ansi.green(PLUGIN_NAME)} ${ansi.green('✓')} Optimized ${ansi.cyan(sizesMap.size)} images (total ${totalDelta > 0 ? '+' : ''}${totalDelta}%)\n`,
      ansiColors
    )
  )
  rows.forEach(row => logger.info(row))
}

const DEFAULT_OPTIONS = {
  test: /\.(jpe?g|png|gif|tiff|webp|svg|avif)$/i,
  include: undefined,
  exclude: undefined,
  includePublic: true,
  logStats: true,
  ansiColors: true,
  svg: {},
  png: {},
  jpeg: {},
  jpg: {},
  gif: {},
  webp: { lossless: true },
  avif: { lossless: true },
  cache: false,
  cacheLocation: undefined,
}

export function ViteImageOptimizer(optionsParam = {}) {
  const options = merge(optionsParam, DEFAULT_OPTIONS)
  let outputPath
  let publicDir
  let rootConfig
  const sizesMap = new Map()
  const mtimeCache = new Map()
  const errorsMap = new Map()

  const applySVGO = async (filePath, buffer) => {
    const { optimize } = await import('svgo')
    return Buffer.from(
      optimize(buffer.toString(), {
        path: filePath,
        ...options.svg,
      }).data
    )
  }

  const applySharp = async (filePath, buffer) => {
    const sharp = (await import('sharp')).default
    const extName = extname(filePath).replace('.', '').toLowerCase()
    // ponytail: rotate() bakes EXIF orientation into pixels before re-encode.
    return await sharp(buffer, { animated: extName === 'gif' })
      .rotate()
      .toFormat(extName, options[extName])
      .toBuffer()
  }

  const processFile = async (filePath, buffer) => {
    try {
      let newBuffer
      let isCached
      const cachedFilePath = join(options.cacheLocation ?? '', filePath)
      if (options.cache === true && fs.existsSync(cachedFilePath)) {
        newBuffer = await fsp.readFile(cachedFilePath)
        isCached = true
      } else {
        const engine = /\.svg$/.test(filePath) ? applySVGO : applySharp
        newBuffer = await engine(filePath, buffer)
        isCached = false
      }
      if (options.cache === true && !isCached) {
        if (!fs.existsSync(dirname(cachedFilePath))) {
          await fsp.mkdir(dirname(cachedFilePath), { recursive: true })
        }
        await fsp.writeFile(cachedFilePath, newBuffer)
      }
      const newSize = newBuffer.byteLength
      const oldSize = buffer.byteLength
      const skipWrite = newSize >= oldSize
      sizesMap.set(filePath, {
        size: newSize / 1024,
        oldSize: oldSize / 1024,
        ratio: Math.floor(100 * (newSize / oldSize - 1)),
        skipWrite,
        isCached,
      })
      return { content: newBuffer, skipWrite }
    } catch (error) {
      errorsMap.set(filePath, error.message)
      return {}
    }
  }

  const getFilesToProcess = (allFiles, getFileName) => {
    if (options.include) {
      return allFiles.reduce((acc, filePath) => {
        const fileName = getFileName(filePath)
        if (areFilesMatching(fileName, filePath, options.include)) acc.push(filePath)
        return acc
      }, [])
    }
    return allFiles.reduce((acc, filePath) => {
      if (options.test?.test(filePath)) {
        const fileName = getFileName(filePath)
        if (!areFilesMatching(fileName, filePath, options.exclude)) acc.push(filePath)
      }
      return acc
    }, [])
  }

  const ensureCacheDirectoryExists = async () => {
    if (options.cache === true && options.cacheLocation && !fs.existsSync(options.cacheLocation)) {
      await fsp.mkdir(options.cacheLocation, { recursive: true })
    }
  }

  return {
    name: PLUGIN_NAME,
    enforce: 'post',
    apply: 'build',
    configResolved(config) {
      rootConfig = config
      outputPath = config.build.outDir
      if (typeof config.publicDir === 'string') {
        publicDir = config.publicDir.replace(/\\/g, '/')
      }
    },
    generateBundle: async (_, bundler) => {
      const allFiles = Object.keys(bundler)
      const files = getFilesToProcess(allFiles, path => bundler[path].name)
      if (files.length > 0) {
        await ensureCacheDirectoryExists()
        const handles = files.map(async filePath => {
          const source = bundler[filePath].source
          const { content, skipWrite } = await processFile(filePath, source)
          if (content && content.length > 0 && !skipWrite) {
            bundler[filePath].source = content
          }
        })
        await Promise.all(handles)
      }
    },
    async closeBundle() {
      if (publicDir && options.includePublic) {
        const allFiles = readAllFiles(publicDir)
        const files = getFilesToProcess(allFiles, path => filename(path) + extname(path))
        if (files.length > 0) {
          await ensureCacheDirectoryExists()
          const handles = files.map(async publicFilePath => {
            const filePath = publicFilePath.replace(`${publicDir}${sep}`, '')
            const fullFilePath = resolve(rootConfig.root, outputPath, filePath)
            if (!fs.existsSync(fullFilePath)) return
            const { mtimeMs } = await fsp.stat(fullFilePath)
            if (mtimeMs <= (mtimeCache.get(filePath) || 0)) return
            const buffer = await fsp.readFile(fullFilePath)
            const { content, skipWrite } = await processFile(filePath, buffer)
            if (content && content.length > 0 && !skipWrite) {
              await fsp.writeFile(fullFilePath, content)
              mtimeCache.set(filePath, Date.now())
            }
          })
          await Promise.all(handles)
        }
      }
      if (sizesMap.size > 0 && options.logStats) {
        logOptimizationStats(rootConfig, sizesMap, options.ansiColors ?? true)
      }
      if (errorsMap.size > 0) {
        logErrors(rootConfig, errorsMap, options.ansiColors ?? true)
      }
    },
  }
}
