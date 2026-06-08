import { describe, expect, it } from 'vitest'
import {
	blocksFromWorkday,
	serializeActivityBlocks,
	validateActivityBlocksClient,
} from './manualActivityBlocks'

const t = (key, params) => `${key}${params?.row ? `:${params.row}` : ''}`

describe('manualActivityBlocks', () => {
	it('preserves optional quantity when serializing activity blocks', () => {
		expect(serializeActivityBlocks([{
			activityId: 'activity-1',
			hours: '4',
			timeFrom: '08:00',
			timeTo: '12:00',
			quantity: '22.5',
		}])).toEqual([{
			activityId: 'activity-1',
			hours: 4,
			timeFrom: '08:00',
			timeTo: '12:00',
			quantity: 22.5,
		}])
	})

	it('loads quantity from existing workday blocks', () => {
		expect(blocksFromWorkday({
			manualActivityBlocks: [{
				activityId: 'activity-1',
				hours: 3,
				quantity: 10,
			}],
		})).toEqual([{
			activityId: 'activity-1',
			hours: '3',
			timeFrom: '',
			timeTo: '',
			quantity: '10',
		}])
	})

	it('rejects negative quantity', () => {
		expect(validateActivityBlocksClient([{
			activityId: 'activity-1',
			hours: '2',
			quantity: '-1',
		}], t)).toBe('workcalendar.activities.errors.invalidQuantity:1')
	})
})
