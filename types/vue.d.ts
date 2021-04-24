declare module  '@vue/runtime-core' {
    // @ts-ignore
    import {VNode} from "vue";

    export interface ComponentCustomProperties {
        render(): JSX.Element | VNode | void
    }
}
