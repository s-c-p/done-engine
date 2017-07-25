const CODEC_CONST = "dbID_";

const todo = '\
<div id="{{db_id}}" class="todo">\
	<span class="title">{{title}}</span>\
	<div class="details">{{details}}</div>\
	<!-- hide test, show logo for buttons -->\
	<button type="button" class="todo__edit_btn">Edit</button>\
	<button type="button" class="todo__delete_btn">Delete</button>\
	<button type="button" class="todo__work_btn">Start Working</button>\
</div>'

const doing = '\
<div id="{{db_id}}" class="doing">\
	<div class="pomodoro"></div>\
	<span class="title">{{title}}</span>\
	<div class="details">{{details}}</div>\
	<!-- hide test, show logo for buttons -->\
	<button type="button" class="doing__markDone_btn">Mark Done</button>\
	<button type="button" class="doing__hibernate_btn">Hibernate</button>\
	<button type="button" class="doing__cannotDo_btn">Move back to ToDo\'s</button>\
</div>'

const hibernating = '\
<div id="{{db_id}}" class="hibernating">\
	<span class="title">{{title}}</span>\
	<div class="details">{{details}}</div>\
	<!-- hide test, show logo for buttons -->\
	<button type="button" class="hibernating__work_btn">Start working</button>\
	<button type="button" class="hibernating__giveup_btn">Give up and delete!</button>\
	<button type="button" class="hibernating__cannotDo_btn">Move back to ToDo\'s</button>\
</div>'

const done = '\
<div id="{{db_id}}" class="done">\
	<span class="title">{{title}}</span>\
	<div class="details">{{details}}</div>\
	<!-- hide test, show logo for buttons -->\
	<button type="button" class="done__delete_btn">Delete</button>\
	<button type="button" class="done__archive_btn">Archive this task</button>\
	<button type="button" class="done__undo_btn">Undone, move back to ToDo\'s</button>\
</div>'

/* ---------------------- user specific configuration ---------------------- */

let WIP_LIMIT = 2

/* ------------------------- TAKEN FROM OUTER WORLD ------------------------ */

var str2htm = function (validHTMLstr) {
	/* "insert arbitary html", 2smNH7B, goog("create element without jquery")
	 * following snippet has been taken from 2rlilJ1
	 */
	var frag = document.createDocumentFragment();
	var temp = document.createElement("div");
	temp.innerHTML = validHTMLstr;
	while (temp.firstChild) {
		frag.appendChild(temp.firstChild);
	}
	return frag;
}

String.prototype.kv_fmt = String.prototype.kv_fmt || function () {
	/* SO's formatUnicorn which works with {{x}} not the typical {x} */
	"use strict";
	var str = this.toString();
	if (arguments.length) {
		var t = typeof arguments[0];
		var args = ("string" === t || "number" === t)
				? Array.prototype.slice.call(arguments)
				: arguments[0];
		var key;
		for(key in args){
			str = str.replace(new RegExp(  "\\{{" + key + "\\}}", "gi"  ), args[key]);
		}
	}
	return str;
};

/* ---------------------------- helper functions --------------------------- */

function _getTemplateFor(nature_of_task) {
	/* return template string based on nature_of_task */
	let template = null;
	switch (nature_of_task) {
		case "todo": template = todo;
				break;
		case "done": template = done;
				break;
		case "doing": template = doing;
				break;
		case "archived": template = "<!--{{db_id}} {{title}} {{details}}-->";
				break;
		case "hibernating": template = hibernating;
				break;
		default: throw "unknown nature of task found-- " + nature_of_task
	}
	return template;
}

function _getTextFrom(css_query) {
	/* get inner text content of elements like p, div, dt, etc. given that
	 * css_query is valid.
	 */
	target = document.querySelector(css_query);
	try {
		content = target.textContent.trim();
	} catch {
		throw `Could not find "${css_query}", so can't return text content`;
	}
	return content;
}

function _makeObj(task_id) {
	/* creates a clone of task based on task's id and stores it in memory
	 * mainly used for taking backup of a task before deleting or updating it
	 */
	let currState = {
		id: task_id,
		nature: document.querySelector("#" + task_id).classList[0],
		title: _getTextFrom(`#${task_id}.title`),
		details: _getTextFrom(`#${task_id}.details`)
	}
	return currState;
}

function updateUIonAPIsuccess(updateObj) {
	/* NOTE that this function takes a complete object
	 * the first thing it does is send update request to the server,wait till
	 * an answer arrives, if success, then redraw the page otherwise just show
	 * an alert message/notification and leave the page as is
	 * designed to be used by button functions, nw_populate doesn't need this
	 */
	ans = nw_updateTask(updateObj)
	if (ans === "updated successfully") {
		close_the_todo_edit_pop_up()// !! TODO: special case for save_edited_todo, how do I make sure that the pop up gets closed before drawing
		draw_task(updateObj);// it will take care of deleting old entry
		return true;
	} else {
		// do nothing, the editing pop up us closed so let user know about the problem that occoured
		alert(ans);
	}
	return false;
}

function triggerNatureChange(task_id, newNature) {
	if (newNature === "doing") {
		// TODO: logic check here, only one task can be assigned "doing" at any time
	} else if (newNature === "hibernating") {
		// TODO: logic check here, number of hibernating tasks is limited
	} else if (newNature === "delete") {
		// TODO: nature: "deleted", (not done because db.* has not implemented & tested it yet)
		newNature = "archived"
	}
	let updatedTask = _makeObj(task_id);
	updatedTask.nature = newNature;
	updateUIonAPIsuccess(updatedTask);
}

/* -------------------------------- network -------------------------------- */

function nw_populate() {
	/*defaults + based on user prefs*/
	let dataFromServer = [{"id": "dbID_1", "title": "Praesent lectus. Vestibulum quam sapien, varius ut, blandit non, interdum in, ante. Vestibulum ante ipsum primis in faucibus orci luctus et ", "details": "Nullam molestie nibh in lectus. Pellentesque at nulla.", "nature": "done"}, {"id": "dbID_2", "title": "Phasellus in felis. Donec semper sapien a libero. Nam dui. Proin leo odio, porttitor id, consequat in, consequat ut, nulla. Sed accumsan fel", "details": "Donec vitae nisi. Nam ultrices, libero non mattis pulvinar, nulla pede ullamcorper augue, a suscipit nulla elit ac nulla. Sed vel enim sit amet nunc viverra dapibus. Nulla suscipit ligula in lacus. Curabitur at ipsum ac tellus semper interdum. Mauris ullamcorper purus sit amet nulla. Quisque arcu libero, rutrum ac, lobortis vel, dapibus at, diam.", "nature": "todo"}, {"id": "dbID_3", "title": "Praesent lectus. Vestibulum quam sapien, varius ut, blandit non, interdum in, ante. Vestibulum ante ipsum primis in faucibus orci luctus et ", "details": "Curabitur gravida nisi at nibh. In hac habitasse platea dictumst. Aliquam augue quam, sollicitudin vitae, consectetuer eget, rutrum at, lorem. Integer tincidunt ante vel ipsum. Praesent blandit lacinia erat. Vestibulum sed magna at nunc commodo placerat. Praesent blandit. Nam nulla.", "nature": "doing"}, {"id": "dbID_4", "title": "Duis bibendum, felis sed interdum venenatis, turpis enim blandit mi, in porttitor pede justo eu massa. Donec dapibus. Duis at velit eu est c", "details": "Pellentesque at nulla.", "nature": "hibernating"}, {"id": "dbID_5", "title": "Nulla ut erat id mauris vulputate elementum. Nullam varius. Nulla facilisi.", "details": "Proin interdum mauris non ligula pellentesque ultrices. Phasellus id sapien in sapien iaculis congue. Vivamus metus arcu, adipiscing molestie, hendrerit at, vulputate vitae, nisl.", "nature": "done"}, {"id": "dbID_6", "title": "Maecenas tristique, est et tempus semper, est quam pharetra magna, ac consequat metus sapien ut nunc. Vestibulum ante ipsum primis in faucib", "details": "Nulla justo. Aliquam quis turpis eget elit sodales scelerisque. Mauris sit amet eros. Suspendisse accumsan tortor quis turpis. Sed ante. Vivamus tortor. Duis mattis egestas metus. Aenean fermentum. Donec ut mauris eget massa tempor convallis. Nulla neque libero, convallis eget, eleifend luctus, ultricies eu, nibh.", "nature": "archived"}, {"id": "dbID_7", "title": "Duis bibendum, felis sed interdum venenatis, turpis enim blandit mi, in porttitor pede justo eu massa. Donec dapibus. Duis at velit eu est c", "details": "Proin interdum mauris non ligula pellentesque ultrices. Phasellus id sapien in sapien iaculis congue. Vivamus metus arcu, adipiscing molestie, hendrerit at, vulputate vitae, nisl. Aenean lectus. Pellentesque eget nunc. Donec quis orci eget orci vehicula condimentum. Curabitur in libero ut massa volutpat convallis.", "nature": "todo"}, {"id": "dbID_8", "title": "In hac habitasse platea dictumst. Aliquam augue quam, sollicitudin vitae, consectetuer eget, rutrum at, lorem. Integer tincidunt ante vel ip", "details": "Praesent id massa id nisl venenatis lacinia. Aenean sit amet justo.", "nature": "todo"}, {"id": "dbID_9", "title": "Nullam orci pede, venenatis non, sodales sed, tincidunt eu, felis. Fusce posuere felis sed lacus. Morbi sem mauris, laoreet ut, rhoncus aliq", "details": "Aenean auctor gravida sem. Praesent id massa id nisl venenatis lacinia. Aenean sit amet justo. Morbi ut odio. Cras mi pede, malesuada in, imperdiet et, commodo vulputate, justo. In blandit ultrices enim. Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Proin interdum mauris non ligula pellentesque ultrices.", "nature": "hibernating"}]
	return dataFromServer;
}

function nw_createTask(title) {}

function nw_updateTask(update) {}

/* ---------------------------------- draw --------------------------------- */

function draw_task(theTask) {
	if (theTask.id === undefined) {
		throw "given argument is not a valid task"
	}
	already_exists = document.getElementById(theTask.id);
	if (already_exists) {
		// i.e. ONLY nature has changed
		// remember that app's ReST API will only say "updated successfully" on successful DB update so it is important to extract theTask's title
		theTask = _makeObj(task_id);	// for safety
		erase_task(theTask.id);
	}
	let base = _getTemplateFor(theTask.nature);
	let final = base.kv_fmt({
		db_id: theTask.id,
		title: theTask.title,
		details: theTask.details
	});
	str2htm(final);
}

function erase_task(task_id) {
	domRef = document.getElementById(task_id);
	domRef.parentNode.removeChild(domRef);
}

/* ---------------------------- button functions --------------------------- */

function create_todo(title) {
	/* from index.html of the app */
	try {
		draw_task(nw_createTask(title));
	} catch {
		;
	}
}

function save_edited_todo(task_id) {
	/* editTodo__save_btn, for btn_edit_todo */
	let baseQuery = "#" + task_id + ".editTodo";
	// can't use _getTextFrom, 1st because baseQuery is different and 2nd because we need to use .value here
	let newTitle = document.querySelector(baseQuery + " input").value;
	let newDetails = document.querySelector(baseQuery + " textarea").value;
	let update = {
		id: task_id,
		nature: "todo",
		title: newTitle,
		details: newDetails
	};
	updateUIonAPIsuccess(update);
	return 0;
}

function btn_edit_todo(task_id) {
	/* todo__edit_btn */
	/* NOTE: the only function which doesn't make an API request */
	const TEMPLATE = '\
		<div id="..." class="editTodo">\
			<input class="editTodo__title" value="{{oldTitle}}">\
			<ul class="editTodo__insertables">\
				<li>audio</li>	<li>video</li>	<li>image</li>	<li>link</li>\
			</ul>\
			<textarea class="editTodo__details">{{oldDetails}}</textarea>\
			<button type="button" class="editTodo__save_btn">Save Changes</button>\
		</div>'
	let old = _makeObj(task_id);
	let editHTML = TEMPLATE.kv_fmt({
		oldTitle: old.title,
		oldDetails: old.details
	});
	str2htm(editHTML);
	/* at this point a new pop up should appear which lets user edit and that popup makes a call to server when exiting if user clicks on "Save Changes" */
}

/* todo__delete_btn */
function btn_delete_todo(task_id) {triggerNatureChange(task_id, "delete");}

/* todo__work_btn */
function btn_workOn_todo(task_id) {triggerNatureChange(task_id, "doing");}

/* doing__markDone_btn */
function btn_checkoff_doing(task_id) {triggerNatureChange(task_id, "done");}

/* doing__hibernate_btn */
function btn_hibernate_doing(task_id) {triggerNatureChange(task_id, "hibernating");}

/*doing__cannotDo_btn*/
function btn_cannotDo_doing(task_id) {triggerNatureChange(task_id, "todo");}

/* hibernating__work_btn */
function btn_workOn_hibernated(task_id) {triggerNatureChange(task_id, "doing");}

/* hibernating__giveup_btn */
function btn_delete_hibernated(task_id) {triggerNatureChange(task_id, "delete");}

/* hibernating__cannotDo_btn */
function btn_cannotDo_hibernated(task_id) {triggerNatureChange(task_id, "todo");}

/* done__delete_btn */
function btn_delete_done(task_id) {triggerNatureChange(task_id, "delete");}

/* done__archive_btn */	
function btn_archive_done(task_id) {triggerNatureChange(task_id, "archived");}

/* done__undo_btn */
function btn_undo_done(task_id) {triggerNatureChange(task_id, "todo");}

/* --------------------------- interaction logic --------------------------- */

