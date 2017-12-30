/**
 * Base power will be used if endpoint power was not found
 *
 * Example :    /user          <- Base power
 *              /user/info     <- Endpoint power
 * */

module.exports = {
    '/v1.0' : 10,
    '/user' : 0,
    '/user/validate' : 0
};