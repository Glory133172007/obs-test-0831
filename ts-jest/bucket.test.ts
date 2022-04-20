import { expect, test } from '@jest/globals';
import * as context from '../src/context';
import * as bucket from '../src/bucket'
    
const inputs = context.getInputsForTest();
const ObsClient = require('esdk-obs-nodejs');
const obs = new ObsClient({
    access_key_id: inputs.accessKey,       
    secret_access_key: inputs.secretKey,       
    server : `https://obs.${inputs.region}.myhuaweicloud.com`,
});

test('check bucket exist in bucket', () => {
    bucket.hasBucket(obs, inputs.bucketName).then((res) => {
        expect(res).toEqual(true);
    });
})