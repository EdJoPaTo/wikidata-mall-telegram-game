import test from 'ava'

import {QuickStats} from '../../source/lib/math/number-array'
import {formatFloat} from '../../source/lib/interface/format-number'

import {specific, minAvgMax} from '../../source/lib/interface/quick-stats'

import {createInputOutputIsMacro} from '../_helper'

const exampleQuickStats: QuickStats = {
	amount: 4,
	sum: 700,
	avg: 42,
	min: 5,
	max: 600
}

const formatSpecificMacro = createInputOutputIsMacro(
	(what: keyof QuickStats) => specific(exampleQuickStats, what, formatFloat),
	what => `specific ${what}`
)

test(formatSpecificMacro, '4.00', 'amount')
test(formatSpecificMacro, '=700', 'sum')
test(formatSpecificMacro, '~42.0', 'avg')
test(formatSpecificMacro, '≥5.00', 'min')
test(formatSpecificMacro, '≤600', 'max')

test('minAvgMax', t => {
	t.is(minAvgMax(exampleQuickStats, formatFloat, formatFloat), '≥5.00 ~42.0 ≤600')
})
