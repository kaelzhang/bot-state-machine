module.exports = {
  parser: require.resolve('babel-eslint'),
  extends: require.resolve('@ostai/eslint-config'),
  rules: {
    'lines-between-class-members': 'off',
    'func-names': 'off'
  }
}
