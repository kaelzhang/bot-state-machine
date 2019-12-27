// Prefixes
// - state: $
// - command: $$

const template = {
  // global command
  $$cancel: {
    // no states,
    // which means it will return to root state after run
    // whether success or fail

    // no action
    // which indicates the action is
    // ```
    // () => {}
    // ```
  }

  // root state
  $: {
    type: STATE,

    // root state has a traceUnlocked flag
    flags: {
      tradeUnlocked: {
        change
      }
    },

    commands: {
      $.$$buy: {
        // $.$$buy
      }
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
      amount
    },

    states: {
      $.$$buy.$need-confirm: {
        // the same object of store['$.$$buy.$confirm']
      }
    },

    condition () {
      // if failed, then return to parent state
    },

    action () {
      // after run,
      // If returns
      // - state: then go to the state
      // - otherwise: the root state
    },

    catch (err) {
      // If the action encounters any uncaught error, then goes into here.
      // Then go to some state depends on the return value
    }
  },

  // state: confirm
  // parent: command buy
  $.$$buy.$need-confirm: {
    type: STATE,

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
