const log = require('perfect-logger');

let registeredEvents = {};

function isRegisteredEvent(eventName) {
    return (typeof registeredEvents[eventName] === 'function');
}

exports.register = function(eventName, fn){
    if (isRegisteredEvent(eventName)){
        log.crir(`Event ${eventName} is already registered.`);
        return;
    }

    registeredEvents[eventName] = fn;
};

exports.trigger = function(eventName){
    if (!isRegisteredEvent(eventName)){
        log.warn(`Unable to trigger event '${eventName}': Event not registered.`);
        return;
    }

    registeredEvents[eventName].apply(this, Array.prototype.slice.call(arguments, 1));
    try {

    } catch (e) {
        log.warn(`Error on event: ${eventName}`);
    }

};

require('../events/registered-events');