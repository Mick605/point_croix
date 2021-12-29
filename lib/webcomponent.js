export let routingHandler = null;
export let baseUrl = null;

export async function WebComponent(options) {
    baseUrl = options.baseUrl || '/'; 
    const components = options.components;

    routingHandler = new RoutingHandler();

    await Promise.all(components.map(c => loadComponent(c)));

    for (const c of components) {
        customElements.define(c.tagName, c);
    }
}

async function loadComponent(c) {
    const response = await fetch(baseUrl + c.templateUrl);
    const content = await response.text();

    const template = document.createElement('template');
    template.id = c.tagName;
    const style = document.createElement('link');
    style.href = baseUrl + c.styleUrl;
    style.rel = 'stylesheet';

    template.innerHTML = content;
    template.content.appendChild(style);

    document.body.appendChild(template);
}

export class BaseComponent extends HTMLElement {
    constructor() {
        super();
        let templateContent = document.getElementById(this.tagName.toLowerCase()).content;

        const shadowRoot = this.attachShadow({ mode: 'open' });
        shadowRoot.appendChild(templateContent.cloneNode(true));
    }

    static properties = {}

    static get observedAttributes() {
        return Object.keys(this.properties);
    }

    attributeChangedCallback(name, oldValue, newValue) {
        this[name] = newValue;
    }
}

class RoutingHandler {

    constructor() {
        this.baseUrl = new URL(baseUrl, window.location.origin);
        this.initialUrl = new URL(window.location.href);
        this.currentUrl = this.initialUrl;

        document.addEventListener('click', (e) => {
            if (e.path[0].tagName == 'A') {
                const url = new URL(e.path[0].href, this.currentUrl);

                if (url.href === this.currentUrl.href) {
                    e.preventDefault();
                    return;
                }

                if (url.href.startsWith(this.baseUrl.href)) {
                    e.preventDefault();
                    this.navigateTo(url.href);
                }
            }
        })
        document.addEventListener('navigate', (e) => this.onNavigateEvent(e.detail));

        window.addEventListener('popstate', (e) => {
            if (e.state) {
                document.dispatchEvent(new CustomEvent("navigate", { bubbles: true, detail: e.state.url }));
            }
        });

        this.routes = new Map();
    }

    declareRoutedComponent(routedComp) {
        const relativeUrl = routedComp.dataset["routing"];
        let curr = routedComp.parentElement;

        while (curr && !(curr instanceof RoutedBaseComponent)) {
            curr = curr.parentElement
        }

        routedComp.routeParent = curr;
        routedComp.routeUrl = new URL(relativeUrl, curr ? curr.routeUrl.href : this.baseUrl.href);
        this.routes.set(routedComp.routeUrl, routedComp);

        this.activateOrDeactivateComp(routedComp, routedComp.routeUrl);
    }

    navigateTo(url) {
        document.dispatchEvent(new CustomEvent("navigate", { bubbles: true, detail: url }));
        history.pushState({url: this.currentUrl.href}, '', this.currentUrl.href);
    }

    onNavigateEvent(url) {
        this.currentUrl = url.startsWith("/") ? new URL(url.slice(1), this.baseUrl) : new URL(url, this.currentUrl);

        for (const [routeUrl, comp] of this.routes) {
            this.activateOrDeactivateComp(comp, routeUrl);
        }
    }

    activateOrDeactivateComp(comp, routeUrl) {
        const match = this.isUrlMatching(routeUrl.pathname, this.currentUrl.pathname);
        if (match !== null) {
            comp.dataset['routingMatch'] = (match.endUrl === "" ? "exact" : "child");
            if (comp.activate) comp.activate(match.endUrl, match.params);
        } else {
            delete comp.dataset['routingMatch'];
            if (comp.deactivate) comp.deactivate();
        }
    }

    isUrlMatching(urlPattern, url) {

        const urlPatternParts = decodeURI(urlPattern).split('/').filter(x => x !== '');
        const urlParts = url.split('/').filter(x => x !== '');
        const params = {}
    
        for (const [i, partmodel] of urlPatternParts.entries()) {
            const part = urlParts[i];
            if (part === undefined) return null;
    
            if (partmodel.startsWith('{') && partmodel.endsWith('}')) {
                params[partmodel.substring(1, partmodel.length - 1)] = part;
            } else {
                if (part !== partmodel) return null;
            }
        }
        const endUrl = urlParts.slice(urlPatternParts.length).join("/");
    
        return {
            endUrl,
            params
        };
    }
}

export class RoutedBaseComponent extends BaseComponent {
    constructor() {
        super();
        routingHandler.declareRoutedComponent(this);
    }
}
