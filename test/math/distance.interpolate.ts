import test from 'ava'

import {interpolate} from '../../source/lib/math/distance'

import {createInputOutputIsMacro} from '../_helper'

const interpolateMacro = createInputOutputIsMacro(interpolate, (start, end, position) => `${start} ${end} ${position}`)

test(interpolateMacro, 0, 0, 1, 0)
test(interpolateMacro, 0, 0, 10, 0)
test(interpolateMacro, 5, 5, 10, 0)

test(interpolateMacro, 1, 0, 1, 1)
test(interpolateMacro, 10, 0, 10, 1)
test(interpolateMacro, 10, 5, 10, 1)

test(interpolateMacro, 0.5, 0, 1, 0.5)
test(interpolateMacro, 5, 0, 10, 0.5)
test(interpolateMacro, 7.5, 5, 10, 0.5)
