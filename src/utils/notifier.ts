export function notify(parentElement: any, type: string, message: string, timeout?: number) {
  const notificationContainer = parentElement.shadowRoot.querySelector('div#notification-container');
  notificationContainer.insertAdjacentHTML( 'beforeend', `<notification-component notification-type="${type}" text="${message}"/>`);

  setTimeout(() => {
    const element = parentElement.shadowRoot.querySelector('notification-component');
    element.parentNode.removeChild(element);
  }, timeout || 3000);
}