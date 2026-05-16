/** @deprecated Użyj attachmentUpload.arrayAttachmentUpload — zachowane dla importów. */
const { createAttachmentMulter } = require('./attachmentUpload')

module.exports = createAttachmentMulter({ maxFiles: 5 })
