import { Component } from '@angular/core';
import { NavController} from 'ionic-angular';
import { File } from 'ionic-native';
import { Geolocation } from 'ionic-native';
import { Device } from 'ionic-native';
import { Http, Headers } from '@angular/http';
import { Diagnostic } from 'ionic-native';
import 'rxjs/add/observable/fromEvent';
import { Network } from 'ionic-native';
import 'rxjs/add/operator/map';

declare var serial;
declare var cordova: any;

var appLanguage = {}
var api_url_https = 'https://meet.acaciadata.com/api/v1/meting/'
var tmp_file_name = ''
var tempor_values = ''
var ec_value = ''
var temperature_value = ''
var uuid = ''
var ec_sensor_id = null
var record_sent = false
var base_path:string = ''
var dir_name = ''
var db_file_name = ''
var is_logging = false
var path = ''
var encoded = ''

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

function dutchLanguage(){
  var d = {}
  d['table_header'] = '<tr><th>Datum</th><th>EC</th><th>Verstuurd</th></tr>'
  d['yes'] = 'Ja'
  d['no'] = 'Nee'
  d['measure'] = 'Meten'
  d['history'] = 'Historie'
  d['syncwarning'] = 'Er zijn onverstuurde metingen<br>druk op Sync als u verbinding heeft.'
  d['gpswarning'] = 'Zet a.u.b. uw GPS aan'
  d['internetwarning'] = 'Er is geen internetverbinding'
  return d
}

function englishLanguage(){
  var d = {}
  d['table_header'] = '<tr><th>Date</th><th>EC</th><th>Sent</th></tr>'
  d['yes'] = 'Yes'
  d['no'] = 'No'
  d['measure'] = 'Measure'
  d['history'] = 'History'
  d['syncwarning'] = 'You have unsent measurements: press Sync when you have internet.'
  d['gpswarning'] = 'Please turn on GPS'
  d['internetwarning'] = ' There is no internet connection'
  return d
}

function hasNumber(myString) {
  return /\d/.test(myString);
}

function embedLanguageInHome(d){
  var syncwarning = <HTMLDivElement> document.getElementById('warning')
  syncwarning.innerHTML = d['syncwarning']
  var send_button = <HTMLInputElement> document.getElementById('send_record')
  send_button.innerHTML = d['measure']
}

function makeFloat(ec_value) {
    var result = parseFloat(ec_value)
    if (isNaN(result)) {
        return -1
    }
    else {
        return result
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
    td_sent.innerHTML = appLanguage['yes']
  }
  else {
    td_sent.innerHTML = appLanguage['no']
  }
}

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

function checkSubString(str, substr) {
    return str.indexOf(substr) !== -1
}

function checkSensorID(ec_sensor_id) {
    if (checkSubString(ec_sensor_id, ',')) {
        var a = ec_sensor_id.split(',')
        for (var i = 0; i < a.length; i++) {
            if (checkSubString(a[i], 'Water')) {
                ec_sensor_id = a[i]
            }
        }
    }
    return ec_sensor_id
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

function checkSyncStatus(){
  function check(text){
    var row = text.split('\n')
    for (var line = row.length-2; line >= 0; line--){
      var obj = JSON.parse(row[line])
      if (obj['record_sent'] == false) {
        enableSyncButton()
        enableStartStopButton()
        return null
      }
    }
    enableStartStopButton()
  }
  File.readAsText(path+'/', db_file_name)
  .then(text => {
    check(text)})
  .catch(err => alert('checkSync, readAsText failed at : '+path+'/'+db_file_name+'. Error = '+JSON.stringify(err)))
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
  alert(JSON.stringify(entries))
  /**
  expects files found in the application directory
  if none are found, its ok (first time app has been installed)
  if only db file is foudn, its ok
  if only tmp file is found, the db file got removed, but the tmp file not renamed, fixes this
  if both are found and tmp is corrupt, remove tmp
  if both are found and tmp is not corrupt, remove db and rename tmp
  */
  var db_file = false
  var tmp_db_file = false
  for (var i=0;i<=entries.length-1;i++){
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
    alert(db_file+'\n'+tmp_db_file)
    checkSyncStatus()
  }
  if (!db_file&&!tmp_db_file){
    //  if neither
    enableStartStopButton()
  }
  if (!db_file&&tmp_db_file){
    // if only tmp file rename it
          File.moveFile(path, tmp_file_name, path, db_file_name)
          .then(_ => checkSyncStatus())
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
              .then(_ => checkSyncStatus())
              .catch(err => alert('error moving tmp to db file, error = '+JSON.stringify(err))))
          .catch(err => alert('error removing file, '+JSON.stringify(err))))
      // file is corrupt
      .catch(_ =>
        File.removeFile(path, tmp_file_name)
          .then(succ => checkSyncStatus())
          .catch(err => alert('failed removing file'+JSON.stringify(err))))
  }
}

function toggleSyncButton(response){
  if (response['status']==202 || response['status']==201 ){
      disableSyncButton()
  }
  if (response['status']!==202 && response['status']!==201 ){
      enableSyncButton()
  }
}

function enableSyncButton(){
  var warning = <HTMLDivElement> document.getElementById('warning')
  var sync_button = <HTMLInputElement> document.getElementById('sync')
  warning.style.visibility = 'visible'
  setTimeout(function() {
    warning.style.visibility = 'hidden'
  }, 4000);
  setTimeout(function() {
    sync_button.disabled = false;
    sync_button.style.visibility = 'visible'
    sync_button.style.background = '#3688C2'
  }, 4200);
}

function disableSyncButton(){
  var sync_button = <HTMLInputElement> document.getElementById('sync')
  sync_button.disabled = true
  sync_button.style.visibility = 'hidden'
  sync_button.style.background = '#808080'
}

function enableSendButton(){
  if (ec_value!==''){
    var send_record_button = <HTMLInputElement> document.getElementById('send_record')
    send_record_button.disabled = false;
    send_record_button.style.background = '#3688C2';
  }
}

function disableSendButton(){
  var send_record_button = <HTMLInputElement> document.getElementById('send_record')
  send_record_button.disabled = true;
  send_record_button.style.background = '#808080';
}

function enableStartStopButton(){
  var start_stop_button = <HTMLInputElement> document.getElementById('startStop')
  start_stop_button.disabled = false;
  start_stop_button.style.background = '#3688C2';
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
    ec_sensor_id = null
    is_logging = true;
    var ss = document.getElementById('startStop');
    ss.innerHTML = 'Stop';
    alert('logging on');
    alert('write DEVICE')
    serial.write("DEVICE\r\n");
    serial.write("R\r\n");
  }
  else{
    is_logging = false;
    var ss = document.getElementById('startStop');
    ss.innerHTML = 'Start';
    alert('logging off');
  }
}

function saveArrayOfRecords(api_response, array_of_records){
  /**
  expects the api_response
  reads tmp_array_of_records
  if 202 is returned, the record_sent value is changed
  saves the records in a temporary file
  replaces original db file with it
  */
  alert('init saveArrayOfRecords with resp = '+JSON.parse(JSON.stringify(api_response))['status'])
  var table :HTMLTableElement
  try {
  table = <HTMLTableElement> document.getElementById('history_table')
  alert(table.id)
  table.innerHTML = appLanguage['table_header']
  alert('JE HEBT EM!'+table.outerHTML)
  }
  catch(err){
    alert('err = '+err.message)
  }

  var response = JSON.parse(JSON.stringify(api_response))
  toggleSyncButton(response)
  var body = ''
  for (var i=0; i<=array_of_records.length-1; i++){
    var x = array_of_records[i]
    if (response['status']==202 || response['status']==201 ){
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
        .then(() => {
          if (is_logging == true){
            alert('logging true')
            enableSendButton()
          }
        })
        .catch(err => alert('tmp to db file replacement error: '+err)))
      .catch(err => alert('db file removal error: '+err)))
    .catch(err => alert('tmp file saving error: '+err))
}

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})

export class HomePage {
  public value = 'A';
  public online = null;

  constructor(public navCtrl: NavController, private http:Http) {
      document.addEventListener("deviceready", function(){onDeviceReady()}, false);
      function onDeviceReady() {
        alert("Device Ready");
        // alert('value is = '+ home.value)
        uuid = Device.device.uuid;
        // latlon = '(x;y)';
        record_sent = false;
        base_path = cordova.file.dataDirectory;
        dir_name = 'AcaciaData';
        db_file_name = 'measurement_table.csv';
        tmp_file_name = 'temp_db.csv'
        path = base_path+dir_name;
        checkDatabaseFiles()
        var lang = window.navigator.language
        if (lang == 'nl-NL'){
          appLanguage = dutchLanguage()
        }
        else{
          appLanguage = englishLanguage()
        }
        embedLanguageInHome(appLanguage)
        Diagnostic.isLocationAvailable().then((resp) => {
          if (!resp){
            alert(appLanguage['gpswarning'])
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
    ec_value = ''

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
                // if there's 'Water' in the output and it doesnt contain a '.' (WaterEC1.0 bug)
                if (ec_sensor_id==null){
                  if (complete_input.indexOf('Water') >= 0 && complete_input.indexOf('.') < 0 && hasNumber(complete_input)){
                    ec_sensor_id = complete_input.replace(/\s/g,'')
                    ec_sensor_id = checkSensorID(ec_sensor_id)
                    encoded = btoa(ec_sensor_id+':'+ec_sensor_id)
                  }
                  else{
                      serial.write("DEVICE\r\n")
                  }
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
                  var ec_float = makeFloat(ec_value)
                  alert('ec_float = '+ec_float+' and ec_sensor_id = '+ec_sensor_id)
                  if (ec_float>=0 && ec_sensor_id!=''){
                    if (is_logging == true){
                      alert('logging true')
                      enableSendButton()
                    }
                  }
                  if (ec_float<0){
                    disableSendButton()
                  }
                }
                if (is_logging){
                  serial.write("R\r\n")
                }
              }
            },
          // error attaching the callback
            function error(evt){
              alert('A '+JSON.stringify(evt))
            }
           );
           toggleLogging();
        }, function error(evt){
          alert('B '+JSON.stringify(evt))
        }
      );
    },
    function error(evt){
      alert('Geen sensor gevonden\nNo sensor found')
    },
    );
  }
  else{
    toggleLogging()
  }
}

    startSavingSendingProcess(){
      /**
      * this function starts the saviong process by first checking if gps is turned on, then asking for the location
      * this function triggers a cascade effect of chained functions that return promises. the order of wich is:
      * 1 getCurrentPosition, 2saveMeasurement() , 3writeFile(), 4readFileContents), 5sendData(), 6HTTP.post()
      */

      disableSendButton()
      Diagnostic.isLocationAvailable().then((resp) => {
        if (!resp){
          alert('Zet a.u.b. GPS aan')
          enableSendButton()
        }
        if (resp){
          Geolocation.getCurrentPosition().then((resp) => {
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
      if (ec_value!=''){
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
      else{
        alert('savemeasruemnt fail cause ec value = '+ec_value)
      }
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
      * writes to file and triggers readFileContents)
      */
      alert('init writeFile')
      ec_data += '\n'
      tmp_data += '\n'
      File.writeFile(path, file_name, ec_data, {append:true})
        .then(_ => File.writeFile(path, file_name, tmp_data, {append:true})
          .then(_ => this.readFileContents(path, file_name))
          .catch(err => alert('createFile '+JSON.stringify(err))))
        .catch(err => alert('createFile '+JSON.stringify(err)))
    }
    triggerReadFileContents(){
      // if this.online ==
      var networkState = Network.connection
      if (networkState=='none'){
        alert(appLanguage['internetwarning'])
      }
      else{
        disableSendButton()
        this.readFileContents(path, db_file_name)
      }
    }

    readFileContents(path, file_name){
      /**
      * writes to file and triggers sendData()
      */
      File.readAsText(path+'/', file_name).then(text => this.sendData(text)).catch(err => alert('readFilecontents: path = '+path+'/'+file_name+'readAsText error ='+JSON.stringify(err)))
      .catch(err => alert('readAsText file reading failed at : '+path+'/'+file_name+'. Error = '+JSON.stringify(err)))
    }


   sendData(text){
      /**
      * expects content of saved file as string
      * makes two arrays of dictionaries by cloning, one to send, other to save
      */
      alert('init sendData')
      var tmp_array_of_records = []
      var body = ''
      var clone_array_for_api = []
      var row = text.split('\n')
      for (var line = row.length-2; line >= 0; line--){
        var obj = JSON.parse(row[line])
        var cl = clone(obj)
        tmp_array_of_records.push(obj)
        delete cl['record_sent']
        clone_array_for_api.push(cl)
      }
      alert('jsut before end sendData')

      if (encoded==''){
        ec_sensor_id = obj['sensor']
        encoded = btoa(ec_sensor_id+':'+ec_sensor_id)
      }
      alert('ec_sensor_id ='+ec_sensor_id)
      var headers = new Headers();
      var auth = 'Basic '+encoded
      headers.append('Authorization' , auth);
      headers.append('Content-Type', 'application/json');

      if (Network.connection!=='none'){
        alert('before this.http')
        this.http
          .get('https://meet.acaciadata.com/api/v1/sensor/?sensor_id='+ec_sensor_id, {headers:headers})
          .map(response => response.json())
          .subscribe(
            res => {
              var sensor_pk = res.objects[0].resource_uri
              for (var ob = clone_array_for_api.length-1; ob >= 0; ob--){
                clone_array_for_api[ob]['sensor_pk'] = sensor_pk
              }
              body = JSON.stringify({objects:clone_array_for_api})
              alert(encoded+'\n'+JSON.stringify(headers)+'\n'+body)
              this.http.patch(api_url_https, body, {headers: headers}).subscribe(api_response => saveArrayOfRecords(api_response, tmp_array_of_records))
            }
          )
      }
      else if (Network.connection =='none'){
        // if no internet
        saveArrayOfRecords({'status': 'nointernet'}, tmp_array_of_records)
      }
      else{
        alert('ended up in else clause somehow')
      }
  }
}
