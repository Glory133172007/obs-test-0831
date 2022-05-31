# HuaweiCloud OBS Helper
[OBS Helper action](https://github.com/marketplace/actions/huaweicloud-obs-helper)基于github workflow，用于访问管理华为云对象存储服务（[Object Storage Service，OBS](https://www.huaweicloud.com/product/obs.html)）  
您可以使用该action实现：  
1、上传文件/文件夹  
2、下载文件/文件夹  
3、创建桶  
4、删除桶  
本文件仅做基础功能示例，不同场景下的参数使用和使用样例请访问[OBS Helper Workflow Sample](https://github.com/huaweicloud/obs-helper-workflow-sample)  
## **前置工作**
1、需要开通华为云的OBS服务，并建好桶，[OBS主页](https://www.huaweicloud.com/product/obs.html)，[OBS文档](https://support.huaweicloud.com/obs/)；  
2、需要在项目的setting--Secret--Actions下添加华为云OBS服务的ACCESSKEY、SECRETACCESSKEY两个参数，[获取ak/sk方式](https://support.huaweicloud.com/api-obs/obs_04_0116.html)；  
3、注意替换参数region和参数bucket_name为自己OBS服务的真实region和桶名；  
## **上传下载对象参数说明**
**access_key**: 华为云账号的AK字符串，需要加密，请参照**前置工作**中的步骤2进行设置并使用，**必填**；  
**secret_key**：华为云账号的SK字符串，需要加密，请参照**前置工作**中的步骤2进行设置并使用，**必填**；  
**region**：OBS所在区域字符串，默认为*cn-north-4*，**必填**；  
**bucket_name**：OBS的目标桶名，**必填**；  
**operation_type**：要进行的操作，上传请使用*upload*，下载请使用*download*，**必填**；  
**local_file_path**：对象的本地路径，上传对象时可填写多个，**必填**；  
**obs_file_path**：对象在桶内的路径，**必填**；  
**include_self_folder**：上传/下载文件夹时是否包含文件夹自身，默认为*false*，不填时默认不包含，**选填**；  
**exclude**：下载对象时，要排除的对象，上传时无用，不填时默认不排除，**选填**；  

## **创建删除桶参数说明**
**access_key**: 华为云账号的AK字符串，需要加密，请参照**前置工作**中的步骤2进行设置并使用，**必填**；  
**secret_key**：华为云账号的SK字符串，需要加密，请参照**前置工作**中的步骤2进行设置并使用，**必填**；  
**region**：OBS所在区域字符串，默认为*cn-north-4*，**必填**；  
**bucket_name**：OBS的目标桶名，**必填**；  
**operation_type**：要进行的操作，创建桶请使用*createbucket*，删除桶请使用*deletebucket*，**必填**；  
**ACL**：创建桶时，桶的预定义访问策略，默认为*AclPrivate*（私有读写），**选填**；  
**storage_class**： 创建桶时，桶的存储类型，默认为*StorageClassStandard*（标准存储），**选填**；  
**clear_bucket**：删除桶时，是否清空桶内全部对象/碎片，默认为*true*，**选填**；  

目前OBS支持的区域名称和对应region如下
```text
  非洲-约翰内斯堡：  af-south-1	
  华北-北京四：	 cn-north-4	
  华北-北京一：	 cn-north-1	
  华北-乌兰察布一：  cn-north-9	
  华东-上海二：	 cn-east-2	
  华东-上海一：	 cn-east-3	
  华南-广州：	 cn-south-1	
  拉美-墨西哥城二：  la-north-2	
  拉美-墨西哥城一：  na-mexico-1	
  拉美-圣保罗一：  sa-brazil-1	
  拉美-圣地亚哥：  la-south-2	
  西南-贵阳一：	 cn-southwest-2	
  亚太-曼谷：	 ap-southeast-2	
  亚太-新加坡：	 ap-southeast-3	
  中国-香港：	 ap-southeast-1	
```
目前OBS支持的预定义访问策略(ACL)如下
```text
  私有读写： AclPrivate
  公共读： AclPublicRead
  公共读写： AclPublicReadWrite
  桶公共读，桶内对象公共读： AclPublicReadDelivered
  桶公共读写，桶内对象公共读写： AclPublicReadWriteDelivered
```
目前OBS支持的存储类型(storage_class)如下
```text
  标准存储： StorageClassStandard
  低频访问存储： StorageClassWarm
  归档存储： StorageClassCold
```
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
          region: 'cn-north-4'
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
          region: 'cn-north-4'
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
          region: 'cn-north-4'
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
          region: 'cn-north-4'
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
          region: 'cn-north-4'
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
          region: 'cn-north-4'
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
          region: 'cn-north-4'
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
          region: 'cn-north-4'
          bucket_name: 'new-bucket'
          operation_type: 'deleteBucket'
```
执行成功后，您在obs的桶'new-bucket'以及其中所有对象和碎片将被删除