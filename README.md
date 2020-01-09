[![Build Status](https://travis-ci.org/kaelzhang/bot-state-machine.svg?branch=master)](https://travis-ci.org/kaelzhang/bot-state-machine)
[![Coverage](https://codecov.io/gh/kaelzhang/bot-state-machine/branch/master/graph/badge.svg)](https://codecov.io/gh/kaelzhang/bot-state-machine)
<!-- optional appveyor tst
[![Windows Build Status](https://ci.appveyor.com/api/projects/status/github/kaelzhang/bot-state-machine?branch=master&svg=true)](https://ci.appveyor.com/project/kaelzhang/bot-state-machine)
-->
<!-- optional npm version
[![NPM version](https://badge.fury.io/js/bot-state-machine.svg)](http://badge.fury.io/js/bot-state-machine)
-->
<!-- optional npm downloads
[![npm module downloads per month](http://img.shields.io/npm/dm/bot-state-machine.svg)](https://www.npmjs.org/package/bot-state-machine)
-->
<!-- optional dependency status
[![Dependency Status](https://david-dm.org/kaelzhang/bot-state-machine.svg)](https://david-dm.org/kaelzhang/bot-state-machine)
-->

# bot-state-machine

Finite state machine for chat bot, which

- Supports to define custom commands with options
- Supports simplified command options
- Supports sub(nested) states and command declarations in sub states
- Only allows **a single task thread**, which means that your chat bot could apply only one task at a time globally even in distributed environment. A single-thread chat bot executes less things but fits better for voice input and interactive tasks.
- Supports distributed task locking with redis, and you can also implement yourself.

`bot-state-machine` uses [private class fields](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/Class_fields#Private_instance_fields) to ensure data security so that it requires node >= 12

## Install

```sh
$ npm i bot-state-machine
```

## Basic Usage

```js
const {StateMachine} = require('bot-state-machine')

// Configurations
//////////////////////////////////////////////////////
const sm = new StateMachine()
const rootState = sm.rootState()

const Buy = rootState.command('buy')
.option('stock')
.action(async function ({options}) {
  await buyStock(options.stock)
  this.say('success')
  // If the action of a command returns `undefined`, then the
  //  state machine will return to the root state after the command executed
})
// If the action function rejects, then it will go into the catch function if exists.
.catch(function (err) {
  this.say('failed')
})

// Chat
//////////////////////////////////////////////////////

// We could create as many chat tasks as we want,
//  so that we could handle arbitrary numbers of requests
const chat = sm.chat()

const output = await chat.input('buy TSLA') // or 'buy stock=TSLA'

console.log(output) // success
```

### Flow control: define several sub states for a command

- A state can have multiple commands
- A commands can have multiple sub states
- The state machine will redirect to a certain state according to the return value of command `action` or `catch`
- A command could only go to one of its sub states, one of the parent states or root state.

[Here](example/nested-states.js) is a complex example, and its corresponding test spec locates [here](test/integrated.test.js)

#### Example: coin-operated turnstile

There is a classic example of the [Finite-state machine](https://en.wikipedia.org/wiki/Finite-state_machine) from wikipedia, [coin-operated turnstile](https://en.wikipedia.org/wiki/Finite-state_machine#Example:_coin-operated_turnstile).

```js
const sm = new StateMachine()

// Locked is an initial state
const StateLocked = sm.rootState()

const CommandCoin = StateLocked.command('coin')
const StateUnlocked = CommandCoin.state('unlocked')

// Putting a coin in the slot to unlock the turnstile
CommandCoin.action(() => StateUnlocked)

const CommandPush = StateUnlocked.command('push')
// Pushing the arm, then the turnstile will be locked (go to the initial state)
.action(() => StateLocked)
```

### Define flags for a state

> TODO: document

### Define global commands

Commands defined by `sm` (not root state) are global commands.

A global command could be called at any state and could not have options, condition, or sub states.

```js
// A global command to return back to the parent state
sm.command('back')
.action(({state}) => state.parent)
```

```js
// A global command to cancel everything and return to root state
sm.command('cancel')
```

### How to distinguish between different users

`sm.chat(distinctId)` has `distinctId` as the argument. `distinctId` should be unique for a certain user (audience).

Users with different `distinctId`s are separated and have different isolated locks, so that the chat bot can serve many users simultaneously.

Everytime we execute `sm.chat('Bob')`, we create a new thread for Bob. And different threads share the same lock for Bob, so the bot could only do one thing for Bob at the same time.

### Distributed lock: Your chat bot for clusters

> TODO: document

## API References

> TODO: document

## License

[MIT](LICENSE)
