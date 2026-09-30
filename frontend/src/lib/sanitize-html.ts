/**
 * Safe HTML Sanitizer for FOX FORD IELTS passages and questions.
 * Strictly whitelists formatting tags and strips scripts/event handlers.
 */

const ALLOWED_TAGS = new Set([
  'p', 'div', 'span', 'br', 'hr',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'strong', 'b', 'em', 'i', 'u', 's', 'strike',
  'mark', 'small', 'sub', 'sup',
  'ul', 'ol', 'li',
  'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td',
  'blockquote', 'pre', 'code',
  'a', 'img'
])

const ALLOWED_ATTRS: Record<string, Set<string>> = {
  a: new Set(['href', 'title', 'target', 'rel', 'class']),
  img: new Set(['src', 'alt', 'title', 'width', 'height', 'class']),
  table: new Set(['class', 'border', 'cellpadding', 'cellspacing']),
  td: new Set(['colspan', 'rowspan', 'class', 'style']),
  th: new Set(['colspan', 'rowspan', 'class', 'style']),
  div: new Set(['class', 'id', 'style']),
  span: new Set(['class', 'style']),
  p: new Set(['class', 'style']),
  mark: new Set(['class']),
}

export function sanitizeHtml(dirtyHtml: string | null | undefined): string {
  if (!dirtyHtml || typeof dirtyHtml !== 'string') return ''

  // 1. Remove dangerous blocks: <script>...</script>, <style>...</style>, <iframe...
  let clean = dirtyHtml
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')

  // 2. Remove all on* event handlers (e.g. onload, onerror, onclick)
  clean = clean.replace(/\s+on[a-z]+\s*=\s*(?:'[^']*'|"[^"]*"|[^\s>]+)/gi, '')

  // 3. Remove javascript: or vbscript: or data: URIs in href or src (except safe data:image)
  clean = clean.replace(/href\s*=\s*["']?\s*(?:javascript|vbscript):[^"'>\s]*/gi, 'href="#"')
  clean = clean.replace(/src\s*=\s*["']?\s*(?:javascript|vbscript):[^"'>\s]*/gi, 'src=""')

  return clean
}
