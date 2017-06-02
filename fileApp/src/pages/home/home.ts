import { Component, OnInit } from '@angular/core';
import { NavController, Platform } from 'ionic-angular';

import { ZetaPushConnection } from 'zetapush-angular';
import { Camera, CameraOptions } from '@ionic-native/camera';
import { Dialogs } from '@ionic-native/dialogs';
import { Geolocation } from '@ionic-native/geolocation';
import { FileUpload } from '../../file/file-upload.service';
import { DetailsPage } from '../details/details';
import { LoadingController } from 'ionic-angular';
import { FileApi } from '../../file/file-api.service';
import { WoleetApi } from '../../woleet/woleet-api.service';
import { LocalNotifications } from '@ionic-native/local-notifications';

// All metadata for a picture
export interface MetadataImage {
    tags: Array<string>;
    latitude: number;
    longitude: number;
    timestamp: number;
    status: string;
}

// Image with his metadata
export interface ImageObject {
    picture: string;
    tags: string;
    latitude: number;
    longitude: number;
    timestamp: number;
    status: string;
    path: string;
}


@Component({
selector: 'page-home',
templateUrl: 'home.html'
})

export class HomePage implements OnInit {

    photos: Array<ImageObject> = [];                                            // All photos on the ZetaPush platform
    loader;                                                                     // Loader to show loading message
    currentCompleteObject: any;                                                 // Complete object put in file management service


    options : CameraOptions = {
        quality: 100,
        destinationType: this.camera.DestinationType.DATA_URL,
        encodingType: this.camera.EncodingType.JPEG,
        mediaType: this.camera.MediaType.PICTURE
    }


    constructor(
        public navCtrl: NavController, 
        private platform: Platform, 
        private zpConnection: ZetaPushConnection,
        private camera: Camera,
        private dialogs: Dialogs,
        private geolocation: Geolocation,
        private upload: FileUpload,
        private LoadingController: LoadingController,
        private fileApi: FileApi,
        private woleetApi: WoleetApi,
        private notif: LocalNotifications) {

            // =========================================================================================
            //                                  HANDLES ZETAPUSH
            // =========================================================================================
            woleetApi.onDispatch.subscribe((message) => {
                console.log("PageDetails::onDispatch", message);

                let status = message['anchor']['status'];
                let name = message['anchor']['name'];
                let id = message['anchor']['created'];

                // We send a new notification
                this.showNotification(status, name, id);

                // Update metadata
                this.woleetApi.updateMetadata(name, status).then((msg) => {
                    console.log("onUpdateMetadata", msg);
                });

                this.woleetApi.listAnchors();

            })


            woleetApi.onCreateAnchor.subscribe((message) => {
            console.log("onCreateAnchor", message);
            this.woleetApi.addNewAnchorId(message['response']['content']['name'], message['response']['content']['id']);
            })



            fileApi.onGetFileEntryList.subscribe((message) => {
                console.log("onGetFileEntryList", message);

                this.photos = [];

                // Get all photos from the ZetaPush platform
                message['entries']['content'].forEach(element => {
                    let img : ImageObject = {
                        'picture': element['metadata']['thumb-200'] != undefined ? element['metadata']['thumb-200']['url'] : element['url']['url'],
                        'tags': (element['metadata']['tags']).join(","),
                        'latitude': +element['metadata']['latitude'],
                        'longitude': +element['metadata']['longitude'],
                        'timestamp': +element['metadata']['timestamp'],
                        'status': element['metadata']['status'],
                        'path': element['url']['path']
                    }
                    this.photos.push(img);
                })
            })


            fileApi.onDeleteFileEntry.subscribe((message) => {
                console.log("onDeleteFileEntry", message);
                this.fileApi.getFileEntryList({'folder': '/', 'owner': null});

                // Delete the Anchor ID
                this.woleetApi.getAnchorId(message['path']).then((msg) => {
                    this.woleetApi.deleteAnchor(msg['id']);
                    this.woleetApi.removeAnchorId(message['path']);
                })
                

            })
        }


    // Launch the connection to the ZetaPush platform and get all pictures
    ngOnInit(): void {

            this.platform.ready().then(() => {
                this.zpConnection.connect({'login':'user', 'password':'password'}).then(() => {
                    console.debug("ZetaPushConnection:OK");
                    this.fileApi.getFileEntryList({'folder': "/", 'owner': null});
                })
            });
        }

    
    // Method to take a photo with his metadata (localisation, date, tags)
    takePhoto(): void {

        this.platform.ready().then(() => {
            
            this.camera.getPicture(this.options).then((image) => {

            // Create blob object
            let base64Image = 'data:image/jpeg;base64,' + image;

            this.loader = this.LoadingController.create({
                content: "We convert the picture..."
            });

            this.loader.present().then(() => {
                fetch(base64Image).then(res => res.blob()).then(blob => {
                this.loader.dismiss();

                this.dialogs.prompt("Type tags (separated by commas)", "Upload picture", ["OK"], "").then((msg) => {
                    if (msg.buttonIndex == 1) {
                        let tags = msg.input1.split(",");
                        
                        // Create an image object
                        let picture : MetadataImage = {
                            'tags': tags,
                            'latitude': null,
                            'longitude': null,
                            'timestamp': Date.now(),
                            'status': null 
                        };

                        // Get the position
                        this.geolocation.getCurrentPosition().then((resp) => {

                            picture.latitude = resp.coords.latitude;
                            picture.longitude = resp.coords.longitude;

                            // Upload the file
                            this.uploadFile(blob, picture);

                        }).catch((error) => {
                            console.error('Error getting location', error);
                        });
                    }

                }).catch((e) => {
                    console.error("Error in the prompt box :", e);
                });
                })
            })

        }, (err) => {
            console.error("Error taking photo, ", err);
        }); 
        });
    }

    // Specific method to upload a file
    uploadFile(picture: any, metadata: any) {

        this.loader = this.LoadingController.create({
            content: "We upload the picture...",
            dismissOnPageChange: true
        });

        this.loader.present();

        // Send the picture
        let file = this.upload.add({
            folder: '/',
            owner: null,
            file: picture
        });
        this.upload.request(file)
            .then((request) => {
            console.log('FileUploadComponent::onRequest', request);
            return this.upload.upload(request);
            })
                .then((request) => {
                console.log('FileUploadComponent::onUpload', request);
                return this.upload.confirm(request, metadata);
                })
                    .then((request) => {
                    console.log('FileUploadComponent::onConfirm', request);
                    this.loader.dismiss();
                    this.fileApi.getFileEntryList({'folder': '/', 'owner': null});
        });
    }

    // Delete a file on the ZetaPush platform
    delete(path): void {
        console.log("URL", path);

        this.dialogs.confirm("Delete this picture ?", "Delete", ["YES", "NO"]).then((number) => {
            if (number == 1) {
                // Delete the file
                this.fileApi.deleteFileEntry({'path': path, 'owner': null});
            }

        }).catch((error) => {
            console.error("Error during delete process", error);
        })
    }

    // Method to go to the 'details' page
    showItem(photo): void {
        console.log("Show item", photo);

        this.navCtrl.push(DetailsPage, {
            parameters: photo
        });
    }


    showNotification(status, name, id): void {

        let text = ""
        if (status == "SENT") {
            text = "A new anchor is sent to the blockchain for " + name;
        } else if (status == "CONFIRMED") {
            text = "The anchor is confirmed for " + name;
        } else {
            return;
        }

        this.notif.schedule({
            id: id,
            text: text,
            title: "Anchor : New status"
        });
    }
}