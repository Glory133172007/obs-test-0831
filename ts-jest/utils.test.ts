import * as fs from 'fs';
import * as utils from '../src/utils';
import { expect, test } from '@jest/globals';

test('test is region legal', () => {
    const result1 = utils.checkRegion('cn-north-4');
    expect(result1).toBeTruthy();

    const result2 = utils.checkRegion('cn-north-5');
    expect(result2).toBeFalsy();

    const result3 = utils.checkRegion('cn-north-');
    expect(result3).toBeFalsy();
});

test('test replace \\ to /', () => {
    const path1 = utils.replaceSlash('a\\b\\\\c');
    expect(path1).toEqual('a/b//c');

    const path2 = utils.replaceSlash('a\\c\\\\');
    expect(path2).toEqual('a/c//');

    const path3 = utils.replaceSlash('a/b/c');
    expect(path3).toEqual('a/b/c');

    const path4 = utils.replaceSlash('a/b\\\\c/');
    expect(path4).toEqual('a/b//c/');
});

test('test get last item with slash from Path', () => {
    const filePath1 = utils.getLastItemWithSlash('test.txt');
    expect(filePath1).toEqual('test.txt');

    const filePath2 = utils.getLastItemWithSlash('/test');
    expect(filePath2).toEqual('test');

    const filePath3 = utils.getLastItemWithSlash('/usr/local/test.zip');
    expect(filePath3).toEqual('test.zip');

    const filePath5 = utils.getLastItemWithSlash('./local/test.zip');
    expect(filePath5).toEqual('test.zip');
 });

 test('test del first rootPath in path', () => {
    const result1 = utils.getPathWithoutRootPath('src/src1/src1-1','src/src1/src1-1/src/src1/src1-1/test.txt')
    expect(result1).toEqual('/src/src1/src1-1/test.txt');
    
    const result2 = utils.getPathWithoutRootPath('src/','src/src1/src1-1/src/src1/src1-1/test.txt')
    expect(result2).toEqual('src1/src1-1/src/src1/src1-1/test.txt');
    
    const result3 = utils.getPathWithoutRootPath('src/te','src/test.txt')
    expect(result3).toEqual('st.txt');
    
    const result4 = utils.getPathWithoutRootPath('src/tast.txt','src/test.txt')
    expect(result4).toEqual('src/test.txt');
    
    const result5 = utils.getPathWithoutRootPath('crs','src/test.txt')
    expect(result5).toEqual('src/test.txt');
 });

 test('test path is end with "/" or not', () => {
    const path1 = utils.isEndWithSlash('a/');
    expect(path1).toBeTruthy();

    const path2 = utils.isEndWithSlash('a/b.');
    expect(path2).toBeFalsy();

    const path3 = utils.isEndWithSlash('');
    expect(path3).toBeFalsy();
 });

 test('test delete "/" in the end of the path if "/" exist', () => {
    const path1 = utils.getStringDelLastSlash('a/');
    expect(path1).toEqual('a');

    const path2 = utils.getStringDelLastSlash('a/b//');
    expect(path2).toEqual('a/b/');

    const path3 = utils.getStringDelLastSlash('a/b.');
    expect(path3).toEqual('a/b.');

    const path4 = utils.getStringDelLastSlash('');
    expect(path4).toEqual('');
 });

 // 创建文件夹
 test('test create folder', () => {
   const folder1 = utils.createFolder('resource/newFolder');
   expect(fs.existsSync('resource/newFolder')).toBeTruthy();
});

 // 检查文件是否超过5GB
 test('test file is oversized', () => {
   const over1 = utils.isFileOverSize('resource/bigFile.zip');
   expect(over1).toBeTruthy();

   const over2 = utils.isFileOverSize('resource/uploadDir/file1.txt');
   expect(over2).toBeFalsy();
});

 // 检查ak/sk是否合法
 test('test file is oversized', () => {
   const input1 = {
      access_key: '******',
      secret_key: '******',
      bucket_name: '******',
      operation_type: 'upload',
      obs_file_path: 'uploadtest1/',
      local_file_path: ['resource/bigFile.zip'],
      region: 'cn-north-6',
   }
   const legal1 = utils.checkAkSk(input1);
   expect(legal1).toBeTruthy();

   const input2 = {
      access_key: 'KQC3',
      secret_key: '******11111222222233333444444',
      bucket_name: '******',
      operation_type: 'upload',
      obs_file_path: 'uploadtest1/',
      local_file_path: ['resource/bigFile.zip'],
      region: 'cn-north-6',
   }
   const legal2 = utils.checkAkSk(input2);
   expect(legal2).toBeFalsy();
});

test('check operation_type', () => {
  expect(utils.checkOperationType('upload')).toBeTruthy();
  expect(utils.checkOperationType('DownLoad')).toBeTruthy();
  expect(utils.checkOperationType('xiazai')).toBeFalsy();
  expect(utils.checkOperationType('上传')).toBeFalsy();
});

test('check local_file_path and obs_file_path when upload', () => {
   const input1 = {
      access_key: '******',
      secret_key: '******',
      bucket_name: '******',
      operation_type: 'upload',
      obs_file_path: 'uploadtest1',
      local_file_path: ['resource/bigFile.zip'],
      region: 'cn-north-6',
   };
   expect(utils.checkUploadFilePath(input1)).toBeTruthy();
   const input2 = {
      access_key: '******',
      secret_key: '******',
      bucket_name: '******',
      operation_type: 'upload',
      obs_file_path: 'uploadtest1',
      local_file_path: ['resource/bigFile.zip', 'resource/a.txt'],
      region: 'cn-north-6',
   };
   expect(utils.checkUploadFilePath(input2)).toBeFalsy();
   const input3 = {
      access_key: '******',
      secret_key: '******',
      bucket_name: '******',
      operation_type: 'upload',
      obs_file_path: 'uploadtest1',
      local_file_path: [],
      region: 'cn-north-6',
   };
   expect(utils.checkUploadFilePath(input3)).toBeFalsy();
   const input4 = {
      access_key: '******',
      secret_key: '******',
      bucket_name: '******',
      operation_type: 'upload',
      obs_file_path: 'uploadtest1',
      local_file_path: [''],
      region: 'cn-north-6',
   };
   expect(utils.checkUploadFilePath(input4)).toBeFalsy();
});


test('check local_file_path and obs_file_path when download', () => {
   const input1 = {
      access_key: '******',
      secret_key: '******',
      bucket_name: '******',
      operation_type: 'download',
      obs_file_path: 'uploadtest1',
      local_file_path: ['resource/bigFile.zip'],
      region: 'cn-north-6',
   };
   expect(utils.checkDownloadFilePath(input1)).toBeTruthy();
   const input2 = {
      access_key: '******',
      secret_key: '******',
      bucket_name: '******',
      operation_type: 'download',
      obs_file_path: 'uploadtest1',
      local_file_path: ['resource/bigFile.zip', 'resource/a.txt'],
      region: 'cn-north-6',
   };
   expect(utils.checkDownloadFilePath(input2)).toBeFalsy();
   const input3 = {
      access_key: '******',
      secret_key: '******',
      bucket_name: '******',
      operation_type: 'download',
      obs_file_path: 'uploadtest1',
      local_file_path: [],
      region: 'cn-north-6',
   };
   expect(utils.checkDownloadFilePath(input3)).toBeFalsy();
   const input4 = {
      access_key: '******',
      secret_key: '******',
      bucket_name: '******',
      operation_type: 'download',
      obs_file_path: 'uploadtest1',
      local_file_path: [''],
      region: 'cn-north-6',
   };
   expect(utils.checkDownloadFilePath(input4)).toBeFalsy();
   const input5 = {
      access_key: '******',
      secret_key: '******',
      bucket_name: '******',
      operation_type: 'download',
      obs_file_path: '',
      local_file_path: ['a/b'],
      region: 'cn-north-6',
   };
   expect(utils.checkDownloadFilePath(input5)).toBeFalsy();
});

test('isExistSameNameFile', () => {
   expect(utils.isExistSameNameFile('resource/uploadDir/file1.txt')).toBeTruthy();
   expect(utils.isExistSameNameFile('resource/uploadDir/file2.txt')).toBeFalsy();
});

test('isExistSameNameFolder', () => {
   expect(utils.isExistSameNameFolder('resource/uploadDir/test1')).toBeTruthy();
   expect(utils.isExistSameNameFolder('resource/uploadDir/test2')).toBeFalsy();
});