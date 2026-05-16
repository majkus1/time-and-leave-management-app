'use strict'

const { describe, it } = require('node:test')
const assert = require('node:assert/strict')

const { isAllowedAttachmentMimeType } = require('../utils/attachmentUpload')

describe('attachmentUpload.isAllowedAttachmentMimeType', () => {
	it('akceptuje typy jak w czacie', () => {
		assert.equal(isAllowedAttachmentMimeType('image/jpeg'), true)
		assert.equal(isAllowedAttachmentMimeType('application/pdf'), true)
		assert.equal(isAllowedAttachmentMimeType('application/zip'), true)
	})

	it('odrzuca wykonywalne i multimedia spoza listy', () => {
		assert.equal(isAllowedAttachmentMimeType('application/javascript'), false)
		assert.equal(isAllowedAttachmentMimeType('text/html'), false)
		assert.equal(isAllowedAttachmentMimeType('video/mp4'), false)
		assert.equal(isAllowedAttachmentMimeType('application/x-msdownload'), false)
	})
})
