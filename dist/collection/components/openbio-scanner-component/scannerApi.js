const url = "http://localhost:9010";
export function getDevices() {
    return fetch(`${url}/scanner/devices`).then(res => res.json());
}
export function setDevice(id) {
    return fetch(`${url}/scanner/set/${id}`, { method: "POST" })
        .then(res => res);
}
export function open() {
    return fetch(`${url}/scanner/open`).then(res => res);
}
export function scan() {
    return fetch(`${url}/scanner/scan`).then(res => res.json());
}
export function close() {
    return fetch(`${url}/scanner/close`).then(res => res);
}
