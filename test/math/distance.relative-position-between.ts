import test from 'ava'

import {relativePositionBetween} from '../../source/lib/math/distance'

import {createInputOutputIsMacro} from '../_helper'

const relativePositionBetweenMacro = createInputOutputIsMacro(relativePositionBetween, (start, end, position) => `${start} ${end} ${position}`)

test(relativePositionBetweenMacro, 0, 0, 1, 0)
test(relativePositionBetweenMacro, 0, 0, 10, 0)
test(relativePositionBetweenMacro, 0, 5, 10, 5)

test(relativePositionBetweenMacro, 1, 0, 1, 1)
test(relativePositionBetweenMacro, 1, 0, 10, 10)
test(relativePositionBetweenMacro, 1, 5, 10, 10)

test(relativePositionBetweenMacro, 0.5, 0, 1, 0.5)
test(relativePositionBetweenMacro, 0.5, 0, 10, 5)
test(relativePositionBetweenMacro, 0.5, 5, 10, 7.5)
