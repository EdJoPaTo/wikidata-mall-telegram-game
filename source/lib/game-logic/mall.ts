export function parseTitle(title: string | undefined): string {
	if (!title) {
		return '??'
	}

	return title.slice(0, 30).trim()
}
