const _ = require('lodash');

let permissionModules = {
    'admin': {
        base: 100,
        routes: {
            '/console(\\?){1}(.){1,}' : 50,
            '/users(\\?){1}(.){1,}' : 50,
            '/users/approve/([0-9]){1,}' : 50,
            '/users/reject/([0-9]){1,}' : 50,
            '/users/reset/([0-9]){1,}' : 50,
            '/system/forcescan' : 50
        }
    },

    'user': {
        base: 0,
        routes: {
            '/validate' : 0,
            '/notifications/*' : 10,
            '/feedback/get' : 100
        }
    },

    'v1.0': {
        base: 10,
        routes: {

        }
    }
};

module.exports = permissionModules;