/**
 * Plain text out of a Lexical document, for word counts and excerpts.
 *
 * Walks `children` generically rather than switching on node types: the tree
 * is uniform, every node that holds text either has a `text` string or has
 * children that do, and treating it that way means a new feature enabled in
 * the editor does not silently fall out of the word count.
 */

type LexicalNode = {
  type?: string
  text?: string
  children?: LexicalNode[]
  root?: LexicalNode
}

/** Node types that should not run into the next word when flattened. */
const BLOCK_TYPES = new Set(['paragraph', 'heading', 'listitem', 'quote', 'horizontalrule'])

function walk(node: LexicalNode | undefined, out: string[]): void {
  if (!node) return

  if (typeof node.text === 'string') out.push(node.text)

  if (Array.isArray(node.children)) {
    for (const child of node.children) walk(child, out)
  }

  if (node.type && BLOCK_TYPES.has(node.type)) out.push('\n')
}

export function lexicalToPlainText(value: unknown): string {
  if (!value || typeof value !== 'object') return ''

  const out: string[] = []
  walk((value as LexicalNode).root ?? (value as LexicalNode), out)

  return out.join(' ').replace(/[ \t]+/g, ' ').replace(/\s*\n\s*/g, '\n').trim()
}

/**
 * Reading time in whole minutes, floored at 1.
 *
 * 200 words per minute is the conservative end of the usual 200–250 range;
 * under-promising on a "5 min read" label costs nothing and over-promising
 * reads as a lie by the third paragraph.
 */
export function readingMinutes(value: unknown): number {
  const words = lexicalToPlainText(value).split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.round(words / 200))
}
