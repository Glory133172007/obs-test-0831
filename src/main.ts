import * as core from '@actions/core';
import * as context from './context';
import * as upload from './upload';
import * as download from './download';
import * as bucket from './bucket';
import * as utils from './utils';

async function run() {
    const inputs = context.getInputs();

    if (!utils.checkInputs(inputs)) {
        core.setFailed('input parameters is not correct.');
        return;
    }
    
    // 初始化OBS客户端
    const obs = context.getObsClient(inputs.access_key, inputs.secret_key, `https://obs.${inputs.region}.myhuaweicloud.com`);

    // 若桶不存在，退出
    if (!bucket.hasBucket(obs, inputs.bucket_name)) {
        core.setFailed('bucket not exist.');
        return;
    }

    // 执行上传/下载操作
    if (inputs.operation_type === 'upload') {
        await upload.uploadFileOrFolder(obs, inputs);
    } else if (inputs.operation_type === 'download') {
        await download.downloadFileOrFolder(obs, inputs);
    } else {
        core.info('operation type error, you should input "upload" or "download"');
    }
}

run();