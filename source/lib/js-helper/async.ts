/**
 * Run the function multiple times with the arguments in order to get all the results over time.
 * The results are concatted into the result array.
 */
export async function stagedAsync<Argument, Result>(func: (arg: Argument) => Promise<readonly Result[]>, args: readonly Argument[], concurrent = 4): Promise<Result[]> {
	const results: Array<readonly Result[]> = []

	while (results.length < args.length) {
		// eslint-disable-next-line no-await-in-loop
		const stepResults = await Promise.all(
			args
				.slice(results.length, results.length + concurrent)
				.map(async o => func(o))
		)

		results.push(...stepResults)
	}

	return results.flat()
}

export async function sequentialAsync<Argument, Result>(func: (arg: Argument) => Promise<Result>, args: readonly Argument[]): Promise<Result[]> {
	const result: Result[] = []
	for (const o of args) {
		// eslint-disable-next-line no-await-in-loop
		result.push(await func(o))
	}

	return result
}
