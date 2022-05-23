import * as fs from 'fs';
import * as utils from './utils';
import * as core from '@actions/core';
import * as bucket from './bucket';
import { ObjectInputs, ListBucketContentItem } from './types';

/**
 * 下载文件或者文件夹
 * @param obsClient Obs客户端，因obsClient为引入的obs库的类型，本身并未导出其类型，故使用any，下同
 * @param inputs 用户输入的参数
 * @returns
 */
export async function downloadFileOrFolder(obsClient: any, inputs: ObjectInputs): Promise<void> {
    const inputLocalFilePath = inputs.local_file_path[0];
    const downloadPathList = await getDownloadList(obsClient, inputs, inputs.obs_file_path);
    if (downloadPathList.length < 1) {
        core.setFailed('object not exist in obs or no object needed downloaded.');
        return;
    } else if (pathIsSingleFile(downloadPathList, inputs.obs_file_path)) {
        await downloadFile(obsClient, inputs, downloadPathList[0]);
        return;
    } else {
        // 下载文件夹时，需指定一个本地存在的目录
        if (!fs.existsSync(inputLocalFilePath)) {
            core.setFailed('local dirctory not exist, please check you input');
            return;
        }
        await downloadFilesFromObs(obsClient, inputs, downloadPathList, inputLocalFilePath);
    }
}

/**
 * 待下载的对象是否为单个文件
 * @param downloadPathList 待下载的对象列表
 * @param obsPath 对象在obs上的path
 * @returns
 */
export function pathIsSingleFile(downloadPathList: string[], obsPath: string): boolean {
    return (
        downloadPathList.length === 1 && downloadPathList[0] === obsPath && !utils.isEndWithSlash(downloadPathList[0])
    );
}

/**
 * 下载多个文件/文件夹
 * @param obsClient Obs客户端
 * @param inputs 用户输入的参数
 * @param downloadList 待下载列表
 * @param localPath 本地path
 */
async function downloadFilesFromObs(
    obsClient: any,
    inputs: ObjectInputs,
    downloadList: string[],
    localPath: string
): Promise<void> {
    const localRoot = createEmptyRootFolders(localPath, inputs.obs_file_path, !!inputs.include_self_folder);
    // 如果obs对象是文件夹且本地存在同名文件，不进行下载，记录需要跳过下载的文件夹开头
    let delFolderPath = '';
    for (const path of downloadList) {
        if (delFolderPath === '' || !path.match(`^${delFolderPath}`)) {
            let finalLocalPath =
                localRoot + utils.getPathWithoutRootPath(utils.getStringDelLastSlash(inputs.obs_file_path), path);
            // 如果下载列表中有和文件同目录同名的文件夹，给文件名加后缀下载
            if (downloadList.indexOf(`${path}/`) !== -1) {
                finalLocalPath += new Date().valueOf();
            }
            if (utils.isEndWithSlash(finalLocalPath)) {
                if (utils.isExistSameNameFile(finalLocalPath)) {
                    core.info(`download folder ${finalLocalPath} failed.`);
                    delFolderPath = path;
                } else {
                    utils.createFolder(finalLocalPath);
                }
            } else {
                await downloadFile(obsClient, inputs, path, finalLocalPath);
            }
        }
    }
}

/**
 * 根据includeSelfFolder，创建文件夹
 * @param localPath 本地path
 * @param obsPath 对象在obs上的path
 * @param includeSelfFolder 是否包含文件夹自身
 * @returns
 */
export function createEmptyRootFolders(localPath: string, obsPath: string, includeSelfFolder: boolean): string {
    let local = utils.getStringDelLastSlash(localPath);
    if (includeSelfFolder) {
        local += `/${utils.getStringDelLastSlash(obsPath).split('/').pop()}`;
        utils.createFolder(local);
    }
    return local;
}

/**
 * 下载文件
 * @param obsClient Obs客户端
 * @param inputs 用户输入的参数
 * @param obsPath 对象在obs上的路径
 * @param localPath 文件要下载在本地的路径
 */
export async function downloadFile(
    obsClient: any,
    inputs: ObjectInputs,
    obsPath: string,
    localPath?: string
): Promise<void> {
    let localFileName = localPath
        ? localPath
        : getLocalFileName(utils.getStringDelLastSlash(inputs.local_file_path[0]), obsPath);

    // 若本地存在同名文件夹，下载到此文件夹中。若此文件夹中还存在同名文件夹，放弃本次下载
    if (utils.isExistSameNameFolder(localFileName)) {
        const nextFileName = `${localFileName}/${utils.getLastItemWithSlash(localFileName)}`;
        if (utils.isExistSameNameFolder(nextFileName)) {
            core.info(`download file ${localFileName} failed.`);
            return;
        } else {
            localFileName = nextFileName;
        }
    }

    core.info(`download ${obsPath} to local: ${localFileName}`);
    await obsClient.getObject({
        Bucket: inputs.bucket_name,
        Key: obsPath,
        SaveAsFile: localFileName,
    });
}

/**
 * 获得对象应在本地的路径
 * @param localPath 本地文件夹路径
 * @param obsPath 对象在obs上的路径
 * @returns
 */
export function getLocalFileName(localPath: string, obsPath: string): string {
    try {
        if (fs.lstatSync(localPath).isDirectory()) {
            return `${localPath}/${utils.getLastItemWithSlash(obsPath)}`;
        } else {
            return localPath;
        }
    } catch (error) {
        return localPath;
    }
}

/**
 * 获取在obs上待下载的对象列表
 * 官方提供的getObject方法最大请求1000个文件，若请求的文件大于1000个则返回对象名按照字典序排序后的前1000个文件
 * result.InterfaceResult.IsTruncated表明本次请求是否返回了全部结果，“true”表示没有返回全部结果；“false”表示已返回了全部结果
 * result.InterfaceResult.NextMarker会记录下次起始位置
 * @param obsClient Obs客户端
 * @param inputs 用户输入的参数
 * @param obsPath 对象在obs上的路径
 * @returns
 */
export async function getDownloadList(obsClient: any, inputs: ObjectInputs, obsPath: string): Promise<string[]> {
    const obsFilePath = utils.getStringDelLastSlash(obsPath);

    let resultList: string[] = [];
    let isTruncated = true;
    let marker = '';

    while (isTruncated) {
        const result = await bucket.listObjects(obsClient, inputs.bucket_name, obsFilePath, marker);
        resultList = resultList.concat(delUselessPath(result.InterfaceResult.Contents, inputs));

        isTruncated = result.InterfaceResult.IsTruncated === 'true';
        marker = result.InterfaceResult.NextMarker;
    }
    return resultList;
}

/**
 * 从待下载列表中排除不需要的对象（用户输入的排除项）
 * @param objList 列举出的桶内对象列表
 * @param inputs 用户输入的参数
 * @returns
 */
function delUselessPath(objList: ListBucketContentItem[], inputs: ObjectInputs): string[] {
    const resultList: string[] = [];
    objList.forEach((element: ListBucketContentItem) => {
        // 删除不需要的path，仅保留inputs.obsFilePath相关的文件路径
        let isInclude = true;
        if (!!inputs.exclude && inputs.exclude.length > 0) {
            inputs.exclude.forEach((excludeItem) => {
                if (element['Key'].search(`^${utils.getStringDelLastSlash(excludeItem)}`) > -1) {
                    isInclude = false;
                }
            });
        }
        if (isInclude) {
            resultList.push(element['Key']);
        }
    });
    return resultList;
}
