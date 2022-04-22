"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
const core = __importStar(require("@actions/core"));
const context = __importStar(require("./context"));
const upload = __importStar(require("./upload"));
const download = __importStar(require("./download"));
const bucket = __importStar(require("./bucket"));
const utils = __importStar(require("./utils"));
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        const inputs = context.getInputs();
        if (!utils.checkInputs(inputs)) {
            core.setFailed('input parameters is not correct.');
            return;
        }
        // 初始化OBS客户端
        const obs = context.getObsClient(inputs.access_key, inputs.secret_key, `https://obs.${inputs.region}.myhuaweicloud.com`);
        // 若桶不存在，退出
        if (!bucket.hasBucket(obs, inputs.bucket_name)) {
            core.setFailed('bucket not exist.');
            return;
        }
        // 执行上传/下载操作
        if (inputs.operation_type === 'upload') {
            yield upload.uploadFileOrFolder(obs, inputs);
        }
        else if (inputs.operation_type === 'download') {
            yield download.downloadFileOrFolder(obs, inputs);
        }
        else {
            core.info('operation type error, you should input "upload" or "download"');
        }
    });
}
run();
