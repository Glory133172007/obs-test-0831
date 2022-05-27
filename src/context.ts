import * as core from '@actions/core';
import { ObjectInputs, BucketInputs } from './types';

export function getOperationType(): string {
    return core.getInput('operation_type', { required: true });
}

export function getObjectInputs(): ObjectInputs {
    return {
        accessKey: core.getInput('access_key', { required: true }),
        secretKey: core.getInput('secret_key', { required: true }),
        operationType: core.getInput('operation_type', { required: true }),
        bucketName: core.getInput('bucket_name', { required: true }),
        region: core.getInput('region', { required: true }),
        localFilePath: core.getMultilineInput('local_file_path', { required: false }),
        obsFilePath: core.getInput('obs_file_path', { required: false }),
        includeSelfFolder: core.getBooleanInput('include_self_folder', { required: false }) ?? false,
        exclude: core.getMultilineInput('exclude', { required: false }),
    };
}

export function getBucketInputs(): BucketInputs {
    return {
        accessKey: core.getInput('access_key', { required: true }),
        secretKey: core.getInput('secret_key', { required: true }),
        operationType: core.getInput('operation_type', { required: true }),
        bucketName: core.getInput('bucket_name', { required: true }),
        region: core.getInput('region', { required: true }),
        ACL: core.getInput('ACL', { required: false }),
        storageClass: core.getInput('storage_class', { required: false }),
        clearBucket: core.getBooleanInput('clear_bucket', { required: false }) ?? true,
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
