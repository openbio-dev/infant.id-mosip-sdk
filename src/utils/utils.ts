import constants from "./constants";

export function format(first: string, middle: string, last: string): string {
  return (
    (first || "") + (middle ? ` ${middle}` : "") + (last ? ` ${last}` : "")
  );
}

export async function getLocalization() {
  return new Promise(async (resolve, _) => {
    await fetch(constants.IPINFO_ADDRESS)
      .then((res) => res.json())
      .then((data) => {
        delete data.hostname;
        delete data.org;
        delete data.postal;
        resolve(JSON.stringify(data));
      });
  });
}

export function addCustomLink(url: string) {
  let element = document.querySelector(`link[href="${url}"]`);

  if (!element) {
    element = document.createElement("link");
    element.setAttribute("rel", "stylesheet");
    element.setAttribute("href", url);
    document.head.appendChild(element);
  }
}

export const THEMES = {
    default: {
      primary: '#380281',
      secondary: '#7919FA',
      accent: 'rgba(121, 25, 250, 0.3)'
    },
    infant: {
      primary: '#1276B8',
      secondary: '#21B8CA',
      accent: '#DEFBFF'
    }
}

export function getThemeByApplicationType(type: string) {
  if (type === 'H') {
    return "infant";
  }
  return "default";
}
