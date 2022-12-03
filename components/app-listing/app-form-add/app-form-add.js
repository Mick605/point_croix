import { BaseComponent } from '../../../lib/webcomponent.js';
import * as Utils from "../../../services/imageService.js";

export default class AppFormAdd extends BaseComponent {

    static tagName = "app-form-add";
    static templateUrl = "./components/app-listing/app-form-add/app-form-add.html";
    static styleUrl = './components/app-listing/app-form-add/app-form-add.css';

    constructor() {
        super();

        this.fileInput = this.shadowRoot.getElementById('file');
        this.nameInput = this.shadowRoot.getElementById('filename');
        this.preview = this.shadowRoot.getElementById('preview');

        this.fileInput.addEventListener('change', this.onFileChange.bind(this));

        this.reset();
    }

    reset() {
        this.fileInput.value = null;
        this.nameInput.value = null;

        this.nameInput.classList.remove('error');
        this.fileInput.classList.remove('error');
        this.image = null;
        this.preview.removeAttribute('src');
    }

    isValid() {
        this.nameInput.classList.toggle('error', !this.nameInput.value);
        this.fileInput.classList.toggle('error', !this.fileInput.files[0]);

        return this.nameInput.value && this.fileInput.files[0];
    }

    async onFileChange() {
        const file = this.fileInput.files[0];
        const reader = new FileReader();

        reader.addEventListener("load", async () => {
            this.image = await Utils.loadImageDataFromUrl(reader.result);

            console.log(this.image);
            this.preview.src = reader.result;

            if (!this.nameInput.value) {
                this.nameInput.value = file.name.replace(/\.[^/.]+$/, "")
            }
        }, false);

        if (file) {
            reader.readAsDataURL(file);
        }
    }

    async getValue() {
        if (!this.isValid()) return null;

        return {
            name: this.nameInput.value,
            image: await this.image
        }
    }

}
