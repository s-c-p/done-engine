let todos = new Array();
let doings = new Array();
let dones = new Array();

let initData = nw.populate();

helper._sort(initData, todos, doings, dones);

map(draw_task, todos);
map(draw_task, doings);
map(draw_task, dones);
