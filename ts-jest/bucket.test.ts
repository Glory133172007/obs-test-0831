import { expect, test } from '@jest/globals';
import * as bucket from '../src/bucket';

// --------------- base ----------------
const inputs = {
    access_key: '******',
    secret_key: '******',
    bucket_name: '******',
    region: 'cn-north-6',
    operation_type: 'deleteBucket',
    clear_bucket: false
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
});

test('check get all objects in bucket', async () => {
    expect((await bucket.getAllObjects(obs, inputs.bucket_name)).length).toEqual(3073);
    expect((await bucket.getAllObjects(obs, inputs.bucket_name, 'over2000/spring-boot-autoconfigure')).length).toEqual(1536);
});

test('check is bucket empty', async () => {
    expect(await bucket.isBucketEmpty(obs, inputs.bucket_name)).toBeFalsy();
});

test('check get bucket version status', async () => {
    expect(await bucket.getBucketVersioning(obs, inputs.bucket_name)).toEqual('Suspended');
});

test('check delete objects in the bucket', async () => {
    await bucket.deleteAllObjects(obs, inputs.bucket_name);
    expect(await bucket.isBucketEmpty(obs, inputs.bucket_name)).toBeTruthy(); 
});
