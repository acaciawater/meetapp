import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { File } from 'ionic-native';
import { Geolocation } from 'ionic-native';
import { Device } from 'ionic-native';
import { HTTP } from 'ionic-native';



declare var serial;
declare var cordova: any;

var api_url = 'http://meet.acaciadata.com:8000/api/v1/meting/'
var headers = {}
var first_measurement_done = false
var tempor_values = '';
var ec_value = '';
var temperature_value = '';
var lat = '';
var lon = '';
var horizontal_accuracy = null;
var altitude = null;
var vertical_accuracy = null;
var uuid = '';
var ec_sensor_id = '';
var record_sent = false;
var base_path:string = '';
var dir_name = '';
var file_name = '';
var is_logging = false;
var path = '';
// var datetime = ''

// var base_path:string = cordova.file.dataDirectory;
// var dir_name = 'AcaciaData';
// var file_name = 'measurement_table.csv';
// var path = base_path+dir_name;

class Record {

  sensor_id:string;
  datetime: string;
  ec: string;
  tmp: string;
  lat: string;
  lon: string;
  horizontal_accuracy:number;
  altitude: number;
  vertical_accuracy:number;
  uuid: string;
  record_sent: boolean;
  constructor(  sensor_id:string, datetime:string, ec_value:string,temperature_value:string, lat:string, lon:string,
                horizontal_accuracy:number,altitude: number,vertical_accuracy:number, uuid:string, record_sent:boolean){
    this.sensor_id = sensor_id;
    this.datetime = datetime;
    this.ec = ec_value;
    this.tmp = temperature_value;
    this.lat = lat;
    this.lon = lon;
    this.horizontal_accuracy = horizontal_accuracy;
    this.altitude = altitude;
    this.vertical_accuracy = vertical_accuracy;
    this.uuid = uuid;
    this.record_sent = record_sent;
  }
  getRecord(){
    var record = new Object();
    record['sensor'] = this.sensor_id;
    record['date'] = this.datetime;
    record['ec'] = this.ec;
    record['tmp'] = this.tmp;
    record['latitude'] = this.lat;
    record['longitude'] = this.lon;
    record['hacc'] = this.horizontal_accuracy;
    record['elevation'] = this.altitude;
    record['vacc'] = this.vertical_accuracy;
    record['phone'] = this.uuid;
    record['record_sent'] = this.record_sent;
    return JSON.stringify(record);
  }
}

function clone(obj) {
    if (null == obj || "object" != typeof obj) return obj;
    var copy = obj.constructor();
    for (var attr in obj) {
        if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
    }
    return copy;
}

function getCurrentDateTime(){
  var unix_timestamp = + new Date()
  var a = new Date(unix_timestamp);
  var months = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Aug','Sep','Okt','Nov','Dec'];
  var year = a.getFullYear();
  var month = a.getMonth()+1;
  var date = a.getDate();
  var hour = a.getHours();
  var min = a.getMinutes();
  var sec = a.getSeconds();
  var time = date + '-' + month + '-' + year + ' ' + hour + ':' + min + ':' + sec ;
  return time;
}

function enableSendButton(){
  var send_record_button = <HTMLInputElement> document.getElementById('send_record')
  send_record_button.disabled = false;
  send_record_button.style.background = 'green';
}

function displayValue(ec_value, temperature_value){
  var ec = document.getElementById('ec_value');
  ec.innerHTML = ec_value;
  var tmp = document.getElementById('temperature_value');
  tmp.innerHTML =  temperature_value;
    }

function toggleLogging() {
  if (is_logging == false){
    is_logging = true;
    var ss = document.getElementById('startStop');
    ss.innerHTML = 'Stop';
    alert('logging on');
    if (ec_sensor_id == ''){
      serial.write("DEVICE\r\n");
    }
    serial.write("R\r\n");
  }
  else{
    is_logging = false;
    var ss = document.getElementById('startStop');
    ss.innerHTML = 'Start';
    alert('logging off');
  }
}


@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})


export class HomePage {

  public value = 'A';

  constructor(
    public navCtrl: NavController,) {
      document.addEventListener("deviceready", onDeviceReady, false);
      function onDeviceReady() {
        alert("Device Ready");
        uuid = Device.device.uuid;
        // latlon = '(x;y)';
        record_sent = false;
        base_path = cordova.file.dataDirectory;
        dir_name = 'AcaciaData';
        file_name = 'measurement_table.csv';
        path = base_path+dir_name;
      };
    }

  startStop() {
    ec_value = '';
    if (is_logging == false){
    serial.requestPermission({vid: 9025, pid: 32845, driver: 'CdcAcmSerialDriver'},
    // if permission is granted
    function success(){
      var opts = {"baudRate":9600, "dataBits":8, "stopBits":1, "parity":0, "dtr":true, 'rts':true}
      //  open serial port
      serial.open(opts,
        // if port is succsefully opened
        function success(){
          alert("Port Succesfully Opened");
          // register the read callback
           serial.registerReadCallback(
             function success(data){
              // 1 er is data binnen gekomen
              // 2 verwerk deze data
              var view = new Uint8Array(data);
              var s = String.fromCharCode.apply(String,view);
              tempor_values += s;
              if (s.endsWith('\n')){
                var complete_input = tempor_values
                tempor_values = ''

                if (complete_input.indexOf('Water') >= 0){
                  ec_sensor_id = complete_input.replace(/\s/g,'')
                  var encoded = btoa(ec_sensor_id+':'+ec_sensor_id)
                  headers['Authorization'] = 'Basic '+encoded
                  displayValue('WATER', ec_sensor_id)
                }
                else if (complete_input.indexOf(',') >= 0){
                  var split_values = complete_input.split(',')
                  temperature_value = split_values[0]
                  ec_value = split_values[1].replace('\r\n','')
                  displayValue(ec_value,temperature_value)
                  enableSendButton()
                }
                if (is_logging){
                  serial.write("R\r\n")
                }
              }
            },
          // error attaching the callback
            function error(evt){
              alert(evt);
            }
           );
           toggleLogging();
        }, function error(evt){
          alert(evt);
        }
      );
    },
    function error(evt){
      alert(evt);
    },
    );
  }
  else{
     toggleLogging();
  }
}

    getCurrentPosition(){
      Geolocation.getCurrentPosition().then((resp) => {
        // alert(lat+lon)
        var latit = resp.coords.latitude
        var longit = resp.coords.longitude
        lat = latit.toString()
        lon = longit.toString()
        horizontal_accuracy = resp.coords.accuracy
        altitude = resp.coords.altitude
        vertical_accuracy = resp.coords.altitudeAccuracy
        // displayValue(horizontal_accuracy,altitude+vertical_accuracy)
        this.saveMeasurement()

      }).catch((error) => {
        alert('Geen GPS signaal.\n'+ error);
      });
    }
// HTTP.post(api_url, temperature_object, headers).then(_ => HTTP.post(api_url, ec_object, headers).then(_ => '2nd HTTP post succesfull!').catch(err => 'HTTP Post, headers = '+JSON.stringify(headers)+' Error = '+JSON.stringify(err)))

    newDirAndFile(base_path, dir_name, path, file_name, data){
      alert('init newDirAndFile');
      File.createDir(base_path, dir_name, false).then(_ => this.writeFile(path, file_name, data)).catch(err => alert('createDir '+base_path+dir_name+' '+JSON.stringify(err)));
    }
    checkDir(){
      File.checkDir(base_path, dir_name).then(_ => alert(base_path+dir_name+' is found')).catch(err => alert('checkDir '+JSON.stringify(err)));
    }
    checkFile(){
      File.checkFile(path+'/', file_name).then(_ => alert('checkFile '+path+file_name+' found')).catch(err => alert('checkFile '+path+'/'+file_name+' error ='+JSON.stringify(err)));
    }
    alertFileContents(){
      File.readAsText(path+'/', file_name).then(succ => alert('readAsText '+path+'/'+file_name+' '+succ)).catch(err => alert('readAsText '+path+'/'+file_name+' '+JSON.stringify(err)))
    }
    saveMeasurement(){
      alert('init saveMeasurement with EC set to = '+ec_value)
      var datetime = getCurrentDateTime()
      var record = new Record(ec_sensor_id, datetime, ec_value, temperature_value, lat, lon,horizontal_accuracy,altitude,vertical_accuracy, uuid, record_sent)
      var data = record.getRecord()
      File.checkDir(base_path, dir_name).then(_ => this.writeFile(path, file_name, data)).catch(err => this.newDirAndFile(base_path, dir_name, path, file_name, data))
    }
    writeFile(path, file_name, data){
      alert('init writeFile')
      data += '\n'
      var body = data
      var headers = '{}'
      // File.writeFile(path, file_name, data, false).then(_ => alert('writeFile success path = '+path+' file_name = '+file_name+' data = '+data)).catch(err => alert('writeFile '+JSON.stringify(err)+ ' path = '+path+' file_name = '+file_name+' data = '+data));
      File.writeFile(path, file_name, data, {append:true}).then(_ => this.sendData()).catch(err => alert('createFile '+JSON.stringify(err)))
    }
    sendData(){
      File.readAsText(path+'/', file_name).then(text => this.fileParser(text)).catch(err => alert('Senddata: readAsText error ='+JSON.stringify(err)))
      .catch(err => alert('Senddata file reading failed at : '+path+'/'+file_name+'. Error = '+JSON.stringify(err)))
    }
    fileParser(text){
      var row = text.split('\n')
      var array_of_objects = []
      for (var line = row.length-2; line >= 0; line--){
        var obj = JSON.parse(row[line])
        array_of_objects.push(obj)
        // als niet verzonden
        if (!obj['record_sent']){
          // split the object
          var temperature_object = clone(obj)
          delete temperature_object['ec']
          var ec_object = clone(obj)
          delete ec_object['tmp']
          headers['Content-Type'] = 'application/json'
          // temperature_object = JSON.stringify(temperature_object)
          // ec_object = JSON.stringify(ec_object)
          // HTTP.get('http://meet.acaciadata.com:8000/api/v1/meting/',null,null).then(resp => alert('success response = '+resp)).catch(err => alert('HTTP Get, Error = '+JSON.stringify(err)))
          HTTP.post(api_url, temperature_object, headers).then(_ => HTTP.post(api_url, ec_object, headers).then(_ => '2nd HTTP post succesfull!').catch(err => 'HTTP Post, headers = '+JSON.stringify(headers)+' Error = '+JSON.stringify(err)))
          .catch(err => alert('HTTP Post, headers = '+JSON.stringify(headers)+' Error = '+JSON.stringify(err)))

          headers = JSON.stringify(headers)
        }
      }
    }

}
