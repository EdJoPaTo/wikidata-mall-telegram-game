import test from 'ava'
import WikidataEntityReader from 'wikidata-entity-reader'

import {labeledValue, labeledFloat, labeledInt} from '../../source/lib/interface/formatted-strings'

test('labeledValue short example', t => {
	t.is(labeledValue('a', 'b'), 'a: b\n')
})

test('labeledValue can use reader', t => {
	const reader = new WikidataEntityReader({id: 'Q5', type: 'item'})
	t.is(labeledValue(reader, 'b'), 'Q5: b\n')
})

test('labeledValue long text', t => {
	const label = '1234567890'
	const value = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
	t.is(labeledValue(label, value), `${label}:\n  ${value}\n`)
})

test('labeledFloat', t => {
	t.is(labeledFloat('a', 1337), 'a: 1.34k\n')
})

test('labeledInt', t => {
	t.is(labeledInt('a', 42), 'a: 42\n')
})
