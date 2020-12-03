import { createRenderer } from "vue";

import { Text } from "./adapter";
let uninitialized = [];
const render = createRenderer({
  createElement(type) {
    switch (type) {
      case "text":
        return new Text();
    }
  },
  insert(el, parent) {
    if (el instanceof Text) {
      el.parent = parent;
      parent.append(el);
      uninitialized.map(({ node, text }) => el.parent.update(node, text));
    }
    return el;
  },
  patchProp(el, key, preValue, nextValue) {
    el[key] = nextValue;
  },
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
