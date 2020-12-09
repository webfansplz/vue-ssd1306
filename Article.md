# 将 Vue 渲染到嵌入式液晶屏

![vue-ssd1306](https://s3.ax1x.com/2020/12/05/DL04dH.jpg)

## 前言

本文我們要做的是将 Vue 渲染到嵌入式液晶屏。这里使用的液晶屏是 0.96 寸大 128x64 分辨率的 SSD1306。要将 Vue 渲染到液晶屏,我们还需要一个桥梁,它必须具备控制液晶屏及运行代码的能力。而树莓派的硬件对接能力和可编程性天然就具备这个条件。最后一个问题来了,我们用什么技术来实现呢?

![vue-ssd1306](https://s3.ax1x.com/2020/12/05/DLrZGR.jpg)

这里我选择了 Node.js。原因:

- Atwood 定律：“任何可以使用 JavaScript 来编写的应用，最终会由 JavaScript 编写。” 🐶
- 驱动硬件我大 Node.js 一行`npm install`走天下。 🐶

![vue-ssd1306](https://s3.ax1x.com/2020/12/05/DLDBCR.jpg)

这个有趣的实践可拆分为这几个步骤:

- 在 Node.js 运行 Vue
- 树莓派连接屏幕芯片
- Node.js 驱动硬件

Talk is cheap,Let's Go!!!

## 跨端渲染

无论是 基于 React 的 React Native 宣称的「Learn Once, Write Anywhere」,还是基于 Vue 的 Weex 宣称的「Write Once, Run Everywhere」口号,本质上强调的都是它们跨端渲染的能力。那什么是跨端渲染呢?

React: ReactNative Taro ...

Vue: Weex UniApp ...

各种五花八门的前端框架纷纷袭来,前端工程师们纷纷抱怨学不动了～

老板们看到纷纷笑嘻嘻, App 单,前端分,小程序单,前端吞,PC/H5,前端昏。skr~

这些跨平台框架原理其实都大同小异,选定 Vue/React 作为 DSL,以这个 DSL 框架为标准在各端分别编译,在运行时,各端使用各自的渲染引擎(Render Engines)进行渲染,底层渲染引擎中不必关心上层 DSL 的语法和更新策略，只需要处理 JS Framework 中统一定义的节点结构和渲染指令。也正是因为这一渲染层的抽象,使得跨平台/框架成为了可能。

![vue-ssd1306](https://s3.ax1x.com/2020/12/05/DLDD81.jpg)

Vue 和 React 现在都实现了自定义渲染器,下面我们简单介绍一下:

### React Reconciler

React16 采用新的 Reconciler,内部采用了 Fiber 的架构。[react-reconciler](https://github.com/facebook/react/tree/master/packages/react-reconciler)模块正是基于 v16 的新 Reconciler 实现,它提供了创建 React 自定义渲染器的能力.

```js
const Reconciler = require("react-reconciler");

const HostConfig = {
  // You'll need to implement some methods here.
  // See below for more information and examples.
};

const MyRenderer = Reconciler(HostConfig);

const RendererPublicAPI = {
  render(element, container, callback) {
    // Call MyRenderer.updateContainer() to schedule changes on the roots.
    // See ReactDOM, React Native, or React ART for practical examples.
  },
};

module.exports = RendererPublicAPI;
```

### Vue createRenderer

vue3 提供了[createRender API](https://v3.cn.vuejs.org/api/global-api.html#createrenderer),让我们创建自定义渲染器。

createRenderer 函数接受两个泛型参数： HostNode 和 HostElement，对应于宿主环境中的 节点 和 元素 类型。
自定义渲染器可以传入特定于平台的类型，如下所示：

```js
import { createRenderer } from 'vue'
const { render, createApp } = createRenderer<Node, Element>({
  patchProp,
  ...nodeOps
})
```

![vue-ssd1306](https://s3.ax1x.com/2020/12/05/DLDrgx.jpg)

## 在 Node.js 上运行 Vue

### SFC To JS

```js
<template>
  <text x="0" y="0">Hello Vue</text>
  <text x="0" y="20">{{ time }}</text>
  <text x="0" y="40">Hi SSD3306</text>
</template>
<script>
import { defineComponent, ref, toRefs, onMounted } from "vue";
import dayjs from "dayjs";
export default defineComponent({
  setup() {
    const time = ref(dayjs().format("hh:mm:ss"));
    onMounted(() => {
      setInterval(() => {
        time.value = dayjs().format("hh:mm:ss");
      }, 800);
    });
    return {
      ...toRefs({
        time,
      }),
    };
  },
});
</script>
```

要将 Vue 渲染到液晶屏,我们首先需要让 Vue 能运行在 Node.js 上,但是上面这个 SFC 是没办法被 Node.js 识别的,它只是 vue 的编程规范,是一种方言。所以我们需要做的是先将 SFC 转为 js。这里我使用 Rollup 打包将 SFC 转为 JS(相关配置这里就不啰嗦了,贴个[传送门](https://github.com/webfansplz/vue-ssd1306/blob/main/rollup.config.js))。到了这一步,Node.js 就能成功运行打包后的 js 代码了,这还不够,这时候 Vue 组件的状态更新是没办法同步到 Node.js 的。

### Create Custom Renderer

组件状态更新我们需要通知 Node.js 更新并渲染液晶屏内容,我们需要创建自定义的"更新策略"。这里就需要用到了我们前面提到的自定义渲染器:createRenderer API。下面我们简单介绍下我们相关使用:

```js
// index.js
// 自定义渲染器
import { createApp } from "./renderer.js";
// 组件
import App from "./App.vue";
// 容器
function getContainer() {
  // ...
}
// 创建渲染器,将组件挂载到容器上
createApp(App).mount(getContainer());
```

```js
// renderer.js

import { createRenderer } from "vue";
// 定义渲染器,传入自定义nodeOps
const render = createRenderer({
  // 创建元素
  createElement(type) {},
  // 插入元素
  insert(el, parent) {},
  // props更新
  patchProp(el, key, preValue, nextValue) {},
  // 设置元素文本
  setElementText(node, text) {},
  // 以下忽略,有兴趣的童鞋可自行了解
  remove(el) {},
  createText(type) {},
  parentNode(node) {},
  nextSibling(nide) {},
});

export function createApp(root) {
  return render.createApp(root);
}
```

vue 渲染器默认实现了 Web 平台 DOM 编程接口,将 Virtual DOM 渲染为真实 DOM。但是这个渲染器只能运行在浏览器中,不具备跨平台能力。所以我们必须重写 nodeOps 相关钩子函数,实现对应宿主环境元素的增删改查操作。接下来我们定义一个适配器,来实现相关逻辑。

### Adapter

在实现前,我们先来理一下我们要实现的逻辑:

- 创建元素实例 (create)

- 将元素实例插入容器,由容器进行管理 (insert)

- 状态改变时,通知容器进行更新 (update)

```js
// adapter.js

// 文本元素
export class Text {
  constructor(parent) {
    // 提供一个父节点用于寻址调用更新 (前面提到状态更新由容器进行)
    this.parent = parent;
  }
  // 元素绘制,这里需要实现文本元素渲染逻辑
  draw(text) {
    console.log(text);
  }
}
// 适配器
export class Adapter {
  constructor() {
    // 装载容器
    this.children = [];
  }
  // 装载子元素
  append(child) {
    this.children.push(child);
  }
  // 元素状态更新
  update(node, text) {
    // 找到目标渲染进行绘制
    const target = this.children.find((child) => child === node);
    target.draw(text);
  }
  clear() {}
}
// 容器 === 适配器实例
export function getContainer() {
  return new Adapter();
}
```

好了,基本的适配器已经完成了,接下来我们来实现渲染器。

### Renderer Abstract

```js
import { createRenderer } from "vue";

import { Text } from "./adapter";
let uninitialized = [];
const render = createRenderer({
  // 创建元素,实例化Text
  createElement(type) {
    switch (type) {
      case "text":
        return new Text();
    }
  },
  // 插入元素,调用适配器方法进行装载统一管理
  insert(el, parent) {
    if (el instanceof Text) {
      el.parent = parent;
      parent.append(el);
      uninitialized.map(({ node, text }) => el.parent.update(node, text));
    }
    return el;
  },
  // props更新
  patchProp(el, key, preValue, nextValue) {
    el[key] = nextValue;
  },
  // 文本更新,重新绘制
  setElementText(node, text) {
    if (node.parent) {
      console.log(text);
      node.parent.clear(node);
      node.parent.update(node, text);
    } else {
      uninitialized.push({ node, text });
    }
  },
  remove(el) {},
  createText(type) {},
  parentNode(node) {},
  nextSibling(nide) {},
});

export function createApp(root) {
  return render.createApp(root);
}
```

## 树莓派连接屏幕芯片

### SSD1306 OLED

OLED，即有机发光二极管（ Organic Light Emitting Diode）。是一种液晶显示屏。而 SSD1306 就是一种 OLED 驱动芯片。ssd1306 本身支持多种总线驱动方式:6800/8080 并口、SPI 及 IIC 接口方式。这里我们选择 IIC 接口方式进行通信,理由很简单: 1. 接线简单方便(两根线就可以驱动 OLED) 2.轮子好找...缺点就是 IIC 传输数据效率太慢了,刷新率只有 10FPS 不到。而 SPI 刷新率最大能达到 2200FPS。

### 硬件接线

IIC 仅需要 4 根线就可以，其中 2 根是电源，另外 2 根是 SDA 和 SCL。我们使用 IIC-1 接口。下面是树莓派的 GPIO 引脚图。

![vue-ssd1306](https://s3.ax1x.com/2020/12/05/DLDsv6.jpg)

**注意：请一定以屏幕的实际引脚编号为准。**

- 屏幕 VCC 接树莓派 1 号引脚。- 3.3v 电源

- 屏幕 GND 接树莓派 9 号引脚。- 地线

- 屏幕 SDA 接树莓派 3 号引脚。- IIC 通信中为数据管脚

- 屏幕 SCL 接树莓派 5 号引脚。- IIC 通信中为时钟管脚

### 树莓派启用 I2C

#### 1.安装工具包

```js
sudo apt-get install -y i2c-tools
```

#### 2.启用 I2C

- sudo raspi-config

- 选择 Interfacing Options

- Enable I2C

#### 3.检查设备挂载状态

i2c-tools 提供的 i2cdetect 命令可以查看挂载设备

```js
sudo i2cdetect -y 1
```

## Node.js 驱动硬件

### Node.js Lib

我们先来看几个 Node.js 库,看完你会不得不感叹～任何可以使用 JavaScript 来编写的应用,最....

[johnny-five](http://johnny-five.io/)

Johnnt-Five 是一个支持 JavaScript 语言编程的机器人和 IOT 开发平台,基于 Firmata 协议。Firmata 是计算机软件和微控制器之间的一种通信协议。使用它,我们可以很简单的架起树莓派和屏幕芯片之间的桥梁。

![vue-ssd1306](https://s3.ax1x.com/2020/12/05/DLDw59.gif)

[raspi-io](https://github.com/nebrius/raspi-io)

Raspi IO 是一个为 Johnny-Five Node.js 机器人平台提供的 I/O 插件，该插件使 Johnny-Five 能够控制一个 Raspberry Pi 上的硬件。

[oled-font-5x7](https://github.com/noopkat/oled-font-5x7)

5x7 oled 字体库,将字符转为 16 进制编码,让 oled 程序能够识别。用于绘制文字。

[oled-js](https://github.com/noopkat/oled-js)

📺 兼容 johnny-five 的 oled 支持库 (johnny-five 本身并不支持 oled),提供了操作 oled 的 API。

### 驱动程序实现

```js
// oled.js
const five = require("johnny-five");
const Raspi = require("raspi-io").RaspiIO;
const font = require("oled-font-5x7");
const Oled = require("oled-js");
const OPTS = {
  width: 128, // 分辨率  0.96寸 ssd1306 128*64
  height: 64, // 分辨率
  address: 0x3c, // 控制输入地址,ssd1306 默认为0x3c
};
class OledService {
  constructor() {
    this.oled = null;
  }
  /**
   * 初始化: 创建一个Oled实例
   * 创建后,我们就可以通过操作Oled实例来控制屏幕了
   */
  init() {
    const board = new five.Board({
      io: new Raspi(),
    });
    // 监听程序退出,关闭屏幕
    board.on("exit", () => {
      this.oled && this.remove();
    });
    return new Promise((resolve, reject) => {
      board.on("ready", () => {
        // Raspberry Pi connect SSD 1306
        this.oled = new Oled(board, five, OPTS);
        // 打开屏幕显示
        this.oled.turnOnDisplay();
        resolve();
      });
    });
  }
  // 绘制文字
  drawText({ text, x, y }) {
    // 重置光标位置
    this.oled.setCursor(+x, +y);
    // 绘制文字
    this.oled.writeString(font, 2, text, 1, true, 2);
  }
  clear({ x, y }) {
    this.oled.setCursor(+x, +y);
  }
  // 刷新屏幕
  update() {
    this.oled.update();
  }
  remove() {
    // 关闭显示
    this.oled.turnOffDisplay();
    this.oled = null;
  }
}
export function oledService() {
  return new OledService();
}
```

接下来,我们就可以在适配器中调用 oled 程序渲染屏幕了～

```js
// index.js
import { createApp } from "./renderer.js";
import { getContainer } from "./adapter";
import { oledService } from "./oled";
import App from "./App.vue";
const oledIns = oledService();
oledIns.init().then(() => {
  createApp(App).mount(getContainer(oledIns));
});

// adapter.js
export class Text {
  constructor(parent) {
    this.parent = parent;
  }
  draw(ints, opts) {
    ints.drawText(opts);
    ints.update();
  }
}

export class Adapter {
  constructor(oledIns) {
    this.children = [];
    this.oled = oledIns;
  }
  append(child) {
    this.children.push(child);
  }
  update(node, text) {
    const target = this.children.find((child) => child === node);
    target.draw(this.oled, {
      text,
      x: node.x,
      y: node.y,
    });
  }
  clear(opts) {
    this.oled.clear(opts);
  }
}
export function getContainer(oledIns) {
  return new Adapter(oledIns);
}
```

到这一步,就可以成功点亮屏幕啦,来看看效果～

## 效果展示

<!-- ![vue-ssd1306](https://cdn.nlark.com/yuque/0/2020/gif/543189/1606922184841-e38d2571-b666-4992-8a2c-a453b45ea19e.gif) -->

![vue-ssd1306](https://s8.gifyu.com/images/hello-vue-1.gif)

## 参考

[将 React 渲染到嵌入式液晶屏](https://juejin.cn/post/6844903984998809614)

[在树莓派上使用 SSD1306 OLED 屏幕](https://shumeipai.nxez.com/2019/04/29/use-the-ssd1306-oled-display-on-the-raspberry-pi.html)

## 结语

完整代码已上传到 [Github](https://github.com/webfansplz/vue-ssd1306),如果你觉得这个实践对你有启发/帮助,点个 [star](https://github.com/webfansplz/vue-ssd1306) 吧～

Vue 已经成功渲染到嵌入式液晶屏了,那下一步是不是可以考虑接个摇杆写个贪吃蛇游戏了～哈哈哈,这很"Javascript"。

"阅读式"的学习使我犯困,所以我更倾向通过一些有趣的实践吸收知识。如果你和我一样爱折腾,欢迎[关注](https://github.com/webfansplz)～
