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
exports.mergeParts = exports.uploadParts = exports.initMultipartUpload = exports.multipartUpload = exports.obsCreateRootFolder = exports.uploadFolder = exports.uploadFile = exports.fileDisplay = exports.getObsRootFile = exports.uploadFileOrFolder = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const utils = __importStar(require("./utils"));
const core = __importStar(require("@actions/core"));
/**
 * 上传文件/文件夹
 * @param obsClient  Obs客户端，因obsClient为引入的obs库的类型，本身并未导出其类型，故使用any，下同
 * @param inputs 用户输入的参数
 */
function uploadFileOrFolder(obsClient, inputs) {
    return __awaiter(this, void 0, void 0, function* () {
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
                        }
                        else {
                            // 若是多路径上传时的文件,不存在重命名,默认传至obs_file_path文件夹下
                            obsFilePath =
                                inputs.localFilePath.length > 1 ? `${inputs.obsFilePath}/${localRoot}` : inputs.obsFilePath;
                        }
                    }
                    else {
                        // 若obs_file_path为空,上传所有对象至根目录
                        obsFilePath = localRoot;
                    }
                    yield uploadFile(obsClient, inputs.bucketName, localFilePath, obsFilePath);
                }
                if (fsStat.isDirectory()) {
                    const localFileRootPath = getObsRootFile(!!inputs.includeSelfFolder, inputs.obsFilePath, localRoot);
                    const uploadList = {
                        file: [],
                        folder: [],
                    };
                    yield fileDisplay(obsClient, inputs, localFilePath, localFileRootPath, uploadList);
                    // 若总文件数大于1000，取消上传
                    const uploadListLength = uploadList.file.length + uploadList.folder.length;
                    if (uploadListLength <= 1000) {
                        if (inputs.obsFilePath) {
                            yield obsCreateRootFolder(obsClient, inputs.bucketName, utils.getStringDelLastSlash(inputs.obsFilePath));
                        }
                        yield uploadFileAndFolder(obsClient, inputs.bucketName, uploadList);
                    }
                    else {
                        core.setFailed(`local dirctory: '${path}' has ${uploadListLength} files and folders,`);
                        core.setFailed(`please upload a dirctory include less than 1000 files and folders.`);
                    }
                }
            }
            catch (error) {
                core.setFailed(`read local file or dirctory: '${path}' failed.`);
            }
        }
    });
}
exports.uploadFileOrFolder = uploadFileOrFolder;
/**
 * 得到待上传对象在obs的根路径
 * @param includeSelf 是否包含文件夹自身
 * @param obsfile 用户输入的obs_file_path
 * @param objectName 对象在本地的名称
 * @returns
 */
function getObsRootFile(includeSelf, obsfile, objectName) {
    if (includeSelf) {
        const obsFinalFilePath = obsfile ? utils.getStringDelLastSlash(obsfile) + '/' + objectName : objectName;
        return obsFinalFilePath;
    }
    else {
        return utils.getStringDelLastSlash(obsfile);
    }
}
exports.getObsRootFile = getObsRootFile;
/**
 * 读取文件夹, 统计待上传文件/文件夹路径
 * @param obsClient Obs客户端
 * @param inputs 用户输入的参数
 * @param localFilePath 本地路径
 * @param obsFileRootPath 要上传到obs的根路径
 * @param uploadList 待上传文件列表
 */
function fileDisplay(obsClient, inputs, localFilePath, obsFileRootPath, uploadList) {
    return __awaiter(this, void 0, void 0, function* () {
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
                    yield fileDisplay(obsClient, inputs, filepath, obsFilePath, uploadList);
                }
            }
        }
        else {
            // 是空文件夹
            if (uploadList.folder.indexOf(utils.getStringDelLastSlash(obsFileRootPath)) === -1) {
                uploadList.folder.push(utils.getStringDelLastSlash(obsFileRootPath));
            }
        }
    });
}
exports.fileDisplay = fileDisplay;
/**
 * 上传文件和文件夹
 * @param obsClient Obs客户端
 * @param bucketName 桶名
 * @param uploadList 待上传对象列表
 */
function uploadFileAndFolder(obsClient, bucketName, uploadList) {
    return __awaiter(this, void 0, void 0, function* () {
        for (const folder of uploadList.folder) {
            yield uploadFolder(obsClient, bucketName, folder);
        }
        for (const file of uploadList.file) {
            yield uploadFile(obsClient, bucketName, file.local, file.obs);
        }
    });
}
/**
 * 上传文件
 * @param obsClient Obs客户端
 * @param bucketName 桶名
 * @param localFilePath 对象在本地的路径
 * @param obsFilePath 对象要上传到obs的路径
 * @returns
 */
function uploadFile(obsClient, bucketName, localFilePath, obsFilePath) {
    return __awaiter(this, void 0, void 0, function* () {
        if (utils.isFileOverSize(localFilePath)) {
            core.setFailed(`your local file '${localFilePath}' cannot be uploaded because it is larger than 5 GB`);
            return;
        }
        core.info(`upload file: ${localFilePath} to ${bucketName}/${obsFilePath}`);
        yield obsClient.putObject({
            Bucket: bucketName,
            Key: obsFilePath,
            SourceFile: localFilePath,
        });
    });
}
exports.uploadFile = uploadFile;
/**
 * 上传文件夹
 * 因obs无实际文件夹概念, 不需要本地路径, 只需目标路径即可
 * @param obsClient Obs客户端
 * @param bucketName 桶名
 * @param obsFilePath 对象要上传到obs的路径
 * @returns
 */
function uploadFolder(obsClient, bucketName, obsFilePath) {
    return __awaiter(this, void 0, void 0, function* () {
        core.info(`create folder ${obsFilePath}/`);
        yield obsClient.putObject({
            Bucket: bucketName,
            Key: obsFilePath + '/',
        });
    });
}
exports.uploadFolder = uploadFolder;
/**
 * 在obs创建空文件夹
 * 上传时若指定一个obs上非已存在的路径, 则需要在obs上逐级建立文件夹
 * @param obsClient Obs客户端
 * @param bucketName 桶名
 * @param obsFilePath 对象要上传到obs的路径
 * @returns
 */
function obsCreateRootFolder(obsClient, bucketName, obsFile) {
    return __awaiter(this, void 0, void 0, function* () {
        const obsPathList = obsFile.split('/');
        let obsPath = '';
        for (const path of obsPathList) {
            if (!path) {
                return;
            }
            obsPath += `${path}/`;
            core.info('create folder ' + obsPath);
            yield obsClient.putObject({
                Bucket: bucketName,
                Key: obsPath,
            });
        }
    });
}
exports.obsCreateRootFolder = obsCreateRootFolder;
/**
 * 分段上传
 * @param obs obs客户端
 * @param bucketName 桶名
 * @param objKey 上传对象在obs上的名称
 * @param filePath 上传对象的本地路径
 */
function multipartUpload(obs, bucketName, objKey, filePath) {
    return __awaiter(this, void 0, void 0, function* () {
        const uploadId = yield initMultipartUpload(obs, bucketName, objKey);
        if (uploadId) {
            const parts = yield uploadParts(obs, bucketName, objKey, uploadId, filePath);
            if (parts.length > 0) {
                yield mergeParts(obs, bucketName, objKey, uploadId, parts);
            }
        }
    });
}
exports.multipartUpload = multipartUpload;
/**
 * 初始化分段上传任务
 * @param obs obs客户端
 * @param bucketName 桶名
 * @param objKey 上传对象在obs上的名称
 * @returns
 */
function initMultipartUpload(obs, bucketName, objKey) {
    return __awaiter(this, void 0, void 0, function* () {
        const result = yield obs.initiateMultipartUpload({
            Bucket: bucketName,
            Key: objKey,
        });
        if (result.CommonMsg.Status < 300) {
            core.info('init multipart upload successfully.');
            return result.InterfaceResult.UploadId;
        }
        else {
            core.info('init multipart upload failed.');
            return '';
        }
    });
}
exports.initMultipartUpload = initMultipartUpload;
/**
 * 上传分段
 * @param obs obs客户端
 * @param bucketName 桶名
 * @param objKey 上传对象在obs上的名称
 * @param uploadId 分段上传任务的uploadid
 * @param filePath 上传对象的本地路径
 * @returns
 */
function uploadParts(obs, bucketName, objKey, uploadId, filePath) {
    return __awaiter(this, void 0, void 0, function* () {
        const partSize = utils.PART_MAX_SIZE;
        const fileLength = fs.lstatSync(filePath).size;
        const partCount = fileLength % partSize === 0 ? Math.floor(fileLength / partSize) : Math.floor(fileLength / partSize) + 1;
        core.info(`total parts count ${partCount}.`);
        const parts = [];
        core.info('Begin to upload multiparts to OBS from a file');
        for (let i = 0; i < partCount; i++) {
            const offset = i * partSize;
            const currPartSize = i + 1 === partCount ? fileLength - offset : partSize;
            const partNumber = i + 1;
            const result = yield obs.uploadPart({
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
            }
            else {
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
    });
}
exports.uploadParts = uploadParts;
/**
 * 合并分段
 * @param obs obs客户端
 * @param bucketName 桶名
 * @param objKey 上传对象在obs上的名称
 * @param uploadId 分段上传任务的uploadid
 * @param parts 分段上传任务的分段信息
 * @returns
 */
function mergeParts(obs, bucketName, objKey, uploadId, parts) {
    return __awaiter(this, void 0, void 0, function* () {
        const result = yield obs.completeMultipartUpload({
            Bucket: bucketName,
            Key: objKey,
            UploadId: uploadId,
            Parts: parts,
        });
        if (result.CommonMsg.Status < 300) {
            core.info('Complete to upload multiparts finished.');
            return true;
        }
        else {
            core.info(result.CommonMsg.Code);
            return false;
        }
    });
}
exports.mergeParts = mergeParts;
