'use strict';

function parseRecordBody(record) {
    const json = new Buffer(record.kinesis.data, 'base64').toString('utf8');
    console.log("Parse record Body:")
    console.log(json);
    return JSON.parse(json);
}

module.exports.getRecord = event => {
    return event.Records.map(parseRecordBody);
};