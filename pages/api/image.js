// import withPassport from '../../../lib/withPassport';
// import formidable from 'formidable';
// import { v4 as uuidv4 } from 'uuid';
// import {responseError, responseSuccess} from '../util';
// import fs from 'fs';
// import path from 'path';
// import {s3, BUCKET_NAME} from '../../../lib/s3';

// async function getImage(Key) {
//     const data =  s3.getObject(
//         {
//           Bucket: BUCKET_NAME,
//           Key: Key,
//         }
      
//     ).promise();
//     return data;
// }

//   export default withPassport((req, res) => {
//     if (req.method === 'POST') {
//         try {
//             const form = formidable({ multiples: true });
//             form.parse(req, (err, fields, files) => {
//                 console.log('field:', fields, files, files.image.name);
//                 let ext = path.extname(files.image.name);
//                 let filename = uuidv4() + ext;
//                 uploadToS3(files.image, filename, function (error, data) {
//                     if (error) {
//                         console.log(error);
//                         responseError(error);
//                     } 
//                     else if (data) {
//                         responseSuccess(res, {uri: data.Location});
//                     } 
//                     else {
//                         responseError(res, {messages: "Yikes! Error saving your photo. Please try again."});
//                     }
//                 });
//             });
        
        
//         } catch (e) {
//             responseError(res, 'dont have note latest');
//         }
//     }
// });