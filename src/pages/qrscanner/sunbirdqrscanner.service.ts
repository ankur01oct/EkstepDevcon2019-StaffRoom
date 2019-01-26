import { HttpClient } from '@angular/common/http';
import { ViewMoreActivityPage } from './../view-more-activity/view-more-activity';
import { SearchPage } from './../search/search';
import { initTabs, GUEST_TEACHER_TABS, GUEST_STUDENT_TABS } from './../../app/module.service';
import { CommonUtilService } from './../../service/common-util.service';
import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import {
  PopoverController,
  Popover,
  Platform
} from 'ionic-angular';
import {
  QRScannerAlert,
  QRAlertCallBack
} from './qrscanner_alert';
import {
  Environment,
  Mode,
  InteractType,
  InteractSubtype,
  PageId,
  PermissionService,
  ImpressionType,
  ImpressionSubtype,
  TelemetryObject,
  TabsPage,
  ProfileType,
  ContainerService,
  Profile,
  DeviceInfoService
} from 'sunbird';
import { TelemetryGeneratorService } from '../../service/telemetry-generator.service';
import { QRScannerResultHandler } from './qrscanresulthandler.service';
import { ProfileSettingsPage } from '../profile-settings/profile-settings';
import { App } from 'ionic-angular';
import { AppGlobalService } from '../../service/app-global.service';
import { Subscription } from 'rxjs';
import { VisitorService } from './visitorservice';

@Injectable()
export class SunbirdQRScanner {
  profile: Profile;
  private readonly QR_SCANNER_TEXT = [
    'SCAN_QR_CODE',
    'SCAN_QR_INSTRUCTION',
    'UNKNOWN_QR',
    'SKIP',
    'CANCEL',
    'TRY_AGAIN',
  ];
  private mQRScannerText;
  readonly permissionList = ['android.permission.CAMERA'];
  backButtonFunc = undefined;
  private pauseSubscription?: Subscription;
  source: string;
  showButton = false;
  deviceId: string;

  constructor(
    private popCtrl: PopoverController,
    private translate: TranslateService,
    private permission: PermissionService,
    private platform: Platform,
    private qrScannerResultHandler: QRScannerResultHandler,
    private telemetryGeneratorService: TelemetryGeneratorService,
    private app: App,
    private commonUtil: CommonUtilService,
    private appGlobalService: AppGlobalService,
    private container: ContainerService,
    private visitorService: VisitorService,
    private deviceService: DeviceInfoService,
    private http: HttpClient
  ) {
    const that = this;
    this.translate.get(this.QR_SCANNER_TEXT).subscribe((data) => {
      that.mQRScannerText = data;
    }, (error) => {

    });

    this.translate.onLangChange.subscribe(() => {
      that.mQRScannerText = that.translate.instant(that.QR_SCANNER_TEXT);
    });
    this.deviceService.getDeviceID().then((data: any) => {
      this.deviceId = data;
    });
  }

  public startScanner(source: string, showButton: boolean = false,
    screenTitle = this.mQRScannerText['SCAN_QR_CODE'],
    displayText = this.mQRScannerText['SCAN_QR_INSTRUCTION'],
    displayTextColor = '#0b0b0b',
    buttonText = this.mQRScannerText['SKIP']
  ) {
    this.source = source;
    this.showButton = showButton;

    /* Just need to override the back button functionality other wise  on pressing back button it will take to two pages back */
    this.backButtonFunc = this.platform.registerBackButtonAction(() => {
      this.backButtonFunc();
    }, 10);
    this.pauseSubscription = this.platform.pause.subscribe(() => this.stopScanner());
    this.generateImpressionTelemetry(source);
    this.generateStartEvent(source);

    this.permission.hasPermission(this.permissionList).then((response: any) => {
      const result = JSON.parse(response);
      if (result.status) {
        const permissionResult = result.result;
        const askPermission = [];
        this.permissionList.forEach(element => {
          if (!permissionResult[element]) {
            askPermission.push(element);
          }
        });

        if (askPermission.length > 0) {
          this.permission.requestPermission(askPermission).then((res: any) => {
            const requestResult = JSON.parse(res);
            if (requestResult.status) {
              let permissionGranted = true;
              const permissionRequestResult = requestResult.result;
              askPermission.forEach(element => {
                if (!permissionRequestResult[element]) {
                  permissionGranted = false;
                }
              });

              if (permissionGranted) {
                this.startQRScanner(screenTitle, displayText, displayTextColor, buttonText, showButton, source);
              } else {
                this.commonUtil.showToast('PERMISSION_DENIED');
              }
            }
          }).catch((error) => {

          });
        } else {
          this.startQRScanner(screenTitle, displayText, displayTextColor, buttonText, showButton, source);
        }
      }
    }).catch((error) => {
      console.log('Error : ' + error);
    });
  }

  public stopScanner() {
    // Unregister back button listner
    this.backButtonFunc();
    (<any>window).qrScanner.stopScanner();
    if (this.pauseSubscription) {
      this.pauseSubscription.unsubscribe();
    }
  }

  getProfileSettingConfig() {
    this.profile = this.appGlobalService.getCurrentUser();
    if (this.profile.profileType === ProfileType.TEACHER) {
      initTabs(this.container, GUEST_TEACHER_TABS);
    } else if (this.profile.profileType === ProfileType.STUDENT) {
      initTabs(this.container, GUEST_STUDENT_TABS);
    }
    this.stopScanner();
    this.app.getActiveNavs()[0].push(TabsPage, { loginMode: 'guest' });
  }
  generateStartEventForDevCon(scannedData) {
    const telemetry = {
      eid: 'DC_START',
      ets: (new Date).getTime(),
      did: this.deviceId,
      dimensions: {
        visitorId: scannedData.code,
        visitorName: scannedData.name,
        stallId: 'STA2',
        stallName: 'CLASSROOM',
        ideaId: 'IDE6',
        ideaName: 'APPU Classroom',
        topics: [],
      },
      edata: {
        type: 'attendance',
        value: 100
      }
    };
    const request = {
      'events': telemetry
    };
    this.http.post('http://52.172.188.118:3000/v1/telemetry', request).subscribe((data: any) => {
      console.log('generateInteractTelemetry for Scan', data);
    });
  }

  private startQRScanner(screenTitle: string, displayText: string, displayTextColor: string,
    buttonText: string, showButton: boolean, source: string) {
    window['qrScanner'].startScanner(screenTitle, displayText,
      displayTextColor, buttonText, showButton, this.platform.isRTL, (scannedData) => {

        console.log('********************Scan Data', scannedData);
        const str = scannedData.match(/^VIS/g);
        if (str) {
          this.visitorService.getVisitorData(scannedData).subscribe(
                data  => {
                    console.log('POST Request is successful ******', data.result.Visitor);
                    const res = data.result.Visitor;
                    this.commonUtil.hierarchyInfo = [
                      {'visitorId': res.code},
                      {'stallId': 'STA2'},
                      {'idea': 'idea'}
                    ];
                    this.generateStartEventForDevCon(res);
                    this.app.getActiveNavs()[0].push(SearchPage, { loginMode: 'guest', headerTitle: 'Select Class',
                    vistorName: res.name, visitorId: res.code});
                    this.stopScanner();
                  },
                error  => {
                    console.log('Error', error);
                    this.stopScanner();
                }
            );
          // this.app.getActiveNavs()[0].push(SearchPage, { loginMode: 'guest', headerTitle: 'Select Class',
          //           vistorName: 'Test', visitorId: 'VIS999'});
          //           this.stopScanner();
        } else
        if (scannedData) {
            this.commonUtil.showToast('Invalid Qr Code');
            this.stopScanner();
        } else
        if (scannedData === 'skip') {
          if (this.appGlobalService.DISPLAY_ONBOARDING_CATEGORY_PAGE) {
            this.app.getActiveNavs()[0].push(ProfileSettingsPage, { stopScanner: true });
          } else {
            this.getProfileSettingConfig();
          }
          this.telemetryGeneratorService.generateInteractTelemetry(
            InteractType.TOUCH,
            InteractSubtype.SKIP_CLICKED,
            Environment.ONBOARDING,
            PageId.QRCodeScanner);
          this.generateEndEvent(source, '');
        } else {
          if (scannedData === 'cancel' ||
            scannedData === 'cancel_hw_back' ||
            scannedData === 'cancel_nav_back') {
            this.telemetryGeneratorService.generateBackClickedTelemetry(PageId.QRCodeScanner,
              source === PageId.ONBOARDING_PROFILE_PREFERENCES ? Environment.ONBOARDING : Environment.HOME,
              scannedData === 'cancel_nav_back' ? true : false);
            this.telemetryGeneratorService.generateInteractTelemetry(
              InteractType.OTHER,
              InteractSubtype.QRCodeScanCancelled,
              Environment.HOME,
              PageId.QRCodeScanner);
            this.generateEndEvent(source, '');
          } else if (this.qrScannerResultHandler.isDialCode(scannedData)) {
            this.qrScannerResultHandler.handleDialCode(source, scannedData);
          } else if (this.qrScannerResultHandler.isContentId(scannedData)) {
            this.qrScannerResultHandler.handleContentId(source, scannedData);
          } else {
            this.qrScannerResultHandler.handleInvalidQRCode(source, scannedData);
            this.showInvalidCodeAlert();
          }
          this.stopScanner();
        }
      }, () => {
        this.stopScanner();
      });
  }

  generateImpressionTelemetry(source) {
    this.telemetryGeneratorService.generateImpressionTelemetry(
      ImpressionType.VIEW,
      ImpressionSubtype.QRCodeScanInitiate,
      PageId.QRCodeScanner,
      source === PageId.ONBOARDING_PROFILE_PREFERENCES ? Environment.ONBOARDING : Environment.HOME);
  }

  generateStartEvent(scanData) {
    const telemetryObject: TelemetryObject = new TelemetryObject();
    telemetryObject.id = '';
    telemetryObject.type = 'qr';
    this.telemetryGeneratorService.generateStartTelemetry(
      scanData,
      telemetryObject);
  }

  generateEndEvent(pageId: string, qrData: string) {
    if (pageId) {
      const telemetryObject: TelemetryObject = new TelemetryObject();
      telemetryObject.id = qrData;
      telemetryObject.type = 'qr';
      this.telemetryGeneratorService.generateEndTelemetry(
        'qr',
        Mode.PLAY,
        PageId.QRCodeScanner,
        Environment.HOME,
        telemetryObject
      );
    }
  }

  showInvalidCodeAlert() {
    let popUp: Popover;
    const self = this;
    const callback: QRAlertCallBack = {
      tryAgain() {
        popUp.dismiss().then(() => {
          this.pauseSubscription.unsubscribe();
        });
        self.startScanner(self.source, self.showButton);
      },
      cancel() {
        popUp.dismiss().then(() => {
          this.pauseSubscription.unsubscribe();
        });

        if (self.showButton) {
          if (this.appGlobalService.DISPLAY_ONBOARDING_CATEGORY_PAGE) {
            self.app.getActiveNavs()[0].push(ProfileSettingsPage, { stopScanner: true });
          } else {
            this.getProfileSettingConfig();
          }
        }
      }
    };

    popUp = this.popCtrl.create(QRScannerAlert, {
      callback: callback,
      invalidContent: true,
      messageKey: 'UNKNOWN_QR',
      tryAgainKey: 'TRY_DIFF_QR'
    }, {
        cssClass: 'qr-alert-invalid'
      });

    popUp.present();
  }
}

export interface QRResultCallback {
  dialcode(scanResult: string, code: string);

  content(scanResult: string, contentId: string);
}
