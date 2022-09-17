import { RoutedBaseComponent, routingHandler, baseUrl } from '../../lib/webcomponent.js';
import * as Utils from "../../services/imageUtils.js";
import Storage from "../../services/storage.js";

export default class AppViewer extends RoutedBaseComponent {

    static tagName = "app-editor";
    static templateUrl = "./components/app-editor/app-editor.html";
    static styleUrl = './components/app-editor/app-editor.css';

    constructor() {
        super();
        this.currentImage = null;

        const back = this.shadowRoot.getElementById('back');
        back.addEventListener('click', this.onBackClick.bind(this));

        this.fileInput = this.shadowRoot.getElementById('file');
        this.imgSource = this.shadowRoot.getElementById('source');
        this.imgPreview = this.shadowRoot.getElementById('preview');

        this.fileInput.addEventListener('change', this.onFileChange.bind(this));

        this.colorsDom = this.shadowRoot.getElementById('colors');
        
        const detectAuto = this.shadowRoot.getElementById('detectAuto');
        detectAuto.addEventListener('click', this.autoDetectColors.bind(this));

        const preview = this.shadowRoot.getElementById('previewBtn');
        preview.addEventListener('click', this.previewResult.bind(this));
    }

    onBackClick() {
        routingHandler.navigateTo("/");
    }

    async onFileChange() {
        const file = this.fileInput.files[0];
        const reader = new FileReader();

        reader.addEventListener("load", async () => {
            this.image = await Utils.loadImageDataFromUrl(reader.result);
            this.imgSource.src = reader.result;

        }, false);

        if (file) {
            reader.readAsDataURL(file);
        }
    }

    createColorItem(color) {
        const hex = Utils.colorToHexa(color);
        const li = document.createElement('li');
        li.textContent = hex;
        const input = document.createElement('input');
        input.type = "color";
        input.value = hex;

        li.appendChild(input);
        li.style.setProperty('--color', hex);
        this.colorsDom.append(li);
    }

    async autoDetectColors() {
        const {skres, qual} = Utils.detectPalette(this.image);
        this.skres = skres;
        this.qual = qual;

        this.colorsDom.innerHTML = "";
        for (const rgb of skres.centroids) {
            const color = Math.round(rgb[0]) * 256 * 256 + Math.round(rgb[1]) * 256 + Math.round(rgb[2]); 
            this.createColorItem(color);
        }

    }

    previewResult() {
        const previewImage = Utils.previewImageWithPalette(this.skres, this.image.width, this.image.height);
        const previewUrl = Utils.convertImageDataToDataUrl(previewImage);
        this.imgPreview.src = previewUrl;
    }
}

