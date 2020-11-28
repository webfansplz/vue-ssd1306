export class ContainerWrap {
  constructor() {
    this.children = [];
  }
  append(child) {
    this.children.push(child);
  }
}

export function getContainer() {
  return new ContainerWrap();
}
