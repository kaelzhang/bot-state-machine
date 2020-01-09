class RuntimeState {
  constructor ({
    id,
    template
  }) {
    Object.defineProperties(this, {
      // Prevent users creating RuntimeState themselves
      constructor: {},

      // Get the parent state
      parent: {
        get () {
          const state = template[id]
          const parentCommandId = state.parentId

          // Which means, `state` is the root state
          if (!parentCommandId) {
            return
          }

          const command = template[parentCommandId]

          return new RuntimeState({
            id: command.parentId,
            template
          })
        }
      },

      id: {
        get () {
          return id
        }
      }
    })
  }
}

module.exports = RuntimeState
