// JavaScript code for the Microbit Demo app.

/**
 * Object that holds application data and functions.
 */
var app = {};

/**
 * Timeout (ms) after which a message is shown if the Microbit wasn't found.
 */
app.CONNECT_TIMEOUT = 3000;

/**
 * Object that holds Microbit UUIDs.
 */
app.microbit = {};
app.gattServer;
app.device;

app.Heading;
app.EventValue = 91;
var compassTimerId;

app.microbit.EVENT_SERVICE = 'e95d93af-251d-470a-a062-fa1922dfa9a8';
app.microbit.EVENT_CHARACTERISTIC = 'e95d9775-251d-470a-a062-fa1922dfa9a8';
app.microbit.CLIENTEVENT_CHARACTERISTIC = 'e95d5404-251d-470a-a062-fa1922dfa9a8';
app.microbit.CLIENTREQUIREMENTS_CHARACTERISTIC = 'e95d23c4-251d-470a-a062-fa1922dfa9a8';


var BLE_NOTIFICATION_UUID = '00002902-0000-1000-8000-00805f9b34fb';

/**
 * Initialise the application.
 */
app.initialize = function()
{
	document.addEventListener(
		'deviceready',
		function() { evothings.scriptsLoaded(app.onDeviceReady) },
		false);
}

function onConnect(context) {
	console.log("Client Connected");
	console.log(context);
}

app.onDeviceReady = function()
{
	app.showInfo('Activate the Microbit and toggle Connect button.');
	var progress = document.querySelector('#progress');
	progress.hidden = true;

	watchCompass();
}


function watchCompass() {
    if(compassTimerId) navigator.compass.clearWatch(compassTimerId);
    compassTimerId = navigator.compass.watchHeading(onCompassUpdate, onCompassError, {
       	frequency: 100 // Update interval in ms
    });
}

function onCompassUpdate(heading) {
    //console.log(heading.magneticHeading);
    var point; var point_destination = 'N';

    switch (Math.round(heading.magneticHeading*4/360)%4) {
        case 0: point = 'N'; break;
        case 1: point = 'E'; break;
        case 2: point = 'S'; break;
        case 3: point = 'W'; break;
    }

    app.Heading = point;

	console.log(app.EventValue);

	var cmd;
	document.getElementById('heading').heading = "Heading to: " + point;

    if(point != 'N' && app.device != null && app.EventValue == 91) {	
		
    	if(point == 'W') {
    		cmd = new Uint16Array([0x22B8, 1002]); //Right
    	}

    	if(point == 'E') {
    		cmd = new Uint16Array([0x22B8, 1001]); //Left
    	}

    	if(point == 'S') {
    		cmd = new Uint16Array([0x22B8, 1001]); //Left
    	}
		
		app.writeCharacteristicUint16(app.device, app.microbit.CLIENTEVENT_CHARACTERISTIC, cmd);
			       	

    }
    
}

function onCompassError(error) {
	console.log('CompassError: ' + error.code);
}


app.sendInfo = function(cmd)
{
	var bytes = []; // char codes
    var sbyte;
    var cmd1;
    var code;
    for (var i = 0; i < cmd.length; ++i) {
    	code = cmd.charCodeAt(i);
        bytes = bytes.concat([code]);
    }

	var cmdPinAd = [0x22B8, cmd];
	cmd = new Uint16Array([0x22B8, new Uint8Array(bytes)]);
	console.log(cmd);
	app.writeCharacteristicUint16(app.device, app.microbit.CLIENTEVENT_CHARACTERISTIC, cmd);
}

app.showInfo = function(info)
{
	document.getElementById('Status').innerHTML = info;
}

app.onStartButton = function()
{
	app.onStopButton();
	app.startScan();
	app.showInfo('Status: Scanning...');
	var progress = document.querySelector('#progress');
	progress.hidden = false;
	app.startConnectTimer();
	app.gattServer = null;
	document.getElementById('info').heading = '';
	app.EventValue = 91;
}

app.onStopButton = function()
{
	// Stop any ongoing scan and close devices.
	app.stopConnectTimer();
	evothings.easyble.stopScan();
	evothings.easyble.closeConnectedDevices();
	app.showInfo('Status: Stopped.');
	app.gattServer = null;
	document.getElementById('heading').heading = "Heading to: ";
}

app.startConnectTimer = function()
{
	// If connection is not made within the timeout
	// period, an error message is shown.
	app.connectTimer = setTimeout(
		function()
		{
			app.showInfo('Status: Scanning... ' +
				'Please start the Microbit.');
			var connectToggle = document.querySelector('#connect');
			var progress = document.querySelector('#progress');
        	
        	connectToggle.checked = false;
            progress.hidden = true;
		},
		app.CONNECT_TIMEOUT)
}

app.stopConnectTimer = function()
{
	clearTimeout(app.connectTimer);
}

app.startScan = function()
{
	evothings.easyble.startScan(
		function(device)
		{
			// Connect if we have found an Microbit.
			if (app.deviceIsMicrobit(device))
			{
				app.showInfo('Status: Device found: ' + device.name + '.');
				evothings.easyble.stopScan();
				app.connectToDevice(device);
				app.stopConnectTimer();
			}
		},
		function(errorCode)
		{
			app.showInfo('Error: startScan: ' + errorCode + '.');
			var dialog = document.querySelector('#errorDialog');
			dialog.open();
		});
}

app.deviceIsMicrobit = function(device)
{
	console.log('device name: ' + device.name);
	return (device != null) &&
		(device.name != null) &&
		((device.name.indexOf('MicroBit') > -1) ||
			(device.name.indexOf('micro:bit') > -1));
};

/**
 * Read services for a device.
 */
app.connectToDevice = function(device)
{
	app.showInfo('Connecting...');
	device.connect(
		function(device)
		{
			app.showInfo('Status: Connected - reading Microbit services...');


			var connectToggle = document.querySelector('#connect');
        	var progress = document.querySelector('#progress');
        	var dialog = document.querySelector('#errorDialog');
      		app.gattServer = device;

        	connectToggle.checked = true;
            progress.hidden = true;
			app.readServices(device);
		},
		function(errorCode)
		{
			app.showInfo('Error: Connection failed: ' + errorCode + '.');
			var dialog = document.querySelector('#errorDialog');
			dialog.open();
			app.gattServer = null;
			evothings.ble.reset();
		});
}

app.readServices = function(device)
{
	device.readServices(
		[
		app.microbit.EVENT_SERVICE,
		],
		app.startNotifications,
		function(errorCode)
		{
			console.log('Error: Failed to read services: ' + errorCode + '.');
			app.showInfo('Error: Failed to read services');
		});
}

app.writeCharacteristic = function(device, characteristicUUID, value) {
	device.writeCharacteristic(
		characteristicUUID,
		new Uint8Array(value),
		function()
		{
			console.log('writeCharacteristic '+characteristicUUID+' ok.');
		},
		function(errorCode)
		{
			console.log('Error: writeCharacteristic: ' + errorCode + '.');
			app.showInfo('Error: writeCharacteristic');
		});
}

app.writeCharacteristicUint16 = function(device, characteristicUUID, value) {
	device.writeCharacteristic(
		characteristicUUID,
		value,
		function()
		{
			console.log('writeCharacteristic '+characteristicUUID+' ok.');
		},
		function(errorCode)
		{
			console.log('Error: writeCharacteristic: ' + errorCode + '.');
			app.showInfo('Error: writeCharacteristic');

		});
}

app.writeNotificationDescriptor = function(device, characteristicUUID)
{
	device.writeDescriptor(
		characteristicUUID,
		BLE_NOTIFICATION_UUID,
		new Uint8Array([1,0]),
		function()
		{
			console.log('writeDescriptor '+characteristicUUID+' ok.');
		},
		function(errorCode)
		{
			// This error will happen on iOS, since this descriptor is not
			// listed when requesting descriptors. On iOS you are not allowed
			// to use the configuration descriptor explicitly. It should be
			// safe to ignore this error.
			console.log('Error: writeDescriptor: ' + errorCode + '.');
			//app.showInfo('Error: writeDescriptor');
		});
}

/**
 * Read accelerometer data.
 * FirmwareManualBaseBoard-v1.5.x.pdf
 */
app.startNotifications = function(device)
{
	app.showInfo('Status: Ready');

	//app.readDeviceInfo(device);

	// Due to https://github.com/evothings/cordova-ble/issues/30
	// ... we have to do double work to make it function properly
	// on both Android and iOS. This first part is only needed for Android
	// and causes an error message on iOS that is safe to ignore.

	// Set notifications to ON.
	app.writeNotificationDescriptor(device, app.microbit.EVENT_CHARACTERISTIC);
	app.writeNotificationDescriptor(device, app.microbit.CLIENTEVENT_CHARACTERISTIC);
	app.writeNotificationDescriptor(device, app.microbit.CLIENTREQUIREMENTS_CHARACTERISTIC);
	app.device = device;

	//var cmdPinAd = [0x22B8, 0x00];
	var cmdPinAd = new Uint16Array([0x22B8, 0x00]);
	app.writeCharacteristicUint16(device, app.microbit.CLIENTREQUIREMENTS_CHARACTERISTIC, cmdPinAd);

	// Set sensor period to 160 ms.
	//var periodDataBuffer = new ArrayBuffer(2);
	//new DataView(periodDataBuffer).setUint16(0, 160, true);
	//app.writeCharacteristic(device, app.microbit.ACCELEROMETER_PERIOD, periodDataBuffer);
	//app.writeCharacteristic(device, app.microbit.MAGNETOMETER_PERIOD, periodDataBuffer);


	// Start Event notification.
	device.enableNotification(
		app.microbit.EVENT_CHARACTERISTIC,
		app.handleEventValues,
		function(errorCode)
		{
			console.log('Error: enableNotification: ' + errorCode + '.');
			app.showInfo('Error: enableNotification');
		});


	
}

app.readDeviceInfo = function(device)
{
	//app.readCharacteristicUint16(device, app.microbit.ACCELEROMETER_PERIOD, 'Acc period');
	//app.readCharacteristicUint16(device, app.microbit.MAGNETOMETER_PERIOD, 'Mag period');
}


// http://www.onicos.com/staff/iz/amuse/javascript/expert/utf.txt
/* utf.js - utf-8 <=> UTF-16 conversion
*
* Copyright (C) 1999 Masanao Izumo <iz@onicos.co.jp>
* Version: 1.1
* LastModified: Nov 27 2015
* This library is free. You can redistribute it and/or modify it.
*/
function utf8ArrayToStr(array, errorHandler) {
	var out, i, len, c;
	var char2, char3;
	array = new Uint8Array(array);
	out = "";
	len = array.length;
	i = 0;
	while(i < len) {
		c = array[i++];
		switch(c >> 4) {
		case 0: case 1: case 2: case 3: case 4: case 5: case 6: case 7:
			// 0xxxxxxx
			out += String.fromCharCode(c);
			break;
		case 12: case 13:
			// 110x xxxx 10xx xxxx
			char2 = array[i++];
			out += String.fromCharCode(((c & 0x1F) << 6) | (char2 & 0x3F));
			break;
		case 14:
			// 1110 xxxx 10xx xxxx 10xx xxxx
			char2 = array[i++];
			char3 = array[i++];
			out += String.fromCharCode(((c & 0x0F) << 12) |
			((char2 & 0x3F) << 6) |
			((char3 & 0x3F) << 0));
			break;
		default:
			if(errorHandler)
				out = errorHandler(out, c)
			else
				throw "Invalid UTF-8!";
		}
	}
	return out;
}

app.readCharacteristicUint16 = function(device, uuid, name)
{
	device.readCharacteristic(uuid, function(data)
	{
		console.log(name+': '+evothings.util.littleEndianToUint16(new Uint8Array(data), 0));
	},
	function(errorCode)
	{
		console.log('Error: readCharacteristic: ' + errorCode + '.');
		app.showInfo('Error: readCharacteristic');
	});
}

app.readCharacteristic = function(device, uuid, spanID)
{
	device.readCharacteristic(uuid, function(data)
	{
		var str = utf8ArrayToStr(data, function(out, c) {
			return out+'['+c+']';
		});
		console.log(spanID+': '+str);
		app.value(spanID, str);
	},
	function(errorCode)
	{
		console.log('Error: readCharacteristic: ' + errorCode + '.');
		app.showInfo('Error: readCharacteristic');
	});
}

app.value = function(elementId, value)
{
	document.getElementById(elementId).innerHTML = value;
}



app.handleEventValues = function(data)
{
	data = new Uint8Array(data);
	var value = evothings.util.littleEndianToUint16(data, 2);
	app.EventValue = value;

	console.log(value)

	if(value == 1) {
		console.log('head:' + app.Heading);
	}

}




// Initialize the app.
app.initialize();