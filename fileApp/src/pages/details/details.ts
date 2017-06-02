import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { WoleetApi } from '../../woleet/woleet-api.service';
import { File } from '@ionic-native/file';
import { Dialogs } from '@ionic-native/dialogs';
import { ReceiptPage } from  '../receipt/receipt';

@Component({
selector: 'page-details',
templateUrl: 'details.html',
styles: ['./details.scss']
})

export class DetailsPage {

    public parameters: any;

    constructor(
        public navCtrl: NavController,
        public params: NavParams,
        private woleetApi: WoleetApi, 
        private file: File,
        private dialogs: Dialogs){
            this.parameters = params.get("parameters");
        }


    ionViewDidLoad() {
        console.log("Page details shown", this.parameters);
    }

    downloadReceipt(): void {
        
        this.woleetApi.getAnchorId(this.parameters.path).then((message) => {
            console.log("Get anchor ID : ", message);
        
            this.woleetApi.getReceipt(message['id']).then((message) => {
                let dataStr = JSON.stringify(message['content']);
                console.log("FILE :", dataStr);

                if (message['content']['extra'] == undefined){

                    this.dialogs.alert("The receipt is not yet ready")

                } else {

                    let file = new Blob([dataStr], {type: 'text/json'});

                    let name = 'receipt_' + message['content']['extra'][0]['anchorid'] + '.json';

                    this.file.createFile(this.file.externalApplicationStorageDirectory, name, true).then((msg) => {
                        this.file.writeExistingFile(this.file.externalApplicationStorageDirectory, name, file).then((msg) => {
                            this.dialogs.confirm("Receipt saved !\n(Path : "+ msg['fullPath'] + ')', "Receipt downloaded", ["SHOW", "OK"]).then((number) => {
                                if (number == 1) {

                                    let jsonObject = JSON.parse(dataStr);
                                    
                                    let receipt = {
                                        'version': jsonObject['header']['chainpoint_version'],
                                        'hashType': jsonObject['header']['hash_type'],
                                        'merkle': jsonObject['header']['merkle_root'],
                                        'txId': jsonObject['header']['tx_id'],
                                        'timestamp': (jsonObject['header']['timestamp'])*1000,
                                        'targetHash': jsonObject['target']['target_hash'],
                                        'targetProof': (jsonObject['target']['target_proof']).join(" , "),
                                        'hanchorId': jsonObject['extra'][0]['anchorid']
                                    }

                                    this.navCtrl.push(ReceiptPage, {
                                        parameters: receipt
                                    });

                                }
                            })
                    }).catch((err) => {
                        console.error("writeExistingFile error :", err);
                    })
                    }).catch((err) => {
                        console.error("CreateFile error :", err);
                    })

                }
            })
            
        })
    }
}