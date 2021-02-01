const test = require('ava')

const {run} = require('./common')

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
      setup (root) {
        root
        .flag('name', 'world')
        .command('hello')
        .option('name', {
          default (key, flags) {
            return flags.name
          }
        })
        .action(function ({options}) {
          this.say(`hello ${options.name}`)
        })
      },
      input: 'hello'
    },
    'hello world'
  ]
]


CASES.forEach(([title, options, expected], i) => {
  test(`${i}: ${title}`, async t => {
    t.is(await run(options), expected)
  })
})
