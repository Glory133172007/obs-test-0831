import * as fs from 'fs';
import * as utils from '../src/utils';
import { expect, test } from '@jest/globals';
import { Inputs } from '../src/interface';

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
      accessKey: '******',
      secretKey: '******',
      bucketName: 'hdn-hcloudtoolkit-devkitgithubaction-obs',
      operationType: 'upload',
      obsFilePath: 'uploadtest1/',
      localFilePath: ['resource/bigFile.zip'],
      region: 'cn-north-6',
   }
   const legal1 = utils.checkAkSk(input1);
   expect(legal1).toBeTruthy();

   const input2 = {
      accessKey: 'KQC3',
      secretKey: '******11111222222233333444444',
      bucketName: 'hdn-hcloudtoolkit-devkitgithubaction-obs',
      operationType: 'upload',
      obsFilePath: 'uploadtest1/',
      localFilePath: ['resource/bigFile.zip'],
      region: 'cn-north-6',
   }
   const legal2 = utils.checkAkSk(input2);
   expect(legal2).toBeFalsy();
});

 // 检查includeSelfFolder
 test('test includeSelfFolder is legal', () => {
   const legal1 = utils.checkIncludeSelfFolder('y');
   expect(legal1).toBeTruthy();

   const legal2 = utils.checkIncludeSelfFolder('N');
   expect(legal2).toBeTruthy();

   const legal3 = utils.checkIncludeSelfFolder('yes');
   expect(legal3).toBeFalsy();

   const legal4 = utils.checkIncludeSelfFolder('false');
   expect(legal4).toBeFalsy();
});