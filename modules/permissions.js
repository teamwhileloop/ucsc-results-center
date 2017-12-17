const permissionJSON = {
    '/user' : 0,
    '/user/validate' : 0
};

module.exports = function checkPermission(url='',userPower = 0) {
    let permissionStatus = false;
    let powerRequired = null;
    let method = null;

    if (permissionJSON[url] !== undefined){
        permissionStatus = permissionJSON[url] <= userPower;
        powerRequired = permissionJSON[url];
        method = 'url';
    }else if(permissionJSON[`/${url.split('/')[1]}`] !== undefined){
        permissionStatus =  permissionJSON[`/${url.split('/')[1]}`] <= userPower;
        powerRequired = permissionJSON[`/${url.split('/')[1]}`];
        method = 'base';
    }else {
        permissionStatus = true;
        method = 'unset';
    }
    return {
        status: permissionStatus,
        powerRequired:  powerRequired,
        method : method,
        userPower: userPower
    }
};