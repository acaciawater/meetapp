import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { File } from 'ionic-native';
import { Geolocation } from 'ionic-native';


declare var serial;
declare var cordova: any;

var tempor_values = '';
var ec_value = '';
var temperature_value = '';
var xy = '';
var uuid = '';
var record_sent = false;
var base_path:string = '';
var dir_name = '';
var file_name = '';
var is_logging = false;
var path = '';
var datetime = 'today'

// var base_path:string = cordova.file.dataDirectory;
// var dir_name = 'AcaciaData';
// var file_name = 'measurement_table.csv';
// var path = base_path+dir_name;

function objToString (obj) {
    var str = '';
    for (var p in obj) {
        if (obj.hasOwnProperty(p)) {
          str += p + ':' + obj[p] + ',';
        }
    }
    return '{'+str+'}'+'\n';
}


class Record {
  datetime: string;
  ec: string;
  tmp: string;
  xy: string;
  uuid: string;
  record_sent: boolean;
  constructor(datetime:string, ec_value:string,temperature_value:string, xy:string, uuid:string, record_sent:boolean){
    this.datetime = datetime;
    this.ec = ec_value;
    this.tmp = temperature_value;
    this.xy = xy;
    this.uuid = uuid;
    this.record_sent = record_sent;
  }
  getRecord(){
    var record = new Object();
    record['datetime'] = this.datetime;
    record['ec'] = this.ec;
    record['tmp'] = this.tmp;
    record['xy'] = this.xy;
    record['uuid'] = this.uuid;
    record['record_sent'] = this.record_sent;
    return objToString(record);
  }
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
  public box = null;

  constructor(
    public navCtrl: NavController,) {
      document.addEventListener("deviceready", onDeviceReady, false);
      // this.box = document.getElementById('divID');
      // console.log(this.box);
      function onDeviceReady() {
        alert("Device Ready");
        uuid = '12345';
        // xy = '(x;y)';
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
              // 4 als string klaar is
              if (s.endsWith('\n')){
                var split_values = tempor_values.split(',')
                temperature_value = split_values[0]
                ec_value = split_values[1].replace('\r\n','')
                displayValue(ec_value,temperature_value);
                tempor_values = ''
                // 5 en als logging aan is, stuur dan nog een 'R'
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
        alert(lat+lon)
        var lat = resp.coords.latitude
        var lon = resp.coords.longitude
        xy = [lat,lon].toString()
        this.saveMeasurement()
      }).catch((error) => {
        alert('Error getting location '+ error);
      });
    }

    writeFile(path, file_name, data){
      alert('init writeFile');
      // File.writeFile(path, file_name, data, false).then(_ => alert('writeFile success path = '+path+' file_name = '+file_name+' data = '+data)).catch(err => alert('writeFile '+JSON.stringify(err)+ ' path = '+path+' file_name = '+file_name+' data = '+data));
      File.writeFile(path, file_name, data, {append:true}).then(_ => alert('createFile success path = '+path+' file_name = '+file_name+'data = '+data)).catch(err => alert('createFile '+JSON.stringify(err)));
    }

    newDirAndFile(base_path, dir_name, path, file_name, data){
      alert('init newDirAndFile');
      File.createDir(base_path, dir_name, false).then(_ => this.writeFile(path, file_name, data)).catch(err => alert('createDir '+base_path+dir_name+' '+JSON.stringify(err)));
    }

    saveMeasurement(){
      alert('init saveMeasurement with EC set to = '+ec_value);
      var record = new Record(datetime, ec_value, temperature_value, xy, uuid, record_sent);
      var data = record.getRecord();
      File.checkDir(base_path, dir_name).then(_ => this.writeFile(path, file_name, data)).catch(err => this.newDirAndFile(base_path, dir_name, path, file_name, data));
    }
    checkDir(){
      File.checkDir(base_path, dir_name).then(_ => alert(base_path+dir_name+' is found')).catch(err => alert('checkDir '+JSON.stringify(err)));
    }
    checkFile(){
      File.checkFile(path+'/', file_name).then(_ => alert('checkFile '+path+file_name+' found')).catch(err => alert('checkFile '+path+'/'+file_name+' error ='+JSON.stringify(err)));
    }
    alertFileContents(){
      File.readAsText(path+'/', file_name).then(succ => alert('readAsText '+path+'/'+file_name+' '+JSON.stringify(succ))).catch(err => alert('readAsText '+path+'/'+file_name+' '+JSON.stringify(err)))
    }

}
