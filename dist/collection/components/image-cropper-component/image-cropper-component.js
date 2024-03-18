import Cropper from 'cropperjs';
import Swal from 'sweetalert2/dist/sweetalert2.all.min.js';
import { TranslationUtils } from '../../locales/translation';
export class ImageCropperComponent {
    constructor() {
        this.cropper = undefined;
        this.segment = false;
        this.locale = 'pt';
    }
    async listenLocale(newValue) {
        this.setI18nParameters(newValue);
    }
    ;
    async componentWillLoad() {
        this.setI18nParameters(this.locale);
        this.translations = await TranslationUtils.fetchTranslations();
    }
    async setI18nParameters(locale) {
        TranslationUtils.setLocale(locale);
        this.translations = await TranslationUtils.fetchTranslations();
        this.componentContainer.forceUpdate();
    }
    componentDidLoad() {
        const parentElement = this.parentElementTag ? document.getElementsByTagName(this.parentElementTag)[0].shadowRoot.lastElementChild : document;
        const currentElement = this.currentElementTag ? parentElement.getElementsByTagName(this.currentElementTag)[0].shadowRoot.lastElementChild : parentElement;
        const image = currentElement.getElementsByTagName("image-cropper-component")[0].shadowRoot.lastElementChild.getElementsByClassName("cropper-base-image")[0];
        this.cropper = new Cropper(image, {
            aspectRatio: this.aspectRatio,
            center: true,
            cropBoxResizable: this.cropBoxResizable,
            dragMode: 'move',
            viewMode: 0,
            minContainerWidth: 710
        });
        // setTimeout(() => {
        //   const cropperContainer: any = currentElement.getElementsByTagName("image-cropper-component")[0].shadowRoot.lastElementChild.getElementsByClassName("cropper-bg")[0];
        //   cropperContainer.style.maxHeight = "710px"
        // }, 1000);
    }
    crop() {
        const croppedImage = this.cropper.getCroppedCanvas().toDataURL('image/jpeg', 0.8);
        const html = `
      <div>
        <img src="${croppedImage}" class="object-fit-contain" style="max-height: 300px" />
        <div class="swal2-content">
          <h2 style="display: flex;
            justify-content: center;
            font-size: 1.4em;
            font-weight: 600;
            margin: 20px;
            word-wrap: break-word;"
          >${this.translations.CONFIRM_CROP}</h2>
          <div id="swal2-content" style="display: block;">${this.translations.MAKE_SURE_PHOTO_WELL_FRAME}</div>
        </div>
      </div>
    `;
        return Swal.fire({
            html,
            type: "warning",
            showCloseButton: true,
            showCancelButton: true,
            focusConfirm: false,
            confirmButtonColor: '#7919FA',
            confirmButtonText: this.translations.CONFIRM,
            cancelButtonText: this.translations.BACK,
        }).then((result) => {
            if (result.value) {
                this.cropCallback(this.parentComponentContext, croppedImage.split(",")[1], this.src.split(",")[1], this.segment);
            }
        });
        ;
    }
    segmentCheckInput() {
        this.segment = !this.segment;
    }
    render() {
        return (h("div", null,
            h("img", { src: this.src, class: "cropper-base-image my-3", style: { maxHeight: "30vh" } }),
            h("div", null),
            h("div", { class: "toolbox-container" },
                h("div", { class: "button-container", onClick: () => this.crop() },
                    h("i", { class: "mdi mdi-crop icon-24", "aria-hidden": "true", title: this.translations.CLIP })),
                h("div", { class: "button-container", onClick: () => this.cropper.rotate(-1) },
                    h("i", { class: "mdi mdi-rotate-left icon-24", "aria-hidden": "true", title: this.translations.ADJUSTMENT_1_DEGREE_LEFT })),
                h("div", { class: "button-container", onClick: () => this.cropper.rotate(1) },
                    h("i", { class: "mdi mdi-rotate-right icon-24", "aria-hidden": "true", title: this.translations.ADJUSTMENT_1_DEGREE_RIGHT })),
                h("div", { class: "button-container", onClick: () => this.cropper.rotate(-90) },
                    h("i", { class: "mdi mdi-rotate-left-variant icon-24", "aria-hidden": "true", title: this.translations.TURN_90_DEGREE_LEFT })),
                h("div", { class: "button-container", onClick: () => this.cropper.rotate(90) },
                    h("i", { class: "mdi mdi-rotate-right-variant icon-24", "aria-hidden": "true", title: this.translations.TURN_90_DEGREE_RIGHT })),
                !this.customizedImageSize ?
                    h("div", { class: "field" },
                        h("input", { class: `is-checkradio has-background-color ${this.segment ? "is-info" : ""}`, id: "check-segment", type: "checkbox", name: "check-segment", checked: this.segment, onChange: () => this.segmentCheckInput() }),
                        h("label", { htmlFor: "check-segment" }, this.translations.USE_SEGMENTATION))
                    : null)));
    }
    static get is() { return "image-cropper-component"; }
    static get encapsulation() { return "shadow"; }
    static get properties() { return {
        "aspectRatio": {
            "type": "Any",
            "attr": "aspect-ratio"
        },
        "componentContainer": {
            "elementRef": true
        },
        "cropBoxResizable": {
            "type": Boolean,
            "attr": "crop-box-resizable"
        },
        "cropCallback": {
            "type": "Any",
            "attr": "crop-callback"
        },
        "cropper": {
            "state": true
        },
        "currentElementTag": {
            "type": String,
            "attr": "current-element-tag"
        },
        "customizedImageSize": {
            "type": Boolean,
            "attr": "customized-image-size"
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
        "segment": {
            "state": true
        },
        "src": {
            "type": String,
            "attr": "src"
        },
        "translations": {
            "state": true
        }
    }; }
    static get style() { return "/**style-placeholder:image-cropper-component:**/"; }
}
