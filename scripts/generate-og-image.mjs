import sharp from 'sharp'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const svgPath = join(__dirname, '..', 'public', 'og-image.svg')
const pngPath = join(__dirname, '..', 'public', 'og-image.png')

const svgBuffer = readFileSync(svgPath)

await sharp(svgBuffer)
  .resize(1200, 630)
  .png()
  .toFile(pngPath)

console.log('Generated public/og-image.png (1200x630)')
