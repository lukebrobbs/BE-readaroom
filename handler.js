"use strict";
const AWS = require("aws-sdk");
const admin = require("firebase-admin");
const { privateKey, authDomain, projectId, clientEmail } = process.env;

admin.initializeApp({
  credential: admin.credential.cert({
    projectId,
    clientEmail,
    privateKey: `-----BEGIN PRIVATE KEY-----\n${privateKey}\n-----END PRIVATE KEY-----\n`.replace(
      /\\n/g,
      "\n"
    )
  }),
  databaseURL: authDomain
});

const db = admin.firestore();

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
    JobTag: "readaroom",
    NotificationChannel: {
      SNSTopicArn: "arn:aws:sns:eu-west-1:015176863114:Rekognition",
      RoleArn: "arn:aws:iam::015176863114:role/RekognitionKinesis"
    }
  };
  rekognition.startFaceDetection(params, (err, data) => {
    if (err) console.log(err);
    console.log(data);
  });
  callback(null, "Success");
};

exports.SNSTriggerListener = (event, context) => {
  console.log(JSON.stringify(event));
  const message = event.Records[0].Sns.Message;
  const parsedMessage = JSON.parse(message);
  const ourJobId = parsedMessage.JobId;
  const params = { JobId: ourJobId };
  const rekognition = new AWS.Rekognition();
  const dbref = db.collection("readaroom").doc("currentData");

  rekognition.getFaceDetection(params, (err, data) => {
    const reducedEmotionData = data.Faces.reduce((acc, curr) => {
      acc.push({
        emotions: curr.Face.Emotions,
        smile: curr.Face.Smile.Confidence > 70 ? curr.Face.Smile.Value : null,
        gender: curr.Face.Gender.Value,
        ageGroup: (curr.Face.AgeRange.Low + curr.Face.AgeRange.High) / 2
      });
      return acc;
    }, []);
    const fireStoreData = {
      timestamp: parsedMessage.Timestamp,
      emotiondata: reducedEmotionData
    };
    if (err) console.log(err);
    console.log(JSON.stringify(data));
    dbref.set(fireStoreData);
  });
};

// exports.ReadVideoStream = (event, context, callback) => {
//   const kinesisVideo = new AWS.KinesisVideo();

//   const params = {
//     StartSelector: { StartSelectorType: 'NOW' },
//     StreamARN:
//       'arn:aws:kinesisvideo:eu-west-1:015176863114:stream/readaroom/1524213524123'
//   };

//   const kinesisVidParams = {
//     APIName: 'GET_MEDIA',
//     StreamARN:
//       'arn:aws:kinesisvideo:eu-west-1:015176863114:stream/readaroom/1524213524123'
//   };

// kinesisVideo.getDataEndpoint(kinesisVidParams, (err, data) => {
//   if (err) console.log(err);
//   var dep = data.DataEndpoint;
//   var ep = new AWS.Endpoint(dep);
//   const kinesisVideoArchivedMedia = new AWS.KinesisVideoArchivedMedia({
//     endpoint: ep
//   });
//   const listFragmentParams = {
//     StreamName: 'readaroom',
//     FragmentSelector: {
//       FragmentSelectorType: 'SERVER_TIMESTAMP',
//       TimestampRange: {
//         EndTimestamp: new Date(Date.now()),
//         StartTimestamp: new Date(Date.now()) - 5000
//       }
//     }
//   };
//   kinesisVideoArchivedMedia.listFragments(listFragmentParams, (err, data) => {
//     if (err) console.log(err);
//     else console.log('data', data);
//   });
// });
// };
