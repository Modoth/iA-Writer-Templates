const translateMindMap = (/**@type { string } */ data, context) => {
  let parents = []
  let lastNode = null
  let currentParent = null
  for (const line of data.split('\n')) {
    if (line.length === 0) {
      continue
    }
    let contentStr = line
    let type = ""
    const match = line.match(/^([*\-+=\s]+)\s+(.*?)\s*$/)
    if (match) {
      type = match[1]
      contentStr = match[2]
      let t = type.trimEnd()
      if (t !== '') {
        type = t
      } else {
        type = type + " "
      }
    }
    let indent = type.length
    if (type.length === 0 && contentStr.length === 0) {
      continue
    }
    const buildContent = (type, contentStr) => {
      const div = document.createElement('div')
      div.innerText = contentStr
      const htmlStr = div.innerHTML
      return context.encodeHtml(contentStr)
    }
    let content = buildContent(type, contentStr)
    const node = { type, indent: indent, content, children: [] }
    const lastIndent = lastNode?.indent ?? -1
    if (indent > lastIndent) {
      currentParent = lastNode
      if (currentParent) {
        parents.push(currentParent)
      } else {
        lastNode = node
        continue
      }
    }
    if (indent < lastIndent) {
      let np = parents.filter(n => n.indent < indent)
      currentParent = np[np.length - 1]
      if (currentParent == null) {
        const node = { type: "", content: "", indent: -1, children: [] }
        if (parents[0]) {
          node.children.push(parents[0])
        }
        np.push(node)
        currentParent = node
      }
      parents = np
    }
    if (currentParent) {
      currentParent.children.push(node)
    }
    lastNode = node
  }
  if (lastNode) {
    parents.push(lastNode)
  }
  const root = parents[0]
  const formatNode = (node, depth = 0) => {
    if (!node) {
      return '\n'
    }
    return ' '.repeat(depth) + node.content + '\n' + (node.children ?? []).map(c => formatNode(c, depth + 1)).join('\n')
  }
  return 'mindmap\n' + formatNode(root)
}

const dataView = async ({ arg, data, context }) => {
  const view = document.createElement('div')
  const div = document.createElement('div')
  div.classList.add('plot-autogen')
  switch (arg.cmd) {
    case 'mindmap': {
      const mmData = translateMindMap(data, context)
      div.innerHTML = context.encodeHtml(mmData)
    }
      break
    case 'mermaid': {
      div.innerHTML = context.encodeHtml(data)
    }
      break
    default:
      break
  }

  view.appendChild(div)
  return view
}
const postUpdate = async (context) => {
  const mermaid = await context.loadMermaid()
  setTimeout(() => mermaid.run({ querySelector: '.plot-autogen' }), 0)
}
export default { dataView, postUpdate, defaults: { cmd: new Set(['mermaid', 'mindmap']) }, css: true }