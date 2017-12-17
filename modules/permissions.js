const permissionJSON = {
    '/user/validate' : 0
};

module.exports = function checkPermission(url='',userPower = 0) {
    return {
        status: (permissionJSON[url] || 0) <= userPower,
        powerRequired:  permissionJSON[url] || 0,
        userPower: userPower
    }
};