declare global {
    namespace JSX {
        export type Element = any;

        interface ElementAttributeProperty {
            props: any;
        }

        interface ElementChildrenAttribute {
            children: any;
        }

        interface IntrinsicElements {
            "a": number;
            [elem: string]: any;
        }
    }
}

export const jsx = {
    element(
        tag: unknown,
        props: unknown,
        ...children: unknown[]
    ): unknown {
        tag;
        props;
        children;
        switch (typeof tag) {
            case "string":
            case "function":
            case "number":
            case "bigint":
            case "boolean":
            case "symbol":
            case "undefined":
            case "object":
            default:
                throw new Error(`Invalid tag? ${tag}`);
        }
    }
}
