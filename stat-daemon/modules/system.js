const os = require('os');
const util = require('util');
const exec = util.promisify(require('child_process').exec);

exports.getCpuUtilization = function () {
    return os.loadavg();
};

exports.getMemory =function () {
    const total = os.totalmem();
    const free = os.freemem();
    const used = total-free;
    return {
        total: total,
        free: free,
        used: used,
        perc: used*100/total
    }
};

exports.getAppData = async function () {
    const { stdout, stderr } = await exec('pm2 jlist');
    let appData = JSON.parse(stdout);
    await appData.forEach(function (app, index) {
        appData[index].status = app.pm2_env.status;
        appData[index].pm_uptime = app.pm2_env.pm_uptime;
        appData[index].created_at = app.pm2_env.created_at;
        appData[index].restart_time = app.pm2_env.restart_time;
        delete appData[index].pm2_env;
    });
    return appData;
};