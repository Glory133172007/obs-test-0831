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
 * 列举桶内对象
 * @param obsClient obs客户端
 * @param bucketName 桶名
 * @returns
 */
export async function listObjects(obsClient: any, bucketName: string): Promise<string[]> {
    const objList: string[] = [];
    const promise = await obsClient.listObjects({
        Bucket: bucketName,
    });
    promise.InterfaceResult.Contents.forEach((element: any) => {
        objList.push(element['Key']);
    });
    return objList;
}
