/**@type {WeakRef} */
let menu = null
let viewRef = null
const fixFixed = () => {
    const m = menu?.deref()
    if (!m) {
        return
    }
    m.style.display = 'none';
    setTimeout(() => { m.style.display = 'flex' }, 0)
}
const menuItems = [
    {
        name: '≡', onclick: ({ close, context }) => {
            const div = document.createElement('div')
            const s = document.createElement('div')
            const id = 'floating-toc-autogen' + Date.now()
            s.id = id
            div.appendChild(s)
            let parentIds = []
            const getParentId = (currentIndent) => {
                for (let i = currentIndent; i >= 0; i++) {
                    if (parentIds[i]) {
                        return parentIds[i]
                    }
                }
            }
            const md = 'flowchart LR\n' + Array.from(document.querySelectorAll('h1,h2,h3,h4,h5,h6')).map((h, i) => {
                const indent = parseInt(h.tagName.slice(1))
                if (!(indent > 0)) {
                    return
                }
                const id = h.id
                let content = h.innerText.trim().replace('"', '#quot;')
                const nodeId = 'node_' + i
                content = `${nodeId}("${content}")`
                if (id !== undefined) {
                    content += `\n click ${nodeId} "#${id}"`
                }
                const currentParentId = getParentId(indent - 2)
                if (currentParentId) {
                    content += `\n ${currentParentId} --- ${nodeId}`
                }
                parentIds[indent - 1] = nodeId
                parentIds = parentIds.slice(0, indent)
                return " ".repeat(indent - 1) + content
            }).filter(s => s).join('\n')
            div.addEventListener('click', () => close())
            setTimeout(async () => {
                const mermaid = await context.loadMermaid()
                const { svg } = await mermaid.render(id, md)
                div.innerHTML = svg
            }, 0)
            return div
        }
    }
]
const updateView = (_, context) => {
    const id = 'menu-autogen'
    if (document.getElementById(id)) {
        return
    }
    const div = document.createElement('div')
    div.id = id
    document.addEventListener('scroll', fixFixed)
    document.body.appendChild(div)
    menu = new WeakRef(div)
    const close = () => {
        const lastView = viewRef?.deref()
        viewRef = null
        if (lastView) {
            lastView.remove()
        }
    }
    const createMenuItem = (item) => {
        const { name, onclick } = item
        const i = document.createElement('div')
        i.innerText = name
        i.onclick = () => {
            close()
            const view = onclick({ close, context })
            if (view) {
                const floating = document.createElement('div')
                floating.classList.add('menu-floating-autogen')
                floating.onclick = () => {
                    floating.remove()
                }
                const wraper = document.createElement('div')
                wraper.onclick = (e) => {
                    e.stopPropagation()
                }
                wraper.appendChild(view)
                floating.appendChild(wraper)
                viewRef = new WeakRef(floating)
                document.body.appendChild(floating)
            }
        }
        div.appendChild(i)
    }
    menuItems.forEach(createMenuItem)
    context.addMenuItem = createMenuItem
}

export default { updateView, css: true }