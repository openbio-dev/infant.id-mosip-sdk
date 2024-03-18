import { getAppConfig } from "../../utils/api";
let config, localUrl;
const updateConfigs = async () => {
    return new Promise((resolve) => {
        getAppConfig().then((response) => {
            config = response;
            localUrl = `http://${config.urls.localService}:${config.ports.localService}`;
            resolve(config);
        });
    });
};
updateConfigs();
export async function getFilters() {
    await updateConfigs();
    return fetch(`${localUrl}/db/api/settings/filters`).then(res => res.json());
}
