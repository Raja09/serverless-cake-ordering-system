'use strict';

const orderManager = require('./orderManager');
const kinesisHelper = require('./kinesisHelper');
const cakeProducerManager = require('./cakeProducerManager');
const deliveryManager = require('./deliveryManager');


function createResponseObject(statusCode, message) {
  const response = {
    statusCode: statusCode,
    body: JSON.stringify(message)
  };

  return response;
}

module.exports.hello = async event => {
  return {
    statusCode: 200,
    body: JSON.stringify(
      {
        message: 'Go Serverless v1.0! Your function executed successfully!',
        input: event,
      },
      null,
      2
    ),
  };

  // Use this code if you don't use the http event with the LAMBDA-PROXY integration
  // return { message: 'Go Serverless v1.0! Your function executed successfully!', event };
};

module.exports.createOrder = async event => {

  // Get the body from the event object
  const body = JSON.parse(event.body);
  const order = orderManager.createOrder(body);

  // Save new Order
  return orderManager.placeNewOrder(order).then(() => {
    return createResponseObject(200, order);
  }).catch( error => {
    return createResponseObject(400, error);
  });
};

module.exports.orderFulfillment = async event => {
  const body = JSON.parse(event.body);
  const orderId = body.orderId;
  const fulfillmentId = body.fulfillmentId;
  
  return orderManager.fulfillOrder(orderId, fulfillmentId).then(() => {
    return createResponseObject(200, `Order with orderId: ${orderId} was sent to delivey.`)
  }).catch(error => {
    return createResponseObject(400, error);
  });
};

module.exports.notifyExternalParties = async event => {
    const records = kinesisHelper.getRecord(event);
    
    console.log("Cake Order notify");
    console.log(records);

    const cakeProducePromises = getCakeProducerPromises(records);
    const deliveryPromises = getDeliveryPromises(records);

    Promise.all([cakeProducePromises, deliveryPromises]).then(() => {
      return 'everything well';
    }).catch(error => {
      return error;
    });

};

module.exports.notifyDeliveryCompany = async event => {
  // Some HTTP call
  console.log("Lets imagine we call delivery comapany endpoint...");
  return "done!!!";
};

module.exports.orderDelivered = async event => {
  const body = JSON.parse(event.body);
  const orderId = body.orderId;
  const deliveyCompanyId = body.deliveryCompanyId;
  const orderReview = parseInt(body.orderReview);
  
  return deliveryManager.orderDelivered(orderId, deliveyCompanyId, orderReview).then(() => {
    return createResponseObject(200, `Order with ${orderId} was delivered successfully by Company Id ${deliveyCompanyId}`);
  }).catch(error => {
    return createResponseObject(400, error);
  });
};

module.exports.notifyCustomerService = async event => {
  console.log("Lets imagine we call delivery comapany endpoint...");
  return "Done!!!";
}

function getCakeProducerPromises(records) {
  const orderPlaced = records.filter(r => r.eventType == 'order_placed');

  console.log("Order Placed length: ");
  console.log(orderPlaced.length);

  if (orderPlaced.length > 0) {
    return cakeProducerManager.handlePlacedOrders(orderPlaced);
  } else {
    return null;
  }
}

function getDeliveryPromises(records) {
  const orderFulfilled = records.filter(r => r.eventType == 'order_fulfilled');

  if (orderFulfilled.length > 0) {
    return deliveryManager.deliveryOrder(orderFulfilled);
  } else {
    return null;
  }
}