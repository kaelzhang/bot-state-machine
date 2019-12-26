// prefix
// - state: $
// - command: $$
const store = {
  current: '$.$$buy',

  // global command
  $$cancel: {}

  // root state
  $: {
    // we should remove flags when teardown
    flags: {
      traceUnlocked: true
    }
  },

  // command
  $.$$buy: {
    // we should remove flags when teardown
    options: {
      stock: '09988',
      amount: '10'
    },

    [Symbol.for('states')]: {
      $.$$buy.$confirm: {
        // the same object of store['$.$$buy.$confirm']
      }
    }
  },

  // confirm state of command buy
  $.$$buy.$confirm: {
    flags: {

    }
  }
}

const redis = {
  [`command-lock:${userId}`]: uuid,
  [`bot-state:${userId}`]: JSON.stringify(store)
}
