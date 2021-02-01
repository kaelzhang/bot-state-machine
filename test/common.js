const makeArray = require('make-array')

const {StateMachine} = require('..')


const run = async ({
  setup,
  input,
  distinctId,
  ...options
}) => {
  const sm = new StateMachine(options)

  const root = sm.rootState()

  setup(root, sm)

  // return sm.chat(distinctId).input(input)

  const inputs = makeArray(input)
  const lastInput = inputs.pop()

  // for (const i of inputs) {
  //   // eslint-disable-next-line no-await-in-loop
  //   await sm.chat(distinctId).input(i)
  // }

  return sm.chat(distinctId).input(lastInput)
}

module.exports = {
  run
}
