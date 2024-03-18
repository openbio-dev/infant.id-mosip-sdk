import constants from "../../utils/constants";
import { getAppConfig } from "../../utils/api";
let config, url, localUrl, sendToRemote, authServicesUrl;
const localServicesUrl = `http://${constants.WS_HOST}`;
getAppConfig().then((response) => {
    config = response;
    url = `${config.serviceServerType}://${config.urls.apiService}:${config.ports.apiService}`;
    localUrl = `http://${config.urls.localService}:${config.ports.localService}`;
    authServicesUrl = config.urls.authServicesUrl;
    sendToRemote = !config.apiService && !config.asyncPersistency;
});
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
export async function getPeople(cpf, captureType) {
    if (!url) {
        config = await getAppConfig();
        url = `${config.serviceServerType}://${config.urls.apiService}:${config.ports.apiService}`;
        authServicesUrl = config.urls.authServicesUrl;
    }
    return fetch(`${url}/db/api/people-details/${cpf}/${captureType}`, {
        method: 'get',
        headers: { 'Content-Type': 'application/json' },
    }).then(res => res.json());
}
