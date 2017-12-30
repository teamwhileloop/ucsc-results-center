const _ = require('lodash');

let permissionModules = {
    'admin': {
        base: 50,
        routes: {
            '/console/clear' : 100,
            '/calculate/pattern/[0-9]{1,}' : 100
        }
    },

    'user': {
        base: 0,
        routes: {
            '/validate' : 0
        }
    },

    'v1.0': {
        base: 10,
        routes: {

        }
    }
};

module.exports = permissionModules;