import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';


declare var serial;

var ec_value = '100';
var is_logging = false;

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


    saveMeasurement(){

    }
}






//   requestPermission() {
//     ec_value = '';
//     serial.requestPermission({vid: 9025, pid: 32845, driver: 'CdcAcmSerialDriver'},
//     // if permission is granted
//     function success(){
//       var opts = {"baudRate":9600, "dataBits":8, "stopBits":1, "parity":0, "dtr":true, 'rts':true}
//       //  open serial port
//       serial.open(opts,
//         // if port is succsefully opened
//         function success(){
//           alert("Port Succesfully Opened");
//           // register the read callback
//            serial.registerReadCallback(
//              function success(data){
//               // 1) er is data binnen gekomen
//               // 2) verwerk deze data
//               var view = new Uint8Array(data);
//               var s = String.fromCharCode.apply(String,view);
//               ec_value += s;
//               // 3) alert deze data
//               alert(ec_value);
//               // 4) verwijder data
//               ec_value = '';
//               // 5) als record aan i, verstuur nog een 'R'
//               serial.write("R\r\n");
//               if (s.endsWith('\n')){
//                 displayValue(ec_value);
//                 if (is_logging){
//                   serial.write("R\r\n")
//                 }
//                 // heb ik niet op stop gedrukt stuur dan nog een 'R'
// //                alert(this.value)
//                 ec_value = '';
//               }
//             },
//           // error attaching the callback
//             function error(evt){
//               alert(evt);
//             }
//            );
//         }, function error(evt){
//           alert(evt);
//         }
//       );
//     },
//     function error(evt){
//       alert(evt);
//     },
//     );
// }
