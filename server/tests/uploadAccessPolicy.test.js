'use strict'

const { describe, it } = require('node:test')
const assert = require('node:assert/strict')

const { normalizeStoredFilename } = require('../utils/uploadAccessPolicy')

describe('uploadAccess.normalizeStoredFilename', () => {
	it('akceptuje zwykłą nazwę pliku', () => {
		assert.equal(normalizeStoredFilename('a1b2c3d4.pdf'), 'a1b2c3d4.pdf')
	})

	it('redukuje ścieżkę do basename (bez katalogów)', () => {
		assert.equal(normalizeStoredFilename('../secret.txt'), 'secret.txt')
		assert.equal(normalizeStoredFilename('..\\secret.txt'), 'secret.txt')
		assert.equal(normalizeStoredFilename('foo/../../../etc/passwd'), 'passwd')
		assert.equal(normalizeStoredFilename('..'), null)
	})

	it('wyciąga basename z ścieżki', () => {
		assert.equal(normalizeStoredFilename('subdir/file.png'), 'file.png')
	})
})
