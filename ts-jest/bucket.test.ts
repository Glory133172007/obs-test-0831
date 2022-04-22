import { expect, test } from '@jest/globals';
import * as bucket from '../src/bucket'
    
const inputs = {
    access_key: '******',
    secret_key: '******',
    bucket_name: '******',
    operation_type: 'download',
    obs_file_path: 'uploadDir/file2.txt',
    local_file_path: ['resource/downloadDir/d4/file2rename.txt'],
    region: 'cn-north-6',
};

const ObsClient = require('esdk-obs-nodejs');
const obs = new ObsClient({
    access_key_id: inputs.access_key,       
    secret_key: inputs.secret_key,       
    server : `https://obs.${inputs.region}.myhuaweicloud.com`,
});

test('check bucket exist in bucket', () => {
    bucket.hasBucket(obs, inputs.bucket_name).then((res) => {
        expect(res).toEqual(true);
    });
})