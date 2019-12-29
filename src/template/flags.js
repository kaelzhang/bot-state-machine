const {NOOP} = require('../common')
const error = require('../error')

module.exports = class Flags {
  constructor (template) {
    this._template = template
  }

  add (name, value, change = NOOP) {
    if (name in this._template) {
      throw error('DUPLICATE_FLAG', name)
    }

    this._template[name] = {
      default: value,
      change
    }
  }
}
