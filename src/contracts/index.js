"use strict";

var generateAbiMap = require("./generate-abi-map");

module.exports = {
  abi: generateAbiMap(require("augur-core").abi),
  addresses: require("./addresses"),
  uploadBlockNumbers: require("./upload-block-numbers"),
};
