import * as core from '@actions/core';
import { Inputs } from './types';

export function getInputs(): Inputs {
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
        include_self_folder: core.getInput('include_self_folder', {
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