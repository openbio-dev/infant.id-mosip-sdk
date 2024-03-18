import constants from "../../utils/constants";
import { getAppConfig } from "../../utils/api";
let config, url, localUrl, sendToRemote;
const localServicesUrl = `http://${constants.WS_HOST}`;
getAppConfig().then((response) => {
    config = response;
    url = `${config.serviceServerType}://${config.urls.apiService}:${config.ports.apiService}`;
    localUrl = `http://${config.urls.localService}:${config.ports.localService}`;
    sendToRemote = !config.apiService && !config.asyncPersistency;
});
export async function getFlowOptions() {
    if (!url) {
        config = await getAppConfig();
        url = `${config.serviceServerType}://${config.urls.apiService}:${config.ports.apiService}`;
        localUrl = `http://${config.urls.localService}:${config.ports.localService}`;
        sendToRemote = !config.apiService && !config.asyncPersistency;
    }
    return fetch(`${sendToRemote ? url : localUrl}/device/flow-options`).then((res) => res.json());
}
export async function getAnomalies(type, detached) {
    if (!url) {
        config = await getAppConfig();
        url = `${config.serviceServerType}://${config.urls.apiService}:${config.ports.apiService}`;
        localUrl = `http://${config.urls.localService}:${config.ports.localService}`;
        sendToRemote = !config.apiService && !config.asyncPersistency;
    }
    return fetch(`${sendToRemote ? url : localUrl}/db/api/settings/anomalies/${type}?detached=${detached}`).then((res) => res.json());
}
export async function saveFingers(data) {
    if (!url) {
        config = await getAppConfig();
        url = `${config.serviceServerType}://${config.urls.apiService}:${config.ports.apiService}`;
        localUrl = `http://${config.urls.localService}:${config.ports.localService}`;
        sendToRemote = !config.apiService && !config.asyncPersistency;
    }
    return fetch(`${sendToRemote ? url : localUrl}/db/api/biometries/fingers?infant=true`, {
        method: "post",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
    }).then((res) => res.json());
}
export async function getModalSettings() {
    return fetch(`${localServicesUrl}/db/api/settings/${constants.settingTypes.INFANT_SETTINGS}`, {
        method: "get",
        headers: { "Content-Type": "application/json" },
    }).then((res) => res.json());
}
export async function getPeople(cpf, captureType) {
    if (!url) {
        config = await getAppConfig();
        url = `${config.serviceServerType}://${config.urls.apiService}:${config.ports.apiService}`;
    }
    return fetch(`${url}/db/api/people-details/${cpf}/${captureType}`, {
        method: "get",
        headers: { "Content-Type": "application/json" },
    }).then((res) => res.json());
}
export async function saveFingerFile(data, file) {
    const bodyData = new FormData();
    bodyData.append("file", file);
    bodyData.set("data", JSON.stringify(data));
    if (!url) {
        config = await getAppConfig();
        url = `${config.serviceServerType}://${config.urls.apiService}:${config.ports.apiService}`;
        localUrl = `http://${config.urls.localService}:${config.ports.localService}`;
        sendToRemote = !config.apiService && !config.asyncPersistency;
    }
    return fetch(`${sendToRemote ? url : localUrl}/db/api/biometries/finger-file`, {
        method: "post",
        body: bodyData,
    }).then((res) => res.json());
}
