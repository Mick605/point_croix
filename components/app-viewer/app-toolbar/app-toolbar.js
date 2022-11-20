import { BaseComponent } from '../../../lib/webcomponent.js';

export default class AppToolbar extends BaseComponent {

    static tagName = "app-toolbar";
    static templateUrl = "./components/app-viewer/app-toolbar/app-toolbar.html";
    static styleUrl = './components/app-viewer/app-toolbar/app-toolbar.css';

    constructor() {
        super();

        const menuButtons = Array.from(this.shadowRoot.querySelectorAll('.toolitem.toolmenu'));
        for (const btn of menuButtons) {
            btn.addEventListener('click', this.onOpenMenuClick);
        }
        
        const actionButtons = Array.from(this.shadowRoot.querySelectorAll('.toolitem.toolaction'));
        for (const btn of actionButtons) {
            btn.addEventListener('click', this.onToolActionClick);
        }

        this._openedContainer = null;
    }

    onClickOutside = (e) => {
        if ((!e.composedPath().includes(this)) && this._openedContainer) {
            this._openedContainer.classList.remove('open');
            this._openedContainer = null;
        }
    }

    onOpenMenuClick = (e) => {
        if (this._openedContainer) this._openedContainer.classList.remove('open');

        if (e.target === this._openedContainer) {
            this._openedContainer = null;
            document.removeEventListener('click', this.onClickOutside, { capture: true });
            return;
        }

        if (!this._openedContainer) document.addEventListener('click', this.onClickOutside, { capture: true });
        e.target.classList.add('open');
        this._openedContainer = e.target;
    }

    onToolActionClick = (e) => {
        const action = e.target.dataset.action || null;
        const value = e.target.dataset.value || null;

        if (!action || !value) {
            throw new Error(`Cannot send CustomEvent: action or value is undefined`)
        }

        this.dispatchEvent(new CustomEvent("changeToolbarMode", { bubbles: true, detail: { action, value }}));
        this.setToolbarMode(action, value);
    }

    setToolbarMode(action, value) {
        const menu = this.shadowRoot.querySelector(`.toolitem.toolcaption[data-action="${action}"]`);
        if (!menu) return;

        menu.dataset.value = value;
    }
}



