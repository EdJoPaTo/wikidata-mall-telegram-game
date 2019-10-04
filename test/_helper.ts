/* eslint ava/use-test: off */
import {ExecutionContext} from 'ava'

type Macro<InputType extends any[], ReturnType> = (t: ExecutionContext, expected: ReturnType, ...input: InputType) => void
type Func<InputType extends any[], ReturnType> = (...input: InputType) => ReturnType

export function createInputOutputDeepEqualMacro<InputType extends any[], ReturnType>(func: Func<InputType, ReturnType>): Macro<InputType, ReturnType> {
	return (t, expected, ...input) => {
		t.deepEqual(func(...input), expected)
	}
}

export function createInputOutputIsMacro<InputType extends any[], ReturnType>(func: Func<InputType, ReturnType>): Macro<InputType, ReturnType> {
	return (t, expected, ...input) => {
		t.deepEqual(func(...input), expected)
	}
}
