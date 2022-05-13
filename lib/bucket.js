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
 * @param obsClient obs客户端，因obsClient为引入的obs库的类型，本身并未导出其类型，故使用any，下同
 * @param bucketName 桶名
 * @returns
 */
function hasBucket(obsClient, bucketName) {
    return __awaiter(this, void 0, void 0, function* () {
        const promise = yield obsClient.headBucket({
            Bucket: bucketName,
        });
        return !(promise.CommonMsg.Status === 404);
    });
}
exports.hasBucket = hasBucket;
/**
 * 根据前缀和起始位置，列举桶内对象
 * @param obsClient Obs客户端
 * @param inputs 用户输入的参数
 * @param obsPath obs上请求的对象前缀
 * @param marker 起始位置
 * @returns
 */
function listObjects(obsClient, inputs, obsPath, marker) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield obsClient.listObjects({
            Bucket: inputs.bucket_name,
            Prefix: obsPath,
            Marker: marker !== null && marker !== void 0 ? marker : '',
        });
    });
}
exports.listObjects = listObjects;
