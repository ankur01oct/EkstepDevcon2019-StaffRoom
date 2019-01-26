import {
  IonicPage,
  NavController,
  NavParams,
  Events
} from 'ionic-angular';
import {
  Component,
  NgZone,
  OnInit
} from '@angular/core';
import {
  ContentService,
  CourseService,
  PageId,
  Environment,
  ImpressionType,
  LogLevel,
  ContentFilterCriteria
} from 'sunbird';

import { CourseUtilService } from '../../service/course-util.service';
import { TelemetryGeneratorService } from '../../service/telemetry-generator.service';
import { CommonUtilService } from '../../service/common-util.service';
import { mobiscroll, MbscEventcalendarOptions } from '@mobiscroll/angular';


import { ViewChild, ElementRef } from '@angular/core';
import { Platform, Content, ViewController } from 'ionic-angular';
import 'rxjs/add/operator/map';
import { AppConstnats } from './app-constants';
import { SearchPage } from '../search';

mobiscroll.settings = {
  theme: 'material'
};
@IonicPage()
@Component({
  selector: 'page-view-more-activity',
  templateUrl: 'view-more-activity.html',
})

export class ViewMoreActivityPage implements OnInit {
  @ViewChild('content', { read: ElementRef })
    private content: ElementRef;
    private backButtonFunc: any;
    private timeTable;

    private teacherId: string;
    private visitorId = '';
    private visitorName = '';

  constructor(
    private platform: Platform,
    private viewCtrl: ViewController,
    private navCtrl: NavController,
    public navParams: NavParams) {
        this.visitorName = this.navParams.get('vistorName');
        this.visitorId = this.navParams.get('visitorId');
    }



  headerTitle: string;
  events: any;

  dailySettings: MbscEventcalendarOptions = {
    display: 'inline',
    view: {
        eventList: { type: 'day' }
    },
    onEventSelect: (event, inst) => {
        // this.getSearchIdentifiers();
        console.log('on onEvent Select', event);
        if (event.event.start.search('2019-01-24') === -1) {
            this.navCtrl.push(SearchPage, {
                data: event,
                teacherId: this.teacherId,
                visitorId: this.visitorId,
                visitorName: this.visitorName
              });
        } else {
            this.navCtrl.push(SearchPage, {
                data: event,
                teacherId: this.teacherId,
                visitorId: this.visitorId,
                visitorName: this.visitorName
              });
        }

    }
};

weeklySettings: MbscEventcalendarOptions = {
    display: 'inline',
    view: {
        eventList: { type: 'week' }
    }
};

monthlySettings: MbscEventcalendarOptions = {
    display: 'inline',
    view: {
        eventList: { type: 'month' }
    }
};

ionViewWillEnter(): void {
  if (this.headerTitle !== this.navParams.get('headerTitle')) {
this.headerTitle = this.navParams.get('headerTitle');
}
}


ngOnInit() {
this.teacherId = 'TCH1';
this.events = AppConstnats.TCH1;
}
}
