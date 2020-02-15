const Command = require('../template/command')
const {
  COMMAND, STATE
} = require('../common')

const permissionList = (commands, template) => {
  // all permissions
  if (!commands) {
    return
  }

  return commands.reduce((prev, command) => {
    // TODO: invalid command

    const id = typeof command === 'string'
      ? command
      : command instanceof Command
        ? command.id
        : undefined

    if (!id) {
      // TODO: invalid command
      return prev
    }

    const def = template[id]

    if (!def || def.type !== COMMAND) {
      return prev
    }

    prev.add(id)

    let current = def

    // Add all parent states recursively, but not parent commands
    // eslint-disable-next-line no-cond-assign
    while (current = current.parentId && template[current.parentId]) {
      if (current.type === STATE) {
        prev.add(current.id)
      }
    }

    return prev
  }, new Set())
}

module.exports = class Permissions {
  constructor (commands, template) {
    this._ids = permissionList(commands, template)
  }

  has (id) {
    // Has all permissions
    if (!this._ids) {
      return true
    }

    return this._ids.has(id)
  }

  filterValue (obj) {
    const ret = Object.create(null)
    for (const [key, value] of Object.entries(obj)) {
      if (this.has(value)) {
        ret[key] = value
      }
    }

    return ret
  }
}
