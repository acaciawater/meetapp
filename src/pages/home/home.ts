import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { File } from 'ionic-native';

declare var serial;
declare var cordova: any;


var ec_value = '100';
var is_logging = false;

var base_path:string = cordova.file.dataDirectory;
var dir_name = 'AcaciaData';
var file_name = 'measurement_table.csv';
var data = 'blabla';
var path = base_path+dir_name;



class Records {
  ec: string;
  constructor(ec_value : string){
    this.ec = ec_value;
  }
  get_values(){
    return this.ec;
  }
}

function displayValue(value){
  var box = document.getElementById('divID');
  box.innerHTML = value;
    }

  // var errorCallback = function(message) {
  //   alert('Error: ' + message);
  // };

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
      function onDeviceReady() {alert("Device Ready")};
                  }

  // int = getEC();
  // int = this.value;


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
              // 1) er is data binnen gekomen
              // 2) verwerk deze data
              var view = new Uint8Array(data);
              var s = String.fromCharCode.apply(String,view);
              ec_value += s;
              // 3) als string klaar is
              if (s.endsWith('\n')){
                // 4) toon de string op pagina
                displayValue(ec_value);
                ec_value = '';
                // 5) en als logging aan is, stuur dan nog een 'R'
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

    writeNewFile(path, file_name, data){
      alert('init writeNewFile');
      // File.writeFile(path, file_name, data, false).then(_ => alert('writeFile success path = '+path+' file_name = '+file_name+' data = '+data)).catch(err => alert('writeFile '+JSON.stringify(err)+ ' path = '+path+' file_name = '+file_name+' data = '+data));
      File.createFile(path, file_name, false).then(_ => alert('createFile success path = '+path+' file_name = '+file_name)).catch(err => alert('createFile '+JSON.stringify(err)));
    }

    newDirAndFile(base_path, dir_name, path, file_name, data){
      alert('init newDirAndFile');
      File.createDir(base_path, dir_name, false).then(_ => this.writeNewFile(path, file_name, data)).catch(errCD => alert('createDir '+base_path+dir_name+' '+JSON.stringify(errCD)));
    }

    writeExistingFile(path, file_name, data){
      alert('init writeExistingFile');
      File.writeExistingFile(path, file_name, data).then(_ => alert('writeExistingFile success')).catch(err => alert('writeExistingFile '+JSON.stringify(err)));
    }

    writeNewOrExistingFile(path, file_name, data){
      alert('writeNewOrExistingFile');
      File.checkFile(path+'/', file_name).then(_ => this.writeExistingFile(path, file_name, data)).catch(err => this.writeNewFile(path, file_name, data));
    }
      
    saveMeasurement(){
      alert('init saveMeasurement');
      var base_path:string = cordova.file.dataDirectory;
      var dir_name = 'AcaciaData';
      var file_name = 'measurement_table.csv';
      var data = 'blabla';
      var path = base_path+dir_name;
      File.checkDir(base_path, dir_name).then(_ => this.writeNewOrExistingFile(path, file_name, data)).catch(err => this.newDirAndFile(base_path, dir_name, path, file_name, data));
    }
    checkDir(){
      var base_path:string = cordova.file.dataDirectory;
      var dir_name = 'AcaciaData';
      var file_name = 'measurement_table.csv';
      var data = 'blabla';
      var path = base_path+dir_name;
      File.checkDir(base_path, dir_name).then(_ => alert(base_path+dir_name+' is found')).catch(err => alert('checkDir '+JSON.stringify(err)));
    }
    checkFile(){
      var base_path:string = cordova.file.dataDirectory;
      var dir_name = 'AcaciaData';
      var file_name = 'measurement_table.csv';
      var data = 'blabla';
      var path = base_path+dir_name;
      File.checkFile(path+'/', file_name).then(_ => alert('checkFile '+path+file_name+' found')).catch(err => alert('checkFile '+path+'/'+file_name+' error ='+JSON.stringify(err)));
    }
}
