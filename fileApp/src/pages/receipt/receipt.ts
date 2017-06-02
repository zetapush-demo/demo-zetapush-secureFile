import { Component } from '@angular/core';
import { NavParams } from 'ionic-angular';

@Component({
selector: 'page-receipt',
templateUrl: 'receipt.html',
styles: ['./receipt.scss']
})

export class ReceiptPage {

    public parameters: any;

    constructor(private params: NavParams){
        this.parameters = params.get("parameters");
    }

    ionViewDidLoad() {
        console.log("Page receipt shown", this.parameters);
    }


}