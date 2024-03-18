import constants from './constants';
let url, config, servicesUrl, localUrl, sendToRemote;
const localServicesUrl = `http://${constants.WS_HOST}`;
getAppConfig().then((response) => {
    config = response;
    servicesUrl = `${config.serviceServerType}://${config.urls.apiService}:${config.ports.apiService}`;
});
export function getAppConfig() {
    return fetch(`${localServicesUrl}/db/api/config`, {
        method: 'get',
        headers: { 'Content-Type': 'application/json' }
    }).then((res) => res.json());
}
export function getCameraPresets() {
    return fetch(`${localServicesUrl}/db/api/camera-presets`, {
        method: 'get',
        headers: { 'Content-Type': 'application/json' }
    }).then((res) => res.json());
}
export async function saveServiceTime(parameters) {
    if (!url) {
        config = await getAppConfig();
        url = `${config.serviceServerType}://${config.urls.apiService}:${config.ports.apiService}`;
        localUrl = `http://${config.urls.localService}:${config.ports.localService}`;
        sendToRemote = !config.apiService && !config.asyncPersistency;
    }
    const { personId, processingTime, type, observations, details, brand, model, serial } = parameters;
    return fetch(`${sendToRemote ? url : localUrl}/db/api/service-time`, {
        method: 'post',
        body: JSON.stringify({
            personId,
            type,
            processingTime,
            observations,
            details,
            brand,
            model,
            serial
        }),
        headers: { 'Content-Type': 'application/json' }
    }).then((res) => res.json());
}
export async function getPersonById(id) {
    if (!url) {
        config = await getAppConfig();
        servicesUrl = `${config.serviceServerType}://${config.urls.apiService}:${config.ports.apiService}`;
    }
    return fetch(`${servicesUrl}/db/api/people/${id}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
    }).then(res => res.json());
}
