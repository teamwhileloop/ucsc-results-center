const _ = require('lodash');

let permissionModules = {
    'admin': {
        base: 50,
        routes: {
            '/console/clear' : 100,
            '/console/download' : 100,
            '/users/role' : 100,
            '/system/maintenance' : 100,
            '/system/forcescan' : 50,
            '/result/dataset' : 100,
            '/console/generate/[0-9]{1,}' : 100,
            '/monitoring/*' : 100,
            '/run-backup/*' : 100,
            '/subject-list' : 100,
            '/datasets/*' : 100,
            '/last-datasets/*' : 100,
            '/maintenance' : 100,
            '/calculate/pattern/[0-9]{1,}' : 100
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