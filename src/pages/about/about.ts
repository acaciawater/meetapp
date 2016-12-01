import { Component } from '@angular/core'
import { NavController } from 'ionic-angular'
import { File } from 'ionic-native'

declare var cordova: any

var base_path = ''
var dir_name = 'AcaciaData'
var file_name = 'measurement_table.csv'
var path = ''

function displayHistory(history){
  var row = history.split('\n')
  for (var line = row.length-2; line >= 0; line--){
    var obj = JSON.parse(row[line])
    var table: HTMLTableElement = <HTMLTableElement> document.getElementById('history_table')
    var datetime = obj['date']
    var ec = obj['ec']
    var tmp = obj['tmp']
    var sent = obj['record_sent']
    var tr = table.insertRow(1)
    var td_date = tr.insertCell(0)
    var td_tmp = tr.insertCell(1)
    var td_ec = tr.insertCell(2)
    var td_sent = tr.insertCell(3)
    td_date.innerHTML = datetime
    td_tmp.innerHTML = tmp
    td_ec.innerHTML = ec
    if (sent){
      td_sent.innerHTML = 'Ja'
    }
    else {
      td_sent.innerHTML = 'Nee'
    }
  }
}

@Component({
  selector: 'page-about',
  templateUrl: 'about.html'
})

export class AboutPage {
  constructor(public navCtrl: NavController) {
    document.addEventListener("deviceready", onDeviceReady, false)
    function onDeviceReady() {
    base_path = cordova.file.dataDirectory
    path = base_path+dir_name
    File.readAsText(path+'/', file_name).then(history => displayHistory(history)).catch(err => alert('readAsText '+path+'/'+file_name+' '+JSON.stringify(err)))
    }
  }
  visualiseHistory(){
    File.readAsText(path+'/', file_name).then(history => displayHistory(history)).catch(err => alert('readAsText '+path+'/'+file_name+' '+JSON.stringify(err)))
  }
}
