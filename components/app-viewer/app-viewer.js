import { RoutedBaseComponent, baseUrl } from '../../lib/webcomponent.js';
import Storage from "../../services/storage.js";

export default class AppViewer extends RoutedBaseComponent {

    static tagName = "app-viewer";
    static templateUrl = "./components/app-viewer/app-viewer.html";
    static styleUrl = './components/app-viewer/app-viewer.css';

    constructor() {
        super();

        this.activeColor = null;

        const reset = this.shadowRoot.getElementById('reset');
        reset.addEventListener('click', this.onResetClick.bind(this));
        
        const back = this.shadowRoot.getElementById('back');
        back.addEventListener('click', this.onBackClick.bind(this));

        this.displayArea = this.shadowRoot.getElementById('display-area');
        this.displayArea.addEventListener('activatecolor', (e) => this.activateColor(e.detail))

        this.paletteArea = this.shadowRoot.getElementById('palettearea');
        this.paletteArea.addEventListener('activatecolor', (e) => this.activateColor(e.detail))
        this.paletteArea.addEventListener('changecolormode', (e) => this.changeColorMode(e.detail))

        this.toolbar = this.shadowRoot.getElementById('toolbar');
        this.toolbar.addEventListener('changeToolbarMode', (e) => this.toolbarChangeMode(e.detail))
    }

    async activate(url, params) {
        const id = parseInt(params.id);
        if (!id) return;

        this.displayArea.imgObject = await Storage.getOneImage(id);
    }

    activateColor(newColor) {
        if (newColor !== null) {
            this.classList.add('colorselected');
        } else {
            this.classList.remove('colorselected')
        }

        this.activeColor = newColor;

        this.displayArea.activeColor = newColor;
        this.paletteArea.activeColor = newColor;
    }

    changeColorMode(mode) {
        this.classList.toggle("originalcolor", mode == "original");
    }

    onResetClick() {
        this.activateColor(null);
    }

    onBackClick() {
        this.activateColor(null);
        this.displayArea.clearSvgGroups();
        history.back();
    }

    toolbarChangeMode({action, value}) {
        switch (action) {
            case "background":
                this.dataset.background = value;
                break;        
            default:
                console.error("unknown toolbar event", e);
                break;
        }
    }
}

