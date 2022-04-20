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
exports.getDownloadList = exports.getLocalFileName = exports.downloadFile = exports.createEmptyRootFolders = exports.pathIsSingleFile = exports.startDownload = void 0;
const fs = __importStar(require("fs"));
const utils = __importStar(require("./utils"));
const core = __importStar(require("@actions/core"));
// obsClient为引入的obs库的类型，本身并未导出其类型，故使用any，下同
// 判断下载类型
function startDownload(obsClient, inputs) {
    return __awaiter(this, void 0, void 0, function* () {
        // 若输入了多个或者没输入下载地址，拒绝请求
        if (inputs.localFilePath.length !== 1) {
            core.info('invalid localFilePath, please check your input');
            return;
        }
        // 若不填写obs路径，则拒绝请求
        if (!(inputs === null || inputs === void 0 ? void 0 : inputs.obsFilePath)) {
            core.info('you should input obsfile when you excute download');
            return;
        }
        // 获得要下载的目录列表
        const inputLocalFilePath = inputs.localFilePath[0];
        const downloadPathList = yield getDownloadList(obsClient, inputs, inputs.obsFilePath);
        if (downloadPathList.length < 1) {
            core.info('obs file or dirctory not exist');
            return;
        }
        else if (pathIsSingleFile(downloadPathList, inputs.obsFilePath)) {
            yield downloadFile(obsClient, inputs, downloadPathList[0]);
            return;
        }
        else {
            // 下载文件夹时，需指定一个本地存在的目录
            if (!fs.existsSync(inputLocalFilePath)) {
                core.info('local dirctory not exist, please check you input');
                return;
            }
            yield downloadFilesFromObs(obsClient, inputs, downloadPathList, inputLocalFilePath);
        }
    });
}
exports.startDownload = startDownload;
// 待下载path为1，和请求的path完全一致，并且不是文件夹，说明只下载单个文件
function pathIsSingleFile(downloadPathList, obsPath) {
    return downloadPathList.length === 1 && downloadPathList[0] === obsPath && !utils.isEndWithSlash(downloadPathList[0]);
}
exports.pathIsSingleFile = pathIsSingleFile;
// 根据是否inpus.includeSelfFolder，创建文件夹
function createEmptyRootFolders(localPath, obsPath, includeSelfFolder) {
    let local = utils.getStringDelLastSlash(localPath);
    if (includeSelfFolder.toLowerCase() === 'y') {
        local += `/${utils.getStringDelLastSlash(obsPath).split('/').pop()}`;
        utils.createFolder(local);
    }
    return local;
}
exports.createEmptyRootFolders = createEmptyRootFolders;
// 有多个待下载文件
function downloadFilesFromObs(obsClient, inputs, downloadList, localPath) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const localRoot = createEmptyRootFolders(localPath, inputs.obsFilePath, (_a = inputs.includeSelfFolder) !== null && _a !== void 0 ? _a : '');
        for (const path of downloadList) {
            let finalLocalPath = localRoot + utils.getPathWithoutRootPath(utils.getStringDelLastSlash(inputs.obsFilePath), path);
            // 如果有和文件同目录同名的文件夹，给文件名加后缀下载
            if (downloadList.indexOf(`${path}/`) !== -1) {
                finalLocalPath += new Date().valueOf();
            }
            if (utils.isEndWithSlash(finalLocalPath)) {
                utils.createFolder(finalLocalPath);
            }
            else {
                yield downloadFile(obsClient, inputs, path, finalLocalPath);
            }
        }
    });
}
// 下载文件
function downloadFile(obsClient, inputs, obsPath, localPath) {
    return __awaiter(this, void 0, void 0, function* () {
        const localFileName = localPath ? localPath : getLocalFileName(utils.getStringDelLastSlash(inputs.localFilePath[0]), obsPath);
        core.info(`download ${obsPath} to local: ${localFileName}`);
        yield obsClient.getObject({
            Bucket: inputs.bucketName,
            Key: obsPath,
            SaveAsFile: localFileName,
        });
    });
}
exports.downloadFile = downloadFile;
// 获得文件应在本地的名称
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
// 获取要下载的对象(getObject方法最大请求1000个文件，若大于1000个则会返回前1000个，且result.InterfaceResult.NextMarker会有值)
function getDownloadList(obsClient, inputs, obsPath) {
    return __awaiter(this, void 0, void 0, function* () {
        const obsFilePath = utils.getStringDelLastSlash(obsPath);
        let result = yield listDownloadObjects(obsClient, inputs, obsFilePath);
        let marker = result.InterfaceResult.NextMarker;
        let resultList = delUselessPath(result.InterfaceResult.Contents, inputs, obsFilePath);
        while (marker !== '') {
            result = yield listDownloadObjects(obsClient, inputs, obsFilePath, marker);
            marker = result.InterfaceResult.NextMarker;
            resultList = resultList.concat(delUselessPath(result.InterfaceResult.Contents, inputs, obsFilePath));
        }
        return resultList;
    });
}
exports.getDownloadList = getDownloadList;
// 根据参数获取桶内对象
function listDownloadObjects(obsClient, inputs, obsPath, marker) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield obsClient.listObjects({
            Bucket: inputs.bucketName,
            Prefix: obsPath,
            Marker: marker !== null && marker !== void 0 ? marker : ''
        });
    });
}
// 剔除不需要的path
function delUselessPath(objList, inputs, obsFilePath) {
    const resultList = [];
    objList.forEach((element) => {
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
