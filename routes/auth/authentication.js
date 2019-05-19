const express = require('express');
const router = express.Router();
const log = require('perfect-logger');
const gauth = require('../../modules/google');


router.post('/google', (req, res) => {
    gauth.verifyToken(req.body.idToken)
        .then((response)=>{
            res.send({
                success: true,
                response: response
            });
        })
        .catch((response)=>{
            res.send({
                success: false
            })
        })
});


module.exports = router;