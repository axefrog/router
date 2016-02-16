import {createAPI} from './api'
import {makeHistoryDriver} from '@motorcycle/history'

/**
 * Instantiates an new router driver function using a valid history object.
 * @public
 * @method makeRouterDriver
 * @param  {object}          history - a valid history instance as defined by
 * ractk/history. Should have `createLocation()`, `createHref()`, `listen()`,
 * and `push()` methods.
 * @return {routerDriver}                  The router driver function
 */
function makeRouterDriver(history) {
  const historyDriver = makeHistoryDriver(history)
  /**
   * The actual router driver.
   * @public
   * @typedef {routerDriver}
   * @name routerDriver
   * @method routerDriver
   * @param  {Stream<string|Object>} sink$ - This is the same input that the
   * history driver would expect.
   * @return {routerAPI}
   */
  return function routerDriver(sink$) {
    const history$ = historyDriver(sink$).multicast()
    return createAPI(history$, [])
  }
}

export {makeRouterDriver}
