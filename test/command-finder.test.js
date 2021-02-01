const {runCases} = require('./common')


const setup = root => {
  root.flag('default', 'hello')

  const hello = root
  .command('hello')
  .option('name', {
    default: 'world'
  })
  .action(function ({options}) {
    this.say(`hello ${options.name}`)
  })

  const bye = root
  .command('bye')
  .action(function () {
    this.say('bye')
  })

  root
  .command('set-default')
  .option('name')
  .action(function ({options}) {
    this.setFlag('default', options.name)
  })

  root.default(
    flags => flags.default === 'hello'
      ? hello
      : bye
  )
}


const CASES = [
  [
    'default command', {
      setup,
      input: 'world'
    },
    'hello world'
  ],
  [
    'default command', {
      setup,
      distinctId: 'bob',
      input: [
        'set-default bye',
        'world'
      ]
    },
    'bye'
  ]
]


runCases(CASES)
