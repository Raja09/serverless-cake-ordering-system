'use strict';

const { v4: uuidv4 } = require('uuid');
const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();
const kinesis = new AWS.Kinesis();

// Fetch the table name from environment variable
const TABLE_NAME = process.env.orderTableName;
const STREAM_NAME = process.env.orderStreamName;

module.exports.createOrder = body => {
    // Create an Order object
    const order = {
        orderId: uuidv4(),
        name: body.name,
        address: body.address,
        productId: body.productId,
        quantity: body.quantity,
        description: body.description,
        date: Date.now(),
        eventType: 'order_placed'
    };

    return order;
};

module.exports.placeNewOrder = order => {
    // Save order in the dynamodb table
    return this.saveOrder(order).then(()=>{
        // Put the order in kinesis data stream
        return placeOrderStream(order);
    }).then(error => {
        return error;
    });
    
};

module.exports.fulfillOrder = (orderId, fulfillmentId)  => {
    return getOrder(orderId).then(savedOrder => {
        const order = createFulfillmentOrder(savedOrder, fulfillmentId);
        return this.saveOrder(order).then(() => {
            return placeOrderStream(order);
        });
    });
};

module.exports.updateOrderDelivery = orderId => {
    return getOrder(orderId).then(order => {
        order.sentToDeliveyDate = Date.now();
        return order;
    });
};

module.exports.updateOrderAfterDelivery = (orderId, deliveyCompanyId) => {
    return getOrder(orderId).then(order => {
        order.deliveyCompanyId = deliveyCompanyId;
        order.deliveryDate = Date.now();
        order.eventType = 'order_delivered';
        return order;
    });
}

module.exports.saveOrder = order => {
    const params = {
        TableName: TABLE_NAME,
        Item: order
    }

    // Save the order details into dynamodb
    return dynamodb.put(params).promise();
};

function getOrder(orderId) {
    const params = {
        Key : {
            orderId: orderId
        },
        TableName: TABLE_NAME   
    };

    return dynamodb.get(params).promise().then(result => {
        return result.Item;
    });
}

function placeOrderStream(order) {
    const params = {
        Data: JSON.stringify(order),
        PartitionKey: order.orderId,
        StreamName: STREAM_NAME
    }

    return kinesis.putRecord(params).promise();
}

function createFulfillmentOrder(savedOrder, fulfillmentId) {
    savedOrder.fulfillmentId = fulfillmentId;
    savedOrder.fulfillmentDate = Date.now();
    savedOrder.eventType = 'order_fulfilled'

    return savedOrder;
}
