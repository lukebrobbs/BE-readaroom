"use strict";
const AWS = require("aws-sdk");

exports.ProcessKinesisRecords = (event, context, callback) => {
  const response = {
    statusCode: 200,
    body: JSON.stringify({
      message: "Go Serverless v1.0! Your function executed successfully!",
      input: event
    })
  };

  const rawPayLoad = new Buffer(
    event.Records[0].kinesis.data,
    "base64"
  ).toString("ascii");
  console.log(rawPayLoad);

  callback(null, response);

  // Use this code if you don't use the http event with the LAMBDA-PROXY integration
  // callback(null, { message: 'Go Serverless v1.0! Your function executed successfully!', event });
};
exports.ReadVideoStream = (event, context, callback) => {
  const kinesisVideoMedia = new AWS.KinesisVideoMedia();
  const kinesisVideo = new AWS.KinesisVideo();
  const params = {
    StartSelector: { StartSelectorType: "NOW" },
    StreamARN:
      "arn:aws:kinesisvideo:eu-west-1:015176863114:stream/readaroom/1524213524123"
  };

  const kinesisVidParams = {
    APIName: "GET_MEDIA",
    StreamARN:
      "arn:aws:kinesisvideo:eu-west-1:015176863114:stream/readaroom/1524213524123"
  };
  kinesisVideo.getDataEndpoint(kinesisVidParams, (err, data) => {
    console.log("data", data, "err", err);
    console.log("err", err);
    kinesisVideoMedia.getMedia(params, (err, data) => {
      console.log("data", JSON.parse(data), "err", err);
      console.log("data2", JSON.parse(data.Payload), "err2", err);
    });
  });
};
