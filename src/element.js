import CreateApp, { appInstanceMap } from "./app"

class MicroElement extends HTMLElement {
  static get observedAttributes() {
    return ['name', 'url']
  }

  constructor() {
    super()
  }

  connectedCallback() {
    // 元素被插入到dom时执行，此时去加载子应用的静态资源并渲染
    // console.log('micro-app is connected')

    const app = new CreateApp({
      url: this.url,
      name: this.name,
      container: this
    })

    appInstanceMap.set(this.name, app)
  }

  disconnectedCallback() {
    // 元素从dom中移除时执行，此时去卸载子应用
    // console.log('micro-app is disconnected')

    const app = appInstanceMap.get(this.name)
    // 如果有属性destroy，则完全卸载应用包括缓存的文件
    app.unmount(this.hasAttribute('destroy'))
  }
  
  attributeChangedCallback(attrName, oldValue, newValue) {
    // console.log('attributeChangedCallback', attrName, oldValue, newValue)

    if(attrName === 'name' && !oldValue && newValue) {
      this.name = newValue
    }

    if(attrName === 'url' && !oldValue && newValue) {
      this.url = newValue
    }
  }
}

export function defineElement() {
  if(!window.customElements.get('micro-app')) {
    window.customElements.define('micro-app', MicroElement)
  }
}