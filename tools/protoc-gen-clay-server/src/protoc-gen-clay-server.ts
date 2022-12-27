import {createEcmaScriptPlugin, Schema} from "@bufbuild/protoplugin";
import {GeneratedFile, ImportSymbol, localName, makeJsDoc} from "@bufbuild/protoplugin/ecmascript";
import {DescMethod, DescService, MethodKind} from "@bufbuild/protobuf";

const generateTs = (schema: Schema) => {
    for (const file of schema.files) {
        const f = schema.generateFile(file.name + "_clay-server.ts");
        f.preamble(file);
        for (const service of file.services) {
            const localServiceName = localName(service);
            f.print(makeJsDoc(service));
            f.print`export interface ${localServiceName}Controller {`;
            service.methods.forEach((method, i) => {
                if (i !== 0) {
                    f.print();
                }
                printMethod(f, method);
            });
            f.print("}");

            const CrpcMethod = f.import("CrpcMethod", "clay-rpc-server");

            f.print();
            f.print`export function ${localServiceName}Methods() {`;
            f.print("  return function (constructor: Function) {");
            // please refactor this
            for(const method of service.methods.filter(method => method.methodKind === MethodKind.Unary)) {
                const input = f.import(method.input);
                const output = f.import(method.output);
                printCrpcMethodAnnotations(f, CrpcMethod, [method], service, false, false, input,output);
            }
            for(const method of service.methods.filter(method => method.methodKind === MethodKind.ClientStreaming)) {
                const input = f.import(method.input);
                const output = f.import(method.output);
                printCrpcMethodAnnotations(f, CrpcMethod, [method], service, true, false, input,output);
            }
            for(const method of service.methods.filter(method => method.methodKind === MethodKind.ServerStreaming)) {
                const input = f.import(method.input);
                const output = f.import(method.output);
                printCrpcMethodAnnotations(f, CrpcMethod, [method], service, false, true, input,output);
            }
            for(const method of service.methods.filter(method => method.methodKind === MethodKind.BiDiStreaming)) {
                const input = f.import(method.input);
                const output = f.import(method.output);
                printCrpcMethodAnnotations(f, CrpcMethod, [method], service, true, true, input,output);
            }
            f.print("  };");
            f.print("}");
        }
    }
}

function printMethod(f: GeneratedFile, method: DescMethod) {
    const Observable = f.import("Observable", "rxjs");
    const isStreamReq = [MethodKind.BiDiStreaming, MethodKind.ClientStreaming].includes(method.methodKind);
    const isStreamRes = method.methodKind !== MethodKind.Unary;

    const reqType = isStreamReq ? [Observable, "<", method.input, ">"] : [method.input];
    const resType = isStreamRes ? [Observable, "<", method.output, ">"] : ["Promise<", method.output, ">"];

    f.print(makeJsDoc(method, "  "));
    f.print`  ${localName(method)}(request: ${reqType}): ${resType};`;
}

function printCrpcMethodAnnotations(
    f: GeneratedFile,
    annotation: ImportSymbol,
    methods: DescMethod[],
    service: DescService,
    clientStream: boolean,
    serverStream: boolean,
    requestMessage: ImportSymbol,
    responseMessage: ImportSymbol
) {
    const methodNames = methods.map((method) => `"${localName(method)}"`).join(", ");
    const methodName = methods[0].name.charAt(0).toUpperCase() + methods[0].name.slice(1);


    f.print`    for (const method of [${methodNames}]) {`;
    f.print`      const descriptor: any = Reflect.getOwnPropertyDescriptor(constructor.prototype, method);`;
    f.print`      ${annotation}("${service.typeName}", "${methodName}", ${clientStream}, ${serverStream}, ${requestMessage}, ${responseMessage})(constructor.prototype[method], method, descriptor);`;
    f.print`    }`;
}

export const protocGenClayServer = createEcmaScriptPlugin({
    name: "protoc-gen-clay-server",
    version: "v0.1.0",
    generateTs,
});

