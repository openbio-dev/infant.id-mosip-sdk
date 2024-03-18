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
}

export function getPerson() {
  return session.person;
}

export function setPerson(data: any) {
  return session.person = data;
}

export function clearPerson() {
  session.person = {id: 0};
}

export function getFingers() {
  return session.modal.fingers;
}

export function setFingers(data: any) {
  return session.modal.fingers = data;
}

export function getMugshot() {
  return session.mugshot;
}

export function setMugshot(data: any) {
  return session.mugshot = data;
}

export function getFace() {
  return session.face;
}

export function setFace(data: any) {
  return session.face = data;
}

export function getSignature() {
  return session.signature;
}

export function setSignature(data: any) {
  return session.signature = data;
}
