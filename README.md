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

The server-ready Finite state machine for chat bot, which

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

# API References

```js
const {
  StateMachine,
  SimpleMemorySyncer
} = require('bot-state-machine')
```

## new StateMachine(options)

- **options** All options are optional.
  - **nonExactMatch?** `boolean=false`
  - **format?** `function(tpl: string, ...values): string = util.format`
  - **joiner?** `function(...messages): string`
  - **actionTimeout?** `number=5000`  timeout in milliseconds before the execution of `action` and `catch` result in an `COMMAND_TIMEOUT` error.
  - **lockRefreshInterval?** `number=1000` advanced option. This option should be less than `Syncer::options.lockExpire`, and it is used to prevent the lock from being expired before the command action finished executing.
  - **lockKey?** `function(distinctId):string` the method to create the `lockKey` for each distinct user.
  - **storeKey?** `function(distinctId):string` to create the key to save the current state for each distinct user.

### sm.rootState(): State

Create a root state.

### sm.command(...names): Command

- **names** `Array<string>` you can create a command with a name and multiple aliases

Create a global command.

A global command could **NOT** define:
- condition
- option
- sub states

### sm.chat(distinctId, {commands}): Chat

Create a new conversation

## Chat

### await chat.input(message): string

- **message** `string`

Receives the user input and return a Promise of the output by chat bot.

## Command

### command.state(stateName): State

- **stateName** `string` the name of the sub state. The name should be unique among the sub states of the `command`.

### command.condition(condition): this

- **condition** `function(flags):boolean` If the function returns false, then the command will skip executing `action` or `catch`. If we need give user some feedback or hint, we could use `this.say()` method in the function. `condition` supports both async and sync functions.
  - **flags** `object` the shadow copy of the key-value pairs of all flags defined in current state.

Check if the command meet the requirement to execute.

```js
// Pay attention that we could not use an arrow function here if we need to use `this.say`
someCommand.condition(function ({enabled}) {
  if (!enable) {
    this.say('not enabled')
  }

  return enabled
})
```

### command.option(name, config): this

- **name** `string` the name of the option
- **config** `object`
  - **alias** `Array<string>` the list of aliases of the option
  - **validate**

Create a option for the `command`.

### command.action(executor): this

- **executor** `function(arg: CommandArgument): TargetState` Either async or sync function to do real things fo the command

Execute the command and go to the target state.

```ts
interface CommandArgument {
  // The options for the command
  options: object
  // The shadow copy of the flags of the current state
  flags: object
  // The runtime state which the state machine is currently at.
  state: RuntimeState
}
```

```ts
interface RuntimeState {
  // The id of the current state
  get id: string
  // The parent state of the current state
  get parent: RuntimeState
}
```

```ts
type TargetState = State
  // So that we can go back to a parent state
  | RuntimeState
  // If the command action returns undefined,
  //   then the state machine will go the root state
  | undefined
```

### command.catch(onError): this

- **onError** `function(err: Error, arg: CommandArgument): TargetState`
  - **err** `Error` the error thrown by command action
  - **arg** the same as the argument of the action executor

If the command action throws an error, then `onError` will be invoked. If `onError` throws an error, it will result in a `COMMAND_ERROR` error.

## State

### state.flag(key, defaultValue, onchange): this

- **key** `string` the name of the key
- **defaultValue** `any` the default value of the flag
- **onchange** `function(newValue, oldValue)` invokes if the value of the flag is changed.

Defines a flag

### state.command(...names): Command

Defines a command which is only available at the current state.

## Context Methods

### this.say(template, ...values): void

- **template** `string`
- **values** `Array<any>`

Say something to the user. The argument of the method is the same as Node.js `util.format()`, and will be formatted by `options.format`

```js
this.say('Hello %s!', 'world')
```

`options.format` is designed to provide better support for i18n.

Could be used in:
- command condition
- command action
- command catch
- onchange method of state flag

### this.setFlag(name, value): void

Could be used inn:
- command action
- command catch

## License

[MIT](LICENSE)
