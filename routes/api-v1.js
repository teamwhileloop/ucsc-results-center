const express = require('express');
const router = express.Router();

let permission = require('../modules/permissions');

// Authentication and Verification Middleware
router.use('/', permission());

router.get('/',function (req,res) {
   res.send({});
});

module.exports = router;