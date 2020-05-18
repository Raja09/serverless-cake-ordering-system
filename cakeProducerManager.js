'use strict';

const AWS = require('aws-sdk');
const ses = new AWS.SES({
    region: process.env.sesRegion
});

const CAKE_PRODUCER_EMAIL = process.env.cakeProducerEmail;
const CAKE_ORDERING_SYSTEM_EMAIL = process.env.cakeOrderingSystemEmail;

module.exports.handlePlacedOrders = orderPlaced => {
    var orderPlacedPromises = [];

    for (let order in orderPlaced) {
        const temp = notifyCakeProducerByEmail(order);
        orderPlacedPromises.push(temp);
    }

    return Promise.all(orderPlacedPromises);
};

function notifyCakeProducerByEmail(order) {
    // SES Email template
    const params = {
        Destination: {
            ToAddresses: [CAKE_PRODUCER_EMAIL]
        },
        Message: {
            Body: {
                Text: {
                    Data: JSON.stringify(order)
                }
            },
            Subject: {
                Data: 'New Cake Order'
            }
        },
        Source: CAKE_ORDERING_SYSTEM_EMAIL
    };

    return ses.sendEmail(params).promise().then((data) => {
        return data;
    }).then(error => {
        return error;
    });
}