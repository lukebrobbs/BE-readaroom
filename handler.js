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
exports.ReadS3Bucket = (event, context, callback) => {
  const rekognition = new AWS.Rekognition();
  const sns = new AWS.SNS();

  const params = {
    Video: { S3Object: { Bucket: "kinesisvideo", Name: "video-0" } },
    FaceAttributes: "ALL",
    NotificationChannel: {
      SNSTopicArn: "arn:aws:sns:eu-west-1:015176863114:Rekognition",
      RoleArn: "arn:aws:iam::015176863114:role/RekognitionKinesis"
    }
  };
  rekognition.startFaceDetection(params, (err, data) => {
    if (err) console.log(err);
    console.log(data);
    sns.getTopicAttributes(
      { TopicArn: "arn:aws:sns:eu-west-1:015176863114:Rekognition" },
      (err, data) => {
        if (err) console.log(err);
        else console.log(data);
      }
    );
    // rekognition.getFaceDetection(data, (err, data) => {
    //   if (err) console.log(err);
    //   else if (data.JobStatus === "SUCCEEDED") {
    //     console.log(data);
    //   }
    // });
  });
};
exports.ReadVideoStream = (event, context, callback) => {
  // const kinesisVideoMedia = new AWS.KinesisVideoMedia({apiVersion: '2017-09-30'});
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
    if (err) console.log(err);
    var dep = data.DataEndpoint;
    var ep = new AWS.Endpoint(dep);
    // const kinesisVideoMedia = new AWS.KinesisVideoMedia({
    //   endpoint: ep
    // });
    // console.log(`endpoint: ${kinesisVideoMedia.endpoint.hostname}`);
    const kinesisVideoArchivedMedia = new AWS.KinesisVideoArchivedMedia({
      endpoint: ep
    });
    const listFragmentParams = {
      StreamName: "readaroom",
      FragmentSelector: {
        FragmentSelectorType: "SERVER_TIMESTAMP",
        TimestampRange: {
          EndTimestamp: new Date(Date.now()),
          StartTimestamp: new Date(Date.now()) - 5000
        }
      }
    };
    kinesisVideoArchivedMedia.listFragments(listFragmentParams, (err, data) => {
      if (err) console.log(err);
      else console.log("data", data);
    });

    // kinesisVideoMedia.getMedia(params, (err, data) => {
    //   if (err) console.log(err);
    //   console.log(data.Payload);
    //   console.log(data);
    // });
  });
};
