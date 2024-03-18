import { TranslationUtils } from '../../locales/translation';
import hexToRgba from 'hex-to-rgba';
import { addCustomLink } from '../../utils/utils';
export class ImageSegmentationAdjustmentComponent {
    constructor() {
        this.area_select = false;
        this.isPress = false;
        this.imagesArray = [];
        this.index = 0;
        this.color = "#ffffff";
        this.undo_disabled = true;
        this.redo_disable = true;
        this.brush_radius = 10;
        this.eraser_radius = 10;
        this.paint_radius = 10;
        this.restorer_radius = 10;
        this.tooltip = false;
        this.selected_area = false;
    }
    async componentWillLoad() {
        this.translations = await TranslationUtils.fetchTranslations();
        addCustomLink("https://cdnjs.cloudflare.com/ajax/libs/bulma/0.7.4/css/bulma.min.css");
        addCustomLink("https://cdn.jsdelivr.net/npm/@mdi/font@6.6.96/css/materialdesignicons.min.css");
        addCustomLink("https://db.onlinewebfonts.com/c/7200c6dd8ac604abe09f5159e53a40c0?family=Mark+Pro");
    }
    componentDidLoad() {
        const parentElement = this.parentElementTag ? document.getElementsByTagName(this.parentElementTag)[0].shadowRoot.lastElementChild : document;
        const currentElement = this.currentElementTag ? parentElement.getElementsByTagName(this.currentElementTag)[0].shadowRoot.lastElementChild : parentElement;
        this.backgroundContext = this.backgroundCanvas.getContext('2d');
        this.overlayContext = this.overlayCanvas.getContext('2d');
        this.backgroundImage = new Image();
        this.backgroundImage.src = 'data:image/jpeg;base64, ' + this.originalImage;
        this.overlayImage = new Image();
        this.overlayImage.src = 'data:image/jpeg;base64, ' + this.segmentedImage;
        this.backgroundImage.onload = async () => {
            let width = 326; // this.backgroundImage.width;
            let height = 435;
            this.backgroundImage.height;
            this.backgroundCanvas.width = width;
            this.backgroundCanvas.height = height;
            this.overlayCanvas.width = width;
            this.overlayCanvas.height = height;
            this.backgroundCanvas.style.backgroundImage = "url('" + this.backgroundImage.src + "')";
            this.backgroundContext.drawImage(this.overlayImage, 0, 0, width, height);
            let imageURL = this.backgroundContext.getImageData(0, 0, width, height);
            this.imagesArray.push(imageURL);
        };
    }
    chooseTool(tool) {
        this.tool = tool;
        if (this.tooltip === true && this.tool !== 'restore' && this.tool !== 'brush' && this.tool !== 'eraser') {
            this.tooltip = false;
            this.rangeContainer.style.display = "none";
        }
        if (this.tool === 'undo') {
            this.imageRestore('undo');
        }
        else if (this.tool === 'redo') {
            this.imageRestore('redo');
        }
        else if (this.tool === 'eraser') {
            this.color = "#ffffff";
            this.tooltip = true;
            this.rangeContainer.style.marginTop = '195px';
            this.rangeContainer.style.display = 'block';
            this.brush_radius = this.eraser_radius;
        }
        else if (this.tool === 'restore') {
            this.tooltip = true;
            this.rangeContainer.style.marginTop = '20px';
            this.rangeContainer.style.display = 'block';
            this.brush_radius = this.restorer_radius;
        }
        else if (this.tool === 'brush') {
            this.tooltip = true;
            this.rangeContainer.style.marginTop = '100px';
            this.rangeContainer.style.display = 'block';
            this.brush_radius = this.paint_radius;
        }
        else if (this.tool === 'area_select') {
            this.area_select = true;
            if (!this.area_select) {
                this.overlayContext.clearRect(0, 0, this.backgroundCanvas.width, this.backgroundCanvas.height);
            }
        }
    }
    useTool(e) {
        let x = e.offsetX;
        let y = e.offsetY;
        this.isPress = true;
        this.old = { x: e.offsetX, y: e.offsetY };
        if (this.tooltip) {
            this.tooltip = false;
            this.rangeContainer.style.display = "none";
        }
        if (this.isPress && this.tool === 'restore') {
            this.backgroundContext.globalCompositeOperation = 'destination-out';
            if (this.area_select) {
                let cursor_x = +this.x_select + +12;
                let cursor_y = +this.y_select + +12;
                this.backgroundContext.clearRect(cursor_x, cursor_y, this.x_old - this.x_select, this.y_old - this.y_select);
                this.overlayContext.clearRect(0, 0, this.overlayCanvas.width, this.overlayCanvas.height);
                this.selected_area = false;
            }
            else if (!this.area_select) {
                const cursor_style = this.backgroundContext.createRadialGradient(x, y, (this.restorer_radius - 5), (x + 1), (y + 1), (this.restorer_radius + 5));
                let transparent = hexToRgba(this.color, '0.05');
                cursor_style.addColorStop(1, transparent);
                this.backgroundContext.beginPath();
                this.backgroundContext.fillStyle = cursor_style;
                let cursor_x = +x + +12;
                let cursor_y = +y + +12;
                this.backgroundContext.arc(cursor_x, cursor_y, this.restorer_radius, 0, 2 * Math.PI, true);
                this.backgroundContext.fill();
            }
        }
        else if (this.isPress && this.tool === 'brush') {
            this.backgroundContext.globalCompositeOperation = 'source-over';
            if (this.area_select) {
                let cursor_x = +this.x_select + +12;
                let cursor_y = +this.y_select + +12;
                this.backgroundContext.beginPath();
                this.backgroundContext.fillStyle = this.color;
                this.backgroundContext.fillRect(cursor_x, cursor_y, this.x_old - this.x_select, this.y_old - this.y_select);
                this.overlayContext.clearRect(0, 0, this.overlayCanvas.width, this.overlayCanvas.height);
                this.selected_area = false;
            }
            else if (!this.area_select) {
                let cursor_x = +x + +12;
                let cursor_y = +y + +12;
                const cursor_style = this.backgroundContext.createRadialGradient(cursor_x, cursor_y, (this.paint_radius * 0.1), (cursor_x + 1), (cursor_y + 1), (this.paint_radius), true);
                let transparent = hexToRgba(this.color, '0.05');
                let transparent_1 = hexToRgba(this.color, '0.1');
                let transparent_2 = hexToRgba(this.color, '0.15');
                let transparent_3 = hexToRgba(this.color, '0.2');
                let transparent_4 = hexToRgba(this.color, '0.25');
                cursor_style.addColorStop(0.1, transparent_4);
                cursor_style.addColorStop(0.2, transparent_3);
                cursor_style.addColorStop(0.3, transparent_2);
                cursor_style.addColorStop(0.5, transparent_1);
                cursor_style.addColorStop(1, transparent);
                this.backgroundContext.beginPath();
                this.backgroundContext.fillStyle = cursor_style;
                this.backgroundContext.arc(cursor_x, cursor_y, this.paint_radius, 0, 2 * Math.PI, true);
                this.backgroundContext.fill();
            }
        }
        else if (this.isPress && this.tool === 'eraser') {
            this.backgroundContext.globalCompositeOperation = 'source-over';
            if (this.area_select) {
                let cursor_x = +this.x_select + +12;
                let cursor_y = +this.y_select + +12;
                this.backgroundContext.beginPath();
                this.backgroundContext.fillStyle = this.color;
                this.backgroundContext.fillRect(cursor_x, cursor_y, this.x_old - this.x_select, this.y_old - this.y_select);
                this.overlayContext.clearRect(0, 0, this.backgroundCanvas.width, this.backgroundCanvas.height);
                this.selected_area = false;
            }
            else if (!this.area_select) {
                let cursor_x = +x + +12;
                let cursor_y = +y + +12;
                const cursor_style = this.backgroundContext.createRadialGradient(cursor_x, cursor_y, (this.eraser_radius * 0.1), (cursor_x + 1), (cursor_y + 1), (this.eraser_radius), true);
                let transparent = hexToRgba(this.color, '0.05');
                let transparent_1 = hexToRgba(this.color, '0.15');
                let transparent_2 = hexToRgba(this.color, '0.25');
                cursor_style.addColorStop(0, transparent_2);
                cursor_style.addColorStop(0.5, transparent_1);
                cursor_style.addColorStop(1, transparent);
                this.backgroundContext.beginPath();
                this.backgroundContext.fillStyle = cursor_style;
                this.backgroundContext.arc(cursor_x, cursor_y, this.eraser_radius, 0, 2 * Math.PI);
                this.backgroundContext.fill();
            }
        }
        else if (this.isPress && this.area_select && !this.selected_area) {
            this.x_select = x;
            this.y_select = y;
        }
        else if (this.isPress && this.area_select && this.selected_area) {
            this.x_select = x;
            this.y_select = y;
            this.overlayContext.clearRect(0, 0, this.overlayCanvas.width, this.overlayCanvas.height);
            this.selected_area = false;
        }
    }
    keepUsingTool(e) {
        let x = e.offsetX;
        let y = e.offsetY;
        if (this.isPress && this.tool === 'restore' && !this.area_select) {
            this.backgroundContext.globalCompositeOperation = 'destination-out';
            const cursor_style = this.backgroundContext.createRadialGradient(x, y, (this.restorer_radius), (x + 1), (y + 1), (this.restorer_radius));
            let transparent = hexToRgba(this.color, '0.05');
            cursor_style.addColorStop(1, transparent);
            this.backgroundContext.beginPath();
            this.backgroundContext.fillStyle = cursor_style;
            let cursor_x = +x + +12;
            let cursor_y = +y + +12;
            this.backgroundContext.arc(cursor_x, cursor_y, this.restorer_radius, 0, 2 * Math.PI, true);
            this.backgroundContext.fill();
        }
        else if (this.isPress && this.tool === 'brush' && !this.area_select) {
            this.backgroundContext.globalCompositeOperation = 'source-over';
            let cursor_x = +x + +12;
            let cursor_y = +y + +12;
            const cursor_style = this.backgroundContext.createRadialGradient(cursor_x, cursor_y, (this.paint_radius * 0.1), (cursor_x + 1), (cursor_y + 1), (this.paint_radius), true);
            let transparent = hexToRgba(this.color, '0.05');
            let transparent_1 = hexToRgba(this.color, '0.1');
            let transparent_2 = hexToRgba(this.color, '0.15');
            let transparent_3 = hexToRgba(this.color, '0.2');
            let transparent_4 = hexToRgba(this.color, '0.25');
            cursor_style.addColorStop(0.1, transparent_4);
            cursor_style.addColorStop(0.2, transparent_3);
            cursor_style.addColorStop(0.3, transparent_2);
            cursor_style.addColorStop(0.5, transparent_1);
            cursor_style.addColorStop(1, transparent);
            this.backgroundContext.beginPath();
            this.backgroundContext.fillStyle = cursor_style;
            this.backgroundContext.arc(cursor_x, cursor_y, this.paint_radius, 0, 2 * Math.PI, true);
            this.backgroundContext.fill();
        }
        else if (this.isPress && this.tool === 'eraser' && !this.area_select) {
            let cursor_x = +x + +12;
            let cursor_y = +y + +12;
            const cursor_style = this.backgroundContext.createRadialGradient(cursor_x, cursor_y, (this.eraser_radius * 0.1), (cursor_x + 1), (cursor_y + 1), (this.eraser_radius), true);
            let transparent = hexToRgba(this.color, '0.05');
            let transparent_1 = hexToRgba(this.color, '0.15');
            let transparent_2 = hexToRgba(this.color, '0.25');
            cursor_style.addColorStop(0, transparent_2);
            cursor_style.addColorStop(0.5, transparent_1);
            cursor_style.addColorStop(1, transparent);
            this.backgroundContext.beginPath();
            this.backgroundContext.fillStyle = cursor_style;
            this.backgroundContext.arc(cursor_x, cursor_y, this.eraser_radius, 0, 2 * Math.PI, true);
            this.backgroundContext.fill();
        }
        else if (this.isPress && this.tool === 'area_select') {
            this.overlayContext.setLineDash([4, 2]);
            this.overlayContext.clearRect(0, 0, this.backgroundCanvas.width, this.backgroundCanvas.height);
            this.overlayContext.setLineDash([4, 2]);
            let cursor_x = +this.x_select + +12;
            let cursor_y = +this.y_select + +12;
            this.overlayContext.strokeRect(cursor_x, cursor_y, x - this.x_select, y - this.y_select);
            this.old = { x: x, y: y };
        }
    }
    stopUsingTool(event) {
        event.stopImmediatePropagation();
        this.isPress = false;
        this.undo_disabled = false;
        if (this.tool !== 'undo' && this.tool !== 'redo' && this.tool !== 'area_select') {
            let imageURL = this.backgroundContext.getImageData(0, 0, 480, 640);
            this.imagesArray.push(imageURL);
            this.index = this.imagesArray.length - 1;
            const dataImage = this.backgroundCanvas.toDataURL('image/png');
            this.imageAdjustmentCallback(this.parentComponentContext, true, dataImage);
            this.area_select = false;
        }
        else if (this.tool === 'area_select' && !this.selected_area) {
            this.x_old = this.old.x;
            this.y_old = this.old.y;
            this.selected_area = true;
        }
    }
    imageRestore(tool) {
        if (this.index >= 0) {
            this.index === 0 ? this.undo_disabled = true : this.undo_disabled = false;
            if (tool === 'redo') {
                this.undo_disabled = false;
                this.index = this.index + 1;
                let imageURL = this.imagesArray[this.index];
                this.backgroundContext.putImageData(imageURL, 0, 0);
                const dataImage = this.backgroundCanvas.toDataURL('image/png');
                this.imageAdjustmentCallback(this.parentComponentContext, true, dataImage);
                this.redo_disable = this.index === (this.imagesArray.length - 1);
            }
            else {
                this.redo_disable = false;
                this.index = this.index - 1;
                let imageURL = this.imagesArray[this.index];
                this.backgroundContext.putImageData(imageURL, 0, 0);
                const dataImage = this.backgroundCanvas.toDataURL('image/png');
                this.imageAdjustmentCallback(this.parentComponentContext, true, dataImage);
                this.undo_disabled = this.index === 0;
            }
        }
        if (this.index < 0) {
            this.index = 0;
            return;
        }
        else if (this.index === 0) {
            this.imageAdjustmentCallback(this.parentComponentContext, false, '');
        }
    }
    updateBrushRadius() {
        this.brush_radius = this.radius.value;
        if (this.tool === 'brush') {
            this.paint_radius = this.brush_radius;
        }
        else if (this.tool === 'eraser') {
            this.eraser_radius = this.brush_radius;
        }
        else if (this.tool === 'restore') {
            this.restorer_radius = this.brush_radius;
        }
    }
    colorPicker() {
        this.inputColor.click();
        if (this.tooltip === true) {
            this.tooltip = false;
            this.rangeContainer.style.display = "none";
        }
    }
    updateColor() {
        this.color = this.inputColor.value;
    }
    render() {
        return (h("div", { id: "container columns" },
            h("div", { class: "column" },
                h("div", { class: "toolbox-container" },
                    h("div", { class: "button-container", onClick: () => this.chooseTool('restore'), style: { boxShadow: this.tool === 'restore' ? '0 0 1em black' : '0 0 0' } },
                        h("i", { class: "mdi mdi-auto-fix icon-24", "aria-hidden": "true", title: this.translations.RESTORE })),
                    h("div", { class: "button-container", onClick: () => this.chooseTool('brush'), style: { boxShadow: this.tool === 'brush' ? '0 0 1em black' : '0 0 0' } },
                        h("i", { class: "mdi mdi-brush icon-24", "aria-hidden": "true", title: this.translations.BRUSH })),
                    h("div", { class: "button-container", onClick: () => this.chooseTool('eraser'), style: { boxShadow: this.tool === 'eraser' ? '0 0 1em black' : '0 0 0' } },
                        h("i", { class: "mdi mdi-eraser icon-24", "aria-hidden": "true", title: this.translations.ERASER })),
                    h("div", { class: "button-container", onClick: () => this.chooseTool('area_select'), style: { boxShadow: this.tool === 'area_select' ? '0 0 1em black' : '0 0 0' } },
                        h("i", { class: "mdi mdi-selection icon-24", "aria-hidden": "true", title: this.translations.AREA_SELECTION })),
                    h("div", { class: "button-container", onClick: () => this.chooseTool('undo'), style: { boxShadow: this.tool === 'undo' ? '0 0 1em black' : '0 0 0' } },
                        h("i", { class: "mdi mdi-undo icon-24", "aria-hidden": "true", title: this.translations.UNDO })),
                    h("div", { class: "button-container", onClick: () => this.chooseTool('redo'), style: { boxShadow: this.tool === 'redo' ? '0 0 1em black' : '0 0 0' } },
                        h("i", { class: "mdi mdi-redo icon-24", "aria-hidden": "true", title: this.translations.REDO })),
                    h("div", { class: "button-container", id: "color-picker", onClick: () => this.colorPicker() },
                        h("i", { class: "mdi mdi-palette icon-24", "aria-hidden": "true", title: this.translations.COLORS }))),
                h("div", { class: "range-slider-container", style: { display: "none" }, ref: el => {
                        this.rangeContainer = el;
                    } },
                    h("label", { id: "brush-radius-label" }, this.tool === 'eraser' ? 'tamanho ' : this.translations.BRUSH_RADIUS),
                    h("label", { id: "brush-radius", title: "radius" }, this.brush_radius),
                    h("input", { type: "range", id: "radius", name: "volume", min: "1", max: "80", value: this.brush_radius, onChange: () => this.updateBrushRadius(), ref: el => {
                            this.radius = el;
                        } })),
                h("input", { type: "color", id: "input-color", onChange: () => this.updateColor(), style: { visibility: "hidden" }, ref: el => {
                        this.inputColor = el;
                    } })),
            h("div", { class: "column" },
                h("div", { class: "canvas-container" },
                    h("canvas", { id: "backgroundCanvas", ref: el => {
                            this.backgroundCanvas = el;
                        } }),
                    h("canvas", { id: "overlayCanvas", onMouseDown: (e) => this.useTool(e), onMouseMove: (e) => this.keepUsingTool(e), onMouseUp: (e) => this.stopUsingTool(e), ref: el => {
                            this.overlayCanvas = el;
                        } })),
                h("button", { class: "button is-success", id: "button", onClick: () => { this.saveAdjustedImageCallback(this.parentComponentContext); } },
                    h("span", { class: "icon is-small" },
                        h("i", { class: "mdi mdi-check icon-24", style: { color: "white" }, "aria-hidden": "true", title: this.translations.SAVE_IMAGE })),
                    h("span", null, this.translations.FINISH)))));
    }
    static get is() { return "image-segmentation-adjustment-component"; }
    static get encapsulation() { return "shadow"; }
    static get properties() { return {
        "area_select": {
            "state": true
        },
        "backgroundCanvas": {
            "state": true
        },
        "backgroundContext": {
            "state": true
        },
        "backgroundImage": {
            "state": true
        },
        "brush_radius": {
            "state": true
        },
        "color": {
            "state": true
        },
        "componentContainer": {
            "elementRef": true
        },
        "currentElementTag": {
            "type": String,
            "attr": "current-element-tag"
        },
        "eraser_radius": {
            "state": true
        },
        "imageAdjustmentCallback": {
            "type": "Any",
            "attr": "image-adjustment-callback"
        },
        "imagesArray": {
            "state": true
        },
        "index": {
            "state": true
        },
        "inputColor": {
            "state": true
        },
        "isPress": {
            "state": true
        },
        "old": {
            "state": true
        },
        "originalImage": {
            "type": "Any",
            "attr": "original-image"
        },
        "overlayCanvas": {
            "state": true
        },
        "overlayContext": {
            "state": true
        },
        "overlayImage": {
            "state": true
        },
        "paint_radius": {
            "state": true
        },
        "parentComponentContext": {
            "type": "Any",
            "attr": "parent-component-context"
        },
        "parentElementTag": {
            "type": String,
            "attr": "parent-element-tag"
        },
        "radius": {
            "state": true
        },
        "rangeContainer": {
            "state": true
        },
        "redo_disable": {
            "state": true
        },
        "restorer_radius": {
            "state": true
        },
        "saveAdjustedImageCallback": {
            "type": "Any",
            "attr": "save-adjusted-image-callback"
        },
        "segmentedImage": {
            "type": "Any",
            "attr": "segmented-image"
        },
        "selected_area": {
            "state": true
        },
        "tool": {
            "state": true
        },
        "tooltip": {
            "state": true
        },
        "translations": {
            "state": true
        },
        "undo_disabled": {
            "state": true
        },
        "x_old": {
            "state": true
        },
        "x_select": {
            "state": true
        },
        "y_old": {
            "state": true
        },
        "y_select": {
            "state": true
        }
    }; }
    static get style() { return "/**style-placeholder:image-segmentation-adjustment-component:**/"; }
}
