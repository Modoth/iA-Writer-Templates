const supportLangs = new Map([['javascript'], window.WebAssembly ? ['python'] : undefined].filter(i => i))
const dataView = async ({ arg, data, context, code }) => {
    const lang = arg.cmd
    if (!lang) {
        return
    }
    code.classList.add(lang)
    code.classList.remove('terminal')
    if (!code.parentNode || !supportLangs.has(lang)) {
        return
    }
    const execute = async () => {
        const Executor = supportLangs.get(lang) || (await import(`./langs/${lang}.js`)).default
        const executor = new Executor()
        return await executor.execute(data, { meta: context.meta, state: context.state }, context)
    }
    code.parentNode.classList.add('terminal-btn-container')
    const runBtn = document.createElement('div')
    runBtn.classList.add('terminal-btn-run')
    const runRes = document.createElement('div')
    runRes.classList.add('terminal-btn-result')
    let executed = false
    runBtn.onclick = async () => {
        if (executed) {
            code.parentNode.classList.toggle('terminal-opened')
            return
        }
        executed = true
        code.parentNode.classList.add('terminal-executing')
        let { output, stdout } = await execute()
        runRes.innerText = stdout + '\n' + String(output)
        code.parentNode.classList.remove('terminal-executing')
        code.parentNode.classList.add('terminal-executed')
        code.parentNode.classList.add('terminal-opened')
    }
    code.parentNode.appendChild(runBtn)
    code.parentNode.appendChild(runRes)
}

export default { dataView, css: true }