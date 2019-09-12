import test from 'ava'

import {countdownHourMinute, countdownMinuteSecond, humanReadableTimestamp} from '../../source/lib/interface/formatted-time'

test('countdownHourMinute examples', t => {
	t.is(countdownHourMinute(42), '0:00')
	t.is(countdownHourMinute(60), '0:01')
	t.is(countdownHourMinute(10 * 60), '0:10')
	t.is(countdownHourMinute(60 * 60), '1:00')
	t.is(countdownHourMinute(65 * 60), '1:05')
	t.is(countdownHourMinute(600 * 60 * 60), '600:00')
})

test('countdownMinuteSecond examples', t => {
	t.is(countdownMinuteSecond(1), '0:01')
	t.is(countdownMinuteSecond(10), '0:10')
	t.is(countdownMinuteSecond(60), '1:00')
	t.is(countdownMinuteSecond(65), '1:05')
	t.is(countdownMinuteSecond(600 * 60), '600:00')
})

test('humanReadableTimestamp de', t => {
	t.is(humanReadableTimestamp(1564782891, 'de', 'UTC'), '2. Aug. 2019, 21:54 UTC')
})

test('humanReadableTimestamp en-us', t => {
	t.is(humanReadableTimestamp(1564782891, 'en-us', 'UTC'), 'Aug 2, 2019, 9:54 PM UTC')
})

test('humanReadableTimestamp en-gb', t => {
	t.is(humanReadableTimestamp(1564782891, 'en-gb', 'UTC'), '2 Aug 2019, 21:54 UTC')
})
