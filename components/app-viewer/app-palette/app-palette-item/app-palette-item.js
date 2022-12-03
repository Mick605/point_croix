import { BaseComponent } from '../../../../lib/webcomponent.js';
import * as Utils from "../../../../services/imageService.js";

export default class AppPaletteItem extends BaseComponent {

    static tagName = "app-palette-item";
    static templateUrl = "./components/app-viewer/app-palette/app-palette-item/app-palette-item.html";
    static styleUrl = './components/app-viewer/app-palette/app-palette-item/app-palette-item.css';

    constructor() {
        super();

        this.activeColor = null;

        this.domcount = this.shadowRoot.getElementById('count');

        this.domoriginalcolor = this.shadowRoot.getElementById('origcolor');

        this.domthreadref = this.shadowRoot.getElementById('threadref');
        this.domthreadname = this.shadowRoot.getElementById('threadname');
        this.domthreadcolor = this.shadowRoot.getElementById('threadcolor');

        this._origcolor = null;
        this._threadcolor = null;
        this._mode = "thread";

        this.updateColors();
    }

    updateColors() {
        const value = (this._mode.toLowerCase() !== "thread" ? this._origcolor : this._threadcolor);  
        if (value === null) return;

        this.style.backgroundColor = value;
        this.classList.toggle('darkmode', (Utils.getPerceivedLum(value) < 125))
    }

    set colorMode(value) {   
        this._mode = value;
        this.classList.toggle('originalcolor', this._mode.toLowerCase() !== "thread");
        this.updateColors()
    }

    set originalColor(value) {
        this._origcolor = value;
        this.domoriginalcolor.textContent = value;
        this.updateColors();
    }

    get originalColor() { return this._origcolor}

    set threadColor(value) {
        this._threadcolor = value;
        this.domthreadcolor.textContent = value;
        this.updateColors();
    }

    set threadRef(value) {
        this.domthreadref.textContent = value;
    }

    set threadName(value) {
        this.domthreadname.textContent = value;
    }
    
    set count(value) {
        this._count = value;
        this.domcount.textContent = this._count;
        this.style.order = -this._count;
    }

    setActive(state) {
        this.classList.toggle('active', state);
    }
}

