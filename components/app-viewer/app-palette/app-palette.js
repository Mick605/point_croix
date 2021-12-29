import { BaseComponent } from '../../../lib/webcomponent.js';
import * as Utils from "../../../services/imageUtils.js";

export default class AppPalette extends BaseComponent {

    static tagName = "app-palette";
    static templateUrl = "./components/app-viewer/app-palette/app-palette.html";
    static styleUrl = './components/app-viewer/app-palette/app-palette.css';

    constructor() {
        super();

        this.paletteMap = new Map();
        this.reset();

        this.palette = this.shadowRoot.getElementById('palette');

        this._mode = "thread";
        this.domColorMode = this.shadowRoot.getElementById('colormode');
        this.domColorMode.addEventListener('change', () => this.changeColorMode(this.domColorMode.checked ? "original" : "thread"));
    }

    reset() {
        this._activeColor = null;

        for (let pi of this.paletteMap.values()) {
            pi.remove();
        }
        this.paletteMap.clear();
    }

    createPaletteItem(color, count, thread) {
        const hexacolor = Utils.colorToHexa(color);
        if (this.paletteMap.has(hexacolor)) return;

        const pi = document.createElement('app-palette-item');
        pi.originalColor = hexacolor;
        pi.count = count;
        pi.colorMode = this._mode;

        if (thread) {
            pi.threadRef = "DMC " + thread.ref;
            pi.threadName = thread.name;
            pi.threadColor = thread.color;
        }
        pi.addEventListener('click', () => this.onPaletteItemClick(pi));
        this.paletteMap.set(hexacolor, pi);
        this.palette.appendChild(pi);
    }

    onPaletteItemClick(paletteItem) {
        if (!paletteItem) return;

        this.dispatchEvent(new CustomEvent("activatecolor", { bubbles: true, detail: paletteItem.originalColor }));
    }

    changeColorMode(mode) {
        this._mode = mode;
        for (const pi of this.palette.children) {
            pi.colorMode = this._mode;
        }

        this.dispatchEvent(new CustomEvent("changecolormode", { bubbles: true, detail: mode }));
    }

    set activeColor(value) {
        if (value === this._activeColor) return;

        const activepi = this.paletteMap.get(this._activeColor);
        if (activepi) activepi.setActive(false);

        this._activeColor = value;
        const newactivepi = this.paletteMap.get(this._activeColor);
        if (newactivepi) newactivepi.setActive(true);
    }

    get activeColor() {
        return this._activeColor;
    }
}

