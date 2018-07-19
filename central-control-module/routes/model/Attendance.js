var mongoose = require('mongoose');
var attendanceSchema = mongoose.Schema({
    "Name": String,
    "Group": Number,
    "Attendance" : String,
    "date": { type: Date, default: Date.now , unique: true}
}, {versionKey: false}/*__v버전키 필드 제거*/);
module.exports = mongoose.model('attendance', attendanceSchema);
