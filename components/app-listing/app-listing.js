import { RoutedBaseComponent, routingHandler } from '../../lib/webcomponent.js';
import Storage from "../../services/storage.js";

export default class AppListing extends RoutedBaseComponent {

    static tagName = 'app-listing';
    static templateUrl = './components/app-listing/app-listing.html';
    static styleUrl = './components/app-listing/app-listing.css';

    constructor() {
        super();

        this.domlist = this.shadowRoot.getElementById('liste');
        this.shadowRoot.getElementById('newimage').addEventListener('click', this.addNewImage.bind(this));

        this.loadImagesFromDb();
    }

    async loadImagesFromDb() {
        this.imageList = await Storage.getAllImages();

        for (const data of this.imageList) {
            this.createImageElement(data);
        }
    }

    createImageElement(data) {
        const card = document.createElement('app-picture-card');
        card.imgObject = data;
        card.addEventListener('delete', async (e) => {
            const result = await this.shadowRoot.getElementById("delpopup").show();
            if (!result) return;

            Storage.deleteImageInDb(e.detail);
            this.deleteImageElement(e.detail);
        })
        card.addEventListener('open', () => { 
            routingHandler.navigateTo("viewer/" + data.id) 
        })
        this.domlist.appendChild(card);
    }

    deleteImageElement(data) {
        for (const child of this.domlist.children) {
            if (child.imgObject === data) {
                child.remove();
                break;
            }
        }
    }

    async addNewImage() {
        const imgObject = await this.getNewImageFromPopup();
        if (!imgObject) return;

        const imgObjectWithId = await Storage.addImageInDb(imgObject);
        this.createImageElement(imgObjectWithId);
    }

    async getNewImageFromPopup() {
        const addPopupContent = this.shadowRoot.getElementById('addpopupcontent');
        addPopupContent.reset();

        const result = await this.shadowRoot.getElementById("addpopup").show((action) => {
            if (action == true) return addPopupContent.isValid();
            return true;
        });
        if (!result) return;

        return await addPopupContent.getValue();
    }

}

