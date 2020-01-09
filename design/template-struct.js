// Prefixes
// - state: $
// - command: $$

const template = {
  // global command
  $$cancel: {
    // no action
    // which indicates it will return to root state after run
    // whether success or fail
    // ```
    // () => {}
    // ```
  }

  // root state
  $: {
    type: STATE,
    id: '$',

    flags: {
      // root state has a traceUnlocked flag
      tradeUnlocked: {
        // default value
        default: false,
        change (value, oldValue) {

        }
      }
    },

    commands: {
      buy: '$.$$buy',
      // trade is an alias of buy
      trade: '$.$$buy'
    }
  },

  // command buy
  $.$$buy: {
    type: COMMAND,
    id: '$.$$buy',
    parentId: '$',

    options: {
      stock: {
        message: 'what stock',
        // If the validation fails
        // - If the options are partial fulfilled,
        //    then do nothing, do not apply new option
        // - If the command just begins to apply options,
        //    then skip the command and just return to parent state
        validate () {

        }
      },
      // s is an alias of stock,
      // but s is not in optionList
      s: {
        // stock
      },
      amount
    },

    optionList: [
      'stock',
      'amount'
    ],

    states: {
      $.$$buy.$need-confirm: {
        // the same object of store['$.$$buy.$confirm']
      }
    },

    condition (flags) {
      // if failed, then return to parent state
    },

    action ({options, flags, distinctId, state}) {
      // after run,
      // If returns
      // - state: then go to the state
      // - otherwise: the root state

      // Context:
      // this.say(template, ...args)
      // this.setFlag(key, value)
    },

    catch (err, {options, flags, distinctId, state}) {
      // If the action encounters any uncaught error, then goes into here.
      // Then go to some state depends on the return value

      // Context:
      // The same as action
    }
  },

  // state: confirm
  // parent: command buy
  $.$$buy.$need-confirm: {
    type: STATE,
    id: '$.$$buy.$need-confirm',
    parentId: '$.$$buy',

    flags: {
      confirmId: {}
    },

    commands: {
      $.$$buy.$need-confirm.$$confirm: {
        // $.$$buy.$need-confirm.$confirm
      }
    }
  },

  $.$$buy.$need-confirm.$$confirm: {
    type: COMMAND,
    id: '$.$$buy.$need-confirm.$$confirm',
    parentId: '$.$$buy.$need-confirm',

    action () {

    }
  }
}


// Design Issues

// Problem:
// $$cancel could also go to $.$$buy.$need-confirm, so sub state is non-sense

// Solve:
// Plan A: If all states are global, then state has commands, and commands has no states
// -> State is not safe ? NO, we can ensure the safety
// -> Can not make sure a state only has one and only one parent state
// Plan B: A command can only go to its sub states or parent states
// -> How to implement ? Possible
//    A -> B -> A
//    A -> C -> B -> A

// Problem:
// global commands could not get the info of current state
// Solve:
// introduce RuntimeState
