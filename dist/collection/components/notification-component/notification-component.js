export class NotificationComponent {
    render() {
        return (h("div", { class: `notification notification-${this.notificationType}` },
            h("div", { class: "notification-message" }, this.text)));
    }
    static get is() { return "notification-component"; }
    static get encapsulation() { return "shadow"; }
    static get properties() { return {
        "notificationType": {
            "type": String,
            "attr": "notification-type"
        },
        "text": {
            "type": String,
            "attr": "text"
        }
    }; }
    static get style() { return "/**style-placeholder:notification-component:**/"; }
}
