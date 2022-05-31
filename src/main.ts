import * as core from '@actions/core';
import * as context from './context';
import * as upload from './upload';
import * as download from './download';
import * as bucket from './bucket';
import * as utils from './utils';

async function run() {
    const commonInputs = context.getCommonInputs();

    if (!utils.checkCommonInputs(commonInputs)) {
        return;
    }

    // 初始化OBS客户端
    const obs = context.getObsClient(
        commonInputs.accessKey,
        commonInputs.secretKey,
        `https://obs.${commonInputs.region}.myhuaweicloud.com`
    );

    const operationCategory = utils.getOperationCategory(context.getOperationType());

    // 对象操作
    if (operationCategory === 'object') {
        const inputs = context.getObjectInputs();

        if (!utils.checkObjectInputs(inputs)) {
            return;
        }

        // 若桶不存在，退出
        if (!(await bucket.hasBucket(obs, inputs.bucketName))) {
            core.setFailed(`The bucket: ${inputs.bucketName} does not exists.`);
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
            return;
        }

        const isBucketExist = await bucket.hasBucket(obs, inputs.bucketName);
        if (inputs.operationType.toLowerCase() === 'createbucket') {
            // 若桶已经存在，退出
            if (isBucketExist) {
                core.setFailed(`The bucket: ${inputs.bucketName} already exists.`);
                return;
            }
            bucket.createBucket(obs, inputs.bucketName, inputs.region, inputs.ACL ?? '', inputs.storageClass ?? '');
        }
        if (inputs.operationType.toLowerCase() === 'deletebucket') {
            // 若桶不存在，退出
            if (!isBucketExist) {
                core.setFailed(`The bucket: ${inputs.bucketName} does not exists.`);
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
