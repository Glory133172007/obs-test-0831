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
exports.obsCreateRootFolder = exports.uploadFolder = exports.uploadFile = exports.getObsRootFile = exports.fileDisplay = exports.startUpload = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const core = __importStar(require("@actions/core"));
const utils = __importStar(require("./utils"));
// obsClient为引入的OBS库的OBS客户端类型，本身并未导出其类型，故使用any，下同
// 判断是上传文件，还是上传文件夹
function startUpload(obsClient, inputs) {
    return __awaiter(this, void 0, void 0, function* () {
        if (inputs.localFilePath.length === 0) {
            core.info('please input localFilePath');
            return;
        }
        for (const localFilePathItem of inputs.localFilePath) {
            const localFilePath = utils.getStringDelLastSlash(localFilePathItem); // 文件或者文件夹
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
                    yield uploadFile(obsClient, inputs.bucketName, localFilePath, obsFilePath);
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
                    yield fileDisplay(obsClient, inputs, localFilePath, localFileRootPath, uploadList);
                    const uploadListLength = uploadList.file.length + uploadList.folder.length;
                    if (uploadListLength <= 1000) {
                        if (inputs.obsFilePath) {
                            yield obsCreateRootFolder(obsClient, inputs.bucketName, utils.getStringDelLastSlash(inputs.obsFilePath));
                        }
                        yield uploadFileAndFolder(obsClient, inputs.bucketName, uploadList);
                    }
                    else {
                        core.info(`local dirctory: '${localFilePathItem}' has ${uploadListLength} files and folders.`);
                        core.info(`please upload a dirctory include less than 1000 files and folders.`);
                    }
                }
            }
            catch (error) {
                core.info(`local file or dirctory: '${localFilePathItem}' not exist, please check your input path`);
            }
        }
    });
}
exports.startUpload = startUpload;
// 循环读取文件夹, 统计待上传文件/文件夹
function fileDisplay(obsClient, inputs, localFilePath, obsFileRootPath, uploadList) {
    return __awaiter(this, void 0, void 0, function* () {
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
                    yield fileDisplay(obsClient, inputs, filepath, obsFilePath, uploadList); // 递归, 继续遍历该文件夹里面的文件
                }
            }
        }
        else {
            // 是个空文件夹
            if (uploadList.folder.indexOf(utils.getStringDelLastSlash(obsFileRootPath)) === -1) {
                uploadList.folder.push(utils.getStringDelLastSlash(obsFileRootPath));
            }
        }
    });
}
exports.fileDisplay = fileDisplay;
// 根据includeSelf，返回待上传对象在obs的根路径
function getObsRootFile(includeSelf, obsfile, localRoot) {
    if (includeSelf.toLowerCase() === 'y') {
        const obsFinalFilePath = obsfile ? utils.getStringDelLastSlash(obsfile) + '/' + localRoot : localRoot;
        return obsFinalFilePath;
    }
    else {
        return utils.getStringDelLastSlash(obsfile);
    }
}
exports.getObsRootFile = getObsRootFile;
// 上传文件和文件夹
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
// 上传文件
function uploadFile(obsClient, bucketName, localFilePath, obsFilePath) {
    return __awaiter(this, void 0, void 0, function* () {
        if (utils.isFileOverSize(localFilePath)) {
            core.info(`your local file '${localFilePath}' cannot be uploaded because it is larger than 5 GB`);
            return;
        }
        core.info(`upload file: ${localFilePath} to ${bucketName}/${obsFilePath}`);
        yield obsClient.putObject({
            Bucket: bucketName,
            Key: obsFilePath,
            SourceFile: localFilePath
        });
    });
}
exports.uploadFile = uploadFile;
// 上传文件夹, 因obs无实际文件夹概念, 不需要本地路径, 只需目标路径即可
function uploadFolder(obsClient, bucketName, obsFilePath) {
    return __awaiter(this, void 0, void 0, function* () {
        core.info(`create folder ${obsFilePath}/`);
        yield obsClient.putObject({
            Bucket: bucketName,
            Key: obsFilePath + '/'
        });
    });
}
exports.uploadFolder = uploadFolder;
// 在obs创建空文件夹
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
                Key: obsPath
            });
        }
    });
}
exports.obsCreateRootFolder = obsCreateRootFolder;
