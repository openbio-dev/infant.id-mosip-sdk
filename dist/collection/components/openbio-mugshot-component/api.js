import constants from "../../utils/constants";
import { getAppConfig } from "../../utils/api";
let config, url, localUrl, sendToRemote;
getAppConfig().then((response) => {
    config = response;
    url = `${config.serviceServerType}://${config.urls.apiService}:${config.ports.apiService}`;
    localUrl = `${config.serviceServerType}://${config.urls.localService}:${config.ports.localService}`;
    sendToRemote = !config.apiService && !config.asyncPersistency;
});
export async function getAnomalies(type, detached) {
    if (!url) {
        config = await getAppConfig();
        url = `${config.serviceServerType}://${config.urls.apiService}:${config.ports.apiService}`;
        localUrl = `http://${config.urls.localService}:${config.ports.localService}`;
        sendToRemote = !config.apiService && !config.asyncPersistency;
    }
    return fetch(`${sendToRemote ? url : localUrl}/db/api/settings/anomalies/${type}?detached=${detached}`).then(res => res.json());
}
export function getCameraSettingsOptions() {
    return fetch(`${localUrl}/device/camera-settings`).then(res => res.json());
}
export function getCameraSettings() {
    return fetch(`${localUrl}/db/api/settings/camera`).then(res => res.json());
}
export function saveCameraSettings(data) {
    fetch(`${localUrl}/db/api/settings/camera`, {
        method: 'post',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' },
    })
        .then(res => res.json());
}
export function getFaceSettings() {
    return fetch(`${localUrl}/db/api/settings/${constants.settingTypes.FACE_SETTINGS}`, {
        method: 'get',
        headers: { 'Content-Type': 'application/json' },
    })
        .then(res => res.json());
}
export async function saveMugshotPhoto(data) {
    if (!url) {
        config = await getAppConfig();
        url = `${config.serviceServerType}://${config.urls.apiService}:${config.ports.apiService}`;
        localUrl = `http://${config.urls.localService}:${config.ports.localService}`;
        sendToRemote = !config.apiService && !config.asyncPersistency;
    }
    return fetch(`${sendToRemote ? url : localUrl}/db/api/biometries/mugshot`, {
        method: 'post',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' },
    })
        .then(res => res.json());
}
export async function deleteMugshotPhoto(id) {
    if (!url) {
        config = await getAppConfig();
        url = `${config.serviceServerType}://${config.urls.apiService}:${config.ports.apiService}`;
        localUrl = `http://${config.urls.localService}:${config.ports.localService}`;
        sendToRemote = !config.apiService && !config.asyncPersistency;
    }
    return fetch(`${sendToRemote ? url : localUrl}/db/api/biometries/mugshot/${id}`, {
        method: 'delete',
        headers: { 'Content-Type': 'application/json' },
    })
        .then(res => res.json());
}
