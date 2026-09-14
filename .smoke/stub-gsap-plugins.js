// Smoke-test stub: ScrollTrigger/SplitText need a real DOM to boot.
class Plugin {
  constructor() { this.progress = 0 }
  kill() {}
  refresh() {}
  update() {}
  static create() { return new Plugin() }
  static refresh() {}
  static getAll() { return [] }
}
export const ScrollTrigger = Plugin
export const SplitText = class {
  constructor(target) { this.words = [target]; this.lines = [target]; this.chars = [] }
  revert() {}
}
export default Plugin
