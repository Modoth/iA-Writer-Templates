class Executer {
    async execute(code, _, context) {
        const stdouts = []
        let loadPyodide = await context.loadLib('loadPyodide')
        let pyodide = await loadPyodide({
            stdout: (msg) => stdouts.push(msg)
        });
        let output = pyodide.runPython(code)
        return { output, stdout: stdouts.join('\n') }
    }
}

export default Executer