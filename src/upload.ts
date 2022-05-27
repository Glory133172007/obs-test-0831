import * as fs from 'fs';
import * as path from 'path';
import * as utils from './utils';
import * as core from '@actions/core';
import { ObjectInputs, UploadFileList } from './types';

/**
 * 上传文件/文件夹
 * @param obsClient  Obs客户端，因obsClient为引入的obs库的类型，本身并未导出其类型，故使用any，下同
 * @param inputs 用户输入的参数
 */
export async function uploadFileOrFolder(obsClient: any, inputs: ObjectInputs): Promise<void> {
    for (const path of inputs.localFilePath) {
        const localFilePath = utils.getStringDelLastSlash(path); // 文件或者文件夹
        const localRoot = utils.getLastItemWithSlash(localFilePath);
        try {
            const fsStat = fs.lstatSync(localFilePath);
            if (fsStat.isFile()) {
                let obsFilePath = '';
                if (inputs.obsFilePath) {
                    if (utils.isEndWithSlash(inputs.obsFilePath)) {
                        obsFilePath = inputs.obsFilePath + localRoot;
                    } else {
                        // 若是多路径上传时的文件,不存在重命名,默认传至obs_file_path文件夹下
                        obsFilePath =
                            inputs.localFilePath.length > 1 ? `${inputs.obsFilePath}/${localRoot}` : inputs.obsFilePath;
                    }
                } else {
                    // 若obs_file_path为空,上传所有对象至根目录
                    obsFilePath = localRoot;
                }

                await uploadFile(obsClient, inputs.bucketName, localFilePath, obsFilePath);
            }

            if (fsStat.isDirectory()) {
                const localFileRootPath = getObsRootFile(!!inputs.includeSelfFolder, inputs.obsFilePath, localRoot);
                const uploadList = {
                    file: [],
                    folder: [],
                };
                await fileDisplay(obsClient, inputs, localFilePath, localFileRootPath, uploadList);

                // 若总文件数大于1000，取消上传
                const uploadListLength = uploadList.file.length + uploadList.folder.length;
                if (uploadListLength <= 1000) {
                    if (inputs.obsFilePath) {
                        await obsCreateRootFolder(
                            obsClient,
                            inputs.bucketName,
                            utils.getStringDelLastSlash(inputs.obsFilePath)
                        );
                    }
                    await uploadFileAndFolder(obsClient, inputs.bucketName, uploadList);
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
export function getObsRootFile(includeSelf: boolean, obsfile: string, objectName: string): string {
    if (includeSelf) {
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
    inputs: ObjectInputs,
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

/**
 * 分段上传
 * @param obs obs客户端
 * @param bucketName 桶名
 * @param objKey 上传对象在obs上的名称
 * @param filePath 上传对象的本地路径
 */
export async function multipartUpload(obs: any, bucketName: string, objKey: string, filePath: string): Promise<void> {
    const uploadId = await initMultipartUpload(obs, bucketName, objKey);
    if (uploadId) {
        const parts = await uploadParts(obs, bucketName, objKey, uploadId, filePath);
        if (parts.length > 0) {
            await mergeParts(obs, bucketName, objKey, uploadId, parts);
        }
    }
}

/**
 * 初始化分段上传任务
 * @param obs obs客户端
 * @param bucketName 桶名
 * @param objKey 上传对象在obs上的名称
 * @returns
 */
export async function initMultipartUpload(obs: any, bucketName: string, objKey: string): Promise<string> {
    const result = await obs.initiateMultipartUpload({
        Bucket: bucketName,
        Key: objKey,
    });

    if (result.CommonMsg.Status < 300) {
        core.info('init multipart upload successfully.');
        return result.InterfaceResult.UploadId;
    } else {
        core.info('init multipart upload failed.');
        return '';
    }
}

/**
 * 上传分段
 * @param obs obs客户端
 * @param bucketName 桶名
 * @param objKey 上传对象在obs上的名称
 * @param uploadId 分段上传任务的uploadid
 * @param filePath 上传对象的本地路径
 * @returns
 */
export async function uploadParts(
    obs: any,
    bucketName: string,
    objKey: string,
    uploadId: string,
    filePath: string
): Promise<{ PartNumber: number; ETag: any }[]> {
    const partSize = utils.PART_MAX_SIZE;

    const fileLength = fs.lstatSync(filePath).size;
    const partCount =
        fileLength % partSize === 0 ? Math.floor(fileLength / partSize) : Math.floor(fileLength / partSize) + 1;

    core.info(`total parts count ${partCount}.`);

    const parts: { PartNumber: number; ETag: any }[] = [];

    core.info('Begin to upload multiparts to OBS from a file');
    for (let i = 0; i < partCount; i++) {
        const offset = i * partSize;
        const currPartSize = i + 1 === partCount ? fileLength - offset : partSize;
        const partNumber = i + 1;

        const result = await obs.uploadPart({
            Bucket: bucketName,
            Key: objKey,
            PartNumber: partNumber,
            UploadId: uploadId,
            SourceFile: filePath,
            Offset: offset,
            PartSize: currPartSize,
        });
        if (result.CommonMsg.Status < 300) {
            parts.push({
                PartNumber: partNumber,
                ETag: result.InterfaceResult.ETag,
            });
        } else {
            throw new Error(result.CommonMsg.Code);
        }
    }

    if (parts.length === partCount) {
        // Sort parts order by partNumber asc
        const _parts = parts.sort((a, b) => {
            if (a.PartNumber >= b.PartNumber) {
                return 1;
            }
            return -1;
        });
        return _parts;
    }
    return parts;
}

/**
 * 合并分段
 * @param obs obs客户端
 * @param bucketName 桶名
 * @param objKey 上传对象在obs上的名称
 * @param uploadId 分段上传任务的uploadid
 * @param parts 分段上传任务的分段信息
 * @returns
 */
export async function mergeParts(
    obs: any,
    bucketName: string,
    objKey: string,
    uploadId: string,
    parts: any[]
): Promise<boolean> {
    const result = await obs.completeMultipartUpload({
        Bucket: bucketName,
        Key: objKey,
        UploadId: uploadId,
        Parts: parts,
    });

    if (result.CommonMsg.Status < 300) {
        core.info('Complete to upload multiparts finished.');
        return true;
    } else {
        core.info(result.CommonMsg.Code);
        return false;
    }
}
