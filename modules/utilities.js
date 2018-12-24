exports.timeSpent = function (start) {
    let duration = new Date() - start;
    return duration/1000 + 's';
};