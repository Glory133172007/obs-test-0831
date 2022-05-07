import * as fs from 'fs';
import * as path from 'path';
import * as utils from './utils';
import * as core from '@actions/core';
import { Inputs, UploadFileList } from './types';

/**
 * 上传文件/文件夹
 * @param obsClient  Obs客户端，因obsClient为引入的obs库的类型，本身并未导出其类型，故使用any，下同
 * @param inputs 用户输入的参数
 */
export async function uploadFileOrFolder(obsClient: any, inputs: Inputs): Promise<void> {
    for (const path of inputs.local_file_path) {
        const localFilePath = utils.getStringDelLastSlash(path); // 文件或者文件夹
        const localRoot = utils.getLastItemWithSlash(localFilePath);
        try {
            const fsStat = fs.lstatSync(localFilePath);
            if (fsStat.isFile()) {
                let obsFilePath = '';
                if (inputs.obs_file_path) {
                    if (utils.isEndWithSlash(inputs.obs_file_path)) {
                        obsFilePath = inputs.obs_file_path + localRoot;
                    } else {
                        // 若是多路径上传时的文件,不存在重命名,默认传至obs_file_path文件夹下
                        obsFilePath =
                            inputs.local_file_path.length > 1
                                ? `${inputs.obs_file_path}/${localRoot}`
                                : inputs.obs_file_path;
                    }
                } else {
                    // 若obs_file_path为空,上传所有对象至根目录
                    obsFilePath = localRoot;
                }

                await uploadFile(obsClient, inputs.bucket_name, localFilePath, obsFilePath);
            }

            if (fsStat.isDirectory()) {
                const localFileRootPath = inputs.include_self_folder
                    ? getObsRootFile(inputs.include_self_folder, inputs.obs_file_path, localRoot)
                    : getObsRootFile('', inputs.obs_file_path, localRoot);
                const uploadList = {
                    file: [],
                    folder: [],
                };
                await fileDisplay(obsClient, inputs, localFilePath, localFileRootPath, uploadList);

                // 若总文件数大于1000，取消上传
                const uploadListLength = uploadList.file.length + uploadList.folder.length;
                if (uploadListLength <= 1000) {
                    if (inputs.obs_file_path) {
                        await obsCreateRootFolder(
                            obsClient,
                            inputs.bucket_name,
                            utils.getStringDelLastSlash(inputs.obs_file_path)
                        );
                    }
                    await uploadFileAndFolder(obsClient, inputs.bucket_name, uploadList);
                } else {
                    core.setFailed(`local dirctory: '${path}' has ${uploadListLength} files and folders,`);
                    core.setFailed(`please upload a dirctory include less than 1000 files and folders.`);
                }
            }
        } catch (error) {
            core.setFailed(`read local file or dirctory: '${path}' failed.`);
        }
    }
}

/**
 * 得到待上传对象在obs的根路径
 * @param includeSelf 是否包含文件夹自身
 * @param obsfile 用户输入的obs_file_path
 * @param objectName 对象在本地的名称
 * @returns
 */
export function getObsRootFile(includeSelf: string, obsfile: string, objectName: string): string {
    if (utils.includeSelfFolderArray.includeItem.indexOf(includeSelf.toLowerCase()) > -1) {
        const obsFinalFilePath = obsfile ? utils.getStringDelLastSlash(obsfile) + '/' + objectName : objectName;
        return obsFinalFilePath;
    } else {
        return utils.getStringDelLastSlash(obsfile);
    }
}

/**
 * 读取文件夹, 统计待上传文件/文件夹路径
 * @param obsClient Obs客户端
 * @param inputs 用户输入的参数
 * @param localFilePath 本地路径
 * @param obsFileRootPath 要上传到obs的根路径
 * @param uploadList 待上传文件列表
 */
export async function fileDisplay(
    obsClient: any,
    inputs: Inputs,
    localFilePath: string,
    obsFileRootPath: string,
    uploadList: UploadFileList
): Promise<void> {
    const fslist = fs.readdirSync(localFilePath);
    if (fslist.length > 0) {
        for (const filename of fslist) {
            // 得到当前文件的绝对路径
            const filepath = path.join(localFilePath, filename);
            const info = fs.statSync(filepath);
            const obsFilePath = obsFileRootPath ? `${obsFileRootPath}/${filename}` : `${obsFileRootPath}${filename}`;

            if (info.isFile()) {
                uploadList.file.push({
                    local: utils.replaceSlash(filepath),
                    obs: obsFilePath,
                });
            }

            if (info.isDirectory()) {
                uploadList.folder.push(obsFilePath);
                await fileDisplay(obsClient, inputs, filepath, obsFilePath, uploadList);
            }
        }
    } else {
        // 是空文件夹
        if (uploadList.folder.indexOf(utils.getStringDelLastSlash(obsFileRootPath)) === -1) {
            uploadList.folder.push(utils.getStringDelLastSlash(obsFileRootPath));
        }
    }
}

/**
 * 上传文件和文件夹
 * @param obsClient Obs客户端
 * @param bucketName 桶名
 * @param uploadList 待上传对象列表
 */
async function uploadFileAndFolder(obsClient: any, bucketName: string, uploadList: UploadFileList): Promise<void> {
    for (const folder of uploadList.folder) {
        await uploadFolder(obsClient, bucketName, folder);
    }
    for (const file of uploadList.file) {
        await uploadFile(obsClient, bucketName, file.local, file.obs);
    }
}

/**
 * 上传文件
 * @param obsClient Obs客户端
 * @param bucketName 桶名
 * @param localFilePath 对象在本地的路径
 * @param obsFilePath 对象要上传到obs的路径
 * @returns
 */
export async function uploadFile(
    obsClient: any,
    bucketName: string,
    localFilePath: string,
    obsFilePath: string
): Promise<void> {
    if (utils.isFileOverSize(localFilePath)) {
        core.setFailed(`your local file '${localFilePath}' cannot be uploaded because it is larger than 5 GB`);
        return;
    }
    core.info(`upload file: ${localFilePath} to ${bucketName}/${obsFilePath}`);
    await obsClient.putObject({
        Bucket: bucketName,
        Key: obsFilePath,
        SourceFile: localFilePath,
    });
}

/**
 * 上传文件夹
 * 因obs无实际文件夹概念, 不需要本地路径, 只需目标路径即可
 * @param obsClient Obs客户端
 * @param bucketName 桶名
 * @param obsFilePath 对象要上传到obs的路径
 * @returns
 */
export async function uploadFolder(obsClient: any, bucketName: string, obsFilePath: string): Promise<void> {
    core.info(`create folder ${obsFilePath}/`);
    await obsClient.putObject({
        Bucket: bucketName,
        Key: obsFilePath + '/',
    });
}

/**
 * 在obs创建空文件夹
 * 上传时若指定一个obs上非已存在的路径, 则需要在obs上逐级建立文件夹
 * @param obsClient Obs客户端
 * @param bucketName 桶名
 * @param obsFilePath 对象要上传到obs的路径
 * @returns
 */
export async function obsCreateRootFolder(obsClient: any, bucketName: string, obsFile: string): Promise<void> {
    const obsPathList = obsFile.split('/');
    let obsPath = '';
    for (const path of obsPathList) {
        if (!path) {
            return;
        }
        obsPath += `${path}/`;
        core.info('create folder ' + obsPath);
        await obsClient.putObject({
            Bucket: bucketName,
            Key: obsPath,
        });
    }
}
