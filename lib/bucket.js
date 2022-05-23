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
exports.deleteBucket = exports.abortAllMultipartUpload = exports.deleteAllObjects = exports.clearBuckets = exports.isBucketEmpty = exports.getAllMultipartUploads = exports.listMultipartUploads = exports.getAllVersionObjects = exports.listVersionObjects = exports.getAllObjects = exports.listObjects = exports.getBucketVersioning = exports.createBucket = exports.hasBucket = void 0;
const core = __importStar(require("@actions/core"));
/**
 * 判断桶是否存在
 * @param obsClient obs客户端，因obsClient为引入的obs库的类型，本身并未导出其类型，故使用any，下同
 * @param bucketName 桶名
 * @returns
 */
function hasBucket(obsClient, bucketName) {
    return __awaiter(this, void 0, void 0, function* () {
        const promise = yield obsClient.headBucket({
            Bucket: bucketName,
        });
        return !(promise.CommonMsg.Status === 404);
    });
}
exports.hasBucket = hasBucket;
/**
 * 创建桶
 * @param obsClient
 * @param bucketName
 */
function createBucket(obsClient, bucketName, location, ACL, storageClass) {
    return __awaiter(this, void 0, void 0, function* () {
        obsClient
            .createBucket({
            Bucket: bucketName,
            Location: location,
            ACL: ACL,
            StorageClass: storageClass,
        })
            .then((result) => {
            if (result.CommonMsg.Status < 300) {
                if (result.InterfaceResult) {
                    core.info('create bucket Successfully.');
                    return true;
                }
            }
            else {
                core.info('Message-->' + result.CommonMsg.Message);
                return false;
            }
        })
            .catch((err) => {
            core.info('Error-->' + err);
            return false;
        });
        return false;
    });
}
exports.createBucket = createBucket;
/**
 * 获取桶的多版本状态
 * @param obsClient
 * @param bucketName
 * @returns
 */
function getBucketVersioning(obsClient, bucketName) {
    return __awaiter(this, void 0, void 0, function* () {
        const result = yield obsClient.getBucketVersioning({
            Bucket: bucketName,
        });
        if (result.CommonMsg.Status < 300) {
            return result.InterfaceResult.VersionStatus;
        }
        else {
            core.info(`get bucket versioning failed because ${result.CommonMsg.Message}`);
            return '';
        }
    });
}
exports.getBucketVersioning = getBucketVersioning;
/**
 * 根据前缀和起始位置，列举桶内对象
 * @param obsClient Obs客户端
 * @param bucketName 桶名
 * @param obsPath obs上请求的对象前缀
 * @param marker 起始位置
 * @returns
 */
function listObjects(obsClient, bucketName, obsPath, marker) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield obsClient.listObjects({
            Bucket: bucketName,
            Prefix: obsPath,
            Marker: marker !== null && marker !== void 0 ? marker : '',
        });
    });
}
exports.listObjects = listObjects;
/**
 * 列举桶内全部对象
 * @param obsClient
 * @param bucketName
 * @param nextMarker
 */
function getAllObjects(obsClient, bucketName, nextMarker) {
    return __awaiter(this, void 0, void 0, function* () {
        const objList = [];
        let isTruncated = true;
        let marker = nextMarker;
        while (isTruncated) {
            const result = yield listObjects(obsClient, bucketName, '', marker);
            result.InterfaceResult.Contents.forEach((elem) => {
                objList.push({ Key: elem['Key'] });
            });
            isTruncated = result.InterfaceResult.IsTruncated === 'true';
            marker = result.InterfaceResult.NextMarker;
        }
        return objList;
    });
}
exports.getAllObjects = getAllObjects;
/**
 * 根据起始位置，列举多版本桶内对象
 * @param obsClient Obs客户端
 * @param bucketName 桶名
 * @param nextKeyMarker 列举多版本对象的起始位置
 * @param nextVersionIdMarker 多版本对象的版本, 与nextKeyMarker配合使用
 * @returns
 */
function listVersionObjects(obsClient, bucketName, nextKeyMarker, nextVersionIdMarker) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield obsClient.listVersions({
            Bucket: bucketName,
            KeyMarker: nextKeyMarker !== null && nextKeyMarker !== void 0 ? nextKeyMarker : '',
            VersionIdMarker: nextVersionIdMarker !== null && nextVersionIdMarker !== void 0 ? nextVersionIdMarker : '',
        });
    });
}
exports.listVersionObjects = listVersionObjects;
/**
 * 列举桶内全部多版本对象
 * @param obsClient
 * @param inputs
 * @param nextKeyMarker
 * @param nextVersionMaker
 */
function getAllVersionObjects(obsClient, bucketName, nextKeyMarker, nextVersionMaker) {
    return __awaiter(this, void 0, void 0, function* () {
        const objList = [];
        let isTruncated = true;
        let keyMarker = nextKeyMarker;
        let versionMaker = nextVersionMaker;
        while (isTruncated) {
            const result = yield listVersionObjects(obsClient, bucketName, keyMarker, versionMaker);
            result.InterfaceResult.Versions.forEach((elem) => {
                objList.push({
                    Key: elem['Key'],
                    VersionId: elem['VersionId'],
                });
            });
            result.InterfaceResult.DeleteMarkers.forEach((elem) => {
                objList.push({
                    Key: elem['Key'],
                    VersionId: elem['VersionId'],
                });
            });
            isTruncated = result.InterfaceResult.IsTruncated === 'true';
            keyMarker = result.InterfaceResult.NextKeyMarker;
            versionMaker = result.InterfaceResult.NextVersionIdMarker;
        }
        return objList;
    });
}
exports.getAllVersionObjects = getAllVersionObjects;
/**
 * 列举桶内分段上传任务
 * @param obsClient
 * @param bucketName
 * @param nextKeyMarker
 * @param nextUploadIdMarker
 * @returns
 */
function listMultipartUploads(obsClient, bucketName, nextKeyMarker, nextUploadIdMarker) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield obsClient.listMultipartUploads({
            Bucket: bucketName,
            KeyMarker: nextKeyMarker !== null && nextKeyMarker !== void 0 ? nextKeyMarker : '',
            UploadIdMarker: nextUploadIdMarker !== null && nextUploadIdMarker !== void 0 ? nextUploadIdMarker : '',
        });
    });
}
exports.listMultipartUploads = listMultipartUploads;
/**
 * 列举桶内全部分段上传任务
 * @param obsClient
 * @param bucketName
 * @param nextKeyMarker
 * @param nextUploadIdMarker
 * @returns
 */
function getAllMultipartUploads(obsClient, bucketName, nextKeyMarker, nextUploadIdMarker) {
    return __awaiter(this, void 0, void 0, function* () {
        const partList = [];
        let isTruncated = true;
        let keyMarker = nextKeyMarker;
        let uploadIdMarker = nextUploadIdMarker;
        while (isTruncated) {
            const result = yield listMultipartUploads(obsClient, bucketName, keyMarker, uploadIdMarker);
            result.InterfaceResult.Uploads.forEach((elem) => {
                partList.push({
                    Key: elem['Key'],
                    UploadId: elem['UploadId'],
                });
            });
            isTruncated = result.InterfaceResult.IsTruncated === 'true';
            keyMarker = result.InterfaceResult.NextKeyMarker;
            uploadIdMarker = result.InterfaceResult.NextUploadIdMarker;
        }
        return partList;
    });
}
exports.getAllMultipartUploads = getAllMultipartUploads;
/**
 * 判断桶内是否存在对象/多版本对象/任务
 * @param obsClient
 * @param bucketName
 * @returns
 */
function isBucketEmpty(obsClient, bucketName) {
    return __awaiter(this, void 0, void 0, function* () {
        if ((yield getBucketVersioning(obsClient, bucketName)) === 'Enabled') {
            return ((yield getAllVersionObjects(obsClient, bucketName)).length +
                (yield getAllMultipartUploads(obsClient, bucketName)).length ===
                0);
        }
        else if ((yield getBucketVersioning(obsClient, bucketName)) === 'Suspended') {
            return ((yield getAllObjects(obsClient, bucketName)).length +
                (yield getAllMultipartUploads(obsClient, bucketName)).length ===
                0);
        }
        return false;
    });
}
exports.isBucketEmpty = isBucketEmpty;
/**
 * 清空桶内全部对象和任务
 * @param obsClient
 * @param bucketName
 * @param clearBucket
 * @returns
 */
function clearBuckets(obsClient, bucketName, clearBucket) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!clearBucket) {
            return false;
        }
        if ((yield deleteAllObjects(obsClient, bucketName)) && (yield abortAllMultipartUpload(obsClient, bucketName))) {
            core.info(`The bucket : ${bucketName} is cleared successfully.`);
            return true;
        }
        return false;
    });
}
exports.clearBuckets = clearBuckets;
/**
 * 删除桶内全部对象/多版本对象
 * @param obsClient
 * @param bucketName
 * @returns
 */
function deleteAllObjects(obsClient, bucketName) {
    return __awaiter(this, void 0, void 0, function* () {
        let objectList = [];
        if ((yield getBucketVersioning(obsClient, bucketName)) === 'Enabled') {
            objectList = yield getAllVersionObjects(obsClient, bucketName);
        }
        else if ((yield getBucketVersioning(obsClient, bucketName)) === 'Suspended') {
            objectList = yield getAllObjects(obsClient, bucketName);
        }
        else {
            return false;
        }
        if (objectList.length === 0) {
            return true;
        }
        // 批量删除一次仅支持最大1000个
        while (objectList.length > 1000) {
            yield deleteObjects(obsClient, bucketName, objectList.splice(0, 1000));
        }
        yield deleteObjects(obsClient, bucketName, objectList);
        objectList = yield getAllObjects(obsClient, bucketName);
        if (objectList.length > 0) {
            core.info('delete all objects failed, please try again or delete objects by yourself.');
            return false;
        }
        else {
            return true;
        }
    });
}
exports.deleteAllObjects = deleteAllObjects;
/**
 * 批量删除对象/多版本对象
 * @param obsClient
 * @param bucketName
 * @param delList
 */
function deleteObjects(obsClient, bucketName, delList) {
    return __awaiter(this, void 0, void 0, function* () {
        obsClient
            .deleteObjects({
            Bucket: bucketName,
            Quiet: false,
            Objects: delList,
        })
            .then((result) => {
            if (result.CommonMsg.Status === 400) {
                core.info(`Delete failed because ${result.CommonMsg.Message}`);
            }
            else if (result.InterfaceResult.Errors.length > 0) {
                core.info(`Failed to delete objects: ${result.InterfaceResult.Errors}.`);
            }
            else {
                core.info(`Successfully delete ${delList.length} objects.`);
            }
        });
    });
}
/**
 * 取消桶内所有分段上传任务
 * @param obsClient
 * @param bucketName
 * @returns
 */
function abortAllMultipartUpload(obsClient, bucketName) {
    return __awaiter(this, void 0, void 0, function* () {
        const partList = yield getAllMultipartUploads(obsClient, bucketName);
        if (partList.length === 0) {
            return true;
        }
        for (const part of partList) {
            yield obsClient.abortMultipartUpload({
                Bucket: bucketName,
                Key: part.Key,
                UploadId: part.UploadId,
            });
        }
        return true;
    });
}
exports.abortAllMultipartUpload = abortAllMultipartUpload;
/**
 * 删除桶
 * @param obsClient
 * @param bucketNme
 * @returns
 */
function deleteBucket(obsClient, bucketNme, isBucketEmpty) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!isBucketEmpty) {
            clearBuckets(obsClient, bucketNme);
        }
        const result = yield obsClient.deleteBucket({
            Bucket: bucketNme,
        });
        if (result.CommonMsg.Status < 300) {
            core.info(`delete bucket: ${bucketNme} successfully.`);
            return true;
        }
        else {
            core.setFailed(`delete bucket: ${bucketNme} failed, because ${result.CommonMsg.Message}.`);
            return false;
        }
    });
}
exports.deleteBucket = deleteBucket;
