const applet = (data) => {
    const div = document.createElement('div')
    div.innerText = 'echo: ' + data
    return div
}

export default applet