import * as core from '@actions/core';
import * as context from './context';
import * as upload from './upload';
import * as download from './download';
import * as bucket from './bucket';
import * as utils from './utils';

async function run() {
    const inputs = context.getInputs();

    // 如果参数输入有问题，终止操作
    if (!utils.checkInputs(inputs)) {
        core.setFailed('input parameters is not correct.');
        return;
    }
    
    // 初始化OBS客户端
    const ObsClient = require('esdk-obs-nodejs');
    const obs = new ObsClient({
        access_key_id: inputs.accessKey,       
        secret_access_key: inputs.secretKey,       
        server : `https://obs.${inputs.region}.myhuaweicloud.com`,
    });

    process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = '1';

    // 若桶不存在，退出请求
    if (!bucket.hasBucket(obs, inputs.bucketName)) {
        core.info('bucket not exist.')
        return;
    }

    // 执行上传/下载操作
    if (inputs.operationType === 'upload') {
        await upload.startUpload(obs, inputs);
    } else if (inputs.operationType === 'download') {
        await download.startDownload(obs, inputs);
    } else {
        core.info('operation type error, you should input "upload" or "download"');
    }
}

run();