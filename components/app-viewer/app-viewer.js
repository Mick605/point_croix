import { RoutedBaseComponent, baseUrl } from '../../lib/webcomponent.js';
import * as Utils from "../../services/imageUtils.js";
import Storage from "../../services/storage.js";

const SVG_GRID_SCALE = 10;

export default class AppViewer extends RoutedBaseComponent {

    static tagName = "app-viewer";
    static templateUrl = "./components/app-viewer/app-viewer.html";
    static styleUrl = './components/app-viewer/app-viewer.css';

    constructor() {
        super();

        this.activeColor = null;

        this.svg = this.shadowRoot.getElementById('svgmain');
        this.svg.addEventListener('click', this.onSvgClick.bind(this));

        const reset = this.shadowRoot.getElementById('reset');
        reset.addEventListener('click', this.onResetClick.bind(this));
        
        const svgimagegroup = this.shadowRoot.getElementById("svgimagegroup");
        svgimagegroup.setAttribute("transform", `scale(${SVG_GRID_SCALE})`)

        const back = this.shadowRoot.getElementById('back');
        back.addEventListener('click', this.onBackClick.bind(this));
        
        this.svgPanZoom = svgPanZoom(this.shadowRoot.getElementById('svgmain'), this.getSvgPanZoomOptions());

        this.paletteArea = this.shadowRoot.getElementById('palettearea');
        this.paletteArea.addEventListener('activatecolor', (e) => this.activateColor(e.detail))
        this.paletteArea.addEventListener('changecolormode', (e) => this.changeColorMode(e.detail))

        this.toolbar = this.shadowRoot.getElementById('toolbar');
        this.toolbar.addEventListener('changeToolbarMode', (e) => this.toolbarChangeMode(e.detail))
    }

    async activate(url, params) {
        const id = parseInt(params.id);
        if (!id) return;

        this._imgObject = await Storage.getOneImage(id);
        this.initializeImage();
    }

    setImageHref(image, value) {
        return new Promise((resolve, reject) => {
            image.addEventListener('load', resolve, { once: true });
            image.addEventListener('error', reject, { once: true });

            image.setAttribute('href', value);
        })
    }

    async initializeImage() {
        this.svg.classList.add('loading');

        const imgData = this._imgObject.image;

        const dataurl = Utils.convertImageDataToDataUrl(imgData);
        const greyimg = Utils.createGreyScaleImage(imgData);
        const greydataurl = Utils.convertImageDataToDataUrl(greyimg);

        const h = imgData.height * SVG_GRID_SCALE;
        const w = imgData.width * SVG_GRID_SCALE;

        const svggrid = this.shadowRoot.getElementById('svggrid');
        svggrid.setAttribute('width', w + 'px');
        svggrid.setAttribute('height', h + 'px');        

        const resp = await fetch(baseUrl + 'datas/dmc_threads.json');
        const jsonData = await resp.json();
        this.threadFinder = new Utils.ThreadFinder(jsonData);

        const splitter = new Utils.ImageAreaSplitter(imgData);

        const colorEquiv = new Map();
        this.paletteArea.reset();
        for (const [color, count] of splitter.palette) {
            if (color === null) continue;

            const thread = this.threadFinder.findClosestColors(Utils.colorToHexa(color))[0];
            this.paletteArea.createPaletteItem(color, count, thread);
            colorEquiv.set(color, thread.rgb);
        }

        const threadimg = Utils.replaceColorsInImage(imgData, colorEquiv);
        const threaddataurl = Utils.convertImageDataToDataUrl(threadimg);

        for (const area of splitter.areas) {
            const threadrgb = colorEquiv.get(area.color);
            const threadcolor = (area.color == null ? null : threadrgb[0] * 256 * 256 + threadrgb[1] * 256 + threadrgb[2]);
            this.createSvgPath(area.color, area.paths, threadcolor);
        }

        await Promise.all([
            this.setImageHref(this.shadowRoot.getElementById("srcimage"), dataurl),
            this.setImageHref(this.shadowRoot.getElementById("greyimage"), greydataurl),
            this.setImageHref(this.shadowRoot.getElementById("threadimage"), threaddataurl),
        ]);

        this.svgPanZoom.reset();
        this.svgPanZoom.resize();
        this.svgPanZoom.updateBBox(); // Update viewport bounding box
        this.svgPanZoom.fit();
        this.svgPanZoom.center();
        
        this.svg.classList.remove('loading');
    }

    onSvgClick(e) {
        const target = e.target;
        const group = this.getParentByClass(target, 'colorgroup');

        if (!group) return;
        this.activateColor(group.dataset['color']);
    }

    onPaletteClick(e) {
        const target = e.target;
        const pal = this.getParentByClass(target, 'colorpalette');

        if (!pal) return;
        this.activateColor(pal.dataset['color']);
    }

    activateColor(newColor) {
        if (this.activeColor !== null) {
            this.findSvgGroup(this.activeColor).classList.remove('active');
        }

        if (newColor !== null) {
            this.findSvgGroup(newColor).classList.add('active');
            this.classList.add('colorselected');
        } else {
            this.classList.remove('colorselected')
        }

        this.activeColor = newColor;

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
        this.clearSvgGroups();
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

    getParentByClass(element, classname) {
        let result = element;
        while (result && !result.classList.contains(classname)) {
            result = result.parentElement;
        }
        return result;
    }

    clearSvgGroups() {
        const svgGroups = this.shadowRoot.getElementById('svgareagroup')
        
        while (svgGroups.firstElementChild) {
            svgGroups.firstElementChild.remove();
        }
    }

    findSvgGroup(color) {
        let result = this.shadowRoot.getElementById('gr_' + color);

        if (!result) {
            result = document.createElementNS("http://www.w3.org/2000/svg", "g");
            result.setAttribute('id', 'gr_' + color);
            result.setAttribute('class', 'colorgroup');
            result.dataset['color'] = color;

            this.shadowRoot.getElementById('svgareagroup').appendChild(result);
        }

        return result;
    }

    createSvgPath(color, paths, threadcolor) {
        const svgpath = document.createElementNS("http://www.w3.org/2000/svg", "path");

        const hexacolor = Utils.colorToHexa(color);
        const group = this.findSvgGroup(hexacolor);
        group.appendChild(svgpath);

        let txt = "";
        for (const path of paths) {
            txt += " M" + (path.origin[0] * SVG_GRID_SCALE) + "," + (path.origin[1] * SVG_GRID_SCALE);
            const pos = [path.origin[0], path.origin[1]];

            for (const [dir, value] of path.path) {
                const v = value * SVG_GRID_SCALE;
                const offset = [0, 0];

                if (dir === Utils.DIR_DOWN) {
                    txt += ` l0,${v}`;
                    pos[1] += value;
                    offset[1] = -value / 2;
                } else if (dir === Utils.DIR_LEFT) {
                    txt += ` l${-v},0`;
                    pos[0] -= value;
                    offset[0] = value / 2;
                } else if (dir === Utils.DIR_UP) {
                    txt += ` l0,${-v}`;
                    pos[1] -= value;
                    offset[1] = value / 2;
                } else if (dir === Utils.DIR_RIGHT) {
                    txt += ` l${v},0`;
                    pos[0] += value;
                    offset[0] = -value / 2;
                }

                if (value >= 5) {
                    const svglabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
                    svglabel.setAttribute('x', (pos[0] + offset[0]) * SVG_GRID_SCALE);
                    svglabel.setAttribute('y', (pos[1] + offset[1]) * SVG_GRID_SCALE);
                    svglabel.textContent = value;
                    group.appendChild(svglabel);
                }
            }
            txt += " Z"
        }
        svgpath.setAttribute('d', txt);
        svgpath.style.setProperty('--origcolor', hexacolor);        
        svgpath.style.setProperty('--threadcolor', Utils.colorToHexa(threadcolor));
    }

    getSvgPanZoomOptions() {
        return {
            zoomScaleSensitivity: 0.4,
            minZoom: 0.1,
            maxZoom: 15,
            // minZoom: false,
            dblClickZoomEnabled: false,
            fit: false,
            center: false,
            // beforePan: (oldPan, newPan) => {
            //     const delta = Math.abs(oldPan.x - newPan.x) + Math.abs(oldPan.y - newPan.y);

            //     if (delta > 30 || panInProgress) {
            //         panInProgress = true;
            //     } else {
            //         return false;
            //     }
            // },
            customEventsHandler: {
                haltEventListeners: ['touchstart', 'touchend', 'touchmove', 'touchleave', 'touchcancel'],
                init: function (options) {
                    const instance = options.instance;
                    let initialScale = 1;
                    let pannedX = 0;
                    let pannedY = 0;
    
                    // Init Hammer
                    // Listen only for pointer and touch events
                    this.hammer = Hammer(options.svgElement, {
                        inputClass: Hammer.SUPPORT_POINTER_EVENTS ? Hammer.PointerEventInput : Hammer.TouchInput
                    })
    
                    // Enable pinch
                    this.hammer.get('pinch').set({ enable: true })
    
                    // Handle pan
                    this.hammer.on('panstart panmove', function (ev) {
                        // On pan start reset panned variables
                        if (ev.type === 'panstart') {
                            pannedX = 0
                            pannedY = 0
                        }
    
                        // Pan only the difference
                        instance.panBy({ x: ev.deltaX - pannedX, y: ev.deltaY - pannedY })
                        pannedX = ev.deltaX
                        pannedY = ev.deltaY
                    })
    
                    // Handle pinch
                    this.hammer.on('pinchstart pinchmove', function (ev) {
                        // On pinch start remember initial zoom
                        if (ev.type === 'pinchstart') {
                            initialScale = instance.getZoom()
                            instance.zoomAtPoint(initialScale * ev.scale, { x: ev.center.x, y: ev.center.y })
                        }
    
                        instance.zoomAtPoint(initialScale * ev.scale, { x: ev.center.x, y: ev.center.y })
                    })
    
                    // Prevent moving the page on some devices when panning over SVG
                    options.svgElement.addEventListener('touchmove', function (e) { e.preventDefault(); });
                },
    
                destroy: function () {
                    this.hammer.destroy()
                }
            }
        };
    }
}

