# fickle-and-shallow

> Examples of unorthodox enterprise-level Vuex practices.

## Experiment Brainstorming

- Looped dispatches (action calls)
  - From outside Vuex
  - From inside a Vuex action
  - Include short timeouts (to simulate API calls)
- Looped commits (mutation calls)
  - From outside Vuex
  - From inside a Vuex action
  - Include short timeouts (to simulate API calls)
- Deeply-nested state mutations
  - Watch out for passing a `...spread` object that still ends up getting applied in a deep nesting circumstance
  - What watchers/triggers are hit? Shallow? Deep?
  - Duration of execution?
- Clone, mutate, and shallow-apply
  - See above (deep nesting)

- Load promises
  - None
  - Single blocking promise for loadAll
  - Promise map

### Measurement Criteria

- Track the number of reactive updates: do they get batched?
- Does the sequence block all other interactions?
- Memory consumption differences?

## Project setup

```
npm install
```

### Compiles and hot-reloads for development

```
npm start
# or, equivalently,
npm run serve
```

### Compiles and minifies for production

```
npm run build
```

### Lints and fixes files

Linting happens automatically via hisky and lint-staged. It can also be triggered manually with the command:

```
npm run lint
```

### Customize configuration

See [Configuration Reference](https://cli.vuejs.org/config/).
