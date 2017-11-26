'use strict';
const nodeMailer = require('nodemailer');
const logger = require('./logger');
const credentials = require('./credentials');
const fs = require('fs');
const ejs = require('ejs');

let transporter = nodeMailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: credentials.postman
});

exports.sendTemplateMail = function (toAddress, subject, templateUrl, options) {
    fs.readFile(templateUrl, 'utf8', function (err,data) {
        if (err) {
            logger.log('Failed to read the email template from :' + templateUrl,'crit',true);
        }else {
            let htmlCode = ejs.render(data, options);
            transporter.sendMail({
                from: '"UCSC Results Center" <ucscresultcenter@gmail.com>',
                to: toAddress,
                subject: subject,
                html: htmlCode
            },function (error, _info) {
                if (error){
                    logger.log('Error occurred while sending '+ subject + ' email to ' + toAddress,'warn',true);
                }else {
                    logger.log(subject + ' email sent to ' + toAddress,'info',true);
                }
            });
        }
    });

};

exports.sendTextMail = function (toAddress, subject, message) {
    transporter.sendMail({
        from: '"UCSC Results Center" <ucscresultcenter@gmail.com>',
        to: toAddress,
        subject: subject,
        text: message
    },function (error, _info) {
        if (error){
            logger.log('Error occurred while sending '+ subject + ' email to ' + toAddress,'warn',true);
        }else {
            logger.log(subject + ' email sent to ' + toAddress,'info',true);
        }
    });
};

exports.transporter = transporter;