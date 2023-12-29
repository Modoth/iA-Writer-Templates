window.addEventListener('load', () => {
  const plugins = [
    { name: 'menu', querySelector: 'body' },
    { name: 'metedata', querySelector: '#meta-data' },
    { name: 'applet' },
    { name: 'viewer' },
    {
      name: 'mermaid',
      codes: ['mermaid', 'mindmap', 'plot.cmd\\=mermaid', 'plot.cmd\\=mindmap'],
      /**@type { string } */
      querySelector: null,
      /**@type { {dataView: ((code: HTMLElement, context: Object) => Promise<(HTMLElement|undefined)>), preUpdate: null, postUpdate: null } } */
      instance: null
    },
    { name: 'plot', codes: ['plot', 'chart', 'plot.cmd\\=chart'] },
    { name: 'spreadsheet' },
    { name: 'web' },
    { name: 'terminal' },
    { name: 'highlight', codes: [] }
  ]
  const context = { state: {}, meta: {} }
  context.decodeHtml = (html) => {
    var txt = document.createElement("textarea");
    txt.innerHTML = html;
    return txt.value;
  }

  context.encodeHtml = (text) => {
    var txt = document.createElement("textarea");
    txt.innerText = text
    return txt.innerHTML.split("<br>").join("\n");
  }

  const loadTasks = {}
  context.loadLib = async (name, version) => {
    if (!loadTasks[name]) {
      // !(mermaid instanceof HTMLElement)
      let existed = window[name]
      if (existed && !((existed instanceof HTMLElement) || (existed instanceof HTMLCollection))) {
        loadTasks[existed] = existed
      } else {
        window[name] = undefined
        const script = document.createElement('script')
        script.src = new URL(`./plugins/libs/${name}${version ? `@${version}` : ''}.js`, window.location.href).href
        loadTasks[name] = new Promise((resolve, reject) => {
          script.onload = () => resolve()
          script.onerror = () => reject()
        })
        document.head.appendChild(script)
        await loadTasks[name]
        loadTasks[name] = window[name]
        if (existed) {
          window[name] = existed
        }
      }
    }
    return loadTasks[name]
  }

  context.loadMermaid = async () => {
    if (!context.mermaid) {
      const mermaid = await context.loadLib('mermaid')
      if (!context.mermaid) {
        mermaid.initialize({ startOnLoad: false, theme: 'default' });
        context.mermaid = mermaid
      }
    }
    return context.mermaid
  }

  context.loadModule = async (name, version) => {
    return await import(`./plugins/libs/${name}${version ? `@${version}` : ''}.js`)
  }

  context.getArgFromClass = (/**@type {HTMLElement} */ view, defaults) => {
    const arg = {}
    const classes = Array.from(view.classList)
    for (let c of classes) {
      let match = c.match(/(.+)=(.+)/)
      if (!match) {
        continue
      }
      arg[match[1]] = match[2]
    }
    if (defaults) {
      for (const p in defaults) {
        arg[p] = arg[p] || (defaults[p] instanceof Set ? classes.find(c => defaults[p].has(c)) : defaults[p])
      }
    }
    return arg
  }

  const replaceMeta = (str) => {
    return str.replace(/\[%([\w\.\-_]*?)\]/g, (_, name) => {
      return context.meta[name] ?? ''
    })
  }
  const replaceFile = async (str) => {
    const files = []
    const reg = /\[%(\/.*?)\]/g
    str.replace(reg, (_, name) => {
      files.push(name)
      return ''
    })
    const fileContens = await Promise.all(files.map(async f =>
      await (await fetch(replaceUrl(f))).text()
    ))
    return str.replace(reg, () => {
      return fileContens.shift()
    })
  }
  const replaceUrl = (str) => {
    context.meta._docRoot = context.meta._docRoot || new URL('./', window.location.href).href.replace(/\/$/, '')
    const docRoot = context.meta.docRoot ?? context.meta._docRoot
    return str.startsWith('/') ? (docRoot + str)
      : (docRoot + (context.meta.docFolder ?? '') + '/' + str)
  }
  let loadDataExecutor = null
  context.loadDataFrom = async (/**@type {string} */ str, { dtype, ftype, __safeJavascriptType }) => {
    try {
      str = str.trim()
      if (dtype === 'url') {
        return str.split('\n').map(s => s.trim()).filter(s => s).map(s => replaceUrl(replaceMeta(s)))
      }
      str = replaceMeta(str)
      str = await replaceFile(str)
      switch (dtype?.toLowerCase()) {
        case 'javascript':
          if (__safeJavascriptType) {
            return eval(str)
          }
          loadDataExecutor = loadDataExecutor || new (await import(`./plugins/langs/javascript.js`)).default
          return (await loadDataExecutor.execute(str, { meta: context.meta, state: context.state }))?.output
        case 'json':
          const json5 = (await context.loadModule("json5")).default
          return json5.parse(str)
        case 'yaml':
          const yaml = await context.loadModule('yaml')
          return yaml.parse(str)
        case 'csv':
          const Papa = await context.loadLib('Papa')
          return Papa.parse(str)?.data
        default:
          return str
      }
    } catch (e) {
      console.log(e)
      return
    }
  }
  let updateToken = 0
  const update = async () => {
    const token = Date.now()
    updateToken = token
    const checkCancled = () => {
      return token !== updateToken
    }
    for (let plugin of plugins) {
      if (checkCancled()) { return }
      plugin.querySelector = plugin.querySelector || (
        plugin.codes ?
          (plugin.codes.length ? plugin.codes.map(code => `html body pre code.${code}`).join(', ')
            : 'html body pre code')
          : `html body pre code.${plugin.name}`)
      let codes = document.querySelectorAll(plugin.querySelector)
      if (!codes.length) {
        continue
      }
      if (!plugin.instance) {
        plugin.instance = (await import(`./plugins/${plugin.name}.js`)).default
        if (plugin.instance.css) {
          let css = document.createElement('link')
          css.rel = 'stylesheet'
          css.href = `./plugins/${plugin.name}.css`
          document.head.appendChild(css)
        }
        if (checkCancled()) { return }
      }
      await plugin.instance.preUpdate?.(context)
      if (checkCancled()) { return }
      /**@type HTMLElement */
      let code = null
      for (code of codes) {
        if (plugin.instance.updateView) {
          try {
            await plugin.instance.updateView(code, context)
          } catch (e) {
            console.log(e)
            continue
          }
        }
        if (!plugin.instance.dataView) {
          continue
        }
        const arg = context.getArgFromClass(code, plugin.instance.defaults)
        const data = await context.loadDataFrom(context.decodeHtml(code.innerHTML), arg)
        let view = undefined
        try {
          view = await plugin.instance.dataView({ arg, data, context, code })
        } catch (e) {
          view = document.createElement('div')
          view.innerText = e
          continue
        }
        if (checkCancled()) { return }
        if (view !== undefined) {
          if (arg['keep-code']) {
            view.classList.add('image-in-code')
            code.parentNode?.appendChild(view)
          } else {
            code.parentNode.parentNode.replaceChild(view, code.parentNode)
          }
        }
        if (plugin.singleton) {
          break
        }
      }
      await plugin.instance.postUpdate?.(context)
      if (checkCancled()) { return }
    }
  }
  document.body.addEventListener('ia-writer-change', () => {
    update()
  })
  update()
});