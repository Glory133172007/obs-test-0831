import * as fs from 'fs';
import * as path from 'path';
import * as core from '@actions/core'
import * as utils from './utils';
import { Inputs, UploadFileList } from './interface';

// obsClient为引入的OBS库的OBS客户端类型，本身并未导出其类型，故使用any，下同
// 判断是上传文件，还是上传文件夹
export async function startUpload(obsClient: any, inputs: Inputs): Promise<void> {
    
    if (inputs.localFilePath.length === 0) {
        core.info('please input localFilePath');
        return;
    }
    for (const localFilePathItem of inputs.localFilePath) {
        const localFilePath = utils.getStringDelLastSlash(localFilePathItem);  // 文件或者文件夹
        const localRoot = utils.getLastItemWithSlash(utils.getStringDelLastSlash(localFilePath));
        try {
            const fsStat = fs.lstatSync(localFilePath);
            // 上传文件
            if (fsStat.isFile()) {
                let obsFilePath = '';
                if (inputs.obsFilePath) {
                    obsFilePath = utils.isEndWithSlash(inputs.obsFilePath) 
                                        ? (inputs.obsFilePath + localRoot) 
                                        : inputs.obsFilePath;
                }
                
                // 若是多个path上传，文件不存在重命名的情况，如果输入的obs目录不是文件夹(以'/'结尾)，手动添加文件名
                if (inputs.localFilePath.length > 1 && !utils.isEndWithSlash(inputs.obsFilePath)) {
                    obsFilePath += `/${localRoot}`;
                }
                await uploadFile(obsClient, inputs.bucketName, localFilePath, obsFilePath);
            }

            // 处理文件夹
            if (fsStat.isDirectory()) {
                const localFileRootPath = inputs.includeSelfFolder 
                                            ? getObsRootFile(inputs.includeSelfFolder, inputs.obsFilePath, localRoot)
                                            : getObsRootFile('', inputs.obsFilePath, localRoot);
                // 获取待上传列表
                const uploadList = {
                    file: [],
                    folder: []
                };
                await fileDisplay(obsClient, inputs, localFilePath, localFileRootPath, uploadList);

                const uploadListLength = uploadList.file.length + uploadList.folder.length;
                if (uploadListLength <= 1000) {
                    if (inputs.obsFilePath) {
                        await obsCreateRootFolder(obsClient, inputs.bucketName, utils.getStringDelLastSlash(inputs.obsFilePath));
                    }
                    await uploadFileAndFolder(obsClient, inputs.bucketName, uploadList);
                } else {
                    core.info(`local dirctory: '${localFilePathItem}' has ${uploadListLength} files and folders.`);
                    core.info(`please upload a dirctory include less than 1000 files and folders.`);
                }
            }
        } catch (error) {
            core.info(`local file or dirctory: '${localFilePathItem}' not exist, please check your input path`);
        }
    }
}

// 循环读取文件夹, 统计待上传文件/文件夹
export async function fileDisplay(obsClient: any, inputs: Inputs, localFilePath: string, obsFileRootPath: string, uploadList: UploadFileList): Promise<void> {
    // 根据文件路径读取文件，返回一个文件列表
    const fslist = fs.readdirSync(localFilePath);
    if (fslist.length > 0) {
        // 遍历读取到的文件列表
        for (const filename of fslist) {
            // path.join得到当前文件的绝对路径
            const filepath = path.join(localFilePath, filename);

            // 根据文件路径获取文件信息
            const info = fs.statSync(filepath);
            const obsFilePath = obsFileRootPath ? `${obsFileRootPath}/${filename}` : `${obsFileRootPath}${filename}`;

            if (info.isFile()) {
                uploadList.file.push({
                    local: utils.replaceSlash(filepath),
                    obs: obsFilePath
                });
            }
            if (info.isDirectory()) {
                uploadList.folder.push(obsFilePath);
                await fileDisplay(obsClient, inputs, filepath, obsFilePath, uploadList); // 递归, 继续遍历该文件夹里面的文件
            }
        }
    } else {
        // 是个空文件夹
        if (uploadList.folder.indexOf(utils.getStringDelLastSlash(obsFileRootPath)) === -1) {
            uploadList.folder.push(utils.getStringDelLastSlash(obsFileRootPath));
        }
    }
}

// 根据includeSelf，返回待上传对象在obs的根路径
export function getObsRootFile(includeSelf: string, obsfile: string, localRoot: string): string {
    if (includeSelf.toLowerCase() === 'y') {
        const obsFinalFilePath = obsfile ? utils.getStringDelLastSlash(obsfile) + '/' + localRoot : localRoot;
        return obsFinalFilePath;
    } else {
        return utils.getStringDelLastSlash(obsfile);
    }
}

// 上传文件和文件夹
async function uploadFileAndFolder(obsClient: any, bucketName: string, uploadList: UploadFileList): Promise<void> {
    for (const folder of uploadList.folder) {
        await uploadFolder(obsClient, bucketName, folder);
    }
    for (const file of uploadList.file) {
        await uploadFile(obsClient, bucketName, file.local, file.obs);
    }
}

// 上传文件
export async function uploadFile(obsClient: any, bucketName: string, localFilePath: string, obsFilePath: string): Promise<void> {
    if (utils.isFileOverSize(localFilePath)) {
        core.info(`your local file '${localFilePath}' cannot be uploaded because it is larger than 5 GB`);
        return;
    }
    core.info(`upload file: ${localFilePath} to ${bucketName}/${obsFilePath}`);
    await obsClient.putObject({
        Bucket : bucketName,
        Key : obsFilePath,
        SourceFile : localFilePath
    });
}

// 上传文件夹, 因obs无实际文件夹概念, 不需要本地路径, 只需目标路径即可
export async function uploadFolder(obsClient: any, bucketName: string, obsFilePath: string): Promise<void> {
    core.info(`create folder ${obsFilePath}/`);
    await obsClient.putObject({
        Bucket : bucketName,
        Key : obsFilePath + '/'
    });
}

// 在obs创建空文件夹
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
            Bucket : bucketName,
            Key : obsPath
        });
    }
}