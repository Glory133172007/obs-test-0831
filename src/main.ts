import * as core from '@actions/core';
import * as context from './context';
import * as upload from './upload';
import * as download from './download';
import * as bucket from './bucket';
import * as utils from './utils';

async function run() {
    const operationCategory = utils.getOperationCategory(context.getOperationType());

    // 对象操作
    if (operationCategory === 'object') {
        const inputs = context.getObjectInputs();

        if (!utils.checkObjectInputs(inputs)) {
            core.setFailed('input parameters is not correct.');
            return;
        }

        // 初始化OBS客户端
        const obs = context.getObsClient(
            inputs.accessKey,
            inputs.secretKey,
            `https://obs.${inputs.region}.myhuaweicloud.com`
        );

        // 若桶不存在，退出
        if (!(await bucket.hasBucket(obs, inputs.bucketName))) {
            core.setFailed('bucket not exist.');
            return;
        }

        // 执行上传/下载操作
        if (inputs.operationType === 'upload') {
            await upload.uploadFileOrFolder(obs, inputs);
        }

        if (inputs.operationType === 'download') {
            await download.downloadFileOrFolder(obs, inputs);
        }
    } else if (operationCategory === 'bucket') {
        const inputs = context.getBucketInputs();

        // 检查桶输入
        if (!utils.checkBucketInputs(inputs)) {
            core.setFailed('input parameters is not correct.');
            return;
        }

        // 初始化OBS客户端
        const obs = context.getObsClient(
            inputs.accessKey,
            inputs.secretKey,
            `https://obs.${inputs.region}.myhuaweicloud.com`
        );

        const isBucketExist = await bucket.hasBucket(obs, inputs.bucketName);
        if (inputs.operationType.toLowerCase() === 'createbucket') {
            // 若桶已经存在，退出
            if (isBucketExist) {
                core.setFailed(`The bucket: ${inputs.bucketName} already exists.`);
                return;
            }
            await bucket.createBucket(
                obs,
                inputs.bucketName,
                inputs.region,
                inputs.ACL ?? '',
                inputs.storageClass ?? ''
            );
        }
        if (inputs.operationType.toLowerCase() === 'deletebucket') {
            // 若桶不存在，退出
            if (!isBucketExist) {
                core.setFailed(`The bucket: ${inputs.bucketName} not exists.`);
                return;
            }
            const isEmpty = await bucket.isBucketEmpty(obs, inputs.bucketName);
            if (!isEmpty && inputs.clearBucket === false) {
                core.setFailed(
                    'some object or parts already exist in bucket, please delete them first or not set parameter "clear_bucket" as false.'
                );
                return;
            }
            await bucket.deleteBucket(obs, inputs.bucketName, isEmpty);
        }
    } else {
        core.setFailed(`please check your operation_type.`);
    }
}

run();
