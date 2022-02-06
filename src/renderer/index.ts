import './styles/reset.scss'
import Vue from 'vue'

var body = document.getElementsByTagName("body")[0]
var div = document.createElement("div")

div.id = "testDiv"
div.innerHTML = "{{test}}"

body.appendChild(div)


new Vue({
    el: "#testDiv",
    data() {
        return {
            test: "Hello world"
        }
    }

})
