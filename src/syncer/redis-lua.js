const fs = require('fs')
const {join} = require('path')

const COMMAND_DEFINED = Symbol.for('bot-state-machine:command-defined')

const read = name => fs.readFileSync(
  join(__dirname, 'lua', `${name}.lua`)
)

const LUA_LOCK = read('lock')
const LUA_READ = read('read')
const LUA_REFRESH_LOCK = read('refresh-lock')
const LUA_UNLOCK = read('unlock')


const defineCommands = redis => {
  if (redis[COMMAND_DEFINED]) {
    return
  }

  redis[COMMAND_DEFINED] = true

  redis.defineCommand('lock', {
    numberOfKeys: 2,
    lua: LUA_LOCK
  })

  redis.defineCommand('read', {
    numberOfKeys: 2,
    lua: LUA_READ
  })

  redis.defineCommand('refreshLock', {
    numberOfKeys: 1,
    lua: LUA_REFRESH_LOCK
  })

  redis.defineCommand('unlock', {
    numberOfKeys: 2,
    lua: LUA_UNLOCK
  })
}


module.exports = {
  defineCommands
}
