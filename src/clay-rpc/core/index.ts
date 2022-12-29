import { Observable, Subject, Subscription } from "rxjs";
import { Message, protoBase64 } from "@bufbuild/protobuf";
import { ClientMessage, ServerMessage } from "./messageTypes";

const assert = (condition: boolean, message: string, nothrow = false) => {
  if (!condition) {
    if (nothrow) {
      console.log(message);
      return;
    }
    throw new Error(message);
  }
};

export let isConnected = false;
export const setConnected = (connected: boolean) => {
  isConnected = connected;
};

interface IncomingClientStream<T> {
  method: MethodRegistryItem;
  subject: Subject<T>;
}

export const disposeHandlers = () => {
  incomingClientStreams.clear();
  while (serviceResponseSubscription.length > 0) {
    const subscription = serviceResponseSubscription.pop();
    subscription?.unsubscribe();
  }
};
const incomingClientStreams = new Map<number, IncomingClientStream<any>>();
const serviceResponseSubscription: Subscription[] = [];
export const getMessageHandler =
  (send: (data: object) => void) => async (message: ClientMessage) => {
    // get method
    const method = methods.get(`${message.service}/${message.method}`);
    assert(
      method != null,
      `method ${message.service}/${message.method} not found`
    );

    // on client stream end
    if (message.completed) {
      // client stream
      const incomingClientStream = incomingClientStreams.get(message.id);
      assert(
        incomingClientStream != null,
        `incoming client stream ${message.id} not found`,
        false
      );
      incomingClientStream!.subject.complete();
      incomingClientStreams.delete(message.id);
    }

    // deserialize payload
    const payload = method!.requestMessage.fromBinary(
      protoBase64.dec(message.payload)
    );

    const isNonFirstResponse = incomingClientStreams.has(message.id);
    assert(
      !(isNonFirstResponse && !method!.clientStream),
      `method ${message.service}.${message.method} is not client stream but received multiple responses`
    );

    const processResponse = (response: Message | Observable<Message>) => {
      const serverStream = method!.serverStream;
      // check if it is unary
      const isUnary = !serverStream && !method!.clientStream;
      if (!isUnary) {
        assert(
          response instanceof Observable,
          `method ${message.service}.${message.method} is not unary but response is not Observable`
        );
        const response$ = response as Observable<Message>;
        // subscribe to stream
        const subscription = response$.subscribe({
          next: (value) => {
            const responseMessage: ServerMessage = {
              id: message.id,
              payload: protoBase64.enc(value.toBinary()),
              completed: isUnary || (!serverStream && method!.clientStream),
            };
            send(responseMessage);
          },
          error: (error) => {
            // TODO: error handling (send error to client?)
          },
          complete: () => {
            unsub();
            if (!method!.serverStream) return; // if not server stream, don't send completed message
            const responseMessage: ServerMessage = {
              id: message.id,
              payload: "",
              completed: true,
            };
            send(responseMessage);
          },
        });
        serviceResponseSubscription.push(subscription);
        const unsub = () => {
          const index = serviceResponseSubscription.indexOf(subscription);
          if (index !== -1) {
            serviceResponseSubscription.splice(index, 1);
          }
        };
      } else {
        const responseMessage: ServerMessage = {
          id: message.id,
          payload: protoBase64.enc(response.toBinary()),
        };
        send(responseMessage);
      }
    };
    if (isNonFirstResponse) {
      const incomingClientStream = incomingClientStreams.get(message.id);
      assert(
        incomingClientStream != null,
        `incomingClientStream ${message.id} not found`
      );
      incomingClientStream!.subject.next(payload);
    } else if (method!.clientStream && !isNonFirstResponse) {
      const subject = new Subject<any>();
      incomingClientStreams.set(message.id, { method: method!, subject });
      processResponse(method!.handler(subject));
      subject.next(payload);
    } else if (!method!.clientStream) {
      const handler = method!.handler;
      // check if handler is async function
      let response: any;
      if (handler.constructor.name === "AsyncFunction") {
        response = await handler(payload);
      } else {
        response = handler(payload);
      }
      processResponse(response);
    }
  };

interface MethodRegistryItem {
  service: string;
  method: string;
  handler: (payload: any) => any;
  clientStream: boolean;
  serverStream: boolean;
  requestMessage: Message;
  responseMessage: Message;
}

// method registration
const methods = new Map<string, MethodRegistryItem>();

export function CrpcMethod(
  service: string,
  method: string,
  clientStream: boolean,
  serverStream: boolean,
  requestMessage: Message,
  responseMessage: Message
): MethodDecorator {
  return (
    target: object,
    key: string | symbol,
    descriptor: PropertyDescriptor
  ) => {
    if (typeof descriptor.value !== "function")
      throw new Error("CrpcMethod can only be used on methods");
    // register the method
    const item: MethodRegistryItem = {
      service,
      method,
      handler: descriptor.value,
      clientStream,
      serverStream,
      requestMessage,
      responseMessage,
    };
    methods.set(`${service}/${method}`, item);
  };
}
