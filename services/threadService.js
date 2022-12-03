import { colorToRgb, hexToRgb, hexToColor, rgb2lab, getCie94Diff } from "../lib/colorUtils.js";

class ThreadFinder {

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
            result.push({ ...entry, deltaE });
        }
        result.sort((a, b) => a.deltaE - b.deltaE);

        return result;
    }
}

class ThreadPalette {

    constructor(name, threads) {
        this.name = name;
        this.threads = threads.map(t => {
            const { ref, name, hexa, ...metas } = t;

            if (!ref || !name || !hexa) throw new Error(`Incorrect thread: missing ref, name or hexa property`);

            const color = hexToColor(hexa)
            const rgb = hexToRgb(hexa);
            const lab = rgb2lab(rgb);

            return { ref, name, hexa, color, rgb, lab, metas }
        });
    }

    findClosestFromColor(color) {
        const rgb = colorToRgb(color)
        return this.findClosestFromRGB(rgb)
    }

    findClosestFromHexa(hexa) {
        const rgb = hexToRgb(hexa)
        return this.findClosestFromRGB(rgb)
    }

    findClosestFromRGB(rgb) {
        const lab = rgb2lab(rgb)
        return this.findClosestFromLAB(lab)
    }

    findClosestFromLAB(lab) {
        let result = null;
        for (const thread of this.threads) {
            const deltaE = getCie94Diff(lab, thread.lab);
            if (!result || result.deltaE > deltaE) {
                result = { thread, deltaE };
                if (result.deltaE === 0) return result;
            }
        }
        return result;
    }
}

const THREAD_PALETTES = [
    { name: "DMC", url: "./datas/dmc_threads.json" }
]

class ThreadPalettesManager {

    async loadPalettes() {
        this.palettes = new Map(); 
        await Promise.all(THREAD_PALETTES.map(palette => this.loadPalette(palette)));
    }

    async loadPalette({ name, url }) {
        const resp = await fetch(url);
        const jsonData = await resp.json();
        this.palettes.set(name, new ThreadPalette(name, jsonData));
    }

    get(name) {
        if (!this.palettes) return null;
        return this.palettes.get(name);
    }
}

const threadPaletteManager = new ThreadPalettesManager();
export default threadPaletteManager;