import * as fs from 'fs';
import * as utils from './utils';
import * as core from '@actions/core';
import { Inputs, ObjectItem, ListBucketResult } from './interface';

// obsClient为引入的obs库的类型，本身并未导出其类型，故使用any，下同
// 判断下载类型
export async function startDownload(obsClient: any, inputs: Inputs): Promise<void> {
    // 若输入了多个或者没输入下载地址，拒绝请求
    if (inputs.localFilePath.length !== 1) {
        core.info('invalid localFilePath, please check your input');
        return;
    }
    // 若不填写obs路径，则拒绝请求
    if (!inputs?.obsFilePath) {
        core.info('you should input obsfile when you excute download');
        return;
    }
    // 获得要下载的目录列表
    const inputLocalFilePath = inputs.localFilePath[0];
    const downloadPathList = await getDownloadList(obsClient, inputs, inputs.obsFilePath); 
    console.log(downloadPathList)
    
    if (downloadPathList.length < 1) {
        core.info('obs file or dirctory not exist');
        return;
    } else if (pathIsSingleFile(downloadPathList, inputs.obsFilePath)) {
        await downloadFile(obsClient, inputs, downloadPathList[0]);
        return;
    } else {
        // 下载文件夹时，需指定一个本地存在的目录
        if (!fs.existsSync(inputLocalFilePath)) {
            core.info('local dirctory not exist, please check you input');
            return;
        }
        await downloadFilesFromObs(obsClient, inputs, downloadPathList, inputLocalFilePath);
    }
}

// 待下载path为1，和请求的path完全一致，并且不是文件夹，说明只下载单个文件
export function pathIsSingleFile(downloadPathList: string[], obsPath: string): boolean {
    return downloadPathList.length === 1 && downloadPathList[0] === obsPath && !utils.isEndWithSlash(downloadPathList[0]);
}

// 根据是否inpus.includeSelfFolder，创建文件夹
export function createEmptyRootFolders(localPath: string, obsPath: string, includeSelfFolder: string): string {
    let local = utils.getStringDelLastSlash(localPath);
    if (includeSelfFolder.toLowerCase() === 'y') {
        local += `/${utils.getStringDelLastSlash(obsPath).split('/').pop()}`;
        utils.createFolder(local);
    }
    return local;
}

// 有多个待下载文件
async function downloadFilesFromObs(obsClient: any, inputs: Inputs, downloadList: string[], localPath: string): Promise<void> {
    const localRoot = createEmptyRootFolders(localPath, inputs.obsFilePath, inputs.includeSelfFolder ?? '');
    for (const path of downloadList) {
        let finalLocalPath = localRoot + utils.getPathWithoutRootPath(utils.getStringDelLastSlash(inputs.obsFilePath), path);
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

// 下载文件
export async function downloadFile(obsClient: any, inputs: Inputs, obsPath: string, localPath?: string): Promise<void> {
    const localFileName = localPath ? localPath : getLocalFileName(utils.getStringDelLastSlash(inputs.localFilePath[0]), obsPath);
    core.info(`download ${obsPath} to local: ${localFileName}`);
    await obsClient.getObject({
        Bucket : inputs.bucketName,
        Key : obsPath,
        SaveAsFile: localFileName,
    });
}

// 获得文件应在本地的名称
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

// 获取要下载的对象(getObject方法最大请求1000个文件，若大于1000个则会返回前1000个，且result.InterfaceResult.NextMarker会有值)
export async function getDownloadList(obsClient: any, inputs: Inputs, obsPath: string): Promise<string[]> {
    const obsFilePath = utils.getStringDelLastSlash(obsPath);
    let result = await listDownloadObjects(obsClient, inputs, obsFilePath);
    let marker = result.InterfaceResult.NextMarker;
    let resultList = delUselessPath(result.InterfaceResult.Contents, inputs, obsFilePath);
    while (marker !== '') {
        result = await listDownloadObjects(obsClient, inputs, obsFilePath, marker);
        marker = result.InterfaceResult.NextMarker;
        resultList = resultList.concat(delUselessPath(result.InterfaceResult.Contents, inputs, obsFilePath));
    }
    return resultList;
}

// 根据参数获取桶内对象
async function listDownloadObjects(obsClient: any, inputs: Inputs, obsPath: string, marker?: string): Promise<ListBucketResult> {
    return await obsClient.listObjects({
        Bucket: inputs.bucketName,
        Prefix: obsPath,
        Marker: marker ?? ''
    });
}

// 剔除不需要的path
function delUselessPath(objList: ObjectItem[], inputs: Inputs, obsFilePath: string): string[] {
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
        if (element['Key'].search(`^${obsFilePath}`) > -1 && isInclude) {
            resultList.push(element['Key']);
        }
    });
    return resultList;
}