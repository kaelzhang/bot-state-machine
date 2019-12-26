// prefix
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

    // we should remove flags when teardown
    options: {
      stock,
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
      // - state: then back to the state
      // - otherwise: the root state
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
