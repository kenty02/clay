import {
    Focus,
    FocusUpdate,
    GetFocusRequest,
    GetFocusResponse,
    HelloReply,
    HelloRequest,
    NodeUpdate,
    SelectFocusRequest
} from "./generated/clay_pb";
import {Observable, Subject} from "rxjs";
import {ClayMethods, GreeterMethods} from "./generated/clay_clay-server";
import {Empty} from "@bufbuild/protobuf";
import {db} from "../db";
import browser from "webextension-polyfill";

@GreeterMethods()
export class GreeterController {
    sayHello(request: HelloRequest): HelloReply {
        return new HelloReply({
            message: `Hello ${request.name}`,
        });
    }
}

@ClayMethods()
export class ClayController {
    static nodeUpdateSubject = new Subject<NodeUpdate>();
    static focusUpdateSubject = new Subject<FocusUpdate>();

    subscribeNodeUpdates(): Observable<NodeUpdate> {
        return ClayController.nodeUpdateSubject.asObservable();
    }

    subscribeFocusUpdates(): Observable<FocusUpdate> {
        return ClayController.focusUpdateSubject.asObservable();
    }

    async getFocus(request: GetFocusRequest): Promise<GetFocusResponse> {

        const {nodeId} = request;
        const collection = db.focus.filter(focus => focus.nodeId === nodeId)
        if (!collection) {
            throw new Error("focus not found");
        }
        return new GetFocusResponse({
            focusList: (await collection.toArray()).map(focus => new Focus({
                id: focus.id,
                nodeId: focus.nodeId,
                tabId: focus.tabId,
                active: focus.active
            }))
        })
    }

    async selectFocus(selectFocusRequest: SelectFocusRequest): Promise<Empty> {
        const {id: focusId} = selectFocusRequest;

        const focus = await db.focus.get(focusId);
        if (!focus) {
            throw new Error("focus not found");
        }

        // activate browser tab
        await browser.tabs.update(focus.tabId, {active: true});
        return new Empty()
    }
}
