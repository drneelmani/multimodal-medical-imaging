// Editable PowerPoint copy of the deck. Each page is opened at its final click state; every text block
// becomes an editable text box in the same place, size and colour; images, canvases and charts become
// separate pictures; boxes, chips and fills form a background picture underneath (taken with the text
// and pictures hidden). Speaker notes go to the notes pane. Interactive parts become still images.
// Usage: node scripts/export-pptx.mjs <port> [out=exports/multimodal-medical-imaging.pptx] [from] [to]
import { resolve } from 'node:path'
import { chromium } from 'playwright-chromium'
import pptxgen from 'pptxgenjs'
import { load } from '@slidev/parser/fs'

const [port, outArg, fromArg, toArg] = process.argv.slice(2)
const out = outArg ?? 'exports/multimodal-medical-imaging.pptx'
const W = 980, H = 552, IN = 13.333 / W, PT = (13.333 * 72) / W

const root = process.cwd()
const data = await load({ roots: [root], userRoot: root }, resolve(root, 'slides.md'))
const slides = data.slides
const from = Number(fromArg ?? 1), to = Number(toArg ?? slides.length)

// Speaker notes: markdown to plain text, one field per paragraph
const plain = s => (s ?? '').replace(/\*\*(.+?)\*\*/g, '$1').replace(/(^|[^*])\*([^*\n]+)\*/g, '$1$2').replace(/`([^`]+)`/g, '$1').replace(/\n{3,}/g, '\n\n').trim()

const HIDE = `
.pptx-text *:not(svg):not(svg *), .pptx-text { color: transparent !important; -webkit-text-fill-color: transparent !important; text-shadow: none !important; text-decoration-color: transparent !important; caret-color: transparent !important; }
.pptx-text a { border-bottom-color: transparent !important; }
.pptx-text ::marker { color: transparent !important; }
.pptx-media [data-pptx-media], .pptx-text [data-pptx-snap] { visibility: hidden !important; }
.zp .tools, .slidev-nav, #slidev-goto-dialog { display: none !important; }
`

function family(f) {
  if (/mono/i.test(f)) return 'Courier New'
  if (/georgia|times|(^|,\s*)serif/i.test(f) && !/sans/i.test(f)) return 'Cambria'
  return 'Arial'
}
const hex = c => {
  const m = c.match(/rgba?\(([^)]+)\)/)
  if (!m) return { hex: '000000', a: 1 }
  const [r, g, b, a = 1] = m[1].split(',').map(Number)
  return { hex: [r, g, b].map(v => Math.round(v).toString(16).padStart(2, '0')).join('').toUpperCase(), a }
}

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 2 })
const pres = new pptxgen()
pres.layout = 'LAYOUT_WIDE'
pres.title = 'Multimodal AI Models for Medical Imaging Analysis'
pres.author = 'Prof. (Dr.) Neel Mani'
let section = null

for (let n = from; n <= to; n++) {
  const fm = slides[n - 1].frontmatter ?? {}
  await page.goto(`http://localhost:${port}/${n}?clicks=99&embedded=true`, { waitUntil: 'networkidle' })
  await page.addStyleTag({ content: HIDE })
  await page.waitForTimeout(900)

  // Read text runs and picture rectangles from the rendered page
  const info = await page.evaluate((n) => {
    const root = document.querySelector(`.slidev-page-${n}`)
    const R = root.getBoundingClientRect()
    const k = 980 / R.width
    const box = r => ({ x: (r.left - R.left) * k, y: (r.top - R.top) * k, w: r.width * k, h: r.height * k })
    const visible = (el) => {
      let o = 1
      for (let e = el; e && e !== document.body; e = e.parentElement) {
        const s = getComputedStyle(e)
        if (s.display === 'none' || s.visibility === 'hidden') return false
        o *= Number(s.opacity)
      }
      return o > 0.05
    }
    // Clip a rectangle by every ancestor that hides overflow
    const clip = (el, r) => {
      let { left, top, right, bottom } = r
      for (let e = el.parentElement; e && e !== root.parentElement; e = e.parentElement) {
        const s = getComputedStyle(e)
        if (s.overflow !== 'visible' || s.overflowX !== 'visible' || s.overflowY !== 'visible') {
          const c = e.getBoundingClientRect()
          left = Math.max(left, c.left); top = Math.max(top, c.top); right = Math.min(right, c.right); bottom = Math.min(bottom, c.bottom)
        }
      }
      left = Math.max(left, R.left); top = Math.max(top, R.top); right = Math.min(right, R.right); bottom = Math.min(bottom, R.bottom)
      return right - left > 1 && bottom - top > 1 ? { left, top, width: right - left, height: bottom - top } : null
    }

    // Boxes whose text is cut off by scrolling (long code) become pictures of exactly what is visible
    const snaps = []
    for (const el of root.querySelectorAll('pre, div')) {
      const s = getComputedStyle(el)
      if (!/auto|scroll|hidden/.test(s.overflowY + s.overflowX) || !visible(el) || el.closest('[data-pptx-snap]')) continue
      if (el.scrollHeight <= el.clientHeight + 4 && el.scrollWidth <= el.clientWidth + 4) continue
      if (!el.textContent.trim() || el.querySelector('img, canvas, video')) continue
      const c = clip(el, el.getBoundingClientRect())
      if (!c) continue
      el.setAttribute('data-pptx-snap', String(snaps.length))
      snaps.push({ ...box(c), css: { x: c.left, y: c.top, width: c.width, height: c.height } })
    }
    // Pictures: images, canvases, videos, and SVG drawings large enough to be figures
    const media = []
    for (const el of root.querySelectorAll('img, canvas, video, svg')) {
      if (el.closest('[data-pptx-media]')) continue
      const r = el.getBoundingClientRect()
      const isSvg = el.tagName.toLowerCase() === 'svg'
      if (isSvg && (r.width * k < 40 || r.height * k < 24)) continue
      if (!visible(el) || r.width < 2 || r.height < 2) continue
      const c = clip(el, r)
      if (!c) continue
      if (isSvg) el.style.color = getComputedStyle(el).color // keep currentColor when the page text is hidden
      el.setAttribute('data-pptx-media', String(media.length))
      media.push({ ...box(c), css: { x: c.left, y: c.top, width: c.width, height: c.height }, alt: el.getAttribute('alt') || el.getAttribute('aria-label') || '' })
    }

    // Text: group text nodes by their nearest non-inline ancestor (the block); one text box per block
    // CSS zoom (used by the cover) is not part of the computed font size
    const zoomOf = (el) => { let z = 1; for (let e = el; e && e !== document.body; e = e.parentElement) z *= parseFloat(getComputedStyle(e).zoom) || 1; return z }
    // A text-only flex item with no box of its own (e.g. a bold word in a flex sentence) belongs to its line
    const textOnly = e => [...e.querySelectorAll('*')].every(c => getComputedStyle(c).display === 'inline')
    const plainBox = s => (s.backgroundColor === 'rgba(0, 0, 0, 0)' || s.backgroundColor === 'transparent') && parseFloat(s.borderTopWidth) + parseFloat(s.borderBottomWidth) + parseFloat(s.borderLeftWidth) + parseFloat(s.borderRightWidth) === 0
    // itemOf: the flex item a merged run came from, so separate items are joined with a space
    let itemOf = null
    const blockOf = (el) => {
      itemOf = null
      for (let e = el; e && e !== root.parentElement; e = e.parentElement) {
        const s = getComputedStyle(e)
        if (s.display === 'inline' || s.display === 'contents') continue
        const ps = e.parentElement && getComputedStyle(e.parentElement)
        if (ps && /flex/.test(ps.display) && /row/.test(ps.flexDirection) && (parseFloat(ps.columnGap) || 0) <= 12 && plainBox(s) && textOnly(e)) { itemOf = e; continue }
        return e
      }
      return root
    }
    // `blocks` maps a block to its current segment; a slider or picture inside a line ends the segment,
    // so text on either side of it gets its own text box. `segs` keeps every segment in page order.
    const blocks = new Map()
    const segs = []
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT)
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      if (node.nodeType === 1) {
        if (node.tagName === 'BR') {
          const b = blockOf(node.parentElement)
          if (blocks.has(b)) blocks.get(b).runs.push({ br: true })
        }
        else if (/^(INPUT|SELECT|IMG|CANVAS|VIDEO|svg)$/.test(node.tagName) && node.parentElement) blocks.delete(blockOf(node.parentElement))
        continue
      }
      const el = node.parentElement
      if (!el || el.closest('svg, [data-pptx-media], [data-pptx-snap], .zp .tools, script, style, textarea')) continue
      const ws = getComputedStyle(el).whiteSpace
      const pre = /pre/.test(ws)
      let text = node.textContent
      if (!pre) text = text.replace(/\s+/g, ' ')
      if (!text.trim()) { if (text && blocks.has(blockOf(el))) blocks.get(blockOf(el)).runs.push({ text: ' ', style: null }); continue }
      if (!visible(el)) continue
      const s = getComputedStyle(el)
      const range = document.createRange()
      range.selectNodeContents(node)
      const rr = [...range.getClientRects()].filter(r => r.width > 0 && r.height > 0)
      if (!rr.length) continue
      const b = blockOf(el)
      const item = itemOf
      if (!blocks.has(b)) {
        const bs = getComputedStyle(b)
        let marker = ''
        if (b.tagName === 'LI' && bs.listStyleType !== 'none') {
          const list = b.parentElement
          marker = list.tagName === 'OL' ? `${[...list.children].indexOf(b) + (list.start || 1)}. ` : '• '
        }
        const z = zoomOf(b)
        const br = b.getBoundingClientRect()
        const seg = { runs: [], rects: [], align: bs.textAlign, lh: (parseFloat(bs.lineHeight) || parseFloat(bs.fontSize) * 1.25) * z, pre, marker, ms: parseFloat(bs.fontSize) * z, inner: { left: br.left + parseFloat(bs.paddingLeft) * z, right: br.right - parseFloat(bs.paddingRight) * z } }
        blocks.set(b, seg)
        segs.push(seg)
      }
      const blk = blocks.get(b)
      if (blk.item !== undefined && blk.item !== item && blk.runs.length && !/\s$/.test(blk.runs.at(-1).text ?? ' ') && !/^\s/.test(text)) text = ' ' + text
      blk.item = item
      blk.rects.push(...rr)
      const tt = s.textTransform
      if (tt === 'uppercase') text = text.toUpperCase()
      const a = el.closest('a[href]')
      blk.runs.push({ text, style: { size: parseFloat(s.fontSize) * zoomOf(el), bold: Number(s.fontWeight) >= 600, italic: s.fontStyle === 'italic', color: s.color, family: s.fontFamily, href: a && /^https?:/.test(a.href) ? a.href : null } })
    }
    const texts = []
    for (const blk of segs) {
      if (!blk.rects.length) continue
      const l = Math.min(...blk.rects.map(r => r.left)), t = Math.min(...blk.rects.map(r => r.top))
      const rgt = Math.max(...blk.rects.map(r => r.right)), btm = Math.max(...blk.rects.map(r => r.bottom))
      const r = { left: l, top: t, width: rgt - l, height: btm - t }
      // Trim leading/trailing spaces of the block
      while (blk.runs.length && blk.runs[0].text === ' ') blk.runs.shift()
      if (!blk.runs.some(x => x.text && x.text.trim())) continue
      texts.push({ ...box(r), runs: blk.runs, align: blk.align, lh: blk.lh * k, pre: blk.pre, marker: blk.marker, ms: blk.ms * k, inner: { left: (blk.inner.left - R.left) * k, right: (blk.inner.right - R.left) * k } })
    }
    return { texts, media, snaps, scale: k }
  }, n)

  // Cut-off text boxes are captured with their text, before anything is hidden
  const snapPics = []
  for (const m of info.snaps) snapPics.push(await page.screenshot({ clip: m.css, type: 'png' }))
  // Pictures with the page text hidden (so overlaid labels stay editable), then the background
  await page.evaluate(() => document.documentElement.classList.add('pptx-text'))
  await page.waitForTimeout(150)
  const pics = []
  for (const m of info.media) pics.push(await page.screenshot({ clip: m.css, type: 'png' }))
  await page.evaluate(() => document.documentElement.classList.add('pptx-media'))
  await page.waitForTimeout(150)
  const bgRect = await page.evaluate(n => { const r = document.querySelector(`.slidev-page-${n}`).getBoundingClientRect(); return { x: r.left, y: r.top, width: r.width, height: r.height } }, n)
  const bg = await page.screenshot({ clip: bgRect, type: 'png' })

  // Sections follow the deck's parts
  const name = fm.layout === 'institution-cover' ? 'Opening' : fm.layout === 'opener' ? `Part ${fm.section}` : fm.layout === 'sources' ? 'Sources' : null
  if (name && name !== section) { pres.addSection({ title: name }); section = name }

  const slide = pres.addSlide(section ? { sectionTitle: section } : undefined)
  slide.addImage({ data: `image/png;base64,${bg.toString('base64')}`, x: 0, y: 0, w: 13.333, h: 7.5, altText: 'Slide background' })
  info.snaps.forEach((m, i) => slide.addImage({ data: `image/png;base64,${snapPics[i].toString('base64')}`, x: m.x * IN, y: m.y * IN, w: m.w * IN, h: m.h * IN, altText: 'Code (scrolls in the live deck)' }))
  info.media.forEach((m, i) => slide.addImage({ data: `image/png;base64,${pics[i].toString('base64')}`, x: m.x * IN, y: m.y * IN, w: m.w * IN, h: m.h * IN, altText: m.alt || 'Image' }))

  for (const t of info.texts) {
    const runs = []
    if (t.marker) runs.push({ text: t.marker, options: { fontFace: 'Arial', fontSize: +(t.ms * PT).toFixed(1), color: '6B7280' } })
    for (const r of t.runs) {
      if (r.br) { if (runs.length) runs.at(-1).options.breakLine = true; continue }
      const st = r.style ?? t.runs.find(x => x.style)?.style
      const c = hex(st.color)
      if (c.a < 0.05) continue
      const parts = t.pre ? r.text.split('\n') : [r.text]
      parts.forEach((p, i) => {
        const ff = family(st.family)
        const o = { fontFace: ff, fontSize: +(st.size * PT * (ff === 'Courier New' ? 0.93 : 1)).toFixed(1), bold: st.bold, italic: st.italic, color: c.hex }
        if (st.href) o.hyperlink = { url: st.href }
        if (i < parts.length - 1) o.breakLine = true
        runs.push({ text: p, options: o })
      })
    }
    if (!runs.length) continue
    // PowerPoint's fonts (Arial, Courier New) are slightly wider than the web fonts: a single line is kept
    // on one line with room to spare; wrapped text gets the full width of its block
    const oneLine = t.h <= t.lh * 1.5 && !t.pre
    const mk = t.marker ? t.ms * 1.3 : 0
    const right = t.align === 'right' || t.align === 'end'
    let x, w
    if (oneLine) {
      w = t.w * 1.18 + 4
      x = t.align === 'center' ? t.x + t.w / 2 - w / 2 : right ? t.x + t.w - w : t.x
    }
    else {
      const l = Math.min(t.x, t.inner.left), r = Math.max(t.x + t.w, t.inner.right)
      x = t.align === 'center' || right ? l : t.x
      w = Math.max(t.w * 1.06, r - x)
    }
    x -= mk; w += mk
    x = Math.max(0, x); w = Math.min(w, W - x)
    slide.addText(runs, {
      x: x * IN, y: t.y * IN, w: w * IN, h: (t.h + 2) * IN,
      margin: 0, valign: 'top', wrap: !oneLine, fit: 'none', isTextBox: true,
      align: t.align === 'center' ? 'center' : (t.align === 'right' || t.align === 'end') ? 'right' : 'left',
      lineSpacing: +(t.lh * PT).toFixed(1),
    })
  }
  const note = plain(slides[n - 1].note)
  if (note) slide.addNotes(note)
  console.log(`page ${n}: ${info.texts.length} text boxes, ${info.media.length} pictures`)
}

await browser.close()
await pres.writeFile({ fileName: out })
console.log('wrote', out)
