import withPassport from '../../../lib/withPassport';
import formidable from 'formidable';
import { v4 as uuidv4 } from 'uuid';
import {responseError, responseSuccess} from '../util';
import fs from 'fs';
import path from 'path';
import {s3, BUCKET_NAME} from '../../../lib/s3';

function deleteFile(filePath) {
    fs.unlink(filePath, function (err) {
      if (err) {
        console.error(err);
      }
      console.log('Temp File Delete');
    });
}
  
function uploadToS3(file, destFileName, callback) {
    let uploadParams = {Bucket: BUCKET_NAME, Key: destFileName, Body: ''};
    let fileStream = fs.createReadStream(file.path);
    fileStream.on('error', function(err) {
      console.log('File Error', err);
    });
    
    uploadParams.Body = fileStream;
    deleteFile(file.path);
    s3.upload(uploadParams, callback);
}

function uploadToLocal(file, destFileName, callback) {
    var oldpath = file.path;
    var newpath = 'public/upload/' + destFileName;
    fs.rename(oldpath, newpath, function (err) {
        if (err) {callback(true, err)};
        callback(false, '/upload/' + destFileName);
    });
}

// first we need to disable the default body parser
export const config = {
    api: {
        bodyParser: false,
    },
}

export default withPassport((req, res) => {
    if (req.method === 'POST') {
        try {
            const form = formidable({ multiples: true });
            form.parse(req, (err, fields, files) => {
                let ext = path.extname(files.image.name);
                let filename = 'images/' + uuidv4() + ext;
                if (process.env.DRIVE_UPLOAD == 's3') {
                    uploadToS3(files.image, filename, function (error, data) {
                        if (error) {
                            console.log(error);
                            responseError(error);
                        } else if (data) {
                            responseSuccess(res, {uri: data.Location});
                        } else {
                            responseError(res, {messages: "Yikes! Error saving your photo. Please try again."});
                        }
                    });
                } else if (process.env.DRIVE_UPLOAD == 'local') {
                    uploadToLocal(files.image, filename, function (error, data) {
                        console.log('uploadToLocal:', error, data);
                        if (error) {
                            console.log(data);
                            responseError(res, data);
                        } else if (data) {
                            responseSuccess(res, {uri: data});
                        } else {
                            responseError(res, {messages: "Yikes! Error saving your photo. Please try again."});
                        }
                    });
                }
            });
        } catch (e) {
            responseError(res, 'dont have note latest');
        }
    }
});
  