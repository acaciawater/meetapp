import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { File } from 'ionic-native';
import { Geolocation } from 'ionic-native';
import { Device } from 'ionic-native';
import { Http, Headers } from '@angular/http';
import { Diagnostic } from 'ionic-native';
import {Observable} from 'rxjs/Observable';
import 'rxjs/add/observable/fromEvent';
import { Network } from 'ionic-native';

declare var serial;
declare var cordova: any;

var api_url_https = 'https://meet.acaciadata.com/api/v1/meting/'
var tmp_file_name = ''
var first_measurement_done = false
var tempor_values = ''
var ec_value = ''
var temperature_value = ''
// var lat = ''
// var lon = ''
// var horizontal_accuracy = null
// var altitude = null
// var vertical_accuracy = null
var uuid = ''
var ec_sensor_id = ''
var record_sent = false
var base_path:string = ''
var dir_name = ''
var db_file_name = ''
var is_logging = false
var path = ''
var encoded = ''
// var tmp_array_of_records = []
// var clone_array_for_api = []
var has_gps = false

class Record {
  /**
  * creates a single record, which can be saved in a file
  */
  sensor_id:string;
  datetime: string;
  value: string;
  entity: string;
  unit: string;
  lat: string;
  lon: string;
  horizontal_accuracy:number;
  altitude: number;
  vertical_accuracy:number;
  uuid: string;
  record_sent: boolean;
  constructor(  sensor_id:string, datetime:string, value:string, entity:string, unit:string, lat:string, lon:string,
                horizontal_accuracy:number,altitude: number,vertical_accuracy:number, uuid:string, record_sent:boolean){
    this.sensor_id = sensor_id;
    this.datetime = datetime;
    this.value = value;
    this.entity = entity;
    this.unit = unit;
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
    record['value'] = this.value;
    record['entity'] = this.entity;
    record['unit'] = this.unit;
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

function addRecordToTable(table, record){
  // DEZE FUNCTIE STAAT OOK IN ABOUT.TS
  alert('init add recorda to table')
  var datetime = record['date']
  var ec = record['value']
  var sent = record['record_sent']
  var tr = table.insertRow(1)
  var td_date = tr.insertCell(0)
  var td_ec = tr.insertCell(1)
  var td_sent = tr.insertCell(2)
  td_date.innerHTML = datetime
  td_ec.innerHTML = ec
  if (sent){
    td_sent.innerHTML = 'Ja'
  }
  else {
    td_sent.innerHTML = 'Nee'
  }
}


// function saveMeasurement(){
//   alert('blaaalala')
//   this.saveMeasurement()
// }

function clone(obj) {
  /**
  * helper function to clone a dictionary, returns the clone
  */
    if (null == obj || "object" != typeof obj) return obj;
    var copy = obj.constructor();
    for (var attr in obj) {
        if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
    }
    return copy;
}

function getCurrentDateTime(){
  /**
  * helper function to get the current datetime, returns a string
  */
  var unix_timestamp = + new Date()
  var a = new Date(unix_timestamp);
  // var months = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Aug','Sep','Okt','Nov','Dec'];
  var year = a.getFullYear();
  var month = a.getMonth()+1;
  var day = a.getDate();
  var hour = a.getHours();
  var min = a.getMinutes();
  var sec = a.getSeconds();
  var time = month + '-' + day + '-' + year + ' ' + hour + ':' + min + ':' + sec ;
  return time;
}

function checkDatabaseFiles(){
  /**
  this function is called upon device ready
  looks in directory for files, then calls reformatFiles() with its result wich are the files found in the dir
  */
  File.listDir(base_path, dir_name)
  .then(entries => reformatFiles(entries))
  // TESTED OK
  .catch(_ => enableStartStopButton())
}

function reformatFiles(entries){
  /**
  expects files found in the application directory
  if none are found, its ok (first time app has been installed)
  if only db file is foudn, its ok
  if only tmp file is found, the db file got removed, but the tmp file not renamed, fixes this
  if both are found and tmp is corrupt, remove tmp
  if both are found and tmp is not corrupt, remove db and rename tmp
  */
  // alert('paths: '+JSON.stringify(entries))
  var db_file = false
  var tmp_db_file = false
  for (var i=0;i<=entries.length-1;i++){
    // alert('index ='+ i)
    if (entries[i].fullPath=='/AcaciaData/measurement_table.csv'){
      // alert('db found')
      db_file = true
    }
    if (entries[i].fullPath=='/AcaciaData/temp_db.csv'){
      // alert('tmp_db found')
      tmp_db_file = true
    }
  }
  if (db_file&&!tmp_db_file){
    // if only db file
    enableStartStopButton()
  }
  if (!db_file&&!tmp_db_file){
    //  if neither
    enableStartStopButton()
  }
  if (!db_file&&tmp_db_file){
    // if only tmp file rename it
          File.moveFile(path, tmp_file_name, path, db_file_name)
          .then(_ => enableStartStopButton())
          .catch(err => alert('tmp to db file replacement error: '+JSON.stringify(err)))
  }
  if(db_file&&tmp_db_file){
    // if both exist
      // if tmp is corrupt remoe tmp
      // if tmp is not corrupt remove db and rename tmp
    File.readAsText(path, tmp_file_name)
      .then(_ =>
        File.removeFile(path, db_file_name)
          .then(_ =>
            File.moveFile(path, tmp_file_name, path, db_file_name)
              .then(_ => enableStartStopButton())
              .catch(err => alert('error moving tmp to db file, error = '+JSON.stringify(err))))
          .catch(err => alert('error removing file, '+JSON.stringify(err))))
      // file is corrupt
      .catch(_ =>
        File.removeFile(path, tmp_file_name)
          .then(succ => enableStartStopButton())
          .catch(err => alert('failed removing file'+JSON.stringify(err))))
  }
}

function enableSendButton(){
  var send_record_button = <HTMLInputElement> document.getElementById('send_record')
  send_record_button.disabled = false;
  send_record_button.style.background = '#3688C2';
}
function disableSendButton(){
  var send_record_button = <HTMLInputElement> document.getElementById('send_record')
  send_record_button.disabled = true;
  send_record_button.style.background = '#808080';
}

function enableStartStopButton(){
  var send_record_button = <HTMLInputElement> document.getElementById('startStop')
  send_record_button.disabled = false;
  send_record_button.style.background = '#3688C2';
}

function displayValue(ec_value, temperature_value){
  /**
  *  displays the ec and temperature values in the HTML
  */
  var ec = document.getElementById('ec_value');
  ec.innerHTML = ec_value;
  var tmp = document.getElementById('temperature_value');
  tmp.innerHTML =  temperature_value;
    }

function toggleLogging() {
  /**
  *  toggles the logging process by setting global var is_logging to true or false
  *  first asks the sensor for its ID (this is picked up by ReadCallback)
  *  kickstarts the process by sending the first request for a measurement to the sensor (consecutive measurement commands are made in ReadCallback )
  * this function is called upon within startStop()
  */
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
    public navCtrl: NavController, private http:Http) {

      document.addEventListener("deviceready", onDeviceReady, false);
      function onDeviceReady() {
        // alert("Device Ready");
        var online = Observable.fromEvent(document, 'online')
        online.subscribe(()=>{
          alert('connection!')
          this.readFileContents()
        })
        uuid = Device.device.uuid;
        // latlon = '(x;y)';
        record_sent = false;
        base_path = cordova.file.dataDirectory;
        dir_name = 'AcaciaData';
        db_file_name = 'measurement_table.csv';
        tmp_file_name = 'temp_db.csv'
        path = base_path+dir_name;
        checkDatabaseFiles()
        Diagnostic.isLocationAvailable().then((resp) => {
          if (!resp){
            alert('Zet a.u.b. GPS aan')
          }
        }
        ).catch(err => alert('isLOC error'+JSON.stringify(err)))
      };
    }


  startStop() {
    /**
    *  linked to html button
    *  starts the measuring process by
    *  1 requesting permission 2 opening port 3 registering a read callback, 4 toggling toggleLogging()
    */
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
               /**
               * responds to responses from the sensor
               *  converts this data to string and concatenates these strings until response has fully arrived
               *  after first EC and temperature measurements have succesfully been assigned to their global vars it enables enableSendButton()
               *  sends a request for a measurement to the sensor if global var is_logging is true (this triggers a loop in the ReadCallback)
               */
              var view = new Uint8Array(data);
              var s = String.fromCharCode.apply(String,view);
              tempor_values += s;
              if (s.endsWith('\n')){
                var complete_input = tempor_values
                tempor_values = ''
                if (complete_input.indexOf('Water') >= 0){
                  ec_sensor_id = complete_input.replace(/\s/g,'')
                  // alert('ec id = '+ec_sensor_id)
                  encoded = btoa(ec_sensor_id+':'+ec_sensor_id)
                  // headers['Authorization'] = 'Basic '+encoded
                  // alert('headers = ' +JSON.stringify(headers))
                  // displayValue('WATER', ec_sensor_id)
                }
                else if (complete_input.indexOf(',') >= 0){
                  var split_values = complete_input.split(',')
                  temperature_value = split_values[0]
                  ec_value = split_values[1].replace('\r\n','')
                  var ecv = parseFloat(split_values[1].replace('\r\n',''))
                  if(ecv>=1000.0){
                    ec_value = Math.round(ecv).toString()
                  }
                  else{
                    ec_value = ecv.toString()
                  }
                  displayValue(ec_value,temperature_value)
                  if (ec_value!=='-1'){
                    enableSendButton()
                  }
                }
                if (is_logging){
                  serial.write("R\r\n")
                }
              }
            },
          // error attaching the callback
            function error(evt){
              alert('A '+JSON.stringify(evt));
            }
           );
           toggleLogging();
        }, function error(evt){
          alert('B '+JSON.stringify(evt));
        }
      );
    },
    function error(evt){
      alert('C ' +JSON.stringify(evt));
    },
    );
  }
  else{
     toggleLogging();
  }
}

    startSavingSendingProcess(){
      /**
      * this function starts the saviong process by first checking if gps is turned on, then asking for the location
      * this function triggers a cascade effect of chained functions that return promises. the order of wich is:
      * 1 getCurrentPosition, 2saveMeasurement() , 3writeFile(), 4readFileContents(), 5sendData(), 6HTTP.post()
      */

      Diagnostic.isLocationAvailable().then((resp) => {
        if (!resp){
          alert('Zet a.u.b. GPS aan')
        }
        if (resp){
          Geolocation.getCurrentPosition().then((resp) => {
            disableSendButton()
            this.saveMeasurement(resp)
          }).catch(error => alert('GPS signaal error.\n'+ error))
        }
      }
      ).catch(err => alert('isLOC error'+JSON.stringify(err)))

    }

    saveMeasurement(location){

      /**
      * checks to see if the app already created a directory to save file in and creates it if needed
      * triggers writeFile
      */

      alert('init saveMeasurement with EC set to = '+ec_value)

      var latit = location.coords.latitude
      var longit = location.coords.longitude
      var lat = latit.toString()
      var lon = longit.toString()
      var horizontal_accuracy = location.coords.accuracy
      var altitude = location.coords.altitude
      var vertical_accuracy = location.coords.altitudeAccuracy

      var datetime = getCurrentDateTime()
      var ec_entity = 'EC'
      var ec_unit = 'µS/cm'
      var tmp_entity = 'temperature'
      var tmp_unit = '°C'
      var ec_record = new Record(ec_sensor_id, datetime, ec_value, ec_entity, ec_unit, lat, lon,horizontal_accuracy,altitude,vertical_accuracy, uuid, record_sent)
      var tmp_record = new Record(ec_sensor_id, datetime, temperature_value, tmp_entity, tmp_unit, lat, lon,horizontal_accuracy,altitude,vertical_accuracy, uuid, record_sent)
      var ec_data = ec_record.getRecord()
      var tmp_data = tmp_record.getRecord()
      File.checkDir(base_path, dir_name).then(_ => this.writeFile(path, db_file_name, ec_data, tmp_data)).catch(err => this.newDirAndFile(base_path, dir_name, path, db_file_name, ec_data, tmp_data))
    }
    newDirAndFile(base_path, dir_name, path, file_name, ec_data, tmp_data){
      /**
      * creates new directory and triggers writeFile()
      */
      alert('init newDirAndFile');
      File.createDir(base_path, dir_name, false).then(_ => this.writeFile(path, file_name, ec_data, tmp_data)).catch(err => alert('createDir '+base_path+dir_name+' '+JSON.stringify(err)));
    }
    writeFile(path, file_name, ec_data, tmp_data){
      /**
      * writes to file and triggers readFileContents()
      */
      alert('init writeFile')
      ec_data += '\n'
      tmp_data += '\n'
      // File.writeFile(path, file_name, data, false).then(_ => alert('writeFile success path = '+path+' file_name = '+file_name+' data = '+data)).catch(err => alert('writeFile '+JSON.stringify(err)+ ' path = '+path+' file_name = '+file_name+' data = '+data));
      File.writeFile(path, file_name, ec_data, {append:true})
        .then(_ => File.writeFile(path, file_name, tmp_data, {append:true})
          .then(_ => this.readFileContents())
          .catch(err => alert('createFile '+JSON.stringify(err))))
        .catch(err => alert('createFile '+JSON.stringify(err)))
    }
    readFileContents(){
      /**
      * writes to file and triggers sendData()
      */
      File.readAsText(path+'/', db_file_name).then(text => this.sendData(text)).catch(err => alert('readFilecontents: path = '+path+'/'+db_file_name+'readAsText error ='+JSON.stringify(err)))
      .catch(err => alert('readAsText file reading failed at : '+path+'/'+db_file_name+'. Error = '+JSON.stringify(err)))
    }

    sendData(text){
      /**
      * expects content of saved file as string
      * makes two arrays of dictionaries by cloning, one to send, other to save
      */
      alert('init sendData')
      var tmp_array_of_records = []
      var clone_array_for_api = []
      var headers = new Headers();
      var auth = 'Basic '+encoded
      headers.append('Authorization' , auth);
      headers.append('Content-Type', 'application/json');
      var json_str = '{"date": "2016-12-01T10:30:00", "elevation": -2.2, "entity": "EC", "hacc": 3.0, "laitude": 52.62, "longitude": 4.54, "phone": "", "sensor": "WaterEC197", "unit": "µS/cm", "vacc": 12.0, "value": 197.0}'
      var row = text.split('\n')
      for (var line = row.length-2; line >= 0; line--){
        var obj = JSON.parse(row[line])
        var cl = clone(obj)
        tmp_array_of_records.push(obj)
        delete cl['record_sent']
        clone_array_for_api.push(cl)
      }

      var body = JSON.stringify({objects:clone_array_for_api})
      alert('jsut before end sendData')

      if (Network.connection!=='none'){
        this.http.patch(api_url_https, body, {headers: headers}).subscribe(api_response => this.saveArrayOfRecords(api_response, tmp_array_of_records))
      }
      if (Network.connection =='none'){
        // if no internet
        this.saveArrayOfRecords({'status': 'nointernet'}, tmp_array_of_records)
      }
    }

    saveArrayOfRecords(api_response, array_of_records){
      /**
      expects the api_response
      reads tmp_array_of_records
      if 202 is returned, the record_sent value is changed
      saves the records in a temporary file
      replaces original db file with it
      */
      // alert('init saveArrayOfRecords')
      alert('init saveArrayOfRecords with resp = '+JSON.parse(JSON.stringify(api_response))['status'])

      var table :HTMLTableElement

      try {
      table = <HTMLTableElement> document.getElementById('history_table')
      alert(table.id)
      table.innerHTML = '<tr><th>Datum</th><th>EC</th><th>Verstuurd</th></tr>'
      alert('JE HEBT EM!'+table.outerHTML)
      }
      catch(err){
        alert('err = '+err.message)
      }

      var response = JSON.parse(JSON.stringify(api_response))
        var body = ''
        for (var i=0; i<=array_of_records.length-1; i++){
          var x = array_of_records[i]
          if (response['status']==202){
            x['record_sent']=true
          }
          if (x['entity']=='EC'){
            if(table !== null){
              addRecordToTable(table, x)
            }
          }
          var line = JSON.stringify(array_of_records[i])+'\n'
          body+=line
        }

        File.writeFile(path, tmp_file_name, body, {append:false})
          .then(_ => File.removeFile(path, db_file_name)
            .then(_ => File.moveFile(path, tmp_file_name, path, db_file_name)
              .then(path => enableSendButton())
              .catch(err => alert('tmp to db file replacement error: '+err)))
            .catch(err => alert('db file removal error: '+err)))
          .catch(err => alert('tmp file saving error: '+err))
    }

    // removeDbFile(){
    //   // TESTING
    //   File.removeFile(path, db_file_name).then(str => alert(JSON.stringify(str)))
    // }
    // checkDir(){
    //   /**debug*/
    //   File.checkDir(base_path, dir_name).then(_ => alert(base_path+dir_name+' is found')).catch(err => alert('checkDir '+JSON.stringify(err)));
    // }
    // checkFile(){
    //   /**debug*/
    //   File.checkFile(path+'/', db_file_name).then(_ => alert('checkFile '+path+db_file_name+' found')).catch(err => alert('checkFile '+path+'/'+db_file_name+' error ='+JSON.stringify(err)));
    // }
    // alertFileContents(){
    //   /**debug*/
    //   File.readAsText(path+'/', db_file_name).then(succ => alert('readAsText '+path+'/'+db_file_name+' '+succ)).catch(err => alert('readAsText '+path+'/'+db_file_name+' '+JSON.stringify(err)))
    // }

}
