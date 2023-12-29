const createHtmlFromObject = (obj) => {
    if (obj instanceof Array) {
        return '<div>\n' + obj.map(e => createHtmlFromObject(e)).join('\n') + '\n</div>'
    }
    if (obj instanceof HTMLElement) {
        return obj.outerHTML
    }
    return String(obj)
}

const dataView = async ({ arg, data, context }) => {
    if (typeof (data) == "object") {
        data = createHtmlFromObject(data)
    }
    if (arg.exec) {
        const div = document.createElement('div')
        div.innerHTML = data
        return div
    } else {
        const pre = document.createElement('pre')
        const code = document.createElement('code')
        code.classList.add('html')
        code.innerHTML = context.encodeHtml(data)
        pre.appendChild(code)
        return pre
    }
}

export default { dataView, defaults: { dtype: 'html', __safeJavascriptType: true } }