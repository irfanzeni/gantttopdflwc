var queue = require('seq-queue');
var order = queue.createQueue(25000);

module.exports = order;