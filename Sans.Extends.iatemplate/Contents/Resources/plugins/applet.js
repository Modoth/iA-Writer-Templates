let appletsRoot = undefined
const getAppletsRoot = (meta) => {
    if (meta.appletsRoot) {
        if (meta.appletsRoot.startsWith('/')) {
            return (meta.docRoot ?? '') + meta.appletsRoot
        }
        else {
            return meta.appletsRoot
        }
    }
    return new URL("./plugins/applets", window.location.href).href
}
const dataView = async ({ arg, data, context }) => {
    appletsRoot = appletsRoot || getAppletsRoot(context.meta)
    const applet = (await import(`${appletsRoot}/${arg.cmd}.js`)).default
    const div = applet(data, context)
    return div
}

export default { dataView, defaults: { cmd: 'echo' } }