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
    alert('row = '+row)
    alert('row length = '+row.length)
    alert('line = '+line)
    alert(' row = '+row[line])

    var values = row[line].split(',')
    var table: HTMLTableElement = <HTMLTableElement> document.getElementById('history_table')
    // var table = document.getElementById('history_table')

    //
    var datetime = values[0].split(';')[1]
    var ec = values[1].split(';')[1]
    var tmp = values[2].split(';')[1]
    var xy = values[3].split(';')[1]
    var uuid = values[4].split(';')[1]
    var sent =values[5].split(';')[1]
    //
    // alert(' values = '+values)
    // alert('ec = '+ec)
    // alert('tmp = '+tmp)
    // alert('xy = '+xy)
    // alert('uuid = '+uuid)
    // alert('sent = '+sent)

    var tr = table.insertRow(1)
    var td_date = tr.insertCell(0)
    var td_tmp = tr.insertCell(1)
    var td_ec = tr.insertCell(2)
    var td_sent = tr.insertCell(3)
    td_date.innerHTML = datetime
    td_tmp.innerHTML = tmp
    td_ec.innerHTML = ec
    td_sent.innerHTML = sent

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
