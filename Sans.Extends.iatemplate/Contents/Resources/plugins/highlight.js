const updateView = (/**@type {HTMLElement} */ view) => {
    let langs = Array.from(view.classList)
    for (let lang of langs) {
        if (lang.match(/[=]/)) {
            continue
        }
        view.classList.add('language-' + lang)
    }
}
const postUpdate = async (context) => {
    let hljs = await context.loadLib('hljs')
    hljs.highlightAll();
}

export default { updateView, postUpdate, css: true }