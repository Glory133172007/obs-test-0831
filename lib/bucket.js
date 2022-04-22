"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listObjects = exports.hasBucket = void 0;
/**
 * 判断桶是否存在
 * @param obsClient obsClient为引入的obs库的类型，本身并未导出其类型，故使用any，下同
 * @param bucketName 桶名
 * @returns
 */
function hasBucket(obsClient, bucketName) {
    return __awaiter(this, void 0, void 0, function* () {
        const promise = yield obsClient.headBucket({
            Bucket: bucketName
        });
        return !(promise.CommonMsg.Status === 404);
    });
}
exports.hasBucket = hasBucket;
/**
 * 列举桶内对象
 * @param obsClient
 * @param bucketName 桶名
 * @returns
 */
function listObjects(obsClient, bucketName) {
    return __awaiter(this, void 0, void 0, function* () {
        const objList = [];
        const promise = yield obsClient.listObjects({
            Bucket: bucketName
        });
        promise.InterfaceResult.Contents.forEach((element) => {
            objList.push(element['Key']);
        });
        return objList;
    });
}
exports.listObjects = listObjects;
