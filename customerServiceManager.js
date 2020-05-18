'use strict'
 
const orderManager = require('./orderManager');
const AWS = require('aws-sdk');
const sqs = new AWS.SQS({
    region: process.env.sqsRegion
});
const CUSTOMER_SERVICE_QUEUE = process.env.customerServiceQueue;

module.exports.notifyCustomerServiceReview = (orderId, orderReview) => {
    const review = {
        orderId: orderId,
        orderReview: orderReview,
        date: Date.now()
    };

    const params = {
        MessageBody: JSON.stringify(review),
        QueueUrl: CUSTOMER_SERVICE_QUEUE
    }

    return sqs.sendMessage(params).promise();
};