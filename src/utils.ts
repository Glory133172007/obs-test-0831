import * as fs from 'fs';
import * as core from '@actions/core';
import { Inputs } from './interface';

/**
 * 目前支持obs功能的region列表
 * LA-Santiago	la-south-2
 * 非洲-约翰内斯堡	af-south-1
 * 华北-北京四	cn-north-4
 * 华北-北京一	cn-north-1
 * 华东-上海二	cn-east-2
 * 华东-上海一	cn-east-3
 * 华南-广州	cn-south-1
 * 拉美-墨西哥城二	la-north-2
 * 拉美-墨西哥城一	na-mexico-1
 * 拉美-圣保罗一	sa-brazil-1
 * 亚太-曼谷	ap-southeast-2
 * 亚太-新加坡	ap-southeast-3
 * 中国-香港	ap-southeast-1
 */
const regionArray = [
    'la-south-2',
    'af-south-1',
    'cn-north-4',
    'cn-north-1',
    'cn-east-2',
    'cn-east-3',
    'cn-south-1',
    'la-north-2',
    'na-mexico-1',
    'sa-brazil-1',
    'ap-southeast-2',
    'ap-southeast-3',
    'ap-southeast-1',
];

const FILE_MAX_SIZE = 5 * 1024 * 1024 * 1024;

export const includeSelfFolderArray = {
    includeItem: ['y', 'yes', 'true'],
    excludeItem: ['n', 'no', 'false'],
};

// 检查aksk是否合法
export function checkAkSk(inputs: Inputs): boolean {
    const akReg = new RegExp('^[a-zA-Z0-9]{10,30}$');
    const skReg = new RegExp('^[a-zA-Z0-9]{30,50}$');
    return akReg.test(inputs.access_key) && skReg.test(inputs.secret_key);
}

// 检查region是否合法
export function checkRegion(region: string): boolean {
    return regionArray.includes(region);
}

// 检查operation_type参数是否合法
export function checkOperationType(operation_type: string): boolean {
    return operation_type.toLowerCase() === 'upload' || operation_type.toLowerCase() === 'download';
}

// 检查上传时的input_file_path和obs_file_path是否合法
export function checkUploadFilePath(inputs: Inputs): boolean {
    if (inputs.local_file_path.length === 0) {
        core.setFailed('please input localFilePath.');
        return false;
    }
    for (const path of inputs.local_file_path) {
        if (path === '') {
            core.setFailed('you should not input a empty string as local_file_path.');
            return false;
        }
        if (!fs.existsSync(path)) {
            core.setFailed(`local file or dirctory: '${path}' not exist, please check your input path.`);
            return false;
        }
    }
    return true;
}

// 检查下载时的input_file_path和obs_file_path是否合法
export function checkDownloadFilePath(inputs: Inputs): boolean {
    if (inputs.local_file_path.length !== 1) {
        core.setFailed('you should input one local_file_path.');
        return false;
    }
    if (inputs.local_file_path[0] === '') {
        core.setFailed('you should not input a empty string as local_file_path.');
        return false;
    }
    if (!inputs.obs_file_path) {
        core.setFailed('you should input one obs_file_path.');
        return false;
    }
    return true;
}

// 检查includeSelfFolder参数是否合法
export function checkIncludeSelfFolder(input: string): boolean {
    return (
        includeSelfFolderArray.includeItem.indexOf(input.toLowerCase()) > -1 ||
        includeSelfFolderArray.excludeItem.indexOf(input.toLowerCase()) > -1
    );
}

// 检查输入的各参数是否正常
export function checkInputs(inputs: Inputs): boolean {
    if (!checkAkSk(inputs)) {
        core.setFailed('ak or sk is not correct.');
        return false;
    }
    if (!checkRegion(inputs.region)) {
        core.setFailed('region is not correct.');
        return false;
    }
    if (!checkOperationType(inputs.operation_type)) {
        core.setFailed('operation_type is not correct, you should input "upload" or "download".');
        return false;
    }
    const checkFilePath =
        inputs.operation_type.toLowerCase() === 'upload' ? checkUploadFilePath(inputs) : checkDownloadFilePath(inputs);
    if (!checkFilePath) {
        return false;
    }
    if (inputs?.include_self_folder) {
        if (!checkIncludeSelfFolder(inputs.include_self_folder)) {
            core.setFailed(
                'include_self_folder is not legal, you should input y(Y)/n(N)/yes(YES)/no(NO)/true(TRUE)/false(FALSE).'
            );
            return false;
        }
    }
    return true;
}

// 替换路径中的'\'为'/'
export function replaceSlash(dir: string): string {
    return dir.replace(/\\/g, '/');
}

// 从文件路径中获取到最后一个'/'后的名称
export function getLastItemWithSlash(path: string): string {
    if (path.indexOf('/') === -1) {
        return path;
    }
    const pathArray = path.split('/');
    return pathArray[pathArray.length - 1];
}

// 获得以rootPath开头， 并删除rootPath的path
export function getPathWithoutRootPath(rootPath: string, path: string): string {
    try {
        const aimPath = path.match(`^${rootPath}`);
        if (aimPath) {
            return path.replace(aimPath[0], '');
        } else {
            return path;
        }
    } catch (error) {
        core.info('rootPath not start with path.');
        return path;
    }
}

// 创建文件夹
export function createFolder(path: string): void {
    if (!fs.existsSync(path)) {
        core.info('create folder: ' + path);
        fs.mkdirSync(path);
    }
}

// 判断路径是否以'/'结尾
export function isEndWithSlash(path: string): boolean {
    try {
        return path.slice(-1) === '/';
    } catch (error) {
        return false;
    }
}

// 删除字符串末尾的字符'/'
export function getStringDelLastSlash(str: string): string {
    if (str) {
        return isEndWithSlash(str) ? str.substring(0, str.length - 1) : str;
    }
    return str;
}

// 检查文件是否超过5GB
export function isFileOverSize(filepath: string): boolean {
    return fs.lstatSync(filepath).size > FILE_MAX_SIZE;
}

// 本地是否存在同名文件夹
export function isExistSameNameFolder(localPath: string): boolean {
    return fs.existsSync(localPath) && fs.statSync(localPath).isDirectory();
}

// 本地是否存在同名文件
export function isExistSameNameFile(localPath: string): boolean {
    return fs.existsSync(getStringDelLastSlash(localPath)) && fs.statSync(getStringDelLastSlash(localPath)).isFile();
}
