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
  function onDeviceReady() {alert("DEvice Ready")};


  }

  // int = getEC();
  int = 0;

  alertsome() {
    alert("Success");
  }

  requestPermission() {
    var str = '';
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
              //  print data to screen
              var view = new Uint8Array(data);
              var s = String.fromCharCode.apply(String,view);
              str += s;
              if (s.endsWith('\n')){
                alert(str);
                str = '';
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
      // ask for the temperature and EC
      // serial.write('STATUS',function success(), function error());
      serial.write("STATUS\r\n",
        function success(){alert('Succesfully written something')},
        function error(status){alert('Failed to write'+status)});

      // serial.read(
      //   function success(buffer){alert('Succesfully reading')},
      //   function error(){'Failed reading'});
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
