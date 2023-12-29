const additionalMimeTypes = {
    'cast': 'application/asciinema'
}
const dataView = async ({ arg, data, context }) => {
    const mimeTypes = (await context.loadModule('mimeTypes')).default
    const div = document.createElement('div')
    div.classList.add('viewer-autogen')
    for (const url of data) {
        const ext = url.split('.').pop().toLowerCase()
        /**@type {string} */
        const mimeType = arg['mime-type'] ?? additionalMimeTypes[ext] ?? mimeTypes[ext]
        if (!mimeType) {
            continue
        }
        const p = document.createElement('p')
        let ele = null
        switch (true) {
            case mimeType.startsWith('video/'): {
                ele = document.createElement('video')
                ele.src = url
                ele.controls = true
                break
            }
            case mimeType == 'application/asciinema': {
                if (!window.WebAssembly) {
                    return
                }
                const AsciinemaPlayer = (await context.loadModule('AsciinemaPlayer')).default
                const div = document.createElement('p')
                const shadow = div.attachShadow({ mode: "open" });
                const style = document.createElement('link')
                style.rel = 'stylesheet'
                style.href = new URL("./plugins/libs/asciinema-player.css", window.location.href).href
                shadow.appendChild(style);
                const playerView = document.createElement("div");
                shadow.appendChild(playerView);
                setTimeout(() => {
                    AsciinemaPlayer.create(url, playerView);
                }, 0)
                ele = div
            }
            default:
                continue
        }
        if (ele) {
            p.appendChild(ele)
            div.appendChild(p)
        }
    }
    return div
}

export default { dataView, css: true, defaults: { dtype: 'url' } }