import './styles/reset.scss'
import { createApp } from 'vue'

import App from 'App.vue'



// createApp(App).mount('#app')

var body = document.getElementsByTagName("body")[0]
var div = document.createElement("div")

div.id = "testDiv"
div.innerHTML = "{{test}}"

body.appendChild(div)


// new Vue({
//     el: "#testDiv",
//     data() {
//         return {
//             test: "Hello world"
//         }
//     }

// })
