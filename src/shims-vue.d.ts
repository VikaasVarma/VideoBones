// declare module '*.vue' {
//     import { Component } from 'vue'
//     var component: Component
//     export default component
// }

/* eslint-disable */
declare module '*.vue' {
    import type  { DefineComponent } from 'vue'
    const component: DefineComponent<{}, {}, any>
    export default component
}