/**@type {Worker} */
let worker = null
let tasks = new Map()
let taskQueues = []
const maxTasks = 1000
class Executer {
    async execute(code, context) {
        if (!worker) {
            worker = new Worker(new URL("./plugins/langs/javascript-worker.js", window.location.href).href)
            worker.onmessage = (ev) => {
                const { stdout, output, token, state } = ev.data
                if(context){
                    context.state = state
                }
                taskQueues = taskQueues.filter(t => t != token)
                const resolve = tasks.get(token)
                tasks.delete(token)
                resolve({ stdout, output })
            }
        }
        const token = Date.now()
        const task = new Promise((resolve) => {
            if (taskQueues.length == maxTasks) {
                const token = taskQueues.shift()
                const resolve = tasks.get(token)
                tasks.delete(token)
                resolve("Timeout!")
            }
            tasks.set(token, resolve)
            taskQueues.push(token)
        })
        worker.postMessage({ code, token, context })
        return task
    }
}

export default Executer