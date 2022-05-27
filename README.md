# HuaweiCloud OBS Helper
obs-helper action用于访问管理华为云对象存储服务（[Object Storage Service，OBS](https://www.huaweicloud.com/product/obs.html)）,  
您可以使用该action对OBS进行上传文件/文件夹、下载文件/文件夹、新增/删除桶。

## **上传文件用法**
假设本地文件夹的格式如下：
```text
└── src1
    ├── src2
          ├── test1.txt
          └── test2.txt
    └── src3
          └── test3.txt
```

### 上传文件
```yaml
jobs:
  upload_file:
    runs-on: ubuntu-latest
    steps:
      - name: Upload To HuaweiCloud OBS
        uses: huaweicloud/obs-helper@v1.2.0
        id: upload_file_to_obs
        with:
          access_key: ${{ secrets.ACCESSKEY }}
          secret_key: ${{ secrets.SECRETACCESSKEY }}
          region: 'region'
          bucket_name: 'bucket-test'
          local_file_path: 'src1/src2/test1.txt'
          obs_file_path: ''
          operation_type: 'upload'
```
成功上传后，桶内生成对象为：
```text
/obs://bucket-test/test1.txt
```

### 上传文件夹(包含文件夹自身)
```yaml
jobs:
  upload_folder:
    runs-on: ubuntu-latest
    steps:
      - name: Upload To HuaweiCloud OBS
        uses: huaweicloud/obs-helper@v1.2.0
        id: upload_folder_to_obs
        with:
          access_key: ${{ secrets.ACCESSKEY }}
          secret_key: ${{ secrets.SECRETACCESSKEY }}
          region: 'region'
          bucket_name: 'bucket-test'
          local_file_path: 'src1/'
          obs_file_path: 'src'
          operation_type: 'upload'
          include_self_folder: true
```
成功上传后，桶内生成对象为：
```text
  src
    └── src1
          ├── src2
                ├── test1.txt
                └── test2.txt
          └── src3
                └── test3.txt
```

### 上传多个文件和文件夹(不包含文件夹自身)
```yaml
jobs:
  upload_files:
    runs-on: ubuntu-latest
    steps:
      - name: Upload To HuaweiCloud OBS
        uses: huaweicloud/obs-helper@v1.2.0
        id: upload_files_to_obs
        with:
          access_key: ${{ secrets.ACCESSKEY }}
          secret_key: ${{ secrets.SECRETACCESSKEY }}
          region: 'region'
          bucket_name: 'bucket-test'
          local_file_path: |
            'src1/src2/test1.txt'
            'src1/src3'
          obs_file_path: 'src'
          operation_type: 'upload'
          include_self_folder: false
```
成功上传后，桶内生成对象为：
```text
  src 
    └── test1.txt
    └── src3
          └── test3.txt
```

## **下载文件用法**
假设bucket-test桶内包含如下对象：
```text
test1.txt
src1
  ├── src2
        ├── test2.txt
        └── test3.txt
  └── src3
        └── test4.txt
```

### 下载文件
```yaml
jobs:
  download_file:
    runs-on: ubuntu-latest
    steps:
      - name: Download File From HuaweiCloud OBS
        uses: huaweicloud/obs-helper@v1.2.0
        id: download_file_from_obs
        with:
          access_key: ${{ secrets.ACCESSKEY }}
          secret_key: ${{ secrets.SECRETACCESSKEY }}
          region: 'region'
          bucket_name: 'bucket-test'
          local_file_path: 'src1/'
          obs_file_path: 'test1.txt'
          operation_type: 'download'
```
下载完成后，本地生成的文件为：
```text
└── src1
      └── test1.txt
```

### 下载文件夹(包含文件夹自身)
```yaml
jobs:
  download_folder:
    runs-on: ubuntu-latest
    steps:
      - name: Download From HuaweiCloud OBS
        uses: huaweicloud/obs-helper@v1.2.0
        id: download_folder_from_obs
        with:
          access_key: ${{ secrets.ACCESSKEY }}
          secret_key: ${{ secrets.SECRETACCESSKEY }}
          region: 'region'
          bucket_name: 'bucket-test'
          local_file_path: 'src'
          obs_file_path: 'src1'
          operation_type: 'download'
          include_self_folder: true
```
下载完成后，本地生成的文件为：
```text
src
  └── src1
        ├── src2
              ├── test2.txt
              └── test3.txt
        └── src3
              └── test4.txt
```

### 下载文件夹(不包含文件夹自身，排除下载桶内src1/sr2/test3.txt和src1/src3目录下的所有文件)
```yaml
jobs:
  download_folder:
    runs-on: ubuntu-latest
    steps:
      - name: Download From HuaweiCloud OBS
        uses: huaweicloud/obs-helper@v1.2.0
        id: download_folder_from_obs
        with:
          access_key: ${{ secrets.ACCESSKEY }}
          secret_key: ${{ secrets.SECRETACCESSKEY }}
          region: 'region'
          bucket_name: 'bucket-test'
          local_file_path: 'src'
          obs_file_path: 'src1'
          operation_type: 'download'
          include_self_folder: false
          exclude: |
            'src1/src2/test3.txt'
            'src1/src3'
```
下载完成后，本地生成的文件为：
```text
src
  └── src2
        └── test2.txt
```

## **创建桶用法**
创建新桶时，可指定预定义访问策略(ACL)和存储类型(storage_class)，若不指定，默认预定义访问策略为私有读写(AclPrivate)，存储类型为标准存储(StorageClassStandard)  
目前OBS支持的预定义访问策略如下
```text
  私有读写： AclPrivate
  公共读： AclPublicRead
  公共读写： AclPublicReadWrite
  桶公共读，桶内对象公共读： AclPublicReadDelivered
  桶公共读写，桶内对象公共读写： AclPublicReadWriteDelivered
```
目前OBS支持的存储类型如下
```text
  标准存储： StorageClassStandard
  低频访问存储：StorageClassWarm
  归档存储： StorageClassCold
```
### 创建名为'new-bucket'的桶（公共读写、低频访问存储）
假设您的OBS中不存在名为'new-bucket'的桶
```yaml
jobs:
  create_bucket:
    runs-on: ubuntu-latest
    steps:
      - name: Create Bucket on HuaweiCloud OBS
        uses: huaweicloud/obs-helper@v1.2.0
        id: create_bucket_on_obs
        with:
          access_key: ${{ secrets.ACCESSKEY }}
          secret_key: ${{ secrets.SECRETACCESSKEY }}
          region: 'region'
          bucket_name: 'new-bucket'
          operation_type: 'createBucket'
          ACL: 'AclPublicReadWrite'
          storage_class: 'StorageClassWarm'
```
执行成功后，OBS中会创建一个名为'new-bucket'、预定义访问策略为公共读写，存储类型为低频访问存储的桶

## **删除桶用法**
删除桶操作会自动清空桶内所有对象和碎片，若您不确定桶内是否有重要对象未备份，请设置参数'clear_bucker'为false  
### 删除名为'new-bucket'的桶（自动清空桶内所有对象和碎片）
假设您的obs中存在名为'new-bucket'的桶
```yaml
jobs:
  delete_bucket:
    runs-on: ubuntu-latest
    steps:
      - name: Delete Bucket on HuaweiCloud OBS
        uses: huaweicloud/obs-helper@v1.2.0
        id: delete_bucket_on_obs
        with:
          access_key: ${{ secrets.ACCESSKEY }}
          secret_key: ${{ secrets.SECRETACCESSKEY }}
          region: 'region'
          bucket_name: 'new-bucket'
          operation_type: 'deleteBucket'
```
执行成功后，您在obs的桶'new-bucket'以及其中所有对象和碎片将被删除