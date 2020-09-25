const fs = require('fs')
const {join} = require('path')

const COMMAND_DEFINED = Symbol.for('bot-state-machine:command-defined')

const read = name => fs.readFileSync(
  join(__dirname, 'lua', `${name}.lua`)
)

const CAN_OWN = read('can-own')

const defineCommands = redis => {
  if (redis[COMMAND_DEFINED]) {
    return
  }

  redis[COMMAND_DEFINED] = true

  redis.defineCommand('canOwn', {
    numberOfKeys: 1,
    lua: CAN_OWN
  })
}


module.exports = {
  defineCommands
}
