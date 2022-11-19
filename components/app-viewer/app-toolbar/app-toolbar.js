import { BaseComponent } from '../../../lib/webcomponent.js';

export default class AppToolbar extends BaseComponent {

    static tagName = "app-toolbar";
    static templateUrl = "./components/app-viewer/app-toolbar/app-toolbar.html";
    static styleUrl = './components/app-viewer/app-toolbar/app-toolbar.css';

    constructor() {
        super();

        const menuButtons = Array.from(this.shadowRoot.querySelectorAll('.toolcontainer > .toolitem'));
        for (const btn of menuButtons) {
            btn.addEventListener('click', (e) => {
                if (this._openedContainer) this._openedContainer.classList.remove('open');

                if (e.target === this._openedContainer) {
                    this._openedContainer = null;
                    return;
                }

                e.target.classList.add('open');
                this._openedContainer = e.target;
            });
        }

        this._openedContainer = null;

        document.addEventListener('click', (e) => {
            if ((!e.composedPath().includes(this)) && this._openedContainer) {
                this._openedContainer.classList.remove('open');
                this._openedContainer = null;
            }
        }, true);
    }

}

