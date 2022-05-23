import * as core from '@actions/core';
import { CommonResult, ListObjectsResult, ListVersionsResult, ListMultipartResult, DeleteObjectsResult } from './types';

/**
 * 判断桶是否存在
 * @param obsClient obs客户端，因obsClient为引入的obs库的类型，本身并未导出其类型，故使用any，下同
 * @param bucketName 桶名
 * @returns
 */
export async function hasBucket(obsClient: any, bucketName: string): Promise<boolean> {
    const promise = await obsClient.headBucket({
        Bucket: bucketName,
    });
    return !(promise.CommonMsg.Status === 404);
}

/**
 * 创建桶
 * @param obsClient
 * @param bucketName
 */
export async function createBucket(
    obsClient: any,
    bucketName: string,
    location: string,
    ACL?: string,
    storageClass?: string
): Promise<boolean> {
    obsClient
        .createBucket({
            Bucket: bucketName,
            Location: location,
            ACL: ACL,
            StorageClass: storageClass,
        })
        .then((result: CommonResult) => {
            if (result.CommonMsg.Status < 300) {
                if (result.InterfaceResult) {
                    core.info('create bucket Successfully.');
                    return true;
                }
            } else {
                core.info('Message-->' + result.CommonMsg.Message);
                return false;
            }
        })
        .catch((err: string) => {
            core.info('Error-->' + err);
            return false;
        });
    return false;
}

/**
 * 获取桶的多版本状态
 * @param obsClient
 * @param bucketName
 * @returns
 */
export async function getBucketVersioning(obsClient: any, bucketName: string): Promise<string> {
    const result = await obsClient.getBucketVersioning({
        Bucket: bucketName,
    });
    if (result.CommonMsg.Status < 300) {
        return result.InterfaceResult.VersionStatus;
    } else {
        core.info(`get bucket versioning failed because ${result.CommonMsg.Message}`);
        return '';
    }
}

/**
 * 根据前缀和起始位置，列举桶内对象
 * @param obsClient Obs客户端
 * @param bucketName 桶名
 * @param obsPath obs上请求的对象前缀
 * @param marker 起始位置
 * @returns
 */
export async function listObjects(
    obsClient: any,
    bucketName: string,
    obsPath: string,
    marker?: string
): Promise<ListObjectsResult> {
    return await obsClient.listObjects({
        Bucket: bucketName,
        Prefix: obsPath,
        Marker: marker ?? '',
    });
}

/**
 * 列举桶内全部对象
 * @param obsClient
 * @param bucketName
 * @param nextMarker
 */
export async function getAllObjects(
    obsClient: any,
    bucketName: string,
    nextMarker?: string
): Promise<{ Key: string }[]> {
    const objList: { Key: string }[] = [];
    let isTruncated = true;
    let marker = nextMarker;

    while (isTruncated) {
        const result = await listObjects(obsClient, bucketName, '', marker);

        result.InterfaceResult.Contents.forEach((elem) => {
            objList.push({ Key: elem['Key'] });
        });
        isTruncated = result.InterfaceResult.IsTruncated === 'true';
        marker = result.InterfaceResult.NextMarker;
    }
    return objList;
}

/**
 * 根据起始位置，列举多版本桶内对象
 * @param obsClient Obs客户端
 * @param bucketName 桶名
 * @param nextKeyMarker 列举多版本对象的起始位置
 * @param nextVersionIdMarker 多版本对象的版本, 与nextKeyMarker配合使用
 * @returns
 */
export async function listVersionObjects(
    obsClient: any,
    bucketName: string,
    nextKeyMarker?: string,
    nextVersionIdMarker?: string
): Promise<ListVersionsResult> {
    return await obsClient.listVersions({
        Bucket: bucketName,
        KeyMarker: nextKeyMarker ?? '',
        VersionIdMarker: nextVersionIdMarker ?? '',
    });
}

/**
 * 列举桶内全部多版本对象
 * @param obsClient
 * @param inputs
 * @param nextKeyMarker
 * @param nextVersionMaker
 */
export async function getAllVersionObjects(
    obsClient: any,
    bucketName: string,
    nextKeyMarker?: string,
    nextVersionMaker?: string
): Promise<{ Key: string; VersionId: string }[]> {
    const objList: { Key: string; VersionId: string }[] = [];
    let isTruncated = true;
    let keyMarker = nextKeyMarker;
    let versionMaker = nextVersionMaker;

    while (isTruncated) {
        const result = await listVersionObjects(obsClient, bucketName, keyMarker, versionMaker);

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
}

/**
 * 列举桶内分段上传任务
 * @param obsClient
 * @param bucketName
 * @param nextKeyMarker
 * @param nextUploadIdMarker
 * @returns
 */
export async function listMultipartUploads(
    obsClient: any,
    bucketName: string,
    nextKeyMarker?: string,
    nextUploadIdMarker?: string
): Promise<ListMultipartResult> {
    return await obsClient.listMultipartUploads({
        Bucket: bucketName,
        KeyMarker: nextKeyMarker ?? '',
        UploadIdMarker: nextUploadIdMarker ?? '',
    });
}

/**
 * 列举桶内全部分段上传任务
 * @param obsClient
 * @param bucketName
 * @param nextKeyMarker
 * @param nextUploadIdMarker
 * @returns
 */
export async function getAllMultipartUploads(
    obsClient: any,
    bucketName: string,
    nextKeyMarker?: string,
    nextUploadIdMarker?: string
): Promise<{ Key: string; UploadId: string }[]> {
    const partList: { Key: string; UploadId: string }[] = [];
    let isTruncated = true;
    let keyMarker = nextKeyMarker;
    let uploadIdMarker = nextUploadIdMarker;

    while (isTruncated) {
        const result = await listMultipartUploads(obsClient, bucketName, keyMarker, uploadIdMarker);

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
}

/**
 * 判断桶内是否存在对象/多版本对象/任务
 * @param obsClient
 * @param bucketName
 * @returns
 */
export async function isBucketEmpty(obsClient: any, bucketName: string): Promise<boolean> {
    if ((await getBucketVersioning(obsClient, bucketName)) === 'Enabled') {
        return (
            (await getAllVersionObjects(obsClient, bucketName)).length +
                (await getAllMultipartUploads(obsClient, bucketName)).length ===
            0
        );
    } else if ((await getBucketVersioning(obsClient, bucketName)) === 'Suspended') {
        return (
            (await getAllObjects(obsClient, bucketName)).length +
                (await getAllMultipartUploads(obsClient, bucketName)).length ===
            0
        );
    }
    return false;
}

/**
 * 清空桶内全部对象和任务
 * @param obsClient
 * @param bucketName
 * @param clearBucket
 * @returns
 */
export async function clearBuckets(obsClient: any, bucketName: string, clearBucket?: boolean): Promise<boolean> {
    if (!clearBucket) {
        return false;
    }
    if ((await deleteAllObjects(obsClient, bucketName)) && (await abortAllMultipartUpload(obsClient, bucketName))) {
        core.info(`The bucket : ${bucketName} is cleared successfully.`);
        return true;
    }
    return false;
}

/**
 * 删除桶内全部对象/多版本对象
 * @param obsClient
 * @param bucketName
 * @returns
 */
export async function deleteAllObjects(obsClient: any, bucketName: string): Promise<boolean> {
    let objectList: { Key: string; VersionId: string }[] | { Key: string }[] = [];
    if ((await getBucketVersioning(obsClient, bucketName)) === 'Enabled') {
        objectList = await getAllVersionObjects(obsClient, bucketName);
    } else if ((await getBucketVersioning(obsClient, bucketName)) === 'Suspended') {
        objectList = await getAllObjects(obsClient, bucketName);
    } else {
        return false;
    }

    if (objectList.length === 0) {
        return true;
    }
    // 批量删除一次仅支持最大1000个
    while (objectList.length > 1000) {
        await deleteObjects(obsClient, bucketName, objectList.splice(0, 1000));
    }
    await deleteObjects(obsClient, bucketName, objectList);

    objectList = await getAllObjects(obsClient, bucketName);
    if (objectList.length > 0) {
        core.info('delete all objects failed, please try again or delete objects by yourself.');
        return false;
    } else {
        return true;
    }
}

/**
 * 批量删除对象/多版本对象
 * @param obsClient
 * @param bucketName
 * @param delList
 */
async function deleteObjects(
    obsClient: any,
    bucketName: string,
    delList: { Key: string; VersionId: string }[] | { Key: string }[]
) {
    obsClient
        .deleteObjects({
            Bucket: bucketName,
            Quiet: false,
            Objects: delList,
        })
        .then((result: DeleteObjectsResult) => {
            if (result.CommonMsg.Status === 400) {
                core.info(`Delete failed because ${result.CommonMsg.Message}`);
            } else if (result.InterfaceResult.Errors.length > 0) {
                core.info(`Failed to delete objects: ${result.InterfaceResult.Errors}.`);
            } else {
                core.info(`Successfully delete ${delList.length} objects.`);
            }
        });
}

/**
 * 取消桶内所有分段上传任务
 * @param obsClient
 * @param bucketName
 * @returns
 */
export async function abortAllMultipartUpload(obsClient: any, bucketName: string): Promise<boolean> {
    const partList = await getAllMultipartUploads(obsClient, bucketName);
    if (partList.length === 0) {
        return true;
    }

    for (const part of partList) {
        await obsClient.abortMultipartUpload({
            Bucket: bucketName,
            Key: part.Key,
            UploadId: part.UploadId,
        });
    }

    return true;
}

/**
 * 删除桶
 * @param obsClient
 * @param bucketNme
 * @returns
 */
export async function deleteBucket(obsClient: any, bucketNme: string, isBucketEmpty: boolean): Promise<boolean> {
    if (!isBucketEmpty) {
        clearBuckets(obsClient, bucketNme);
    }

    const result = await obsClient.deleteBucket({
        Bucket: bucketNme,
    });

    if (result.CommonMsg.Status < 300) {
        core.info(`delete bucket: ${bucketNme} successfully.`);
        return true;
    } else {
        core.setFailed(`delete bucket: ${bucketNme} failed, because ${result.CommonMsg.Message}.`);
        return false;
    }
}
