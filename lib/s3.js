import AWS from 'aws-sdk';

const s3 = new AWS.S3();
const BUCKET_NAME = 'wnote';

export {s3, BUCKET_NAME};