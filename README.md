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

const Buy = rootState.comman('buy')
.option('stock')
.action(async function ({
  options: {
    stock
  }
}) {
  await buyStock(stock)
  this.say('success')
  // If the action of a command returns `undefined`, then the
  //  state machine will return to the root state after the command executed
})
// If the action function rejects, then it will go into the catch function if exists.
.catch (function (err) {
  this.say('failed')
})

// Agent
//////////////////////////////////////////////////////

// We could create as many agents as we want,
//  so that we could handle arbitrary numbers of requests
const agent = sm.agent()

const output = await agent.input('buy TSLA') // or 'buy stock=TSLA'

console.log(output) // success
```

## Flow control: define several sub states for a command

> TODO

## Define flags for a state

> TODO

## Distributed lock: Your chat bot for a cluster

> TODO

## License

[MIT](LICENSE)
