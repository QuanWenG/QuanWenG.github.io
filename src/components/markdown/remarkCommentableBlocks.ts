import type { Root, RootContent } from 'mdast'
import type { Plugin } from 'unified'

const commentableTypes = new Set(['heading', 'paragraph', 'listItem', 'code'])

export const remarkCommentableBlocks: Plugin<[], Root> = () => (tree) => {
  const walk = (node: Root | RootContent, path: number[], parentType = '') => {
    if (commentableTypes.has(node.type) && !(node.type === 'paragraph' && parentType === 'listItem')) {
      const data = (node.data ||= {}) as { hProperties?: Record<string, string> }
      data.hProperties = {
        ...(data.hProperties || {}),
        'data-block-id': `b-${node.type}-${path.join('-')}`,
        'data-block-type': node.type,
      }
    }
    if ('children' in node) {
      node.children.forEach((child, index) => walk(child as RootContent, [...path, index], node.type))
    }
  }
  walk(tree, [])
}