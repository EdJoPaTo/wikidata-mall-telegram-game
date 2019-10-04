/* eslint ava/use-test: off */
import {ExecutionContext} from 'ava'

interface Macro<InputType extends any[], ReturnType> {
	title?: (providedTitle: string | undefined, expected: ReturnType, ...args: InputType) => string;

	(t: ExecutionContext, expected: ReturnType, ...input: InputType): void;
}

type Func<InputType extends any[], ReturnType> = (...input: InputType) => ReturnType
type TitleFunc<InputType extends any[]> = (...input: InputType) => string

export function createInputOutputDeepEqualMacro<InputType extends any[], ReturnType>(
	func: Func<InputType, ReturnType>, titleFunc?: TitleFunc<InputType>
): Macro<InputType, ReturnType> {
	const macro: Macro<InputType, ReturnType> = (t, expected, ...input) => {
		t.deepEqual(func(...input), expected)
	}

	if (titleFunc) {
		macro.title = (_providedTitle, _expected, ...args) => titleFunc(...args)
	}

	return macro
}

export function createInputOutputIsMacro<InputType extends any[], ReturnType>(
	func: Func<InputType, ReturnType>, titleFunc?: TitleFunc<InputType>
): Macro<InputType, ReturnType> {
	const macro: Macro<InputType, ReturnType> = (t, expected, ...input) => {
		t.deepEqual(func(...input), expected)
	}

	if (titleFunc) {
		macro.title = (_providedTitle, _expected, ...args) => titleFunc(...args)
	}

	return macro
}
