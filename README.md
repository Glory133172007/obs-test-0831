# HuaweiCloud OBS Helper
obs-helper action用于访问管理华为云对象存储服务（[Object Storage Service，OBS](https://www.huaweicloud.com/product/obs.html)），您可以使用该action对OBS进行上传文件/文件夹、下载文件/文件夹。

## **上传文件用法**
假设本地文件夹的格式如下：
```text
└── src1
    ├── src2
          └── test1.txt
          └── test2.txt
    ├── src3
          └── test3.txt
```

### 上传文件
```yaml
jobs:
  upload_file:
    runs-on: ubuntu-latest
    steps:
      - name: Upload To HuaweiCloud OBS
        uses: huaweicloud/obs-helper@v1.0.0
        id: upload_file_to_obs
        with:
          access_key: ${{ secrets.ACCESSKEY }}
          secret_key: ${{ secrets.SECRETACCESSKEY }}
          region: region
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
  upload_file:
    runs-on: ubuntu-latest
    steps:
      - name: Upload To HuaweiCloud OBS
        uses: huaweicloud/obs-helper@v1.0.0
        id: upload_file_to_obs
        with:
          access_key: ${{ secrets.ACCESSKEY }}
          secret_key: ${{ secrets.SECRETACCESSKEY }}
          region: region
          bucket_name: 'bucket-test'
          local_file_path: 'src1/'
          obs_file_path: 'src'
          operation_type: 'upload'
          include_self_folder: 'yes'
```
成功上传后，桶内生成对象为：
```text
  src
    └── src1
        ├── src2
            └── test1.txt
            └── test2.txt
        ├── src3
            └── test3.txt
```

### 上传多个文件和文件夹(不包含文件夹自身)
```yaml
jobs:
  upload_file:
    runs-on: ubuntu-latest
    steps:
      - name: Upload To HuaweiCloud OBS
        uses: huaweicloud/obs-helper@v1.0.0
        id: upload_file_to_obs
        with:
          access_key: ${{ secrets.ACCESSKEY }}
          secret_key: ${{ secrets.SECRETACCESSKEY }}
          region: region
          bucket_name: 'bucket-test'
          local_file_path: 'src1/src2/test1.txt'
                          'src1/src3'
          obs_file_path: 'src'
          operation_type: 'upload'
          include_self_folder: 'no'
```
成功上传后，桶内生成对象为：
```text
  src
    └── src2
          └── test1.txt
    ├── src3
          └── test3.txt
```

## **下载文件用法**
假设bucket-test桶内包含如下对象：
```text
test1.txt
src1
  ├── src2
        └── test2.txt
        └── test3.txt
  ├── src3
        └── test4.txt
```

### 下载文件
```yaml
jobs:
  upload_file:
    runs-on: ubuntu-latest
    steps:
      - name: Upload To HuaweiCloud OBS
        uses: huaweicloud/obs-helper@v1.0.0
        id: upload_file_to_obs
        with:
          access_key: ${{ secrets.ACCESSKEY }}
          secret_key: ${{ secrets.SECRETACCESSKEY }}
          region: region
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
  upload_file:
    runs-on: ubuntu-latest
    steps:
      - name: Upload To HuaweiCloud OBS
        uses: huaweicloud/obs-helper@v1.0.0
        id: upload_file_to_obs
        with:
          access_key: ${{ secrets.ACCESSKEY }}
          secret_key: ${{ secrets.SECRETACCESSKEY }}
          region: region
          bucket_name: 'bucket-test'
          local_file_path: 'src'
          obs_file_path: 'src1'
          operation_type: 'download'
          include_self_folder: 'true'
```
下载完成后，本地生成的文件为：
```text
src
  └── src1
        ├── src2
              └── test1.txt
              └── test2.txt
        ├── src3
              └── test3.txt
```

### 下载文件夹(不包含文件夹自身，排除下载桶内src1/sr2/test1.txt和src1/src3目录下的所有文件)
```yaml
jobs:
  upload_file:
    runs-on: ubuntu-latest
    steps:
      - name: Upload To HuaweiCloud OBS
        uses: huaweicloud/obs-helper@v1.0.0
        id: upload_file_to_obs
        with:
          access_key: ${{ secrets.ACCESSKEY }}
          secret_key: ${{ secrets.SECRETACCESSKEY }}
          region: region
          bucket_name: 'bucket-test'
          local_file_path: 'src'
          obs_file_path: 'src1'
          operation_type: 'download'
          include_self_folder: 'no'
          exclude: 'src1/src2/test1.txt'
                  'src1/src3'
```
下载完成后，本地生成的文件为：
```text
src
  └── src2
        └── test2.txt
```
