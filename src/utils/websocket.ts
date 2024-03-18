import moment from "moment";
import constants from "./constants";
import { getAppConfig } from '../utils/api';

export default class WS {
  public deviceSocket: any;
  public componentSocket: any;
  public interfaceSocket: any;

  constructor() {
    this.init();
  }

  private init(): void {
    console.info("websocket will try connection", moment().format());

    try {
      this.deviceSocket = new WebSocket(`ws://${constants.WS_HOST}/device`);
    } catch (error) {
      console.log('Component WS error', error);
    }

    this.deviceSocket.addEventListener("close", () => {
      this.deviceSocket.close();
      console.warn("device websocket connection closed", moment().format());
    });

    this.deviceSocket.addEventListener("error", () => {
      this.deviceSocket.close();
    });

    this.deviceSocket.addEventListener("open", () => {
      console.info("device websocket connection opened", moment().format());
    });


    this.componentSocket = new WebSocket(`ws://${constants.WS_HOST}/component`);

    this.componentSocket.addEventListener("close", () => {
      this.componentSocket.close();
    });

    this.componentSocket.addEventListener("error", () => {
      this.componentSocket.close();
    });

    this.componentSocket.addEventListener("open", () => {
      console.info("component websocket connection opened", moment().format());
    });

    this.interfaceSocket = new WebSocket(`ws://${constants.WS_HOST}/interface`);

    this.interfaceSocket.addEventListener("close", () => {
      this.interfaceSocket.close();
    });

    this.interfaceSocket.addEventListener("open", () => {
      console.info("interface websocket connection opened", moment().format());
    });

    this.interfaceSocket.addEventListener("error", () => {
      this.interfaceSocket.close();
    });
  }

  respondToDeviceWS(message): void {
    if (message instanceof ArrayBuffer && message.byteLength !== undefined) {
      this.deviceSocket.send(message);
    } else {
      this.deviceSocket.send(JSON.stringify(message));
    }
  }

  respondToComponentWS(message): void {
    this.componentSocket.send(JSON.stringify(message));
  }

  changeModuleTo(message): void {
    this.interfaceSocket.send(JSON.stringify(message));
  }

  status(): number {
    return this.deviceSocket.readyState;
  }

  async startDevice(ws: WS, payload: any): Promise<void> {
    const wsStatusInterval = setInterval(() => {
      if (ws.status() === 1) {
        clearInterval(wsStatusInterval);
        ws.respondToDeviceWS(payload);
      }
    }, 1000);
  }
}
