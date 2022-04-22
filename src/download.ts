import * as fs from 'fs';
import * as utils from './utils';
import * as core from '@actions/core';
import { Inputs, ObjectItem, ListBucketResult } from './interface';

/**
 * 下载文件或者文件夹
 * @param obsClient Obs客户端，因obsClient为引入的obs库的类型，本身并未导出其类型，故使用any，下同
 * @param inputs 用户输入的参数
 * @returns 
 */
export async function downloadFileOrFolder(obsClient: any, inputs: Inputs): Promise<void> {

    const inputLocalFilePath = inputs.local_file_path[0];
    const downloadPathList = await getDownloadList(obsClient, inputs, inputs.obs_file_path); 
    
    if (downloadPathList.length < 1) {
        core.setFailed('objecton obs  not exist or no object needed downloaded.');
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
    return downloadPathList.length === 1 && downloadPathList[0] === obsPath && !utils.isEndWithSlash(downloadPathList[0]);
}

/**
 * 下载多个文件/文件夹
 * @param obsClient Obs客户端
 * @param inputs 用户输入的参数
 * @param downloadList 待下载列表
 * @param localPath 本地path
 */
async function downloadFilesFromObs(obsClient: any, inputs: Inputs, downloadList: string[], localPath: string): Promise<void> {
    const localRoot = createEmptyRootFolders(localPath, inputs.obs_file_path, inputs.include_self_folder ?? '');
    for (const path of downloadList) {
        let finalLocalPath = localRoot + utils.getPathWithoutRootPath(utils.getStringDelLastSlash(inputs.obs_file_path), path);
        // 如果有和文件同目录同名的文件夹，给文件名加后缀下载
        if (downloadList.indexOf(`${path}/`) !== -1) {
            finalLocalPath += new Date().valueOf();
        }
        if (utils.isEndWithSlash(finalLocalPath)) {
            utils.createFolder(finalLocalPath);
        } else {
            await downloadFile(obsClient, inputs, path, finalLocalPath);
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
 export function createEmptyRootFolders(localPath: string, obsPath: string, includeSelfFolder: string): string {
    let local = utils.getStringDelLastSlash(localPath);
    if (utils.includeSelfFolderArray.includeItem.indexOf(includeSelfFolder.toLowerCase())> -1) {
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
export async function downloadFile(obsClient: any, inputs: Inputs, obsPath: string, localPath?: string): Promise<void> {
    const localFileName = localPath ? localPath : getLocalFileName(utils.getStringDelLastSlash(inputs.local_file_path[0]), obsPath);
    core.info(`download ${obsPath} to local: ${localFileName}`);
    await obsClient.getObject({
        Bucket : inputs.bucket_name,
        Key : obsPath,
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
 * result.InterfaceResult.NextMarker会记录下次起始位置
 * @param obsClient Obs客户端
 * @param inputs 用户输入的参数
 * @param obsPath 对象在obs上的路径
 * @returns 
 */
export async function getDownloadList(obsClient: any, inputs: Inputs, obsPath: string): Promise<string[]> {
    const obsFilePath = utils.getStringDelLastSlash(obsPath);
    let result = await listDownloadObjects(obsClient, inputs, obsFilePath);
    let resultList = delUselessPath(result.InterfaceResult.Contents, inputs);
    let marker = result.InterfaceResult.NextMarker;
    while (marker !== '') {
        result = await listDownloadObjects(obsClient, inputs, obsFilePath, marker);
        marker = result.InterfaceResult.NextMarker;
        resultList = resultList.concat(delUselessPath(result.InterfaceResult.Contents, inputs));
    }
    return resultList;
}

/**
 * 根据前缀和起始位置，列举桶内对象
 * @param obsClient Obs客户端
 * @param inputs 用户输入的参数
 * @param obsPath obs上请求的对象前缀
 * @param marker 起始位置
 * @returns 
 */
async function listDownloadObjects(obsClient: any, inputs: Inputs, obsPath: string, marker?: string): Promise<ListBucketResult> {
    return await obsClient.listObjects({
        Bucket: inputs.bucket_name,
        Prefix: obsPath,
        Marker: marker ?? ''
    });
}

/**
 * 从待下载列表中排除不需要的对象（用户输入的排除项）
 * @param objList 列举出的桶内对象列表
 * @param inputs 用户输入的参数
 * @returns 
 */
function delUselessPath(objList: ObjectItem[], inputs: Inputs): string[] {
    const resultList: string[] = [];
    objList.forEach((element: ObjectItem) => {
        // 删除不需要的path，仅保留inputs.obsFilePath相关的文件路径
        let isInclude = true;
        if (!!inputs.exclude && inputs.exclude.length > 0) {
            inputs.exclude.forEach(excludeItem => {
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