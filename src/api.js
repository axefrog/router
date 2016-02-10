import hold from '@most/hold'
import {makePathFilter} from './pathFilter'
import {makeDefinitionResolver} from './definitionResolver'
import {makeCreateHref} from './util'

/**
 * Creates the public API returned by the base router driver
 * as well as the API which is returned by `.path()`
 * @private
 * @method createAPI
 * @param  {Stream<history.location>}  history$   Observable of the current
 * location as defined by rackt/history
 * @param  {Array<String>}  namespace  An array which contains all of the
 * `.path()`s that have be created to this point
 * @return {routerAPI}
 */
function createAPI(history$, namespace) {
  let heldHistory$ = hold(history$)
  heldHistory$.createHref = history$.createHref
  /**
   * The Public API returned by the router driver, createRouter(), and .path()
   * @typedef {routerAPI}
   * @name routerAPI
   * @type {Object}
   * @prop {path} path - used for filtering routes to a given path
   * @prop {define} define - used for defining a set of routes to values via
   * switch-path
   * @prop {Stream<location>} observable - a way to get access to the
   * current history$ from the historyDriver
   * @prop {createHref} createHref - a method for create HREFs that are properly
   * prefixed for the current namespace
   */
  const API = {
    path: makePathFilter(heldHistory$, namespace),
    define: makeDefinitionResolver(heldHistory$, namespace),
    observable: heldHistory$,
    createHref: makeCreateHref(namespace, history$.createHref),
  }
  return API
}

export {createAPI}
