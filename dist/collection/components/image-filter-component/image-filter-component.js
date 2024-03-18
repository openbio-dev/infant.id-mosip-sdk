import { getFilters } from "./api";
import Swal from 'sweetalert2/dist/sweetalert2.all.min.js';
import { TranslationUtils } from '../../locales/translation';
export class GuideImageComponent {
    constructor() {
        this.filters = [];
        this.locale = 'pt';
    }
    async listenLocale(newValue) {
        TranslationUtils.setLocale(newValue);
        this.translations = await TranslationUtils.fetchTranslations();
        this.componentContainer.forceUpdate();
    }
    ;
    async componentWillLoad() {
        this.translations = await TranslationUtils.fetchTranslations();
    }
    async componentDidLoad() {
        const filters = await getFilters();
        this.loadFilters(filters);
        this.loadImage();
    }
    loadFilters(filters) {
        this.filters = [];
        for (let i = 0; i < filters.length; i++) {
            if (filters[i].visibility) {
                this.filters.push(Object.assign({}, filters[i], { enabled: false, level: filters[i].min }));
            }
        }
        this.componentContainer.forceUpdate();
    }
    getCanvas() {
        const parentElement = this.parentElementTag ? document.getElementsByTagName(this.parentElementTag)[0].shadowRoot.lastElementChild : document;
        const currentElement = this.currentElementTag ? parentElement.getElementsByTagName(this.currentElementTag)[0].shadowRoot.lastElementChild : parentElement;
        return currentElement.getElementsByTagName("image-filter-component")[0].shadowRoot.lastElementChild.getElementsByClassName("canvas-image")[0];
    }
    loadImage() {
        const image = new Image();
        image.src = this.src;
        image.onload = () => {
            const canvas = this.getCanvas();
            const context = canvas.getContext('2d');
            canvas.width = image.width;
            canvas.height = image.height;
            let filters = '';
            this.filters.forEach((filter) => {
                if (filter.enabled) {
                    filters += `${filter.type}(${filter.level}${filter.unity})`;
                }
            });
            context.filter = filters;
            context.drawImage(image, 0, 0, image.width, image.height);
            this.componentContainer.forceUpdate();
        };
    }
    getConfirmPopUpHtml(finalImage) {
        return `
      <div>
        <img src="${finalImage}" class="object-fit-contain" style="max-height: 300px" />
        <div class="swal2-content">
          <h2 style="display: flex;
            justify-content: center;
            font-size: 1.4em;
            font-weight: 600;
            margin: 20px;
            word-wrap: break-word;"
          >${this.translations.CONFIRM_ADJUSTMENT}</h2>
          <div id="swal2-content" style="display: block;">${this.translations.MAKE_SURE_PHOTO_SHARP_QUALITY}</div>
        </div>
      </div>
    `;
    }
    finalize() {
        const canvas = this.getCanvas();
        const finalImage = canvas.toDataURL('image/jpeg', 0.8);
        const html = this.getConfirmPopUpHtml(finalImage);
        return Swal.fire({
            html,
            type: "warning",
            showCloseButton: true,
            showCancelButton: true,
            focusConfirm: false,
            confirmButtonText: this.translations.CONFIRM,
            confirmButtonColor: '#7919FA',
            cancelButtonText: this.translations.BACK,
        }).then((result) => {
            if (result.value) {
                this.filterCallback(this.parentComponentContext, finalImage.split(",")[1]);
            }
        });
        ;
    }
    sliderInput(filter, event) {
        const index = this.filters.findIndex((filterAux) => filter === filterAux);
        this.filters[index].level = Number(event.path[0].value);
        this.componentContainer.forceUpdate();
        this.loadImage();
    }
    textInput(filter, event) {
        const index = this.filters.findIndex((filterAux) => filter === filterAux);
        const value = event.path[0].value < filter.min ? filter.min : event.path[0].value > filter.max ? filter.max : event.path[0].value;
        this.filters[index].level = value;
        this.componentContainer.forceUpdate();
        this.loadImage();
    }
    checkInput(filter, event) {
        const index = this.filters.findIndex((filterAux) => filter === filterAux);
        this.filters[index].enabled = event.path[0].checked;
        this.componentContainer.forceUpdate();
        this.loadImage();
    }
    getFilters() {
        return this.filters.map((filter) => {
            return (h("div", { class: "column is-6" },
                h("div", { class: "column field" },
                    h("input", { class: `is-checkradio has-background-color ${filter.enabled ? "is-info" : ""}`, id: `check${filter.label}`, type: "checkbox", name: `check${filter.label}`, checked: filter.enabled, onChange: ($event) => this.checkInput(filter, $event) }),
                    h("label", { htmlFor: `check${filter.label}` },
                        " ",
                        this.translations[filter.label])),
                h("div", { class: "columns", style: { position: "relative" } },
                    h("div", { class: "column is-11" },
                        h("input", { id: "sliderWithValue", class: `slider has-output is-fullwidth is-circle ${filter.enabled ? "is-info" : ""}`, disabled: !filter.enabled, min: filter.min, max: filter.max, value: filter.level, step: filter.step, type: "range", onInput: ($event) => this.sliderInput(filter, $event) })),
                    h("div", { class: "column is-3", style: { position: "absolute", right: "1vw", top: "1vh" } },
                        h("input", { class: "input is-info", type: "text", pattern: "\\d*", disabled: !filter.enabled, min: filter.min, max: filter.max, value: filter.level, onInput: ($event) => this.textInput(filter, $event), style: { maxWidth: '65px', textAlign: 'center' } })))));
        });
    }
    render() {
        return (h("div", null,
            h("div", { class: "centrelize", style: { marginTop: "15px" } },
                h("canvas", { class: "canvas-image", id: 'canvas', height: '300', width: '300', style: { maxHeight: "350px" } })),
            h("div", { class: "centrelize" },
                h("button", { class: "button is-success", style: { marginTop: "15px" }, onClick: () => { this.finalize(); } },
                    h("span", { class: "icon is-small" },
                        h("i", { class: "mdi mdi-check icon-24", "aria-hidden": "true", title: this.translations.FINALIZE_AND_SAVE })),
                    h("span", null, this.translations.FINISH))),
            h("div", { class: "columns is-multiline", style: { marginTop: "15px", overflowY: "scroll", maxHeight: "153px", overflowX: "hidden" } }, this.getFilters())));
    }
    static get is() { return "image-filter-component"; }
    static get encapsulation() { return "shadow"; }
    static get properties() { return {
        "componentContainer": {
            "elementRef": true
        },
        "currentElementTag": {
            "type": String,
            "attr": "current-element-tag"
        },
        "filterCallback": {
            "type": "Any",
            "attr": "filter-callback"
        },
        "filters": {
            "state": true
        },
        "locale": {
            "type": String,
            "attr": "locale",
            "mutable": true,
            "watchCallbacks": ["listenLocale"]
        },
        "parentComponentContext": {
            "type": "Any",
            "attr": "parent-component-context"
        },
        "parentElementTag": {
            "type": String,
            "attr": "parent-element-tag"
        },
        "src": {
            "type": String,
            "attr": "src"
        },
        "translations": {
            "state": true
        }
    }; }
    static get style() { return "/**style-placeholder:image-filter-component:**/"; }
}
