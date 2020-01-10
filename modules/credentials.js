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

exports.facebook = {
    pageToken: process.env.FB_PAGE_TOKEN,
    pagePostToken: process.env.FB_PAGE_POST_TOKEN,
    verifyToken: process.env.FB_VERIFY_TOKEN
};

exports.ssl = {
    key: process.env.RSA_KEY,
    cert: process.env.RSA_CERT,
    ca: process.env.RSA_CA
};

exports.accessToken = process.env.UCSC_RESULTS_CENTER_ACCESSTOKEN;

exports.isDeployed = process.env.DEV_ENV === 'false';


console.log(JSON.stringify(exports, null, 2));