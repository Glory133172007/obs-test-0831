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
Object.defineProperty(exports, "__esModule", { value: true });
exports.isExistSameNameFile = exports.isExistSameNameFolder = exports.isFileOverSize = exports.getStringDelLastSlash = exports.isEndWithSlash = exports.createFolder = exports.getPathWithoutRootPath = exports.getLastItemWithSlash = exports.replaceSlash = exports.checkInputs = exports.checkIncludeSelfFolder = exports.checkDownloadFilePath = exports.checkUploadFilePath = exports.checkOperationType = exports.checkRegion = exports.checkAkSk = exports.includeSelfFolderArray = void 0;
const fs = __importStar(require("fs"));
const core = __importStar(require("@actions/core"));
/**
 * 目前支持obs功能的region列表
 * LA-Santiago	la-south-2
 * 非洲-约翰内斯堡	af-south-1
 * 华北-北京四	cn-north-4
 * 华北-北京一	cn-north-1
 * 华东-上海二	cn-east-2
 * 华东-上海一	cn-east-3
 * 华南-广州	cn-south-1
 * 拉美-墨西哥城二	la-north-2
 * 拉美-墨西哥城一	na-mexico-1
 * 拉美-圣保罗一	sa-brazil-1
 * 亚太-曼谷	ap-southeast-2
 * 亚太-新加坡	ap-southeast-3
 * 中国-香港	ap-southeast-1
 */
const regionArray = [
    'la-south-2',
    'af-south-1',
    'cn-north-4',
    'cn-north-1',
    'cn-east-2',
    'cn-east-3',
    'cn-south-1',
    'la-north-2',
    'na-mexico-1',
    'sa-brazil-1',
    'ap-southeast-2',
    'ap-southeast-3',
    'ap-southeast-1',
];
const FILE_MAX_SIZE = 5 * 1024 * 1024 * 1024;
exports.includeSelfFolderArray = {
    includeItem: ['y', 'yes', 'true'],
    excludeItem: ['n', 'no', 'false'],
};
// 检查aksk是否合法
function checkAkSk(inputs) {
    const akReg = new RegExp('^[a-zA-Z0-9]{10,30}$');
    const skReg = new RegExp('^[a-zA-Z0-9]{30,50}$');
    return akReg.test(inputs.access_key) && skReg.test(inputs.secret_key);
}
exports.checkAkSk = checkAkSk;
// 检查region是否合法
function checkRegion(region) {
    return regionArray.includes(region);
}
exports.checkRegion = checkRegion;
// 检查operation_type参数是否合法
function checkOperationType(operation_type) {
    return operation_type.toLowerCase() === 'upload' || operation_type.toLowerCase() === 'download';
}
exports.checkOperationType = checkOperationType;
// 检查上传时的input_file_path和obs_file_path是否合法
function checkUploadFilePath(inputs) {
    if (inputs.local_file_path.length === 0) {
        core.setFailed('please input localFilePath.');
        return false;
    }
    for (const path of inputs.local_file_path) {
        if (path === '') {
            core.setFailed('you should not input a empty string as local_file_path.');
            return false;
        }
        if (!fs.existsSync(path)) {
            core.setFailed(`local file or dirctory: '${path}' not exist, please check your input path.`);
            return false;
        }
    }
    return true;
}
exports.checkUploadFilePath = checkUploadFilePath;
// 检查下载时的input_file_path和obs_file_path是否合法
function checkDownloadFilePath(inputs) {
    if (inputs.local_file_path.length !== 1) {
        core.setFailed('you should input one local_file_path.');
        return false;
    }
    if (inputs.local_file_path[0] === '') {
        core.setFailed('you should not input a empty string as local_file_path.');
        return false;
    }
    if (!inputs.obs_file_path) {
        core.setFailed('you should input one obs_file_path.');
        return false;
    }
    return true;
}
exports.checkDownloadFilePath = checkDownloadFilePath;
// 检查includeSelfFolder参数是否合法
function checkIncludeSelfFolder(input) {
    return (exports.includeSelfFolderArray.includeItem.indexOf(input.toLowerCase()) > -1 ||
        exports.includeSelfFolderArray.excludeItem.indexOf(input.toLowerCase()) > -1);
}
exports.checkIncludeSelfFolder = checkIncludeSelfFolder;
// 检查输入的各参数是否正常
function checkInputs(inputs) {
    if (!checkAkSk(inputs)) {
        core.setFailed('ak or sk is not correct.');
        return false;
    }
    if (!checkRegion(inputs.region)) {
        core.setFailed('region is not correct.');
        return false;
    }
    if (!checkOperationType(inputs.operation_type)) {
        core.setFailed('operation_type is not correct, you should input "upload" or "download".');
        return false;
    }
    const checkFilePath = inputs.operation_type.toLowerCase() === 'upload' ? checkUploadFilePath(inputs) : checkDownloadFilePath(inputs);
    if (!checkFilePath) {
        return false;
    }
    if (inputs === null || inputs === void 0 ? void 0 : inputs.include_self_folder) {
        if (!checkIncludeSelfFolder(inputs.include_self_folder)) {
            core.setFailed('include_self_folder is not legal, you should input y(Y)/n(N)/yes(YES)/no(NO)/true(TRUE)/false(FALSE).');
            return false;
        }
    }
    return true;
}
exports.checkInputs = checkInputs;
// 替换路径中的'\'为'/'
function replaceSlash(dir) {
    return dir.replace(/\\/g, '/');
}
exports.replaceSlash = replaceSlash;
// 从文件路径中获取到最后一个'/'后的名称
function getLastItemWithSlash(path) {
    if (path.indexOf('/') === -1) {
        return path;
    }
    const pathArray = path.split('/');
    return pathArray[pathArray.length - 1];
}
exports.getLastItemWithSlash = getLastItemWithSlash;
// 获得以rootPath开头， 并删除rootPath的path
function getPathWithoutRootPath(rootPath, path) {
    try {
        const aimPath = path.match(`^${rootPath}`);
        if (aimPath) {
            return path.replace(aimPath[0], '');
        }
        else {
            return path;
        }
    }
    catch (error) {
        core.info('rootPath not start with path.');
        return path;
    }
}
exports.getPathWithoutRootPath = getPathWithoutRootPath;
// 创建文件夹
function createFolder(path) {
    if (!fs.existsSync(path)) {
        core.info('create folder: ' + path);
        fs.mkdirSync(path);
    }
}
exports.createFolder = createFolder;
// 判断路径是否以'/'结尾
function isEndWithSlash(path) {
    try {
        return path.slice(-1) === '/';
    }
    catch (error) {
        return false;
    }
}
exports.isEndWithSlash = isEndWithSlash;
// 删除字符串末尾的字符'/'
function getStringDelLastSlash(str) {
    if (str) {
        return isEndWithSlash(str) ? str.substring(0, str.length - 1) : str;
    }
    return str;
}
exports.getStringDelLastSlash = getStringDelLastSlash;
// 检查文件是否超过5GB
function isFileOverSize(filepath) {
    return fs.lstatSync(filepath).size > FILE_MAX_SIZE;
}
exports.isFileOverSize = isFileOverSize;
// 本地是否存在同名文件夹
function isExistSameNameFolder(localPath) {
    return fs.existsSync(localPath) && fs.statSync(localPath).isDirectory();
}
exports.isExistSameNameFolder = isExistSameNameFolder;
// 本地是否存在同名文件
function isExistSameNameFile(localPath) {
    return fs.existsSync(getStringDelLastSlash(localPath)) && fs.statSync(getStringDelLastSlash(localPath)).isFile();
}
exports.isExistSameNameFile = isExistSameNameFile;
