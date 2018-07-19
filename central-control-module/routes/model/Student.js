var mongoose = require('mongoose');
var studentSchema = mongoose.Schema({
    "ID": String,     // student ID
    "Name" : String,  //student ID
    "group": Number,  // group ID (0~999)
    "Phone": Number,  // empty: 0, full: 1
    "index" : Number,
    "date": { type: Date, default: Date.now , unique: false}
}, {versionKey: false}/*__v버전키 필드 제거*/);
module.exports = mongoose.model('student', studentSchema);
