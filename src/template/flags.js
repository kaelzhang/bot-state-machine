const {NOOP, create} = require('../common')
const error = require('../error')

module.exports = class Flags {
  constructor (template) {
    this._template = template
    this._flags = create()
  }

  add (name, value, change = NOOP) {
    if (name in this._flags) {
      throw error('DUPLICATE_FLAG', name)
    }

    this._template[name] = value

    this._flags[name] = {
      change
    }
  }

  set (name, newValue) {
    const flag = this._flags[name]
    if (!flag) {
      throw error('FLAG_NOT_FOUND')
    }

    const {
      [name]: value
    } = this._template

    if (value === newValue) {
      return
    }

    const {
      change
    } = flag

    if (change) {
      change(newValue, value)
    }

    this._template[name] = value
  }
}
