var mongoose = require('mongoose');
var enevSchema = mongoose.Schema({
    "Temp":   Number,
    "Humid": Number,
    "Lux": Number,
    "date": { type: Date, default: Date.now , unique: true}
}, {versionKey: false}/*__v버전키 필드 제거*/);
module.exports = mongoose.model('enev', enevSchema);
