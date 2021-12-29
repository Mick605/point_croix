import { hexToRgb, rgb2lab, getCie94Diff} from "../lib/colorUtils.js";

export const DIR_UP = 1;
export const DIR_LEFT = 2;
export const DIR_DOWN = -1;
export const DIR_RIGHT = -2;

export class ImageAreaSplitter {

    constructor(img) {
        this.img = img;
        this.palette = new Map();
        this.areas = [];

        this.analyze();
    }

    analyze() {
        const size = this.img.width * this.img.height;
        const donePixels = new Set(Array(size).fill().map((_, idx) => idx))

        while (donePixels.size) {
            const start = donePixels.values().next().value;
            donePixels.delete(start);

            const area = this.propagate(start, donePixels);

            if (this.palette.has(area.color)) {
                this.palette.set(area.color, this.palette.get(area.color) + area.content.size);
            } else {
                this.palette.set(area.color, area.content.size)
            }
            this.areas.push(area);
        }
    }

    getPathsFromBoundaries(boundaries) {
        const paths = [];

        while (boundaries.size) {
            const start = boundaries.values().next().value;

            const path = this.followBoundaries(start, boundaries);
            paths.push(path);
        }

        return paths;
    }


    followBoundaries(start, boundaries) {
        const h = this.img.height;
        const w = this.img.width;

        const path = []
        let curdir = null;
        let newdir = null;
        let counter = 0;

        // Node origin calculation
        let c = (start > 0 ? (start - 1) % w : (- start - 1) % (w + 1));
        let r = (start > 0 ? (start - 1 - c) / w : (- start - 1 - c) / (w + 1));

        let finished = false;
        while (!finished) {
            if (c !== w && boundaries.delete(1 + c + r * w)) {
                newdir = DIR_RIGHT;
                c += 1;
            } else if (r !== h && boundaries.delete(-1 - c - r * (w + 1))) {
                newdir = DIR_DOWN;
                r += 1;
            } else if (c !== 0 && boundaries.delete(c + r * w)) {
                newdir = DIR_LEFT;
                c -= 1;
            } else if (r !== 0 && boundaries.delete(-1 - c - (r - 1) * (w + 1))) {
                newdir = DIR_UP;
                r -= 1;
            } else {
                finished = true;
                newdir = null;
            }

            if (newdir !== curdir) {
                if (curdir) {
                    path.push([curdir, counter])
                }
                curdir = newdir;
                counter = 1;
            } else {
                counter += 1
            }
        }

        return {
            origin: [c, r],
            path
        };
    }

    getNeighbours(pixelIndex) {
        const h = this.img.height;
        const w = this.img.width;

        const column = pixelIndex % w;
        const row = (pixelIndex - column) / w;

        const left = (column === 0 ? null : pixelIndex - 1);
        const right = (column === w - 1 ? null : pixelIndex + 1);
        const top = (row === 0 ? null : pixelIndex - w);
        const bottom = (row === h - 1 ? null : pixelIndex + w);

        const bleft = - (1 + column + row * (w + 1));
        const bright = bleft - 1;
        const btop = 1 + pixelIndex;
        const bbottom = btop + w;

        return [
            [bleft, left],
            [bright, right],
            [btop, top],
            [bbottom, bottom]
        ];
    }

    getPixelColor(pixelIndex) {
        const tmp = this.img.data.subarray(pixelIndex * 4, pixelIndex * 4 + 4);
        if (tmp[3] === 0) return null;
        return tmp[0] * 65536 + tmp[1] * 256 + tmp[2];
    }

    propagate(fromPixelIndex, donePixels) {
        const color = this.getPixelColor(fromPixelIndex);
        const content = new Set([fromPixelIndex]);
        const boundaries = new Set();

        const todo = [fromPixelIndex];

        while (todo.length) {
            const i = todo.pop();
            content.add(i);

            for (const [bound, index] of this.getNeighbours(i)) {

                if (index === null || this.getPixelColor(index) !== color) {
                    boundaries.add(bound);
                    continue
                }

                if (!donePixels.delete(index)) continue;

                todo.push(index);
            }
        }

        const paths = this.getPathsFromBoundaries(boundaries);

        return {
            color,
            content,
            boundaries,
            paths
        };
    }
}

export class ThreadFinder {

    constructor(threads) {
        this.threads = threads;

        for (const entry of this.threads) {
            entry.rgb = hexToRgb(entry.color);
            entry.lab = rgb2lab(entry.rgb);
        }
    }

    findClosestColors(hexa) {
        const lab = rgb2lab(hexToRgb(hexa))
        
        const result = [];
        for (const entry of this.threads) {
            const deltaE = getCie94Diff(lab, entry.lab);
            result.push(Object.assign({ deltaE }, entry));
        }
        result.sort((a, b) => a.deltaE - b.deltaE);
        
        return result;
    }
}


export function createGreyScaleImage(srcImgData) {

    const data = new Uint8ClampedArray(srcImgData.data.length);

    let i = 0;
    while (i < srcImgData.data.length) {
        const srcpixel = srcImgData.data.subarray(i, i + 4);
        const destpixel = data.subarray(i, i + 4);

        // 0.299 R + 0.587 G + 0.114 B
        const value = 0.299 * srcpixel[0] + 0.587 * srcpixel[1] + 0.114 * srcpixel[2];
        const lum = 255 - (255 - value) * 0.9;

        destpixel[0] = lum;
        destpixel[1] = lum;
        destpixel[2] = lum;

        //Alpha
        destpixel[3] = srcpixel[3];

        i += 4;
    }

    return new ImageData(data, srcImgData.width, srcImgData.height);
}


export function replaceColorsInImage(srcImgData, colormap) {

    const data = new Uint8ClampedArray(srcImgData.data.length);

    let i = 0;
    while (i < srcImgData.data.length) {
        const srcpixel = srcImgData.data.subarray(i, i + 4);
        const destpixel = data.subarray(i, i + 4);

        const srccolor = srcpixel[0] * 256 * 256 + srcpixel[1] * 256 + srcpixel[2]
        const newcolor = colormap.get(srccolor);

        if (newcolor) {
            destpixel[0] = newcolor[0];
            destpixel[1] = newcolor[1];
            destpixel[2] = newcolor[2];
        } else {
            destpixel[0] = srcpixel[0];
            destpixel[1] = srcpixel[1];
            destpixel[2] = srcpixel[2];
        }
        destpixel[3] = srcpixel[3];

        i += 4;
    }

    return new ImageData(data, srcImgData.width, srcImgData.height);
}

export function convertImageDataToDataUrl(data) {
    const tmpcanvas = document.createElement('canvas');

    tmpcanvas.width = data.width;
    tmpcanvas.height = data.height;
    const context = tmpcanvas.getContext('2d');
    context.putImageData(data, 0, 0);

    const dataurl = tmpcanvas.toDataURL();
    return dataurl;
}


export function loadImageDataFromUrl(url) {

    return new Promise((resolve, reject) => {
        const base_image = new Image();
        base_image.src = url;
        base_image.onload = function () {
            const canvas = document.createElement("canvas");
            const context = canvas.getContext('2d');
            const realWidth = base_image.naturalWidth;
            const realHeight = base_image.naturalHeight;
            canvas.width = realWidth;
            canvas.height = realHeight;
            context.drawImage(base_image, 0, 0);
            resolve(context.getImageData(0, 0, realWidth, realHeight));
        }

        base_image.onerror = function () {
            reject();
        }
    })
}

export function getCIE76Diff(lab1, lab2) {
    return Math.sqrt(
        (lab1[0] - lab2[0]) ** 2
        + (lab1[1] - lab2[1]) ** 2
        + (lab1[2] - lab2[2]) ** 2
    )
}

export function colorToHexa(color) {
    if (color === null) return "transparent";
    return '#' + color.toString(16).padStart(6, '0');
}

export function hexaToColor(hexa) {
    return parseInt(hexa.substr(1), 16)
}


export function getPerceivedLum(colorstr) {
    //https://www.w3.org/TR/AERT/_color-contrast

    if (colorstr === "transparent") return 255;
    const r = parseInt(colorstr[1] + colorstr[2], 16);
    const g = parseInt(colorstr[3] + colorstr[4], 16);
    const b = parseInt(colorstr[5] + colorstr[6], 16);

    return ((r * 299) + (g * 587) + (b * 114)) / 1000;
}

export function prepareSkMeans(srcImgData) {
    const result = [];
    let i = 0;
    while (i < srcImgData.data.length) {
        const srcpixel = srcImgData.data.subarray(i, i + 3);

        result.push(srcpixel);
        i += 4;
    }

    return result;
}


function dist(p1, p2) {
    return Math.sqrt((p1[0] - p2[0])**2 +(p1[1] - p2[1])**2 +(p1[2] - p2[2])**2) 
}

function getSkmeansQuality(matrix, skres) {
    return skres.idxs.reduce((max, curr, i) => {
        const d = dist(skres.centroids[curr], matrix[i]);

        return d > max.maxDelta ? {maxDelta: d, val: matrix[i]} : max
    }, {maxDelta: 0, val: null});
}

export function detectPalette(image, maxColors = 20) {
    const tab = prepareSkMeans(image);

    let skres = skmeans(tab, 2, undefined);
    let qual = getSkmeansQuality(tab, skres);
    console.log(qual.maxDelta);

    while (skres.centroids.length < maxColors && qual.maxDelta > 10) {
        skres.centroids.push(qual.val);
        skres = skmeans(tab, skres.centroids.length, skres.centroids);
        qual = getSkmeansQuality(tab, skres);
        console.log(qual.maxDelta);
    }

    return {skres, qual}
}