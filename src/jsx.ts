export function customElement(tag: unknown, props: unknown, ...children: unknown[]) {
    console.log(tag);
    console.log(new tag());
}
