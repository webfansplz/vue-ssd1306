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
