import WS from '../../utils/websocket';
var WEB_SOCKET_ACTIONS;
(function (WEB_SOCKET_ACTIONS) {
    WEB_SOCKET_ACTIONS["BACKGROUND_REMOVED"] = "background-removed";
})(WEB_SOCKET_ACTIONS || (WEB_SOCKET_ACTIONS = {}));
export class CnhPreviewComponent {
    constructor() {
        this.ws = new WS();
        this.size = {
            width: '300',
            height: 'auto',
        };
        this.cnhTemplate = '../../assets/general/template_cnh.png';
        this.signature = undefined;
    }
    async componentDidLoad() {
        setTimeout(() => {
            try {
                this.loadWsListeners();
                this.removeSignatureBackground();
                this.person = this.person ? JSON.parse(this.person) : {};
                this.componentContainer.forceUpdate();
            }
            catch (e) {
                console.log(e);
            }
        }, 1000);
    }
    loadWsListeners() {
        this.open();
        this.ws.deviceSocket.addEventListener("message", (event) => {
            const data = JSON.parse(event.data);
            if (data.action === WEB_SOCKET_ACTIONS.BACKGROUND_REMOVED) {
                this.signature = data.convertedSignature;
                this.componentContainer.forceUpdate();
            }
        });
    }
    open() {
        const payload = {
            action: "utils-start"
        };
        this.ws.respondToDeviceWS(payload);
    }
    removeSignatureBackground() {
        const payload = {
            action: "remove-background",
            data: {
                base64: this.inputSignature,
                outputType: "pnga"
            }
        };
        this.ws.respondToDeviceWS(payload);
    }
    applyCpfMask(cpf) {
        if (!cpf) {
            return '';
        }
        cpf = cpf.replace(/\D/g, '');
        return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/g, "$1.$2.$3-$4");
    }
    formatDate(date) {
        const dbDate = date ? date.split('-') : '00-00-0000'.split('-');
        return `${dbDate[2]}/${dbDate[1]}/${dbDate[0]}`;
    }
    render() {
        return (h("div", { style: { position: 'relative' } },
            h("img", { src: this.cnhTemplate, style: { width: `${this.size.width}${this.size.unit || this.size.width !== 'auto' ? 'px' : ''}`,
                    height: `${this.size.height}${this.size.unit || this.size.height !== 'auto' ? 'px' : ''}`,
                } }),
            h("span", { class: "cnh-position cnh-font cnh-color-default", style: { left: "54px", top: "52px" } },
                " ",
                this.person.fullName ? this.person.fullName.toUpperCase() : '',
                " "),
            h("div", { class: "cnh-position centrelize", style: { left: "51px", top: "69px", width: '99px' } },
                h("img", { src: `data:image/charset=UTF-8;png;base64,${this.photo}`, style: { maxWidth: '86.3%' } })),
            h("span", { class: "cnh-position cnh-font cnh-color-default", style: { left: "155px", top: "71px" } },
                " ",
                this.person.registerId,
                " "),
            h("span", { class: "cnh-position cnh-font cnh-color-default", style: { left: "155px", top: "92px" } },
                " ",
                this.applyCpfMask(this.person.cpf),
                " "),
            h("span", { class: "cnh-position cnh-font cnh-color-default", style: { left: "230px", top: "92px" } },
                " ",
                this.formatDate(this.person.dateOfBirth),
                " "),
            h("div", { class: "cnh-position cnh-font cnh-color-default", style: { left: "155px", top: "115px", maxWidth: '124px', maxHeight: '20px', lineHeight: '10px' } },
                h("span", null,
                    " ",
                    this.person.fatherName ? this.person.fatherName.toUpperCase() : '',
                    " ")),
            h("div", { class: "cnh-position cnh-font cnh-color-default", style: { left: "155px", top: "133px", maxWidth: '124px', maxHeight: '20px', lineHeight: '10px' } },
                h("span", null,
                    " ",
                    this.person.motherName ? this.person.motherName.toUpperCase() : '',
                    " ")),
            h("span", { class: "cnh-position cnh-font cnh-color-red", style: { left: "264px", top: "165px" } },
                " ",
                this.person.cnhCategory,
                " "),
            h("span", { class: "cnh-position cnh-font cnh-color-red", style: { left: "70px", top: "188px" } },
                " ",
                this.person.registerCode,
                " "),
            h("span", { class: "cnh-position cnh-font cnh-color-red", style: { left: "154px", top: "188px" } }, " --/--/---- "),
            h("span", { class: "cnh-position cnh-font cnh-color-default", style: { left: "222px", top: "188px" } }, " --/--/---- "),
            h("span", { class: "cnh-position cnh-font cnh-color-default", style: { left: "53px", top: "217px" } }, " - "),
            this.signature ?
                h("div", { class: "cnh-position centrelize", style: { left: "57px", top: "288px", maxWidth: '171px' } },
                    h("img", { src: `data:image/charset=UTF-8;png;base64,${this.signature}` })) : null,
            h("span", { class: "cnh-position cnh-font cnh-color-default", style: { left: "54px", top: "334px" } },
                " ",
                this.person.local,
                " "),
            h("span", { class: "cnh-position cnh-font cnh-color-default", style: { left: "227px", top: "334px" } }, " --/--/---- ")));
    }
    static get is() { return "cnh-preview"; }
    static get encapsulation() { return "shadow"; }
    static get properties() { return {
        "cnhTemplate": {
            "state": true
        },
        "componentContainer": {
            "elementRef": true
        },
        "inputSignature": {
            "type": "Any",
            "attr": "input-signature"
        },
        "person": {
            "type": "Any",
            "attr": "person",
            "mutable": true
        },
        "photo": {
            "type": "Any",
            "attr": "photo"
        },
        "signature": {
            "state": true
        },
        "size": {
            "type": "Any",
            "attr": "size",
            "mutable": true
        }
    }; }
    static get style() { return "/**style-placeholder:cnh-preview:**/"; }
}
