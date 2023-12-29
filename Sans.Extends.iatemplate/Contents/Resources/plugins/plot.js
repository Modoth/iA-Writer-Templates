const dataView = async ({ arg, data, context }) => {
    const view = document.createElement('div')
    let graphContainer = null
    switch (arg.cmd) {
        default:
            {
                graphContainer = document.createElement('canvas')
                graphContainer.style.width = "100%"
                const Chart = (await context.loadLib('Chart')).Chart
                setTimeout(() => {
                    new Chart(graphContainer, data)
                }, 0)
            }
            break
    }

    if (graphContainer) {
        view.appendChild(graphContainer)
        if (arg.height) {
            graphContainer.style.height = `${height}px`
        }
        if (arg.ratio) {
            graphContainer.style.height = `${Math.floor(100 * arg.height)}vw`
        }
    }
    return view
}

export default { dataView, defaults: { cmd: new Set(['chart']), dtype: 'json' } }