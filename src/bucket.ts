import { Inputs, ListBucketResult } from './types';

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
 * 根据前缀和起始位置，列举桶内对象
 * @param obsClient Obs客户端
 * @param inputs 用户输入的参数
 * @param obsPath obs上请求的对象前缀
 * @param marker 起始位置
 * @returns
 */
export async function listObjects(
    obsClient: any,
    inputs: Inputs,
    obsPath: string,
    marker?: string
): Promise<ListBucketResult> {
    return await obsClient.listObjects({
        Bucket: inputs.bucket_name,
        Prefix: obsPath,
        Marker: marker ?? '',
    });
}
