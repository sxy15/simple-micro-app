import { fetchSource } from "./utils"

function normalizeHtml(html) {
  return html.replace(/<head[^>]*>[\s\S]*?<\/head>/i, (match) => {
    return match
          .replace(/<head/i, '<micro-app-head')
          .replace(/<\/head>/i, '</micro-app-head>')
  }).replace(/<body[^>]*>[\s\S]*?<\/body>/i, (match) => {
    return match
          .replace(/<body/i, '<micro-app-body')
          .replace(/<\/body>/i, '</micro-app-body>')
  })
}

// 递归每一个子元素
function extractSourceDom(parent, app) {
  const children = Array.from(parent.children)

  if(children.length) {
    children.forEach(child => {
      extractSourceDom(child, app)
    })
  }

  for(const dom of children) {
    // style link
    if(dom instanceof HTMLLinkElement) {
      const href = dom.getAttribute('href')
      if(dom.getAttribute('rel') === 'stylesheet' && href) {
        app.source.links.set(href.startsWith('http') ? href : `${app.url}${href}`, {
          code: '',
        })
      }
      parent.removeChild(dom)
    }

    // script - link & textContent
    if(dom instanceof HTMLScriptElement) {
      const src = dom.getAttribute('src')
      if(src) { // 外链
        app.source.scripts.set(src.startsWith('http') ? src : `${app.url}${src}`, {
          code: '',
          isExternal: true
        })
      } else if (dom.textContent) { // 内联
        const nonceStr = Math.random().toString(36).substr(2, 15)
        app.source.scripts.set(nonceStr, {
          code: dom.textContent,
          isExternal: false,
        })
      }

      parent.removeChild(dom)
    }

    // style inline
    if(dom instanceof HTMLStyleElement) {
      console.log('style', dom)
    }
  }
}

// 获取link远程资源
function fetchLinksFromHtml(app, microAppHead, htmlDom) {
  const linkEntries = Array.from(app.source.links.entries())

  // 通过fetch请求所有css资源
  const fetchLinkPromise = []
  for (const [url] of linkEntries) {
    fetchLinkPromise.push(fetchSource(url))
  }

  Promise.all(fetchLinkPromise).then((res) => {
    for (let i = 0; i < res.length; i++) {
      const code = res[i]
      // 拿到css资源后放入style元素并插入到micro-app-head中
      const link2Style = document.createElement('style')
      link2Style.textContent = code
      // scopedCSS(link2Style, app.name)
      microAppHead.appendChild(link2Style)
      // 将代码放入缓存，再次渲染时可以从缓存中获取
      linkEntries[i][1].code = code
    }

    // 处理完成后执行onLoad方法
    app.onLoad(htmlDom)
  }).catch((e) => {
    console.error('加载css出错', e)
  })
}

function fetchScriptsFromHtml(app, htmlDom) {
  const scriptEntries = Array.from(app.source.scripts.entries())
  // 通过fetch请求所有js资源
  const fetchScriptPromise = []
  for (const [url, info] of scriptEntries) {
    // 如果是内联script，则不需要请求资源
    fetchScriptPromise.push(info.code ? Promise.resolve(info.code) :  fetchSource(url))
  }

  Promise.all(fetchScriptPromise).then((res) => {
    for (let i = 0; i < res.length; i++) {
      const code = res[i]
      // 将代码放入缓存，再次渲染时可以从缓存中获取
      scriptEntries[i][1].code = code
    }

    // 处理完成后执行onLoad方法
    app.onLoad(htmlDom)
  }).catch((e) => {
    console.error('加载js出错', e)
  })
}

export default function loadHtml(app) {
  const _url = app.url

  fetchSource(_url).then(html => {
    const _html = normalizeHtml(html)

    const htmlDom = document.createElement('div')
    htmlDom.innerHTML = _html

    // 提取和处理js、css等静态资源
    extractSourceDom(htmlDom, app)

    const microAppHead = htmlDom.querySelector('micro-app-head')
    
    // link
    if(app.source.links.size) {
      fetchLinksFromHtml(app, microAppHead, htmlDom)
    } else {
      app.onLoad(htmlDom)
    }

     // script
    if (app.source.scripts.size) {
      fetchScriptsFromHtml(app, htmlDom)
    } else {
      app.onLoad(htmlDom)
    }
  })
}
