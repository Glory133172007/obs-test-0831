import * as core from '@actions/core';
import * as context from './context';
import * as upload from './upload';
import * as download from './download';
import * as bucket from './bucket';
import * as utils from './utils';

async function run() {

    // 对象操作
    if (utils.getOperationType(context.getOperationType()) === 'object') {
        const inputs = context.getObjectInputs();

        if (!utils.checkObjectInputs(inputs)) {
            core.setFailed('input parameters is not correct.');
            return;
        }

        // 初始化OBS客户端
        const obs = context.getObsClient(
            inputs.access_key,
            inputs.secret_key,
            `https://obs.${inputs.region}.myhuaweicloud.com`
        );

        // 若桶不存在，退出
        if (!(await bucket.hasBucket(obs, inputs.bucket_name))) {
            core.setFailed('bucket not exist.');
            return;
        }

        // 执行上传/下载操作
        if (inputs.operation_type === 'upload') {
            await upload.uploadFileOrFolder(obs, inputs);
        } else if (inputs.operation_type === 'download') {
            await download.downloadFileOrFolder(obs, inputs);
        } else {
            core.setFailed('operation type error, you should input "upload" or "download"');
        }
    } else if (utils.getOperationType(context.getOperationType()) === 'bucket') {
        const inputs = context.getBucketInputs();

        // 检查桶输入
        if (!utils.checkBucketInputs(inputs)) {
            core.setFailed('input parameters is not correct.');
            return;
        }

        // 初始化OBS客户端
        const obs = context.getObsClient(
            inputs.access_key,
            inputs.secret_key,
            `https://obs.${inputs.location}.myhuaweicloud.com`
        );

        const isBucketExist = await bucket.hasBucket(obs, inputs.bucket_name);
        if (inputs.operation_type.toLowerCase() === 'createbucket') {
            // 若桶已经存在，退出
            if (isBucketExist) {
                core.setFailed('bucket already exist.');
                return;
            }
            await bucket.createBucket(obs, inputs.bucket_name, inputs.location, inputs.ACL, inputs.storage_class);
        } else if (inputs.operation_type.toLowerCase() === 'deletebucket') {
            // 若桶不存在，退出
            if (!isBucketExist) {
                core.setFailed('bucket not exist.');
                return;
            }
            const isEmpty = await bucket.isBucketEmpty(obs, inputs.bucket_name);
            if (!isEmpty && !inputs.clear_bucket) {
                core.setFailed(
                    'please clear all objects and parts in the bucket before delete it, you can set "clear_bucket" as true to allow us clear the bucket.'
                );
                return;
            }
            await bucket.deleteBucket(obs, inputs.bucket_name, isEmpty);
        } else {
            core.setFailed('operation type error, you should input "createBucket" or "deleteBucket"');
            return;
        }
    } else {
        core.setFailed(`please check your operation_type.`);
    }
}

run();
