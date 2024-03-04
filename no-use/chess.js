const padding = 50;
const r = 20;
const interval = 100;

function check_near_which_chess(x) {
    for (let n = 0; n < 4; n++) {
        if (x <= r + n * interval + padding && x >= n * interval + padding -r) return n;
    }
    return false;
}
let num = Math.random() * 400;
console.log(num, ":", check(num));