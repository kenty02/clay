import { initTRPC } from "@trpc/server";
import { observable } from "@trpc/server/observable";
import { EventEmitter } from "events"; // todo npm remove events
import { z } from "zod";
import browser from "webextension-polyfill";

// create a global event emitter (could be replaced by redis, etc)
const ee = new EventEmitter();

const t = initTRPC.create({ isServer: true });

export const appRouter = t.router({
  onAdd: t.procedure.subscription(() => {
    // `resolve()` is triggered for each client when they start subscribing `onAdd`

    // return an `observable` with a callback which is triggered immediately

    return observable<string>((emit) => {
      const onAdd = (data: string) => {
        // emit data to client
        emit.next(data);
      };

      browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
        emit.next(changeInfo.url ?? "");
      });
      // trigger `onAdd()` when `add` is triggered in our event emitter
      ee.on("add", onAdd);

      // unsubscribe function when client disconnects or stops subscribing
      return () => {
        ee.off("add", onAdd);
      };
    });
  }),
  add: t.procedure
    .input(
      z.object({
        id: z.string().uuid().optional(),
        text: z.string().min(1),
      })
    )
    .mutation(async ({ input }) => {
      const post = { ...input }; /* [..] add to db */

      ee.emit("add", post);
      return post;
    }),
  hello: t.procedure.input(z.string()).query((req) => {
    return `hello ${req.input}`;
  }),
});
