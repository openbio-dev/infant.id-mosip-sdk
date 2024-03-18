const authServicesUrl = "http://biometria.cl2dam.detran.am.gov.br:55501/match-server/api";
function authServicesToken() {
    return fetch(`${authServicesUrl}/auth?username=user01&password=E-(Q2hX:pmRugZQ`, {
        method: 'post',
        headers: { 'Content-Type': 'application/json' },
    }).then(res => res.json());
}
export async function getPeople(cpf) {
    await authServicesToken();
    return fetch(`${authServicesUrl}/person-details/${cpf}`, {
        method: 'get',
        headers: { 'Content-Type': 'application/json' },
    }).then(res => res.json());
}
export async function authLog(data) {
    await authServicesToken();
    return fetch(`${authServicesUrl}/log/auth`, {
        method: 'post',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' },
    })
        .then(res => res.json());
}
export async function faceAuthenticate(data) {
    await authServicesToken();
    return fetch(`${authServicesUrl}/face/authenticate`, {
        method: 'post',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' },
    }).then(res => res.json());
}
