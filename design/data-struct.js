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
    }
  },

  // confirm state of command buy
  $.$$buy.$confirm: {
    flags: {

    }
  }
}
