// 判断桶是否存在
export async function hasBucket(obsClient: any, bucketName: string): Promise<boolean> {
    const promise = await obsClient.headBucket({
        Bucket : bucketName
    });
    return !(promise.CommonMsg.Status === 404);
}

// 列举桶内对象
export async function listObjects(obsClient: any, bucketName: string): Promise<string[]> {
    const objList: string[] = [];
    const promise = await obsClient.listObjects({
        Bucket: bucketName
    });
    promise.InterfaceResult.Contents.forEach((element: any) => {
        objList.push(element['Key']);
    });
    return objList;
}
