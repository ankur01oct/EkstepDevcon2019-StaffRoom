import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { ViewMoreActivityPage } from './view-more-activity';
import { TranslateModule } from '@ngx-translate/core';
import { ComponentsModule } from '../../component/components.module';
import { MbscModule } from '@mobiscroll/angular';
import { FormsModule } from '@angular/forms';
@NgModule({
  declarations: [
    ViewMoreActivityPage,
  ],
  imports: [
    IonicPageModule.forChild(ViewMoreActivityPage),
    TranslateModule.forChild(),
    ComponentsModule,
    MbscModule,
    FormsModule
  ],
  exports: [
    ViewMoreActivityPage
  ]
})
export class ViewMoreActivityPageModule { }
