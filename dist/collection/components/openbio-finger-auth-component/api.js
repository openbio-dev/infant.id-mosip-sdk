import { getAppConfig } from "../../utils/api";
let config, authServicesUrl;
function authServicesToken() {
    return fetch(`${authServicesUrl}/auth?username=user01&password=E-(Q2hX:pmRugZQ`, {
        method: 'post',
        headers: { 'Content-Type': 'application/json' },
    }).then(res => res.json());
}
export async function getPeople(cpf) {
    if (!authServicesUrl) {
        config = await getAppConfig();
        authServicesUrl = config.urls.authServicesUrl;
    }
    await authServicesToken();
    return fetch(`${authServicesUrl}/person-details/${cpf}`, {
        method: 'get',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
    }).then(res => res.json());
}
