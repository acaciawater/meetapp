import { Component } from '@angular/core';

import { HomePage } from '../home/home';
import { AboutPage } from '../about/about';

@Component({
  templateUrl: 'tabs.html'
})
export class TabsPage {
  // this tells the tabs component which Pages
  // should be each tab's root Page
  // tab1Root: any = HomePage;
  // tab2Root: any = AboutPage;

  tabs : any = [];

  constructor() {
    var lang = window.navigator.language
    if (lang == 'nl-NL'){
      this.tabs.push({title: 'Meten', icon: 'water', component: HomePage});
      this.tabs.push({title: 'Historie', icon: 'albums', component: AboutPage});
    }
    else{
      this.tabs.push({title: 'Measure', icon: 'water', component: HomePage});
      this.tabs.push({title: 'History', icon: 'albums', component: AboutPage});
    }
    }

  // home(){
  //   return this.tab1Root
  // }

}
