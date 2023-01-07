declare module "trpc/types" {
    export interface NodeUpdate {
        id: number;
        url: string;
        parentId?: number;
        childrenIds: number[];
        title: string;
    }
    export interface FocusUpdate {
        id: number;
        nodeId: number;
        tabId: number;
        active: boolean;
    }
}
declare module "db" {
    import Dexie, { Table } from "dexie";
    export interface INodeWithoutPosition {
        id?: number;
        url: string;
        parentId?: number;
        childrenIds: number[];
    }
    export interface INodePosition {
        absolutePosition: {
            col: number;
            row: number;
        };
    }
    export type INode = INodeWithoutPosition & INodePosition;
    export interface IFocus {
        id?: number;
        nodeId: number;
        tabId: number;
        active: boolean;
    }
    export interface IComment {
        id?: number;
        nodeId: number;
        content: string;
        createdAt: Date;
    }
    export class SpileDatabase extends Dexie {
        node: Table<INode, number>;
        focus: Table<IFocus, number>;
        comment: Table<IComment, number>;
        constructor();
    }
    export const db: SpileDatabase;
}
declare module "trpc/router" {
    import { FocusUpdate, NodeUpdate } from "trpc/types";
    import { Subject } from 'rxjs';
    import superjson from 'superjson';
    export const appRouter: import("@trpc/server").CreateRouterInner<import("@trpc/server").RootConfig<{
        ctx: object;
        meta: object;
        errorShape: import("@trpc/server").DefaultErrorShape;
        transformer: typeof superjson;
    }>, {
        onAdd: import("@trpc/server").BuildProcedure<"subscription", {
            _config: import("@trpc/server").RootConfig<{
                ctx: object;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _ctx_out: object;
            _input_in: typeof import("@trpc/server").unsetMarker;
            _input_out: typeof import("@trpc/server").unsetMarker;
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
            _meta: object;
        }, import("@trpc/server/observable").Observable<string, unknown>>;
        add: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: object;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: object;
            _input_in: {
                id?: string | undefined;
                text: string;
            };
            _input_out: {
                id?: string | undefined;
                text: string;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            id?: string | undefined;
            text: string;
        }>;
        hello: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: object;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: object;
            _input_in: string;
            _input_out: string;
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, string>;
        node: import("@trpc/server").CreateRouterInner<import("@trpc/server").RootConfig<{
            ctx: object;
            meta: object;
            errorShape: import("@trpc/server").DefaultErrorShape;
            transformer: typeof superjson;
        }>, {
            onUpdate: import("@trpc/server").BuildProcedure<"subscription", {
                _config: import("@trpc/server").RootConfig<{
                    ctx: object;
                    meta: object;
                    errorShape: import("@trpc/server").DefaultErrorShape;
                    transformer: typeof superjson;
                }>;
                _ctx_out: object;
                _input_in: typeof import("@trpc/server").unsetMarker;
                _input_out: typeof import("@trpc/server").unsetMarker;
                _output_in: typeof import("@trpc/server").unsetMarker;
                _output_out: typeof import("@trpc/server").unsetMarker;
                _meta: object;
            }, import("@trpc/server/observable").Observable<NodeUpdate, unknown>>;
        }>;
        focus: import("@trpc/server").CreateRouterInner<import("@trpc/server").RootConfig<{
            ctx: object;
            meta: object;
            errorShape: import("@trpc/server").DefaultErrorShape;
            transformer: typeof superjson;
        }>, {
            onUpdate: import("@trpc/server").BuildProcedure<"subscription", {
                _config: import("@trpc/server").RootConfig<{
                    ctx: object;
                    meta: object;
                    errorShape: import("@trpc/server").DefaultErrorShape;
                    transformer: typeof superjson;
                }>;
                _ctx_out: object;
                _input_in: typeof import("@trpc/server").unsetMarker;
                _input_out: typeof import("@trpc/server").unsetMarker;
                _output_in: typeof import("@trpc/server").unsetMarker;
                _output_out: typeof import("@trpc/server").unsetMarker;
                _meta: object;
            }, import("@trpc/server/observable").Observable<FocusUpdate, unknown>>;
            get: import("@trpc/server").BuildProcedure<"query", {
                _config: import("@trpc/server").RootConfig<{
                    ctx: object;
                    meta: object;
                    errorShape: import("@trpc/server").DefaultErrorShape;
                    transformer: typeof superjson;
                }>;
                _meta: object;
                _ctx_out: object;
                _input_in: {
                    nodeId: number;
                };
                _input_out: {
                    nodeId: number;
                };
                _output_in: typeof import("@trpc/server").unsetMarker;
                _output_out: typeof import("@trpc/server").unsetMarker;
            }, FocusUpdate[]>;
            select: import("@trpc/server").BuildProcedure<"mutation", {
                _config: import("@trpc/server").RootConfig<{
                    ctx: object;
                    meta: object;
                    errorShape: import("@trpc/server").DefaultErrorShape;
                    transformer: typeof superjson;
                }>;
                _meta: object;
                _ctx_out: object;
                _input_in: number;
                _input_out: number;
                _output_in: typeof import("@trpc/server").unsetMarker;
                _output_out: typeof import("@trpc/server").unsetMarker;
            }, void>;
        }>;
    }>;
    export const nodeUpdateSubject: Subject<NodeUpdate>;
    export const focusUpdateSubject: Subject<FocusUpdate>;
}
