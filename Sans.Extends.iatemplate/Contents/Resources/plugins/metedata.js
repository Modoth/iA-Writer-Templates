const updateView = async (/**@type {HTMLElement} */ view, context) => {
    if (view.parentNode?.children.length === 1) {
        view.parentNode.style.display = 'none !important'
    }
    context.meta = Object.fromEntries(view.innerText.split('\n').map(l => l.match(/^(.*?):(.*)$/)).filter(m => m).map(m => [m[1], m[2]]))
}

export default { updateView, css: true }