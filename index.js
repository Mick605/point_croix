import { WebComponent } from './lib/webcomponent.js';

import AppRouter from './components/app-router/app-router.js';
import AppViewer from './components/app-viewer/app-viewer.js';
import AppDisplayArea from './components/app-viewer/app-display-area/app-display-area.js';
import AppPalette from './components/app-viewer/app-palette/app-palette.js';
import AppPaletteItem from './components/app-viewer/app-palette/app-palette-item/app-palette-item.js';
import AppToolbar from './components/app-viewer/app-toolbar/app-toolbar.js'
import AppListing from './components/app-listing/app-listing.js';
import AppPictureCard from './components/app-listing/app-picture-card/app-picture-card.js';
import AppPopup from './components/_shared/app-popup/app-popup.js';
import AppFormAdd from './components/app-listing/app-form-add/app-form-add.js';
import AppEditor from './components/app-editor/app-editor.js';

WebComponent({
    baseUrl: "/point_croix/",
    components: [
        AppRouter,
        AppViewer,
        AppDisplayArea,
        AppListing,
        AppPictureCard,
        AppPopup,
        AppFormAdd,
        AppPalette,
        AppPaletteItem,
        AppToolbar,
        AppEditor
    ]
});