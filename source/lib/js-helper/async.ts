/* eslint no-await-in-loop: off */

/**
 * Run the function multiple times with the arguments in order to get all the results over time.
 * The results are concatted into the result array.
 */
export async function stagedAsync<Argument, Result>(func: (arg: Argument) => Promise<Result[]>, args: readonly Argument[], concurrent = 10): Promise<Result[]> {
	const results: Result[][] = []

	while (results.length < args.length) {
		const stepResults = await Promise.all(
			args
				.slice(results.length, results.length + concurrent)
				.map(async o => func(o))
		)

		results.push(...stepResults)
	}

	return results.flat()
}

export async function sequentialAsync<Argument>(func: (arg: Argument) => Promise<void>, args: readonly Argument[]): Promise<void> {
	for (const o of args) {
		await func(o)
	}
}
