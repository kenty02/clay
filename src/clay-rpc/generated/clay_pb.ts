// @generated by protoc-gen-es v1.0.0 with parameter "target=ts"
// @generated from file clay.proto (package clay, syntax proto3)
/* eslint-disable */
// @ts-nocheck

import type { BinaryReadOptions, FieldList, JsonReadOptions, JsonValue, PartialMessage, PlainMessage } from "@bufbuild/protobuf";
import { Message, proto3 } from "@bufbuild/protobuf";

/**
 * @generated from message clay.HelloMessage
 */
export class HelloMessage extends Message<HelloMessage> {
  /**
   * @generated from field: string message = 1;
   */
  message = "";

  constructor(data?: PartialMessage<HelloMessage>) {
    super();
    proto3.util.initPartial(data, this);
  }

  static readonly runtime = proto3;
  static readonly typeName = "clay.HelloMessage";
  static readonly fields: FieldList = proto3.util.newFieldList(() => [
    { no: 1, name: "message", kind: "scalar", T: 9 /* ScalarType.STRING */ },
  ]);

  static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): HelloMessage {
    return new HelloMessage().fromBinary(bytes, options);
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): HelloMessage {
    return new HelloMessage().fromJson(jsonValue, options);
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): HelloMessage {
    return new HelloMessage().fromJsonString(jsonString, options);
  }

  static equals(a: HelloMessage | PlainMessage<HelloMessage> | undefined, b: HelloMessage | PlainMessage<HelloMessage> | undefined): boolean {
    return proto3.util.equals(HelloMessage, a, b);
  }
}

/**
 * @generated from message clay.NodeUpdate
 */
export class NodeUpdate extends Message<NodeUpdate> {
  /**
   * @generated from field: int32 id = 1;
   */
  id = 0;

  /**
   * @generated from field: string url = 2;
   */
  url = "";

  /**
   * @generated from field: int32 parentId = 3;
   */
  parentId = 0;

  /**
   * @generated from field: repeated int32 childrenIds = 4;
   */
  childrenIds: number[] = [];

  /**
   * @generated from field: string title = 5;
   */
  title = "";

  constructor(data?: PartialMessage<NodeUpdate>) {
    super();
    proto3.util.initPartial(data, this);
  }

  static readonly runtime = proto3;
  static readonly typeName = "clay.NodeUpdate";
  static readonly fields: FieldList = proto3.util.newFieldList(() => [
    { no: 1, name: "id", kind: "scalar", T: 5 /* ScalarType.INT32 */ },
    { no: 2, name: "url", kind: "scalar", T: 9 /* ScalarType.STRING */ },
    { no: 3, name: "parentId", kind: "scalar", T: 5 /* ScalarType.INT32 */ },
    { no: 4, name: "childrenIds", kind: "scalar", T: 5 /* ScalarType.INT32 */, repeated: true },
    { no: 5, name: "title", kind: "scalar", T: 9 /* ScalarType.STRING */ },
  ]);

  static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): NodeUpdate {
    return new NodeUpdate().fromBinary(bytes, options);
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): NodeUpdate {
    return new NodeUpdate().fromJson(jsonValue, options);
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): NodeUpdate {
    return new NodeUpdate().fromJsonString(jsonString, options);
  }

  static equals(a: NodeUpdate | PlainMessage<NodeUpdate> | undefined, b: NodeUpdate | PlainMessage<NodeUpdate> | undefined): boolean {
    return proto3.util.equals(NodeUpdate, a, b);
  }
}

/**
 * @generated from message clay.GetFocusResponse
 */
export class GetFocusResponse extends Message<GetFocusResponse> {
  /**
   * @generated from field: repeated clay.Focus focusList = 1;
   */
  focusList: Focus[] = [];

  constructor(data?: PartialMessage<GetFocusResponse>) {
    super();
    proto3.util.initPartial(data, this);
  }

  static readonly runtime = proto3;
  static readonly typeName = "clay.GetFocusResponse";
  static readonly fields: FieldList = proto3.util.newFieldList(() => [
    { no: 1, name: "focusList", kind: "message", T: Focus, repeated: true },
  ]);

  static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): GetFocusResponse {
    return new GetFocusResponse().fromBinary(bytes, options);
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): GetFocusResponse {
    return new GetFocusResponse().fromJson(jsonValue, options);
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): GetFocusResponse {
    return new GetFocusResponse().fromJsonString(jsonString, options);
  }

  static equals(a: GetFocusResponse | PlainMessage<GetFocusResponse> | undefined, b: GetFocusResponse | PlainMessage<GetFocusResponse> | undefined): boolean {
    return proto3.util.equals(GetFocusResponse, a, b);
  }
}

/**
 * @generated from message clay.Focus
 */
export class Focus extends Message<Focus> {
  /**
   * @generated from field: int32 id = 1;
   */
  id = 0;

  /**
   * @generated from field: int32 nodeId = 2;
   */
  nodeId = 0;

  /**
   * @generated from field: int32 tabId = 3;
   */
  tabId = 0;

  /**
   * @generated from field: bool active = 4;
   */
  active = false;

  constructor(data?: PartialMessage<Focus>) {
    super();
    proto3.util.initPartial(data, this);
  }

  static readonly runtime = proto3;
  static readonly typeName = "clay.Focus";
  static readonly fields: FieldList = proto3.util.newFieldList(() => [
    { no: 1, name: "id", kind: "scalar", T: 5 /* ScalarType.INT32 */ },
    { no: 2, name: "nodeId", kind: "scalar", T: 5 /* ScalarType.INT32 */ },
    { no: 3, name: "tabId", kind: "scalar", T: 5 /* ScalarType.INT32 */ },
    { no: 4, name: "active", kind: "scalar", T: 8 /* ScalarType.BOOL */ },
  ]);

  static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Focus {
    return new Focus().fromBinary(bytes, options);
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Focus {
    return new Focus().fromJson(jsonValue, options);
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Focus {
    return new Focus().fromJsonString(jsonString, options);
  }

  static equals(a: Focus | PlainMessage<Focus> | undefined, b: Focus | PlainMessage<Focus> | undefined): boolean {
    return proto3.util.equals(Focus, a, b);
  }
}

/**
 * @generated from message clay.GetFocusRequest
 */
export class GetFocusRequest extends Message<GetFocusRequest> {
  /**
   * @generated from field: int32 nodeId = 2;
   */
  nodeId = 0;

  constructor(data?: PartialMessage<GetFocusRequest>) {
    super();
    proto3.util.initPartial(data, this);
  }

  static readonly runtime = proto3;
  static readonly typeName = "clay.GetFocusRequest";
  static readonly fields: FieldList = proto3.util.newFieldList(() => [
    { no: 2, name: "nodeId", kind: "scalar", T: 5 /* ScalarType.INT32 */ },
  ]);

  static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): GetFocusRequest {
    return new GetFocusRequest().fromBinary(bytes, options);
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): GetFocusRequest {
    return new GetFocusRequest().fromJson(jsonValue, options);
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): GetFocusRequest {
    return new GetFocusRequest().fromJsonString(jsonString, options);
  }

  static equals(a: GetFocusRequest | PlainMessage<GetFocusRequest> | undefined, b: GetFocusRequest | PlainMessage<GetFocusRequest> | undefined): boolean {
    return proto3.util.equals(GetFocusRequest, a, b);
  }
}

/**
 * @generated from message clay.SelectFocusRequest
 */
export class SelectFocusRequest extends Message<SelectFocusRequest> {
  /**
   * @generated from field: int32 id = 1;
   */
  id = 0;

  constructor(data?: PartialMessage<SelectFocusRequest>) {
    super();
    proto3.util.initPartial(data, this);
  }

  static readonly runtime = proto3;
  static readonly typeName = "clay.SelectFocusRequest";
  static readonly fields: FieldList = proto3.util.newFieldList(() => [
    { no: 1, name: "id", kind: "scalar", T: 5 /* ScalarType.INT32 */ },
  ]);

  static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): SelectFocusRequest {
    return new SelectFocusRequest().fromBinary(bytes, options);
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): SelectFocusRequest {
    return new SelectFocusRequest().fromJson(jsonValue, options);
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): SelectFocusRequest {
    return new SelectFocusRequest().fromJsonString(jsonString, options);
  }

  static equals(a: SelectFocusRequest | PlainMessage<SelectFocusRequest> | undefined, b: SelectFocusRequest | PlainMessage<SelectFocusRequest> | undefined): boolean {
    return proto3.util.equals(SelectFocusRequest, a, b);
  }
}

