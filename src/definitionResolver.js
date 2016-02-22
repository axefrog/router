import hold from '@most/hold'
import switchPath from 'switch-path'

import {splitPath, filterPath, makeCreateHref} from './util'

/**
 * Workaround for issues with switch-path finding the * parameter
 * @private
 * @method getPathValue
 * @param  {string}     pathname    the route to match against
 * @param  {Object}     definitions route definitions object as defined by
 * switch-path
 * @return {Object}                 an object containing the path matched
 * and the value associated with that route.
 */
function getPathValue(pathname, definitions) {
  let path
  let value
  try {
    const match = switchPath(pathname, definitions)
    value = match.value
    path = match.path
  } catch (e) {
    // try handling default route
    if (definitions[`*`]) {
      path = pathname
      value = definitions[`*`]
    } else {
      throw e
    }
  }
  return {path, value}
}

/**
 * Creates the method used publicly as .define()
 * @private
 * @method makeDefinitionResolver
 * @param  {Stream<location>}               history$   Observable
 * of the current location as defined by rackt/history
 * @param  {Array<String>}               namespace  An array which contains
 * all of the `.path()`s that have be created to this point
 * @param  {function}               createHref function used to create HREFs
 * as defined by the current history instance
 * @return {function}                          the public API function used
 * for `.define()`
 */
function makeDefinitionResolver(history$, namespace) {
  /**
   * Function used to match the current route to a set of routes using
   * switch-path
   * @public
   * @typedef {define}
   * @name define
   * @method define
   * @param  {Object}   definitions Route definitions as expected by
   * [switch-path](https://github.com/staltz/switch-path)
   * @return {defineAPI}
   */
  return function define(definitions) {
    const matches$ = history$.map(
      ({pathname: fullPath}) => {
        const filteredPath = `/${filterPath(splitPath(fullPath), namespace)}`
        const {path, value} = getPathValue(filteredPath, definitions)
        return {path, value, fullPath}
      }
    ).multicast()

    const match$ = hold(matches$)
    const path$ = match$.map(({path}) => path)
    const value$ = match$.map(({value}) => value)
    const fullPath$ = match$.map(({fullPath}) => fullPath)

    /**
     * Propeties and methods returned from define()
     * @typedef {defineAPI}
     * @name defineAPI
     * @type {Object}
     * @prop {Stream<Object>} match$ - a stream of the path, value and fullPath
     * matched by switch-path
     * @prop {Stream<string>} path$ - a stream of the path matched
     * by switch-path
     * @prop {Stream<any>} value$ - a stream of the value matched
     * by switchPath
     * @prop {Stream<string>} fullPath$ - a stream of the current
     * url entirely unfiltered
     * @prop {createHref} createHref - method used to define nested HREFs
     */
    const defineAPI = {
      match$,
      path$,
      value$,
      fullPath$,
      createHref: makeCreateHref(namespace, history$.createHref),
    }
    return defineAPI
  }
}

export {makeDefinitionResolver}
