import { BrowserModule } from '@angular/platform-browser';
import { ErrorHandler, NgModule } from '@angular/core';
import { IonicApp, IonicErrorHandler, IonicModule } from 'ionic-angular';
import { SplashScreen } from '@ionic-native/splash-screen';
import { StatusBar } from '@ionic-native/status-bar';

import { MyApp } from './app.component';
import { HomePage } from '../pages/home/home';
import { DetailsPage } from '../pages/details/details';
import { ReceiptPage } from '../pages/receipt/receipt';

import { ZetaPushClientConfig, ZetaPushModule } from 'zetapush-angular';
import { Camera } from '@ionic-native/camera';
import { Dialogs } from '@ionic-native/dialogs';
import { Geolocation } from '@ionic-native/geolocation';
import { LocalNotifications } from '@ionic-native/local-notifications';
import { File } from '@ionic-native/file';

import { FileApiProvider } from '../file/file-api.service';
import { FileUpload } from '../file/file-upload.service';

import { WoleetApiProvider } from '../woleet/woleet-api.service'; 

@NgModule({
  declarations: [
    MyApp,
    HomePage,
    DetailsPage,
    ReceiptPage
  ],
  imports: [
    BrowserModule,
    IonicModule.forRoot(MyApp),
    ZetaPushModule,
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
    HomePage,
    DetailsPage,
    ReceiptPage
  ],
  providers: [
    StatusBar,
    SplashScreen,
    Camera,
    Dialogs,
    Geolocation,
    FileApiProvider, 
    FileUpload,
    WoleetApiProvider,
    LocalNotifications,
    File,
    { provide: ZetaPushClientConfig, useValue: { sandboxId: '<sandboxId>' }},
    {provide: ErrorHandler, useClass: IonicErrorHandler}
  ]
})
export class AppModule {}
