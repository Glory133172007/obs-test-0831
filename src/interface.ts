import stream from "stream";

export interface Inputs {
    accessKey: string, // ak
    secretKey: string, // sk
    bucketName: string, // 桶名
    operationType: string, // 'upload' || 'download'
    region: string, // 节点
    localFilePath: string[],  // 本地文件路径
    obsFilePath: string, // 桶内路径, 为空时即从根目录起
    includeSelfFolder?: string, // 上传时是否包含根文件夹
    exclude?: string[] // 要排除的目录/文件
}

export interface CommonResult {
    CommonMsg: CommonMsg,
    InterfaceResult: CommonInterfaceResult
}

export interface CommonMsg {
    Status: number,
    Code: string,
    Message: string,
    HostId: string,
    RequestId: string,
    Id2: string,
    Indicator: string
}

export interface CommonInterfaceResult {
    RequestId: string,
    Id2: string
}

export interface ListBucketResult {
    CommonMsg: CommonMsg,
    InterfaceResult: ListBucketInterfaceResult
}

export interface ListBucketInterfaceResult extends CommonInterfaceResult {
    RequestId: string,
    Location: string,
    Bucket: string,
    Delimiter: string,
    IsTruncated: string,
    Prefix: string,
    Marker: string,
    NextMarker: string,
    MaxKeys: string,
    Contents: ObjectItem[],
    CommonPrefixes: string[]
}

export interface ObjectItem {
    ETag: string,
    Size: string,
    Key: string,
    LastModified: string,
    Owner: {
        ID: string
    },
    StorageClass: string,
    Type: string
}

export interface PutObjectResult {
    CommonMsg: CommonMsg,
    InterfaceResult: PutObjectInterfaceResult
}

export interface PutObjectInterfaceResult extends CommonInterfaceResult {
    RequestId: string,
    ETag: string,
    VersionId: string,
    StorageClass: string,
    SseKms: string,
    SseKmsKey: string,
    SseC: string,
    SseCKeyMd5: string
}

export interface GetObjectResult {
    CommonMsg: CommonMsg,
    InterfaceResult: GetObjectInterfaceResult
}

export interface GetObjectInterfaceResult {
    RequestId: string,
    DeleteMarker: string,
    LastModified: string,
    ContentLength: string,
    CacheControl: string,
    ContentDisposition: string,
    ContentEncoding: string,
    ContentLanguage: string,
    ContentType: string,
    Expires: string,
    ETag: string,
    VersionId: string,
    WebsiteRedirectLocation: string,
    StorageClass: string,
    Restore: string,
    AllowOrigin: string,
    AllowHeader: string,
    AllowMethod: string,
    ExposeHeader: string,
    MaxAgeSeconds: string,
    SseKms: string,
    SseKmsKey: string,
    SseC: string,
    SseCKeyMd5: string,
    Expiration: string,
    Content: string | stream.Readable,
    Metadata: any // 官网描述类型为Object, 描述为'对象自定义元数据'
}

export interface UploadFileList {
    file: UploadFile[],
    folder: string[]
}

export interface UploadFile {
    local: string,
    obs: string
}