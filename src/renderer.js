import { createRenderer } from "@vue/runtime-core";
import { ContainerWrap } from "./container";

class Text {
  constructor(parent) {
    this.parent = parent;
  }
  draw(text) {
    console.log(text);
  }
}
class Pixel {
  constructor(parent) {
    this.parent = parent;
  }
  draw(text) {}
}
class Container {
  constructor() {
    this.children = [];
  }
  append(child) {
    this.children.push(child);
  }
  update(node, text) {
    const target = this.children.find((child) => child === node);
    target.draw(text);
  }
}
const render = createRenderer({
  createElement(type) {
    switch (type) {
      case "container":
        return new Container();
      case "text":
        return new Text();
      case "pixel":
        return new Pixel();
    }
  },
  insert(el, parent) {
    if (el instanceof Text || el instanceof Pixel) {
      el.parent = parent;
      parent.append(el);
    }
    return el;
  },
  patchProp(el, key, preValue, nextValue) {
    el[key] = nextValue;
  },
  setElementText(node, text) {
    node.parent && node.parent.update(node, text);
  },
  // ticker.add 要实现的
  parentNode(node) {},
  nextSibling(nide) {},
});

export function createApp(root) {
  return render.createApp(root);
}
