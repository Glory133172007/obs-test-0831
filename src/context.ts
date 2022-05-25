import * as core from '@actions/core';
import { ObjectInputs, BucketInputs } from './types';

export function getOperationType(): string {
    return core.getInput('operation_type', { required: true });
}

export function getObjectInputs(): ObjectInputs {
    return {
        access_key: core.getInput('access_key', { required: true }),
        secret_key: core.getInput('secret_key', { required: true }),
        bucket_name: core.getInput('bucket_name', { required: true }),
        operation_type: core.getInput('operation_type', { required: true }),
        local_file_path: core.getMultilineInput('local_file_path', {
            required: true,
        }),
        obs_file_path: core.getInput('obs_file_path', { required: true }),
        region: core.getInput('region', { required: true }),
        include_self_folder: core.getBooleanInput('include_self_folder', {
            required: false,
        }),
        exclude: core.getMultilineInput('exclude', { required: false }),
    };
}

export function getBucketInputs(): BucketInputs {
    return {
        access_key: core.getInput('access_key', { required: true }),
        secret_key: core.getInput('secret_key', { required: true }),
        operation_type: core.getInput('operation_type', { required: true }),
        bucket_name: core.getInput('bucket_name', { required: true }),
        region: core.getInput('region', { required: true }),
        ACL: core.getInput('ACL', { required: false }),
        storage_class: core.getInput('storage_class', { required: false }),
        clear_bucket: core.getBooleanInput('clear_bucket', { required: false }),
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
