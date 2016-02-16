/* eslint max-nested-callbacks: 0 */
/*global describe, it */
import assert from 'assert'
import most from 'most'
import {createHashHistory} from 'history'
import {makeRouterDriver} from '../../src'

describe(`Cyclic Router`, () => {
  describe(`makeRouterDriver`, () => {
    it(`should throw if not given a history instance`, () => {
      assert.throws(() => {
        makeRouterDriver(null)
      }, Error,
      /First argument to makeRouterDriver must be a valid history driver/i)
    })

    describe(`routerDriver`, () => {
      it(`should return an object with 'path' 'define' 'observable' ` +
        `and 'createHref'`,
        () => {
          const router = makeRouterDriver(createHashHistory())(most.just(`/`))
          assert.notStrictEqual(router.path, null)
          assert.strictEqual(typeof router.path, `function`)
          assert.notStrictEqual(router.define, null)
          assert.strictEqual(typeof router.define, `function`)
          assert.notStrictEqual(router.observable, null)
          assert.strictEqual(typeof router.observable, `object`)
          assert.strictEqual(typeof router.observable.observe, `function`)
          assert.notStrictEqual(router.createHref, null)
          assert.strictEqual(typeof router.createHref, `function`)
        })
    })
  })

  describe(`path()`, () => {
    it(`should return an object with 'path' 'define' 'observable' ` +
      `and 'createHref'`,
      () => {
        const history = createHashHistory()
        const router = makeRouterDriver(history)(most.just(`/`))
          .path(`/`)
        assert.notStrictEqual(router.path, null)
        assert.strictEqual(typeof router.path, `function`)
        assert.notStrictEqual(router.define, null)
        assert.strictEqual(typeof router.define, `function`)
        assert.notStrictEqual(router.observable, null)
        assert.strictEqual(typeof router.observable, `object`)
        assert.strictEqual(typeof router.observable.observe, `function`)
        assert.notStrictEqual(router.createHref, null)
        assert.strictEqual(typeof router.createHref, `function`)
      })

    it(`should filter the history$`, () => {
      const routes = [
        `/somewhere/else`,
        `/path/that/is/correct`,
      ]
      const history = createHashHistory()
      const router = makeRouterDriver(history)(most.from(routes))
        .path(`/path`)

      router.observable.observe((location) => {
        assert.notStrictEqual(location.pathname, `/somewhere/else`)
        assert.strictEqual(location.pathname, `/path/that/is/correct`)
      })
    })

    it(`multiple path()s should filter the history$`, () => {
      const routes = [
        `/the/wrong/path`,
        `/some/really/really/deeply/nested/route/that/is/correct`,
        `/some/really/really/deeply/nested/incorrect/route`,
      ]

      const history = createHashHistory()
      const router = makeRouterDriver(history)(most.from(routes))
        .path(`/some`).path(`/really`).path(`/really`).path(`/deeply`)
        .path(`/nested`).path(`/route`).path(`/that`)

      router.observable.observe(({pathname}) => {
        assert.strictEqual(pathname,
          `/some/really/really/deeply/nested/route/that/is/correct`)
      })
    })

    it(`should create a proper path using createHref()`, () => {
      const routes = [
        `/the/wrong/path`,
        `/some/really/really/deeply/nested/route/that/is/correct`,
        `/some/really/really/deeply/nested/incorrect/route`,
      ]

      const history = createHashHistory()
      const router = makeRouterDriver(history)(most.from(routes))
        .path(`/some`).path(`/really`).path(`/really`).path(`/deeply`)
        .path(`/nested`).path(`/route`).path(`/that`)

      router.observable.observe(({pathname}) => {
        assert.strictEqual(pathname,
          `/some/really/really/deeply/nested/route/that/is/correct`)
        assert.strictEqual(
          router.createHref(`/is/correct`),
          `#/some/really/really/deeply/nested/route/that/is/correct`)
      })
    })
  })

  describe(`define()`, () => {
    it(`should return an object with 'path$' 'value$' 'fullPath$' ` +
      `and 'createHref'`,
      () => {
        const history = createHashHistory()
        const router = makeRouterDriver(history)(most.just(`/`))
          .define({})
        assert.notStrictEqual(router.path$, null)
        assert.strictEqual(typeof router.path$, `object`)
        assert.strictEqual(typeof router.path$.observe, `function`)
        assert.notStrictEqual(router.value$, null)
        assert.strictEqual(typeof router.value$, `object`)
        assert.strictEqual(typeof router.value$.observe, `function`)
        assert.notStrictEqual(router.fullPath$, null)
        assert.strictEqual(typeof router.fullPath$, `object`)
        assert.strictEqual(typeof router.fullPath$.observe, `function`)
        assert.notStrictEqual(router.createHref, null)
        assert.strictEqual(typeof router.createHref, `function`)
      })

    it(`should match routes against a definition object`, () => {
      const defintion = {
        '/some': {
          '/route': 123,
        },
      }

      const routes = [
        `/some/route`,
      ]

      const history = createHashHistory()
      const router = makeRouterDriver(history)(most.from(routes))
      const {path$, value$, fullPath$} =
        router.define(defintion)

      path$.observe((path) => {
        assert.strictEqual(path, `/some/route`)
      })

      value$.observe((value) => {
        assert.strictEqual(value, 123)
      })

      fullPath$.observe(fullPath => {
        assert.strictEqual(fullPath, `/some/route`)
      })
    })

    it(`should respect prior filtering by path()`, () => {
      const defintion = {
        '/correct': {
          '/route': 123,
        },
      }

      const routes = [
        `/wrong/path`,
        `/some/nested/correct/route`,
      ]

      const history = createHashHistory()
      const router = makeRouterDriver(history)(most.from(routes))
      const {path$, value$, fullPath$} = router
          .path(`/some`).path(`/nested`).define(defintion)

      path$.observe((path) => {
        assert.strictEqual(path, `/correct/route`)
      })

      value$.observe((value) => {
        assert.strictEqual(value, 123)
      })

      fullPath$.observe(fullPath => {
        assert.strictEqual(fullPath, `/some/nested/correct/route`)
      })
    })

    it(`should match a default route if one is not found`, () => {
      const definition = {
        '/correct': {
          '/route': 123,
        },
        '*': 999,
      }

      const routes = [
        `/wrong/path`,
        `/wrong/route`,
        `/some/nested/incorrect/route`,
      ]

      const history = createHashHistory()
      const router = makeRouterDriver(history)(most.from(routes))
      const {path$, value$, fullPath$} = router
          .path(`/some`).path(`/nested`).define(definition)

      path$.observe((path) => {
        assert.strictEqual(path, `/incorrect/route`)
      })

      value$.observe((value) => {
        assert.strictEqual(value, 999)
      })

      fullPath$.observe(fullPath => {
        assert.strictEqual(fullPath, `/some/nested/incorrect/route`)
      })
    })

    it(`should create a proper href using createHref()`, () => {
      const defintion = {
        '/correct': {
          '/route': 123,
        },
        '*': 999,
      }

      const routes = [
        `/wrong/path`,
        `/some/nested/correct/route`,
      ]

      const history = createHashHistory()
      const router = makeRouterDriver(history)(most.from(routes))
      const {fullPath$, createHref} = router
          .path(`/some`).path(`/nested`).define(defintion)

      fullPath$.observe(pathname => {
        assert.strictEqual(pathname, `/some/nested/correct/route`)
        assert.strictEqual(createHref(`/correct/route`), `#${pathname}`)
      })
    })

    it(`should match partials`, () => {
      const defintion = {
        '/correct': {
          '/route': 123,
        },
        '*': 999,
      }

      const routes = [
        `/wrong/path`,
        `/some/nested/correct/route/partial`,
      ]

      const history = createHashHistory()
      const router = makeRouterDriver(history)(most.from(routes))
      const {path$, fullPath$} = router
          .path(`/some`).path(`/nested`).define(defintion)

      path$.observe(pathname => {
        assert.strictEqual(pathname, `/correct/route`)
      })

      fullPath$.observe(pathname => {
        assert.strictEqual(pathname, `/some/nested/correct/route/partial`)
      })
    })
  })
})
