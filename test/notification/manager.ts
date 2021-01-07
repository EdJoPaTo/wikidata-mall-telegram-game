import test from 'ava'

import {NotificationManager} from '../../source/lib/notification/manager'

function inMilliseconds(ms: number): Date {
	return new Date(Date.now() + ms)
}

test.cb('notification is triggered', t => {
	setTimeout(t.end, 1000)

	const notify = new NotificationManager(
		(chatId, notification) => {
			t.is(chatId, 'bob')
			t.is(notification.text, '42')
		}
	)

	notify.add('bob', {
		type: 'skillFinished',
		date: inMilliseconds(500),
		text: '42'
	})
})

test.cb('multiple notifications are triggered', t => {
	t.plan(2)
	setTimeout(t.end, 1000)

	const notify = new NotificationManager(
		(_, notification) => {
			t.is(notification.text, '42')
		}
	)

	notify.add('bob', {
		type: 'skillFinished',
		date: inMilliseconds(400),
		text: '42'
	})

	notify.add('bob', {
		type: 'skillFinished',
		date: inMilliseconds(800),
		text: '42'
	})
})

test.cb('clear works', t => {
	setTimeout(() => {
		t.pass()
		t.end()
	}, 1000)

	const notify = new NotificationManager(
		() => {
			t.fail('should not be triggered')
		}
	)

	notify.add('bob', {
		type: 'skillFinished',
		date: inMilliseconds(500),
		text: '42'
	})

	notify.clear('bob')
})

test.cb('clear does not interfer with other user', t => {
	setTimeout(t.end, 1000)

	const notify = new NotificationManager(
		(chatId, notification) => {
			t.is(chatId, 'bob')
			t.is(notification.text, '42')
		}
	)

	notify.add('bob', {
		type: 'skillFinished',
		date: inMilliseconds(500),
		text: '42'
	})

	notify.clear('carl')
})

test.cb('clear works after notification triggered', t => {
	t.plan(2)
	setTimeout(t.end, 1000)

	const notify = new NotificationManager(
		() => {
			t.pass()
		}
	)

	notify.add('bob', {
		type: 'skillFinished',
		date: inMilliseconds(400),
		text: '42'
	})

	setTimeout(() => {
		notify.clear('bob')
		t.pass()
	}, 800)
})

test('job in the past can be cleared', t => {
	const notify = new NotificationManager(
		() => {
			t.fail()
		}
	)

	notify.add('bob', {
		type: 'skillFinished',
		date: inMilliseconds(-500),
		text: '42'
	})

	t.notThrows(() => {
		notify.clear('bob')
	})
})
