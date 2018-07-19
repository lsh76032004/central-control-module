
var net = require('net');
var port = 33333;

var feeding_client = null;
var env_client = null;
var phone_client = null;
var stt_client = null;
var test_client = null;
var android_client = null;

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
		writeData(env_client, json_packet);
	}

function	request_env_cmd_actbuzzer()
	{
		if(env_client == null){
			console.log('env client is null');
			return;
		}
		var json_packet = "{\"pid\":\"env\",\"cmd\":\"act_buzzer\"}";
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
			if(jsonObj.cmd=='get_data'){
				stt_data={
					"data" : jsonObj.data
				}
			}
		}
		else if(jsonObj.pid == 'feeding'){
			if(jsonObj.cmd=='get_status'){
				feeding_data = {
					"feed" : jsonObj.feed
				}
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
		
			//ENV MODULE
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
		
			//ANDROID MODULE
			else if(jsonObj.cmd == '41')
			{
				request_android_cmd_noti("김수봉 바보");
			}

			//TEST MODULE
			else if(jsonObj.cmd == '9999')
			{
				writeData(test_client, 'Server is working');
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
				else if(client == test_client){
				test_client = null;
				console.log('Stt module client disconnected');
				}
				else if(client == android_client){
				android_client = null;
				console.log('android module client disconnected');
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


