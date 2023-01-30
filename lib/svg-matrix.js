

export class SvgMatrixHandler {

    constructor(parent, group) {
        this.parent = parent;
        this.group = group;

        this.offsetX = null;
        this.offsetY = null;
        this.zoom = null;
    }

    init() {
        this.group.removeAttribute("transform");

        const parentRect = this.parent.getBoundingClientRect();
        const groupRect = this.group.getBoundingClientRect();

        const zoomX = parentRect.width / groupRect.width;
        const zoomY = parentRect.height / groupRect.height;

        this.zoom = Math.min(zoomX, zoomY);

        this.offsetX = (parentRect.width - groupRect.width * this.zoom) / 2 - (groupRect.left - parentRect.left) * this.zoom;
        this.offsetY = (parentRect.height - groupRect.height * this.zoom) / 2 - (groupRect.top - parentRect.top) * this.zoom;

        this.refresh();
    }

    panBy({x, y}) {
        this.offsetX += x;
        this.offsetY += y;
        this.refresh();
    }

    zoomBy({scale, x, y}) {
        this.offsetX -= (x - this.offsetX) * (scale - 1);
        this.offsetY -= (y - this.offsetY) * (scale - 1);
        this.zoom *= scale;
        this.refresh();
    }

    refresh() {
        this.group.setAttribute("transform", `translate(${this.offsetX},${this.offsetY}) scale(${this.zoom})`)
    }

}