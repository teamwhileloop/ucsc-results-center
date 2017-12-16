// Database Credentials
exports.database = {
    host : process.env.AWS_RDB_HOST,
    username : process.env.AWS_RDB_USERNAME,
    password : process.env.AWS_RDB_PASSWORD,
    database : process.env.AWS_RDB_DATABASE
};

// Postman Credentials
exports.postman = {
    user: process.env.MAILMAN_EMAIL,
    pass: process.env.MAILMAN_PASSWORD
};

exports.accessToken = process.env.UCSC_RESULTS_CENTER_ACCESSTOKEN;

exports.isDeployed = process.env.DEV_ENV === 'false';