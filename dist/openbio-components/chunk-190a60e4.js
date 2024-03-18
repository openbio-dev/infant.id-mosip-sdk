const h = window.OpenbioComponents.h;

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
function getPerson() {
    return session.person;
}
function setPerson(data) {
    return session.person = data;
}
function clearPerson() {
    session.person = { id: 0 };
}
function getFingers() {
    return session.modal.fingers;
}
function setFingers(data) {
    return session.modal.fingers = data;
}
function getMugshot() {
    return session.mugshot;
}
function setMugshot(data) {
    return session.mugshot = data;
}
function getFace() {
    return session.face;
}
function setFace(data) {
    return session.face = data;
}
function getSignature() {
    return session.signature;
}
function setSignature(data) {
    return session.signature = data;
}

export { setFace as a, setFingers as b, setSignature as c };
