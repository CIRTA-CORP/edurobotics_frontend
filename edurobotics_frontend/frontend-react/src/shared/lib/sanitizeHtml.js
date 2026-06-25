import DOMPurify from 'dompurify'

/**
 * Sanitize rich-text/HTML before injecting it via dangerouslySetInnerHTML.
 *
 * Strips anything that could execute JavaScript (script tags, on* event
 * handlers, javascript: URLs, etc.) while keeping the formatting tags the
 * lesson editor produces. Use this for ANY HTML that originates from the
 * database / user input — never render it raw.
 */
export function sanitizeHtml(dirty) {
  if (!dirty) return ''
  return DOMPurify.sanitize(dirty, {
    // Allow YouTube/Vimeo embeds produced by the editor while keeping the
    // sandbox: DOMPurify still strips scripts and event handlers.
    ADD_TAGS: ['iframe'],
    ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder', 'target'],
    // Defang any javascript:/data: URI sneaking into href/src.
    FORBID_ATTR: ['onerror', 'onload', 'onclick'],
  })
}

export default sanitizeHtml
