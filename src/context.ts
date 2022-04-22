import * as core from '@actions/core';
import { Inputs } from './interface';

export function getInputs(): Inputs {
    return {
        access_key: core.getInput('access_key', { required: true }),
        secret_key: core.getInput('secretKey', { required: true }),
        bucket_name: core.getInput('bucketName', { required: true }),
        operation_type: core.getInput('operationType', { required: true }),
        local_file_path: core.getMultilineInput('localFilePath', {
            required: true,
        }),
        obs_file_path: core.getInput('obsFilePath', { required: true }),
        region: core.getInput('region', { required: true }),
        include_self_folder: core.getInput('includeSelfFolder', {
            required: false,
        }),
        exclude: core.getMultilineInput('exclude', { required: false }),
    };
}

/**
 * 根据ak/sk，初始化Obs客户端
 * @param ak AK
 * @param sk SK
 * @param server 连接OBS的服务地址
 * @returns obsClient为引入的obs库的类型，本身并未导出其类型，故使用any
 */
export function getObsClient(ak: string, sk: string, server: string): any {
    const ObsClient = require('esdk-obs-nodejs'); // eslint-disable-line @typescript-eslint/no-var-requires
    try {
        const obs = new ObsClient({
            access_key_id: ak,
            secret_access_key: sk,
            server: server,
        });
        return obs;
    } catch (error) {
        core.setFailed('init obs client fail.');
    }
}
