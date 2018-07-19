var mongoose = require('mongoose');
var lecTimeSchema = mongoose.Schema({
  "booked": false,
  "length": Number,
  "startTime": Date,
  "endTime": Date,
  "conflict": false
}, {versionKey: false}/*__v버전키 필드 제거*/);
module.exports = mongoose.model('lecTime', lecTimeSchema);
