var express = require('express');
var net = require('net');
var mongoose = require('mongoose');
var fs = require('fs');
var path = require('path');
var events = require('events');
// var server = require('../tcp_test/tcp_server');
var socketio = require('socket.io'); // 추가
var router = express.Router();
var app = express();


var http = require('http');
var update_enev_server = http.createServer(app);
update_enev_server.listen(52273, function () {
    console.log('실시간 업데이트 소켓 Server Running at http://127.0.0.1:52273');
});

var enev_temp_data = [];
var enev_humid_data= [];
var enev_cds_data = [];
var enev_index = 0;
var enev_interval;
var record_data;
var record_interval;
var io = socketio.listen(update_enev_server);

io.sockets.on('connection', function(socket){
  console.log("=======update_enev_server socket connection=====");

  socket.on('init_enev', function (maximum) {
    enev_interval = setInterval(function(){
        request_env_cmd_getstatus();
        if(enev_index <65){
          // enev_data.unshift([0, (Math.random() * 60) + 15]);
          enev_humid_data.unshift([0, env_data.humi/10]);
          enev_temp_data.unshift([0, env_data.temp/10]);
          enev_cds_data.unshift([0, env_data.cds/10]);
          enev_index++;
        }
        else{
          enev_humid_data.pop();
          enev_temp_data.pop();
          enev_cds_data.pop();
          enev_index--;
        }
        socket.emit('update_enev',
         enev_humid_data, enev_temp_data, enev_cds_data);
        //push
      }, 1000);
  });


  socket.on('exit_enev', function(){
    clearInterval(enev_interval);
  });

  socket.on('init_record', function (maximum) {
    record_interval = setInterval(function(){
        // record_data = server.record_data;
        if(record_data.length==0){
          console.log("null data from record");
        }else{
          socket.emit('update_record', record_data);
        }
      }, 3000);
  });

  socket.on('exit_record', function(){
    clearInterval(record_interval);
  });

  eventEmitter.on('phone_completed', function(){
        var temp=[0,0,0,0,0];
        temp[0] = phone_data.std_1;
        temp[1] = phone_data.std_2;
        temp[2] = phone_data.std_3;
        temp[3] = phone_data.std_4;
        temp[4] = phone_data.std_5;

    for(var i=0;i<5;i++){
      Student.update({"index": i+1}, {"$set": {"Phone" : temp[i], "date": Date.now()} }, function(err, doc){

      });
    }
    socket.emit('phone_redirect');
    });

  eventEmitter.on('env_completed', function(){
    var newEnev = new Enev({
      "Temp" : env_data.temp/10,
      "Humid" : env_data.humi/10,
      "Lux": env_data.cds/10
    });
    // newEnev.save( function(err, doc){
      // eventEmitter.emit('enev_save_success');
    // });
  });

  eventEmitter.on('feeding_completed', function(){
    socket.emit('feeding_update', feed_data );
  });


});//io.sockets.on connect

mongoose.connect('mongodb://localhost:27017/testDB', {useNewUrlParser: true});
var db = mongoose.connection;
db.on('error', function(){
    console.log('Connection Failed!');
});
db.once('open', function() {
    console.log('MongoDB Connected!');
});

var Enev = require('./model/Enev.js');
var Student = require('./model/Student.js');
var Attendance = require('./model/Attendance.js');
var LecTime = require('./model/Lectime.js');
var Record = require('./model/Record.js')

var my_env_data;


/* GET home page. */
router.get('/', function(req, res, next) {

  //


  // for (var i = 1; i <= 10; i++) {
  //     var name1 = new Enev({
  //       "Temp" : 20 +i/10+ i%3,
  //       "Humid": 30 +i/5 +i%4,  // group ID (0~999)
  //       "Lux": 40 +i/4,
  //       "date": +new Date() + i*24*60*60*1000*3
  //     });
  //
  //     name1.save(function(error, data){
  //       if(error){
  //         console.log(error);
  //       }else{
  //         console.log( data.name + 'Saved!');
  //       }
  //     });
  //   }


  Enev.find({}, null, {sort: {"date":-1}}, function(err,docs){
    //ㄴcondition, columns to return, sort, function
    var barData=[];
    var avg ={
      temp:0,
      humid:0,
      lux:0
    };

     for(i = docs.length-1; i >=0; i-=1){
      barData.push({
           date: docs[i].date.getMonth()+1+"-" + docs[i].date.getDate(),
           Temp: docs[i].Temp,
           Humid: docs[i].Humid,
           Lux: docs[i].Lux,
      });

      avg.temp += docs[i].Temp;
      avg.humid += docs[i].Humid;
      avg.lux += docs[i].Lux;
     }

     avg.temp = (avg.temp/docs.length).toFixed(1);
     avg.humid = (avg.humid/docs.length).toFixed(1);
     avg.lux = (avg.lux/docs.length).toFixed(1);

    Student.count({Phone: 1}, function(err, count){
    res.render('index.ejs', {docs: docs, count: count, barData: barData, avg: avg});
  });
  });
});

router.get('/flot', function(req, res, next) {
  res.render('flot.ejs');
});

router.get('/attendance', function(req, res, next) {
    Student.find({}, null, {sort:{name:1}}, function(err, docs){
      Attendance.find({}, null, {sort:{ date:1, name:1}}, function(err, attendance){
        var temp_num = [];
        var length = attendance.length;

        var day_index = length / 5; //5는 휴대폰 거치대 수
        for(var i=0;i<day_index;i++){
          temp_num.push(0);
        }

        for (i = 0; i < length; i +=1) {
            if (attendance[i].Attendance === "O"){
              temp_num[parseInt(i/ day_index)] +=1;
            }
        }

        var barData=[];
         for(i = 0; i < day_index; i+=1){
          barData.push({
               y : attendance[i*5].date.getMonth()+1 +"-" + attendance[i*5].date.getDate(),
               a: (temp_num[i]/day_index*100)
          });
         }

        res.render('attendance.ejs', {docs:docs, attendance:attendance, barData:barData});
      });
    });
});

router.get('/blank', function(req, res, next) {


  res.render('blank.ejs');
});

router.get('/logout', function(req, res, next) {
  var sess = req.session;
  if(sess.username=="admin"){
    sess.destroy(function(err){
      if(err)console.log(err);
      else{
        res.redirect('/');
      }
    });
  }else{
      res.redirect('/');
  }
});

router.get('/login', function(req, res, next) {
  console.log("login get");
  res.render('login.ejs');
});

router.post('/login', function(req, res, next) {
  if(req.body.p=="1234"){
    var sess = req.session;
    sess.username = "admin";
    Student.find( {"group":{$gt:0}}, null, {sort: {"ID":1}}, function(err, docs){
        LecTime.find({}, {"_id":0}, {sort: {"startTime":1}}, function(err, lecTime){

          res.render('admin.ejs', {docs: docs, lecTime:lecTime});

        });
    });
  }
});

router.get('/admin', function(req, res, next) {
  // console.log(req.session);
  if(req.session.username=="admin"){
    Student.find( {"group":{$gt:0}}, null, {sort: {"ID":1}}, function(err, docs){
      LecTime.find({}, {"_id":0}, {sort: {"startTime":1}}, function(err, lecTime){

        res.render('admin.ejs', {docs: docs, lecTime:lecTime});
      });
    });
  }
  else{
    res.render('login.ejs');
  }
});

router.post('/admin/stduentAdd', function(req, res, next) {
  if(Object.keys(req.body).length === 0){
    res.redirect('/admin');
  }
  else{
    Student.count({group: req.body.student_group}, function(err, count){
        if(count >= 5){
          res.redirect('/admin');
        }
        else{
          var newStudent = new Student({
            "ID": req.body.student_id,     // student ID
            "Name" : req.body.student_name,
            "group": req.body.student_group,  // group ID (0~999)
            "Phone": 0,
            });
          newStudent.save( function(err, doc){
            res.redirect('/admin');
          });
        }
    });
  }

});

router.post('/admin/stduentDelete', function(req, res, next) {


});

router.post('/admin/timeAdd', function(req, res, next) {
  var newLecTime = new LecTime({
    "booked":false,
    "length": req.body.length,
    "startTime" : req.body.startTime,
    "endTime" : req.body.endTime,
    "conflict":false
    });

    newLecTime.save(function(error, data){
      if(error){
        console.log(error);
      }else{
        console.log( req.body.startTime + 'Saved!');
        return res.send("success");
      }
    });
});

// module 정보 request
router.post('/enev_update', function(req, res, next) {
  request_env_cmd_getstatus();//tcp 서버에 요청 보냄

});

router.post('/phone_update', function(req, res, next) {
  request_phone_cmd_getstatus();
});

router.post('/buzzer_click', function(req, res, next) {
  request_env_cmd_actbuzzer();
});

var level=1;
router.post('/actled_click', function(req, res, next) {
  request_env_cmd_actled(level);
  level+=1;
  level%=5;
});

router.post('/feeding_click', function(req, res, next) {
  request_feeding_cmd_getstatus();
});


router.post('/stt_start_click', function(req, res, next) {
  request_feeding_cmd_getstatus();
});


router.post('/stt_end_click', function(req, res, next) {
  request_feeding_cmd_getstatus();
});





var eventEmitter = new events.EventEmitter();

var connectHandler = function connected(){
  console.log("connection success");
  eventEmitter.emit('data_received');
};


eventEmitter.on('data_received', function(){
  console.log("Data Received");
});

////////////////////////////////////////////////////////////////////////////////

var net = require('net');
var port = 33333;

var feeding_client = null;
var env_client = null;
var phone_client = null;
var stt_client = null;
var android_client = null;
var test_client = null;

var phone_data={
	"std_num" : 0,
	"std_1" : 0,
	"std_2" : 0,
	"std_3" : 0,
	"std_4" : 0,
	"std_5" : 0
};

var env_data={
	"cds" : 0,
	"temp" : 0,
	"humi" : 0
};

var stt_data={
	"feed":""
};

var feed_data={
  "feed":""
};

var buzz_data;
var led_data;

function	request_handshake(client)
	{
		if(client == null)
			return ;

		var json_packet = "{\"pid\":\"global\",\"cmd\":\"handshake\"}\r";
		writeData(client, json_packet);
		console.log('[LOG] Send handshake');
	}

function	request_env_cmd_getstatus()
	{
		if(env_client == null){
			console.log('env client is null');
			return;
		}
		var json_packet = "{\"pid\":\"env\",\"cmd\":\"get_status\"}";
    console.log("here is request func in tcp=============");
		writeData(env_client, json_packet);
	}

function	request_env_cmd_actbuzzer()
	{
    console.log("actbuzzer call=============");
		if(env_client == null){
			console.log('env client is null');
			return;
		}
		var json_packet = "{\"pid\":\"env\",\"cmd\":\"act_buzzer\"}";
    console.log(json_packet);
		writeData(env_client, json_packet);
	}

function	request_env_cmd_actled(brightness)
	{
		if(env_client == null){
			console.log('env client is null');
			return;
		}
		var json_packet = "{\"pid\":\"env\",\"cmd\":\"act_led\",\"level\":\"";
		json_packet += (brightness + "\"}");
		writeData(env_client, json_packet);
	}

function request_stt_cmd_startstt(){
		if(stt_client == null){
			console.log('stt client is null');
			return;
		}
		var json_packet = "{\"pid\":\"stt\",\"cmd\":\"start_stt\"}";
		writeData(stt_client, json_packet);
}

function request_stt_cmd_stopstt(){
		if(stt_client == null){
			console.log('stt client is null');
			return;
		}
		var json_packet = "{\"pid\":\"stt\",\"cmd\":\"stop_stt\"}";
		writeData(stt_client, json_packet);
}

function request_stt_cmd_get_data(){
		if(stt_client == null){
			console.log('stt client is null');
			return;
		}
		var json_packet = "{\"pid\":\"stt\",\"cmd\":\"get_data\"}";
		writeData(stt_client, json_packet);
}


function	request_feeding_cmd_getstatus()
	{
		if(feeding_client == null){
			console.log('feeding client is null');
			return;
		}
		var json_packet = "{\"pid\":\"feeding\",\"cmd\":\"get_status\"}";
		writeData(feeding_client, json_packet);

	}

  function	request_phone_cmd_getstatus()
  	{
  		if(phone_client == null){
  			console.log('feeding client is null');
  			return;
  		}
  		var json_packet = "{\"pid\":\"phone\",\"cmd\":\"get_status\"}";
  		writeData(phone_client, json_packet);

  	}
function request_android_cmd_noti(msg)
{  	
		if(android_client == null){
  			console.log('android client is null');
  			return;
  		}
  		writeData(android_client, msg+'\r');

 
}

function	recv_data(client, json_packet)
	{
		var jsonObj;
		try{
			jsonObj = JSON.parse(json_packet);
		}catch(e){
			console.log('invalid format');
			return ;
		}
		//Receive handshake packet
		if(jsonObj.pid == 'global'){
			if(jsonObj.cmd == 'handshake'){
				if(jsonObj.module == 'feeding'){
					feeding_client = client;
				}
				else if(jsonObj.module == 'env'){
					env_client = client;
				}
				else if(jsonObj.module == 'phone'){
					phone_client = client;
				}
				else if(jsonObj.module == 'stt'){
					stt_client = client;
				}
				else if(jsonObj.module == 'test'){
					test_client = client;
				}
				else if(jsonObj.module == 'android'){
					android_client = client;
				}

			}
		}
		else if(jsonObj.pid == 'env'){
			if(jsonObj.cmd=='get_status'){
				env_data={
					"cds" : jsonObj.cds,
					"temp" : jsonObj.temp,
					"humi" : jsonObj.humi
				};
        eventEmitter.emit('env_completed');
			}
      // else if(jsonObj.cmd == 'act_buzzer'){
      //
      // }
		}

		else if(jsonObj.pid == 'phone'){
			if(jsonObj.cmd=='get_status'){
				phone_data={
					"std_num" : jsonObj.std_num,
					"std_1" : jsonObj.std_1,
					"std_2" : jsonObj.std_2,
					"std_3" : jsonObj.std_3,
					"std_4" : jsonObj.std_4,
					"std_5" : jsonObj.std_5
				}
        eventEmitter.emit('phone_completed');
			}

		}
		else if(jsonObj.pid == 'stt'){
			if(jsonObj.cmd=='start_stt'){
				stt_data={
					"data" : jsonObj.data
				}

			}
		}
		else if(jsonObj.pid == 'feeding'){
      console.log("feeding completed in webserver");
			if(jsonObj.cmd=='get_status'){
				feed_data = {
					"feed" : jsonObj.feed
				}
        eventEmitter.emit('feeding_completed');
      }
		}
		else if(jsonObj.pid == 'test'){
			if(jsonObj.cmd == '1')
			{
				request_phone_cmd_getstatus();
			}

			//ENV MODULE
			else if(jsonObj.cmd == '11')
			{
				request_env_cmd_getstatus();
			}
			else if(jsonObj.cmd == '12')
			{
				request_env_cmd_actbuzzer();
			}
			else if(jsonObj.cmd == '13')
			{
				request_env_cmd_actled(3);
			}
			//STT MODULE
			else if(jsonObj.cmd == '21')
			{
				request_stt_cmd_startstt();
			}
			else if(jsonObj.cmd == '22')
			{
				request_stt_cmd_stopstt();
			}
			else if(jsonObj.cmd == '23')
			{
				request_stt_cmd_get_data();
			}


			//FEEDING MODULE
			else if(jsonObj.cmd == '31')
			{
				request_feeding_cmd_getstatus();
			}

			//TEST MODULE
			else if(jsonObj.cmd == '9999')
			{
				writeData(test_client, 'Server is working');
			}
			//ANDROID MODULE
			else if(jsonObj.cmd == '41')
			{
				request_android_cmd_noti("김수봉 바보");
			}


			//EXCEPTION
			else{
				console.log('[ERR] Unknown pid : %s', jsonObj.pid);
			}
		}
	}


var server = net.createServer(function(client) {
		console.log('Client connection: [ip:%s], [port:%s]', client.localAddress, client.localPort);
		console.log('   remote = %s:%s', client.remoteAddress, client.remotePort);
		client.setTimeout(500);
		client.setEncoding('utf8');

		request_handshake(client);

		client.on('data', function(data) {
				console.log('Received data from client on port %d: %s',
						client.remotePort, data.toString());
				//writeData(client, data.toString());
				recv_data(client, data.toString());
				});

		client.on('end', function() {
				if(client == feeding_client){
				feeding_client = null;
				console.log('Feeding module client disconnected');
				}
				else if(client == env_client){
				env_client = null;
				console.log('Env module client disconnected');
				}
				else if(client == phone_client){
				phone_client = null;
				console.log('Phone module client disconnected');
				}
				else if(client == stt_client){
				stt_client = null;
				console.log('Stt module client disconnected');
				}
				else if(client == android_client){
				android_client = null;
				console.log('android module client disconnected');
				}


				else if(client == test_client){
				test_client = null;
				console.log('Stt module client disconnected');
				}

				else{
					console.log('Anonymous client disconnected');
				}

				server.getConnections(function(err, count){
						console.log('Remaining Connections: ' + count);
						});
		});
		client.on('error', function(err) {
				console.log('Socket Error: ', JSON.stringify(err));
				});
		client.on('timeout', function() {
				console.log('Socket Timed out');
				});
});

server.listen(port, function() {
		console.log('Server listening: ' + JSON.stringify(server.address()));
		server.on('close', function(){
				console.log('Server Terminated');
				});
		server.on('error', function(err){
				console.log('Server Error: ', JSON.stringify(err));
				});
		});

function writeData(socket, data){
	var success = !socket.write(data);
	if (!success){
		(function(socket, data){
		 socket.once('drain', function(){
				 writeData(socket, data);
				 });
		 })(socket, data);
	}
}

var readline = require('readline');
var rl = readline.createInterface({
input: process.stdin,
output: process.stdout,
terminal: false
});

rl.on('line', function(line){
		if(line == 'handshake')
		{

		}
		if(line == 'feeding_get_status')
		{
		console.log('call get feeding status');
		request_feeding_status(feeding_client)
		}
});


module.exports = router;
