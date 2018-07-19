var mongoose = require('mongoose');
var recordSchema = mongoose.Schema({
    "Note":String,
    "date": { type: Date, default: Date.now , unique: true}
}, {versionKey: false}/*__v버전키 필드 제거*/);
module.exports = mongoose.model('record', recordSchema);
