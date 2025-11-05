import AWS from 'aws-sdk';
import conf from '../config/storage';

const s3 = new AWS.S3({
    accessKeyId: conf.s3.key,
    secretAccessKey: conf.s3.secret,
    region: conf.s3.region,
    params: {
        Bucket: conf.s3.bucket,
    },
});

type Callback = (err: AWS.AWSError, data: AWS.S3.PutObjectOutput | AWS.S3.DeleteObjectOutput) => void;

export default {
    url(file: string): string {
        return `${conf.url}/${file}`;
    },

    write(file: string, content: string | Buffer, callback: Callback): void {
        const params: AWS.S3.PutObjectRequest = {
            Key: file,
            Bucket: conf.s3.bucket!,
            Body: content,
        };
        s3.putObject(params, callback);
    },

    remove(file: string, callback: Callback): void {
        const params: AWS.S3.DeleteObjectRequest = {
            Key: file,
            Bucket: conf.s3.bucket!,
        };
        s3.deleteObject(params, callback);
    },
}
