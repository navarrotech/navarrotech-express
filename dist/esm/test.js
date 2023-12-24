"use strict";
// Copyright © 2023 Navarrotech
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = __importDefault(require("./index"));
const app = (0, index_1.default)({
    store: "memory",
    storeSettings: {},
});
app.listen(64123, () => console.log("Test successful and running."));
//# sourceMappingURL=test.js.map