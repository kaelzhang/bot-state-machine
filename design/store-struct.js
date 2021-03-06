// prefix
// - state: $
// - command: $$
const store = {
  current: '$',

  // Root state
  // The value of a state is the flags
  $: {
    traceUnlocked: true
  },

  // TODO: #1
  // The value of a command is the options
  // If a command is about to be execute,
  //   the options will be consumed and removed
  $.$$buy: {
    stock: '09988'
  },

  // If a state exits, then the flags will be removed

  // $.$$buy.$confirm: {
  //   confirmId: 'xxxxx'
  // }
}

const redis = {
  [`bot-sm:lock:${distinctId}`]: chatId,
  [`bot-sm:store:${distinctId}`]: JSON.stringify(store)
}

