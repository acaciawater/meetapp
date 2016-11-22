import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';

declare var serial;

var errorCallback = function(message) {
  alert('Error: ' + message);
};

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {

  constructor(public navCtrl: NavController) {
  document.addEventListener("deviceready", onDeviceReady, false);
  function onDeviceReady() {
    alert("DEvice Ready")
  }
  }

  // int = getEC();
  int = 0;

  alertsome() {
    alert("Success");
  }

  requestPermission() {
    serial.requestPermission({vid: 9025, pid: 32845, driver: 'CdcAcmSerialDriver'},
    function success(){
      // BaudRate for our Chip: 115200, Adruino: 9600
      var opts = {"baudRate":9600, "dataBits":8, "stopBits":1, "parity":0, "dtr":false}
      serial.open(opts,
        function success(){
          alert("Success");
        }, function error(evt){
          alert(evt);
        }
      );
    },
    function error(evt){
      alert(evt);
    }
  );
}
}


// function getEC() {
// document.addEventListener("deviceready", onDeviceReady, false);
// function onDeviceReady() {
//   serial.requestPermission({vid: '9025', pid: '32845', driver: 'CdcAcmSerialDriver'},
//      function success(){
//       // BaudRate for our Chip: 115200, Adruino: 9600
//       var opts = {"baudRate":9600, "dataBits":8, "stopBits":1, "parity":0, "dtr":false}
//       serial.open(opts,
//        function success(){
//         alert("Success");
//        }, function error(evt){
//         alert(evt);
//        }
//       );
//      },
//      function error(evt){
//       alert(evt);
//      }
//     );
// }
// }
