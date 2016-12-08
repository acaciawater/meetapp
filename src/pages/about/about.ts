import { Component } from '@angular/core'
import { NavController } from 'ionic-angular'
import { File } from 'ionic-native'

declare var cordova: any

var base_path = ''
var dir_name = 'AcaciaData'
var file_name = 'measurement_table.csv'
var path = ''

function displayHistory(history){
  /**
  * reads through saved records and adds max 100 records to table
  */
  var table: HTMLTableElement = <HTMLTableElement> document.getElementById('history_table')
  table.innerHTML = ''

  var tr = table.insertRow(0)
  var th_date = tr.insertCell(0)
  var th_ec = tr.insertCell(1)
  var th_sent = tr.insertCell(2)
  th_date.innerHTML = 'Datum'
  th_ec.innerHTML = 'EC'
  th_sent.innerHTML = 'Verstuurd'

  var row = history.split('\n')
  for (var line = row.length-2; ((line >= 0)&&(line>row.length-100)); line--){
    var obj = JSON.parse(row[line])
    if (obj['entity']=='EC'){
      var datetime = obj['date']
      var ec = obj['value']
      var sent = obj['record_sent']
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
  }
}

@Component({
  selector: 'page-about',
  templateUrl: 'about.html'
})

export class AboutPage {
  constructor(public navCtrl: NavController) {
    /**
    * on device ready loads the table by calling displayHistory()
    */
    document.addEventListener("deviceready", onDeviceReady, false)
    function onDeviceReady() {
      base_path = cordova.file.dataDirectory
      path = base_path+dir_name
      File.readAsText(path+'/', file_name).then(history => displayHistory(history)).catch(_ => 'do nothing')
    }
    // window.addEventListener('load',onPageShow)
    // function onPageShow() {
    //   alert('abii')
    // }

    // document.getElementById("history_table").addEventListener("load", onPageShow)
    // // window.addEventListener("pageshow", onPageShow, false)
    //
      // this.visualiseHistory()

  }




  visualiseHistory(){
    /**
    * attached to button in html to reload history
    */
    File.readAsText(path+'/', file_name).then(history => displayHistory(history)).catch(_ => 'do nothing')
  }
}
