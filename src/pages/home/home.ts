import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { File } from 'ionic-native';

declare var serial;
declare var cordova: any;

var tmp_ec_value = '';
var ec_value = '';
var xy = '';
var uuid = '';
var record_sent = false;
var base_path:string = '';
var dir_name = '';
var file_name = '';
var is_logging = false;
var path = '';

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
  ec: string;
  xy: string;
  uuid: string;
  record_sent: boolean;
  constructor(ec_value:string, xy:string, uuid:string, record_sent:boolean){
    this.ec = ec_value;
    this.xy = xy;
    this.uuid = uuid;
    this.record_sent = record_sent;
  }
  getRecord(){
    var record = new Object();
    record['ec'] = this.ec;
    record['xy'] = this.xy;
    record['uuid'] = this.uuid;
    record['record_sent'] = this.record_sent;
    return objToString(record);
  }
}

function displayValue(value){
  var box = document.getElementById('divID');
  box.innerHTML = value;
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
        xy = '(x,y)';
        record_sent = false;
        base_path = cordova.file.dataDirectory;
        dir_name = 'AcaciaData';
        file_name = 'measurement_table.csv';
        path = base_path+dir_name;
      };
    }

  requestPermission() {
    ec_value = '';
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
              tmp_ec_value += s;
              displayValue(ec_value);
              // 4 als string klaar is
              if (s.endsWith('\n')){
                ec_value = tmp_ec_value
                tmp_ec_value = ''
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

    getEC() {
      serial.write("STATUS\r\n",
        function success(){alert('Succesfully written something')},
        function error(status){alert('Failed to write'+status)});

      // serial.read(
      //   function success(buffer){alert('Succesfully reading')},
      //   function error(){'Failed reading'});
    }

    testClassVariable() {
      var s = new String('PAPAPAPAP');
      this.value+=s;
      displayValue(this.value);
    }

    // toggleLogging(){alert(is_logging)}

    toggleLogging() {
      if (is_logging == false){
        is_logging = true;
        alert('logging on');
        serial.write("R\r\n")
      }
      else{
        is_logging = false;
        alert('logging off');
      }
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
      var record = new Record(ec_value, xy, uuid, record_sent);
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
