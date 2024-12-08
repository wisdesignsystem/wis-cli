import * as is from '@wisdesign/utils/is.js'

import Configure from './Configure.js'

class ObjectSet extends Configure {
  constructor(key) {
    super(key)
    this.value = {}
  }

  static check(value) {
    return is.isLiteObject(value)
  }

  static create(key, value) {
    const object = new ObjectSet(key)
    for (const name of Object.keys(value)) {
      object.set(name.replace(/\./g, '\\.'), Configure.into(name, value[name]))
    }

    return object
  }

  getValue(key) {
    return this.value[key]
  }

  setValue(key, value) {
    this.value[key] = value
  }

  cloneValue() {
    const objectSet = new ObjectSet(this.key)
    for (const key of Object.keys(this.value)) {
      objectSet.setValue(key, this.value[key].cloneValue())
    }
    return objectSet
  }

  toValue() {
    return Object.keys(this.value).reduce((result, key) => {
      const value = this.value[key].toValue()
      if (!is.isUndefined(value)) {
        result[key] = value
      }
      return result
    }, {})
  }
}

export default ObjectSet
