import { SvgMatrixHandler } from '../../../lib/svg-matrix.js';
import { BaseComponent } from '../../../lib/webcomponent.js';
import * as Utils from "../../../services/imageService.js";

const SVG_GRID_SCALE = 10;
const SVG_MIN_DISPLAYED_SIZE = 4;

export default class AppDisplayArea extends BaseComponent {

    static tagName = "app-display-area";
    static templateUrl = "./components/app-viewer/app-display-area/app-display-area.html";
    static styleUrl = './components/app-viewer/app-display-area/app-display-area.css';
    
    constructor() {
        super();

        this._activeColor = null;

        this.svg = this.shadowRoot.getElementById('svgmain');
        // this.svg.addEventListener('click', this.onSvgClick.bind(this));
        
        const svgimagegroup = this.shadowRoot.getElementById("svgimagegroup");
        svgimagegroup.setAttribute("transform", `scale(${SVG_GRID_SCALE})`)
        
        const svgmain = this.shadowRoot.getElementById('svgmain')
        this.svgMatrixHandler = new SvgMatrixHandler(svgmain, this.shadowRoot.getElementById('svgmatrixhandler'))
        svgmain.addEventListener('wheel', (e) => this.onMouseWheel(e));

        this.hammer = new Hammer(svgmain, {
            // inputClass: Hammer.SUPPORT_POINTER_EVENTS ? Hammer.PointerEventInput : Hammer.TouchInput
        })
        
        this.hammer.get('pan').set({ direction: Hammer.DIRECTION_ALL });

        this.hammerVars = {
            pannedX: 0, 
            pannedY: 0
        }
        // Handle pan
        this.hammer.on('panstart panmove', (ev) => {
            // On pan start reset panned variables
            if (ev.type === 'panstart') {
                this.hammerVars.pannedX = 0
                this.hammerVars.pannedY = 0
            }

            // Pan only the difference
            this.svgMatrixHandler.panBy({ x: ev.deltaX - this.hammerVars.pannedX, y: ev.deltaY - this.hammerVars.pannedY })
            this.hammerVars.pannedX = ev.deltaX
            this.hammerVars.pannedY = ev.deltaY
        })

        this.hammer.on('tap', (ev) => {
            const path = ev.srcEvent.composedPath();
            this.onSvgClick(path[0]);
        })

        this.hammer.on('pinch', (ev) => {
            console.log(ev);
            this.svgMatrixHandler.zoomBy({scale: ev.scale, x: ev.center.x, y: ev.center.y})
        })
    }

    onMouseWheel(e) {
        const scale = e.wheelDelta > 0 ? e.wheelDelta / 100 : 100 / -e.wheelDelta;
        this.svgMatrixHandler.zoomBy({scale: scale, x: e.x, y: e.y})
    }

    set activeColor(value) {
        if (value === this._activeColor) return;

        if (value !== null) {
            this.classList.add('colorselected');
        } else {
            this.classList.remove('colorselected')
        }
       
        if (this._activeColor !== null) {
            this.findSvgGroup(this.activeColor).classList.remove('active');
        }

        this._activeColor = value; 
        this.findSvgGroup(this._activeColor).classList.add('active');
    }

    get activeColor() {
        return this._activeColor;
    }

    setImageHref(image, value) {
        return new Promise((resolve, reject) => {
            image.addEventListener('load', resolve, { once: true });
            image.addEventListener('error', reject, { once: true });

            image.setAttribute('href', value);
        })
    }

    async setImage(imgData, splitter, colorEquiv) {
        this.svg.classList.add('loading');

        const dataurl = Utils.convertImageDataToDataUrl(imgData);
        const greyimg = Utils.createGreyScaleImage(imgData);
        const greydataurl = Utils.convertImageDataToDataUrl(greyimg);

        const h = imgData.height * SVG_GRID_SCALE;
        const w = imgData.width * SVG_GRID_SCALE;

        const svggrid = this.shadowRoot.getElementById('svggrid');
        svggrid.setAttribute('width', w + 'px');
        svggrid.setAttribute('height', h + 'px');        

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

        this.svgMatrixHandler.init();
        
        this.svg.classList.remove('loading');
    }

    onSvgClick(target) {
        const group = target.closest('.colorgroup');

        if (!group) return;
        this.dispatchEvent(new CustomEvent("activatecolor", { bubbles: true, detail: group.dataset['color'] }));
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

                if (value >= SVG_MIN_DISPLAYED_SIZE) {
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
}



