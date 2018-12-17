'use strict';
const nodeMailer = require('nodemailer');
const log = require('perfect-logger');
const credentials = require('./credentials');
const configurations = require('./configurations');
const fs = require('fs');
const ejs = require('ejs');

let transporter = nodeMailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: credentials.postman
});

exports.sendTemplateMail = function (toAddress, subject, templateUrl, options) {
    if (!toAddress){
        log.info(`'${subject}' mail was not sent as the receiver was not valid`);
        return;
    }
    fs.readFile(templateUrl, 'utf8', function (err,data) {
        if (err) {
            log.crit('Failed to read the email template from :' + templateUrl, err);
        }else {
            let htmlCode = ejs.render(data, options);

            if (!configurations.enableEmails){
                return;
            }

            transporter.sendMail({
                from: '"UCSC Results Center" <ucscresultcenter@gmail.com>',
                to: toAddress,
                subject: subject,
                html: htmlCode
            },function (error, _info) {
                if (error){
                    log.warn('Error occurred while sending '+ subject + ' email to ' + toAddress, error);
                }else {
                    log.mail(subject + ' email sent to ' + toAddress);
                }
            });
        }
    });

};

exports.sendTextMail = function (toAddress, subject, message) {

    if (!configurations.enableEmails){
        return;
    }
    
    transporter.sendMail({
        from: '"UCSC Results Center" <ucscresultcenter@gmail.com>',
        to: toAddress,
        subject: subject,
        text: message
    },function (error, _info) {
        if (error){
            log.warn('Error occurred while sending '+ subject + ' email to ' + toAddress, error);
        }else {
            log.mail(subject + ' email sent to ' + toAddress);
        }
    });
};

exports.transporter = transporter;