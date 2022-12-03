import { BaseComponent } from '../../../lib/webcomponent.js';
import * as Utils from "../../../services/imageService.js";

export default class AppPictureCard extends BaseComponent {

    static tagName = "app-picture-card";
    static templateUrl = "./components/app-listing/app-picture-card/app-picture-card.html";
    static styleUrl = './components/app-listing/app-picture-card/app-picture-card.css';

    constructor() {
        super();

        this.shadowRoot.getElementById('btnopen').addEventListener('click', () => this.onActionClick('open'));
        this.shadowRoot.getElementById('btndelete').addEventListener('click', () => this.onActionClick('delete'));
    }

    set imgObject(data) {
        const dataUrl = Utils.convertImageDataToDataUrl(data.image);
        this._imgObject = data;
        this.shadowRoot.getElementById('image').src = dataUrl;
        this.shadowRoot.getElementById('name').textContent = data.name;
        this.shadowRoot.getElementById('infos').textContent = `${data.image.height}x${data.image.width}`;
    }

    get imgObject() {
        return this._imgObject;
    }

    onActionClick(action) {
        const event = new CustomEvent(action, { bubbles: true, detail: this._imgObject });
        this.dispatchEvent(event);
    }
}
