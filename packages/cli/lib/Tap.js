import * as is from '@wisdesign/utils/is.js'

class Tap {
  constructor(names = []) {
    this.events = []
    this.names = names
  }

  tap(handle) {
    if (!is.isFunction(handle)) {
      return
    }

    this.events.push(handle)
  }

  call(...rest) {
    for (const handle of this.events) {
      handle(...rest.slice(0, this.names.length))
    }
  }
}

export default Tap
