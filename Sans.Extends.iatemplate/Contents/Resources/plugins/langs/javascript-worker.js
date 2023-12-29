const execute = (code, context) => {
    context = context || {}
    const stdout = []
    const log = (...data) => {
        stdout.push(data.map(i => String(i)).join(''))
    }
    let output = undefined
    const console =
    {
        log: log,
        debug: log,
        info: log,
        warn: log,
        error: log
    }
    try {
        with ({ ...context, console, print: log }) {
            output = eval(code)
        }
    } catch (e) {
        stdout.push(e);
        return;
    }
    return { stdout: stdout.map(i => String(i)).join('\n'), output, state: context?.state }
}

onmessage = (ev) => {
    const { code, token, context } = ev.data
    const output = execute(code, context)
    postMessage({
        ...output,
        token
    })
}
