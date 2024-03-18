const session = {
    person: {
        id: 0
    },
    document: {},
    signature: {},
    face: {},
    modal: {
        fingers: []
    },
    mugshot: []
};
export function getPerson() {
    return session.person;
}
export function setPerson(data) {
    return session.person = data;
}
export function clearPerson() {
    session.person = { id: 0 };
}
export function getFingers() {
    return session.modal.fingers;
}
export function setFingers(data) {
    return session.modal.fingers = data;
}
export function getMugshot() {
    return session.mugshot;
}
export function setMugshot(data) {
    return session.mugshot = data;
}
export function getFace() {
    return session.face;
}
export function setFace(data) {
    return session.face = data;
}
export function getSignature() {
    return session.signature;
}
export function setSignature(data) {
    return session.signature = data;
}
