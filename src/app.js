import loadHtml from "./source"
import sandBox from "./sandbox"

// 微应用实例
export const appInstanceMap = new Map()

export default class CreateApp {
  status = 'created' // 组件状态，包括 created/loading/mount/unmount

  constructor({name, url, container}) {
    this.name = name
    this.url = url
    this.container = container
    this.status = 'loading'

    this.sandbox = new sandBox(name)
    loadHtml(this)
  }

  // 存放应用的静态资源
  source = { 
    links: new Map(), // link元素对应的静态资源
    scripts: new Map(), // script元素对应的静态资源
  }

  // 资源加载完成时执行
  onLoad(htmlDom) {
    this.loadCount = this.loadCount ? this.loadCount + 1 : 1
    // 第二次执行且组件未卸载时执行渲染
    if (this.loadCount === 2 && this.status !== 'unmount') {
      // 记录DOM结构用于后续操作
      this.source.html = htmlDom
      // 执行mount方法
      this.mount()
    }
  }

  // 渲染
  mount() {
    // 克隆DOM节点
    const cloneHtml = this.source.html.cloneNode(true)
    // 创建一个fragment节点作为模版，这样不会产生冗余的元素
    const fragment = document.createDocumentFragment()
    Array.from(cloneHtml.childNodes).forEach((node) => {
      fragment.appendChild(node)
    })

    // 将格式化后的DOM结构插入到容器中
    this.container.appendChild(fragment)

    this.sandbox.start()
    // 执行js
    this.source.scripts.forEach((info) => {
      (0, eval)(this.sandbox.bindScope(info.code))
      // (0, eval)(info.code)
    })

    // 标记应用为已渲染
    this.status = 'mounted'
  }

  // 卸载 -> 关闭沙箱 清除缓存等
  unmount(destroy) {
   // 更新状态
   this.status = 'unmount'
   // 清空容器
   this.container = null
   
   this.sandbox.stop()
   // destroy为true，则删除应用
   if (destroy) {
     appInstanceMap.delete(this.name)
   }
  }
}