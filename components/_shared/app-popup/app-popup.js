import { BaseComponent } from '../../../lib/webcomponent.js';

export default class AppPopup extends BaseComponent {

    static tagName = "app-popup";
    static templateUrl = "./components/_shared/app-popup/app-popup.html";
    static styleUrl = './components/_shared/app-popup/app-popup.css';

    static properties = {
        label: String,
        okbutton: String,
        cancelbutton: String
    }

    constructor() {
        super();

        this.shadowRoot.getElementById('okbutton').addEventListener('click', () => this.closePopup(true));
        this.shadowRoot.getElementById('cancelbutton').addEventListener('click', () => this.closePopup(false));
    }

    set okbutton(value) {
        const ok = this.shadowRoot.getElementById('okbutton');
        ok.textContent = value;
        ok.classList.toggle('visible', value);
    }

    set cancelbutton(value) {
        const cancel = this.shadowRoot.getElementById('cancelbutton');
        cancel.textContent = value;
        cancel.classList.toggle('visible', value);
    }

    set label(value) {
        const title = this.shadowRoot.getElementById('label');
        title.textContent = value;
        title.classList.toggle('visible', value);
    }

    show(beforeClosing) {
        this.beforeClosingCallback = beforeClosing;
        
        return new Promise((resolve, reject) => {
            this.resolve = resolve;
            this.classList.add('visible');
        });
    }

    closePopup(action) {
        if (this.beforeClosingCallback && !this.beforeClosingCallback(action)) return;

        this.classList.remove('visible');
        this.resolve(action);
    }
}
