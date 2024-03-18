import { getAppConfig } from "../../utils/api";
let config, localUrl, url, sendToRemote;
getAppConfig().then((response) => {
    config = response;
    console.log("app config fetched");
    url = `${config.serviceServerType}://${config.urls.apiService}:${config.ports.apiService}`;
    localUrl = `${config.serviceServerType}://${config.urls.localService}:${config.ports.localService}`;
    sendToRemote = !config.apiService && !config.asyncPersistency;
});
export function loadFingerForm(data) {
    return fetch(`${localUrl}/db/api/biometries/finger/form`, { method: "POST", body: data })
        .then(res => res.json());
}
export function loadRoiCroppedForm(data) {
    return fetch(`${localUrl}/db/api/biometries/finger/roi-crop`, { method: "POST", body: data })
        .then(res => res.json());
}
export function loadPalmForm(data) {
    return fetch(`${localUrl}/db/api/biometries/palm/form`, { method: "POST", body: data })
        .then(res => res.json());
}
export function scannerScan() {
    return fetch(`${localUrl}/db/api/scanner/scan`)
        .then(res => res.json());
}
export async function savePalm(data) {
    if (!url) {
        config = await getAppConfig();
        url = `${config.serviceServerType}://${config.urls.apiService}:${config.ports.apiService}`;
        localUrl = `http://${config.urls.localService}:${config.ports.localService}`;
        sendToRemote = !config.apiService && !config.asyncPersistency;
    }
    return fetch(`${sendToRemote ? url : localUrl}/db/api/palm`, {
        method: 'post',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' },
    })
        .then(res => res.json());
}
export async function saveFingers(data) {
    if (!url) {
        config = await getAppConfig();
        url = `${config.serviceServerType}://${config.urls.apiService}:${config.ports.apiService}`;
        localUrl = `http://${config.urls.localService}:${config.ports.localService}`;
        sendToRemote = !config.apiService && !config.asyncPersistency;
    }
    return fetch(`${sendToRemote ? url : localUrl}/db/api/biometries/fingers`, {
        method: 'post',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' },
    })
        .then(res => res.json());
}
