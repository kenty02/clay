import { ProtocolWithReturn } from "webext-bridge";

declare module "webext-bridge" {
  export interface ProtocolMap {
    foo: { title: string };
    // to specify the return type of the message,
    // use the `ProtocolWithReturn` type wrapper
    bar: ProtocolWithReturn<CustomDataType, CustomReturnType>;
    ping: { pongMessage: string };
  }
}

// TODO: add more

// TODO: send PR to @types/webextension-polyfill
// lacked types
declare module "webextension-polyfill/namespaces/webNavigation" {
  namespace WebNavigation {
    interface OnCommittedDetailsType {
      transitionType: TransitionType;
      transitionQualifiers: TransitionQualifier[];
    }
    interface onReferenceFragmentUpdatedDetailsType {
      transitionType: TransitionType;
      transitionQualifiers: TransitionQualifier[];
    }
    interface OnHistoryStateUpdatedDetailsType {
      transitionType: TransitionType;
      transitionQualifiers: TransitionQualifier[];
    }
  }
}
