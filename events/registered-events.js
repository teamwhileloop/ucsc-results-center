let events = require('../modules/events');

events.register('test-event', require('./test-event'));
events.register('system_warn_err_thrown', require('./sys-err-warn'));