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
/**
 * 下载文件或者文件夹
 * @param obsClient Obs客户端，因obsClient为引入的obs库的类型，本身并未导出其类型，故使用any，下同
 * @param inputs 用户输入的参数
 * @returns
 */
function downloadFileOrFolder(obsClient, inputs) {
    return __awaiter(this, void 0, void 0, function* () {
        const inputLocalFilePath = inputs.local_file_path[0];
        const downloadPathList = yield getDownloadList(obsClient, inputs, inputs.obs_file_path);
        if (downloadPathList.length < 1) {
            core.setFailed('object not exist in obs or no object needed downloaded.');
            return;
        }
        else if (pathIsSingleFile(downloadPathList, inputs.obs_file_path)) {
            yield downloadFile(obsClient, inputs, downloadPathList[0]);
            return;
        }
        else {
            // 下载文件夹时，需指定一个本地存在的目录
            if (!fs.existsSync(inputLocalFilePath)) {
                core.setFailed('local dirctory not exist, please check you input');
                return;
            }
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
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const localRoot = createEmptyRootFolders(localPath, inputs.obs_file_path, (_a = inputs.include_self_folder) !== null && _a !== void 0 ? _a : '');
        // 如果obs对象是文件夹且本地存在同名文件，不进行下载，记录需要跳过下载的文件夹开头
        let delFolderPath = '';
        for (const path of downloadList) {
            if (delFolderPath === '' || !path.match(`^${delFolderPath}`)) {
                let finalLocalPath = localRoot + utils.getPathWithoutRootPath(utils.getStringDelLastSlash(inputs.obs_file_path), path);
                // 如果下载列表中有和文件同目录同名的文件夹，给文件名加后缀下载
                if (downloadList.indexOf(`${path}/`) !== -1) {
                    finalLocalPath += new Date().valueOf();
                }
                if (utils.isEndWithSlash(finalLocalPath)) {
                    if (utils.isExistSameNameFile(finalLocalPath)) {
                        core.info(`download folder ${finalLocalPath} failed.`);
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
    if (utils.includeSelfFolderArray.includeItem.indexOf(includeSelfFolder.toLowerCase()) > -1) {
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
        let localFileName = localPath
            ? localPath
            : getLocalFileName(utils.getStringDelLastSlash(inputs.local_file_path[0]), obsPath);
        // 若本地存在同名文件夹，下载到此文件夹中。若此文件夹中还存在同名文件夹，放弃本次下载
        if (utils.isExistSameNameFolder(localFileName)) {
            const nextFileName = `${localFileName}/${utils.getLastItemWithSlash(localFileName)}`;
            if (utils.isExistSameNameFolder(nextFileName)) {
                core.info(`download file ${localFileName} failed.`);
                return;
            }
            else {
                localFileName = nextFileName;
            }
        }
        core.info(`download ${obsPath} to local: ${localFileName}`);
        yield obsClient.getObject({
            Bucket: inputs.bucket_name,
            Key: obsPath,
            SaveAsFile: localFileName,
        });
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
 * result.InterfaceResult.NextMarker会记录下次起始位置
 * @param obsClient Obs客户端
 * @param inputs 用户输入的参数
 * @param obsPath 对象在obs上的路径
 * @returns
 */
function getDownloadList(obsClient, inputs, obsPath) {
    return __awaiter(this, void 0, void 0, function* () {
        const obsFilePath = utils.getStringDelLastSlash(obsPath);
        let result = yield listDownloadObjects(obsClient, inputs, obsFilePath);
        let resultList = delUselessPath(result.InterfaceResult.Contents, inputs);
        let marker = result.InterfaceResult.NextMarker;
        while (marker !== '') {
            result = yield listDownloadObjects(obsClient, inputs, obsFilePath, marker);
            marker = result.InterfaceResult.NextMarker;
            resultList = resultList.concat(delUselessPath(result.InterfaceResult.Contents, inputs));
        }
        return resultList;
    });
}
exports.getDownloadList = getDownloadList;
/**
 * 根据前缀和起始位置，列举桶内对象
 * @param obsClient Obs客户端
 * @param inputs 用户输入的参数
 * @param obsPath obs上请求的对象前缀
 * @param marker 起始位置
 * @returns
 */
function listDownloadObjects(obsClient, inputs, obsPath, marker) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield obsClient.listObjects({
            Bucket: inputs.bucket_name,
            Prefix: obsPath,
            Marker: marker !== null && marker !== void 0 ? marker : '',
        });
    });
}
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
