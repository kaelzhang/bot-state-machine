const test = require('ava')

const {run} = require('./common')


const helloSetup = alias => root => {
  root
  .flag('name', 'world')
  .command('hello')
  .option('name', {
    alias,
    default (key, flags) {
      return flags.name
    }
  })
  .action(function ({options}) {
    this.say(`hello ${options.name}`)
  })
}

const CASES = [
  [
    'default value', {
      setup (root) {
        root.command('hello')
        .option('name', {
          default: 'world'
        })
        .action(function ({options}) {
          this.say(`hello ${options.name}`)
        })
      },
      input: 'hello'
    },
    'hello world'
  ],
  [
    'default value from flags', {
      setup: helloSetup(),
      input: 'hello'
    },
    'hello world'
  ],
  [
    'default value from flags, keyword argument', {
      setup: helloSetup(),
      input: 'hello name=world?'
    },
    'hello world?'
  ],
  [
    'default value from flags, with alias', {
      setup: helloSetup('n'),
      input: 'hello n=world!'
    },
    'hello world!'
  ],
  [
    'rest', {
      setup (root) {
        root.command('hello')
        .action(function ({options}) {
          this.say(`hello ${options._.join('+')}`)
        })
      },
      input: 'hello world !'
    },
    'hello world+!'
  ]
]


CASES.forEach(([title, options, expected], i) => {
  test(`${i}: ${title}`, async t => {
    t.is(await run(options), expected)
  })
})
