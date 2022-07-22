"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDownloadList = exports.getLocalFileName = exports.downloadFile = exports.createEmptyRootFolders = exports.pathIsSingleFile = exports.downloadFileOrFolder = void 0;
const fs = __importStar(require("fs"));
const utils = __importStar(require("./utils"));
const core = __importStar(require("@actions/core"));
const bucket = __importStar(require("./bucket"));
/**
 * 下载文件或者文件夹
 * @param obsClient Obs客户端，因obsClient为引入的obs库的类型，本身并未导出其类型，故使用any，下同
 * @param inputs 用户输入的参数
 * @returns
 */
function downloadFileOrFolder(obsClient, inputs) {
    return __awaiter(this, void 0, void 0, function* () {
        const inputLocalFilePath = inputs.localFilePath[0];
        const downloadPathList = yield getDownloadList(obsClient, inputs, inputs.obsFilePath);
        if (downloadPathList.length < 1) {
            core.setFailed('object not exist in obs or no object needed downloaded.');
            return;
        }
        else if (pathIsSingleFile(downloadPathList, inputs.obsFilePath)) {
            // 下载单个文件时，以'/'结尾，代表下载到localpath代表的文件夹中，下载文件夹时无此限制
            if (utils.isEndWithSlash(inputLocalFilePath)) {
                yield downloadFile(obsClient, inputs, downloadPathList[0], `${inputLocalFilePath}${utils.getLastItemWithSlash(downloadPathList[0])}`);
            }
            else {
                yield downloadFile(obsClient, inputs, downloadPathList[0], inputLocalFilePath);
            }
            return;
        }
        else {
            yield downloadFilesFromObs(obsClient, inputs, downloadPathList, inputLocalFilePath);
        }
    });
}
exports.downloadFileOrFolder = downloadFileOrFolder;
/**
 * 待下载的对象是否为单个文件
 * @param downloadPathList 待下载的对象列表
 * @param obsPath 对象在obs上的path
 * @returns
 */
function pathIsSingleFile(downloadPathList, obsPath) {
    return (downloadPathList.length === 1 && downloadPathList[0] === obsPath && !utils.isEndWithSlash(downloadPathList[0]));
}
exports.pathIsSingleFile = pathIsSingleFile;
/**
 * 下载多个文件/文件夹
 * @param obsClient Obs客户端
 * @param inputs 用户输入的参数
 * @param downloadList 待下载列表
 * @param localPath 本地path
 */
function downloadFilesFromObs(obsClient, inputs, downloadList, localPath) {
    return __awaiter(this, void 0, void 0, function* () {
        const localRoot = createEmptyRootFolders(localPath, inputs.obsFilePath, !!inputs.includeSelfFolder);
        // 如果obs对象是文件夹且本地存在同名文件，不进行下载，记录需要跳过下载的文件夹开头
        let delFolderPath = '';
        for (const path of downloadList) {
            if (delFolderPath === '' || !path.match(`^${delFolderPath}`)) {
                let finalLocalPath = localRoot + utils.getPathWithoutRootPath(utils.getStringDelLastSlash(inputs.obsFilePath), path);
                // 如果下载列表中有和文件同目录同名的文件夹，给文件名加后缀下载
                if (downloadList.indexOf(`${path}/`) !== -1) {
                    finalLocalPath = path + new Date().valueOf();
                }
                // 下载文件夹时，空文件夹一并下载
                if (utils.isEndWithSlash(finalLocalPath)) {
                    if (utils.isExistSameNameFile(finalLocalPath)) {
                        core.info(`download folder "${finalLocalPath}" failed.`);
                        delFolderPath = path;
                    }
                    else {
                        utils.createFolder(finalLocalPath);
                    }
                }
                else {
                    yield downloadFile(obsClient, inputs, path, finalLocalPath);
                }
            }
        }
    });
}
/**
 * 根据includeSelfFolder，创建文件夹
 * @param localPath 本地path
 * @param obsPath 对象在obs上的path
 * @param includeSelfFolder 是否包含文件夹自身
 * @returns
 */
function createEmptyRootFolders(localPath, obsPath, includeSelfFolder) {
    let local = utils.getStringDelLastSlash(localPath);
    if (includeSelfFolder) {
        local += `/${utils.getStringDelLastSlash(obsPath).split('/').pop()}`;
        utils.createFolder(local);
    }
    return local;
}
exports.createEmptyRootFolders = createEmptyRootFolders;
/**
 * 下载文件
 * @param obsClient Obs客户端
 * @param inputs 用户输入的参数
 * @param obsPath 对象在obs上的路径
 * @param localPath 文件要下载在本地的路径
 */
function downloadFile(obsClient, inputs, obsPath, localPath) {
    return __awaiter(this, void 0, void 0, function* () {
        let localFileName = localPath !== null && localPath !== void 0 ? localPath : getLocalFileName(utils.getStringDelLastSlash(inputs.localFilePath[0]), obsPath);
        // 若本地存在同名文件夹，下载到此文件夹中。若此文件夹中还存在同名文件夹，放弃本次下载
        if (utils.isExistSameNameFolder(localFileName)) {
            core.info(`a folder already exists on the local that has the same name as the path for downloading the obs file "${obsPath}"`);
            core.info(`try to download obs file in this folder`);
            const nextFileName = `${localFileName}/${utils.getLastItemWithSlash(localFileName)}`;
            if (utils.isExistSameNameFolder(nextFileName)) {
                core.info(`download file "${localFileName}" failed, because "${localFileName}" already exists as a folder on the local.`);
                return;
            }
            else {
                localFileName = nextFileName;
            }
        }
        core.info(`start download obs file: "${obsPath}"`);
        const result = yield obsClient.getObject({
            Bucket: inputs.bucketName,
            Key: obsPath,
            SaveAsFile: localFileName,
        });
        if (result.CommonMsg.Status < 300) {
            core.info(`successfully download obs file: "${obsPath}" as ${localFileName}`);
        }
        else {
            core.info(`failed to download obs file: "${obsPath}", because ${result.CommonMsg.Message}`);
        }
    });
}
exports.downloadFile = downloadFile;
/**
 * 获得对象应在本地的路径
 * @param localPath 本地文件夹路径
 * @param obsPath 对象在obs上的路径
 * @returns
 */
function getLocalFileName(localPath, obsPath) {
    try {
        if (fs.lstatSync(localPath).isDirectory()) {
            return `${localPath}/${utils.getLastItemWithSlash(obsPath)}`;
        }
        else {
            return localPath;
        }
    }
    catch (error) {
        return localPath;
    }
}
exports.getLocalFileName = getLocalFileName;
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
function getDownloadList(obsClient, inputs, obsPath) {
    return __awaiter(this, void 0, void 0, function* () {
        const obsFilePath = utils.getStringDelLastSlash(obsPath);
        let resultList = [];
        let isTruncated = true;
        let marker = '';
        while (isTruncated) {
            const result = yield bucket.listObjects(obsClient, inputs.bucketName, obsFilePath, marker);
            resultList = resultList.concat(delUselessPath(result.InterfaceResult.Contents, inputs));
            isTruncated = result.InterfaceResult.IsTruncated === 'true';
            marker = result.InterfaceResult.NextMarker;
        }
        return resultList;
    });
}
exports.getDownloadList = getDownloadList;
/**
 * 从待下载列表中排除不需要的对象（用户输入的排除项）
 * @param objList 列举出的桶内对象列表
 * @param inputs 用户输入的参数
 * @returns
 */
function delUselessPath(objList, inputs) {
    const resultList = [];
    objList.forEach((element) => {
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
