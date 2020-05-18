'use strict';

const orderManager = require('./orderManager');
const customerServiceManager = require('./customerServiceManager');
const AWS = require('aws-sdk');
const sqs = new AWS.SQS({
    region: process.env.sesRegion   
});

const DELIVERY_COMPANY_QUEUE = process.env.deliveyCompanyQueue;

module.exports.deliveryOrder = orderFulfilled => {
    const orderFulfilledPromises = [];

    for (let order in orderFulfilled) {
        const temp = orderManager.updateOrderDelivery(order.orderId).then(updateOrder => {
            orderManager.saveOrder(updateOrder).then(() => {
                notifyDeliveryCompany(updateOrder);
            });
        });

        orderFulfilledPromises.push(temp);
    }

    return Promise.all(orderFulfilledPromises);
};

module.exports.orderDelivered = (orderId, deliveyCompanyId, orderReview) => {
    return orderManager.updateOrderAfterDelivery(orderId, deliveyCompanyId).then(
        updateOrder => {
            return orderManager.saveOrder(updateOrder).then(() => {
                return customerServiceManager.notifyCustomerServiceReview(orderId, orderReview);
            });
        }
    );
};

function notifyDeliveryCompany(order) {
    const params = {
        MessageBody: JSON.stringify(order),
        QueueUrl: DELIVERY_COMPANY_QUEUE
    }

    return sqs.sendMessage(params).promise();
}
