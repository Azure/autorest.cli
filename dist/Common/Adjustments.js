"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
class Adjustments {
    constructor(adjustments) {
        this._adjustments = adjustments;
    }
    GetFlatten(path) {
        let pathAdjustment = this._adjustments[path.toLowerCase()];
        if (pathAdjustment == undefined || typeof pathAdjustment != "string")
            return "";
        return pathAdjustment;
    }
    IsPathExcludedFromInfoResponse(path) {
        let pathAdjustment = this._adjustments[path.toLowerCase()];
        if (pathAdjustment == undefined || typeof pathAdjustment != "object" || pathAdjustment['info'] == undefined)
            return false;
        return !pathAdjustment["info"];
    }
    IsPathIncludedInInfoResponse(path) {
        let pathAdjustment = this._adjustments[path.toLowerCase()];
        if (pathAdjustment == undefined || typeof pathAdjustment != "object" || pathAdjustment['info'] == undefined)
            return false;
        return pathAdjustment["info"];
    }
    IsPathIncludedInResponse(path) {
        let pathAdjustment = this._adjustments[path.toLowerCase()];
        if (pathAdjustment == undefined || typeof pathAdjustment != "object" || pathAdjustment['response'] == undefined)
            return false;
        return pathAdjustment["response"];
    }
    IsPathExcludedFromResponse(path) {
        let pathAdjustment = this._adjustments[path.toLowerCase()];
        if (pathAdjustment == undefined || typeof pathAdjustment != "object" || pathAdjustment['response'] == undefined)
            return false;
        return !pathAdjustment["response"];
    }
    IsPathIncludedInRequest(path) {
        let pathAdjustment = this._adjustments[path.toLowerCase()];
        if (pathAdjustment == undefined || typeof pathAdjustment != "object" || pathAdjustment['request'] == undefined)
            return false;
        return pathAdjustment["request"];
    }
    IsPathExcludedFromRequest(path) {
        let pathAdjustment = this._adjustments[path.toLowerCase()];
        if (pathAdjustment == undefined || typeof pathAdjustment != "object" || pathAdjustment['request'] == undefined)
            return false;
        return pathAdjustment["request"];
    }
}
exports.Adjustments = Adjustments;
