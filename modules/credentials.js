// DATABASE CREDENTIALS
exports.database = {
    host : process.env.AWS_RDB_HOST,
    username : process.env.AWS_RDB_USERNAME,
    password : process.env.AWS_RDB_PASSWORD,
    database : process.env.AWS_RDB_DATABASE
};

exports.isDeployed = process.env.DEV_ENV === 'false';