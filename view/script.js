/*jshint esversion: 6 */

const CODEC_CONST = "dbID_";

const MEAT = '<span class="title">{{title}}</span>' + 
			'<div class="details">{{details}}</div>';

const todo =
'<div id="{{db_id}}" class="task todo">' +
	'{{the_meat}}' +
	'<button type="button" class="task__button todo__edit">Edit</button>' +
	'<button type="button" class="task__button todo__delete">Delete</button>' +
	'<button type="button" class="task__button todo__work">Start Working</button>' +
'</div>';

const doing = 
'<div id="{{db_id}}" class="task doing">' +
	'<div class="pomodoro"></div>' +
		'{{the_meat}}' +
	'<button type="button" class="task__button doing__markDone">Mark Done</button>' +
	'<button type="button" class="task__button doing__hibernate">Hibernate</button>' +
	'<button type="button" class="task__button doing__cannotDo">Move back to ToDo\'s</button>' +
'</div>';

const hibernating =
'<div id="{{db_id}}" class="task hibernating">' +
	'{{the_meat}}' +
	'<button type="button" class="task__button hibernating__work">Start working</button>' +
	'<button type="button" class="task__button hibernating__giveup">Give up and delete!</button>' +
	'<button type="button" class="task__button hibernating__cannotDo">Move back to ToDo\'s</button>' +
'</div>';

const done =
'<div id="{{db_id}}" class="task done">' +
	'{{the_meat}}' +
	'<button type="button" class="task__button done__delete">Delete</button>' +
	'<button type="button" class="task__button done__archive">Archive this task</button>' +
	'<button type="button" class="task__button done__undo">Undone, move back to ToDo\'s</button>' +
'</div>';

/* ---------------------- user specific configuration ---------------------- */

let WIP_LIMIT = 2;

/* ------------------------- TAKEN FROM OUTER WORLD ------------------------ */

/**
 * "insert arbitary html", 2smNH7B, goog("create element without jquery") 
 * following snippet has been taken from 2rlilJ1
 * @param  {validHTMLstr: str}
 * @return {frag: dom object}
 */
var str2htm = function (validHTMLstr) {
	var frag = document.createDocumentFragment();
	var temp = document.createElement("div");
	temp.innerHTML = validHTMLstr;
	while (temp.firstChild) {
		frag.appendChild(temp.firstChild);
	}
	return frag;
};

/**
 * SO's formatUnicorn which works with {{x}} not the typical {x}
 * USAGE:
 * 	x = "a {{}} c"
 * 	x.kv_fmt('b')	// now x === "a b c"
 * 	x = "a {{mid_term}} c"
 * 	x.kv_fmt({mid_term: 'b'})	// now x === "a b c"
 * 	
 * @return {str: str}
 */
String.prototype.kv_fmt = String.prototype.kv_fmt || function () {
	"use strict";
	var str = this.toString();
	if (arguments.length) {
		var t = typeof arguments[0];
		var args = ("string" === t || "number" === t) ?
				Array.prototype.slice.call(arguments)
				: arguments[0];
		var key;
		for(key in args){
			str = str.replace(new RegExp(  "\\{{" + key + "\\}}", "gi"  ), args[key]);
		}
	}
	return str;
};

/* ---------------------------- helper functions --------------------------- */

/**
 * return template string based on nature_of_task
 * @param  {nature_of_task: enum(todo, done, doing, archived, hibernating)}
 * @return {template: str}
 */
function _getTemplateFor(nature_of_task) {
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
		default: throw "unknown nature of task found-- " + nature_of_task;
	}
	return template;
}

/**
 * get inner text content of elements like p, div, dt, etc. given that
 * css_query is valid.
 * @param  {css_query: str}
 * @return {content: str}
 */
function _getTextFrom(css_query) {
	let target = document.querySelector(css_query);
	try {
		let content = target.textContent.trim();
	} catch (err) {
		throw `Could not find "${css_query}", so can't return text content`;
	}
	return content;
}

/**
 * creates a clone of task based on task's id and stores it in memory
 * mainly used for taking backup of a task before deleting or updating it
 * @param  {task_id: str, valid iff starting with CODEC_CONST}
 * @return {currState: aTask}
 */
function _makeObj(task_id) {
	// "use strict"; as recommeneded by jsLint
	let currState = {
		id: task_id,
		nature: document.querySelector("#" + task_id).classList[0],
		title: _getTextFrom(`#${task_id}.title`),
		details: _getTextFrom(`#${task_id}.details`)
	};
	return currState;
}

/**
 * NOTE that this function takes a complete object
 * 	the first thing it does is send update request to the server, wait till
 * 	an answer arrives, if success, then redraw the page otherwise just show
 * 	an alert message/notification and leave the page as is
 * designed to be used by button functions, nw_populate doesn't need this
 * @param  {updateObj: aTask}
 * @return {_: boolean}
 */
function updateUIonAPIsuccess(updateObj) {
	let ans = nw_updateTask(updateObj);
	if (ans === "updated successfully") {
		close_the_todo_edit_pop_up();// !! TODO: special case for save_edited_todo, how do I make sure that the pop up gets closed before drawing
		draw_task(updateObj);// it will take care of deleting old entry
		return true;
	} else {
		// do nothing, the editing pop up us closed so let user know about the problem that occoured
		alert(ans);
	}
	return false;
}

/**
 * first of all, it checks if nature change requested for given task
 * if logical or not (e.g. enforcing WIP_LIMIT). Then it creates a backup
 * copy of task in consideration modifies the in-memoery backup and triggers
 * change
 * @param  {task_id: str, valid iff starting with CODEC_CONST}
 * @param  {newNature: enum(todo, done, doing, archived, hibernating)}
 * @return {null}
 */
function triggerNatureChange(task_id, newNature) {
	if (newNature === "doing") {
		// TODO: logic check here, only one task can be assigned "doing" at any time
	} else if (newNature === "hibernating") {
		// TODO: logic check here, number of hibernating tasks is limited
	} else if (newNature === "delete") {
		// TODO: nature: "deleted", (not done because db.* has not implemented & tested it yet)
		newNature = "archived";
	}
	let updatedTask = _makeObj(task_id);
	updatedTask.nature = newNature;
	updateUIonAPIsuccess(updatedTask);
}

/* -------------------------------- network -------------------------------- */

/**
 * non blockingly downloads initial data from server while page renders, this
 * should be the first function that runs, as soo as possible
 * @param  {todo: int}
 * @param  {done: int}
 * @param  {doing: int}
 * @param  {hibernating: int}
 * @return {dataFromServer: Array(aTask)}
 */
function nw_populate(todo, done, doing, hibernating) {
	// defaults + based on user prefs
	let dataFromServer = [{"id": "dbID_1", "title": "Praesent lectus. Vestibulum quam sapien, varius ut, blandit non, interdum in, ante. Vestibulum ante ipsum primis in faucibus orci luctus et ", "details": "Nullam molestie nibh in lectus. Pellentesque at nulla.", "nature": "done"}, {"id": "dbID_2", "title": "Phasellus in felis. Donec semper sapien a libero. Nam dui. Proin leo odio, porttitor id, consequat in, consequat ut, nulla. Sed accumsan fel", "details": "Donec vitae nisi. Nam ultrices, libero non mattis pulvinar, nulla pede ullamcorper augue, a suscipit nulla elit ac nulla. Sed vel enim sit amet nunc viverra dapibus. Nulla suscipit ligula in lacus. Curabitur at ipsum ac tellus semper interdum. Mauris ullamcorper purus sit amet nulla. Quisque arcu libero, rutrum ac, lobortis vel, dapibus at, diam.", "nature": "todo"}, {"id": "dbID_3", "title": "Praesent lectus. Vestibulum quam sapien, varius ut, blandit non, interdum in, ante. Vestibulum ante ipsum primis in faucibus orci luctus et ", "details": "Curabitur gravida nisi at nibh. In hac habitasse platea dictumst. Aliquam augue quam, sollicitudin vitae, consectetuer eget, rutrum at, lorem. Integer tincidunt ante vel ipsum. Praesent blandit lacinia erat. Vestibulum sed magna at nunc commodo placerat. Praesent blandit. Nam nulla.", "nature": "doing"}, {"id": "dbID_4", "title": "Duis bibendum, felis sed interdum venenatis, turpis enim blandit mi, in porttitor pede justo eu massa. Donec dapibus. Duis at velit eu est c", "details": "Pellentesque at nulla.", "nature": "hibernating"}, {"id": "dbID_5", "title": "Nulla ut erat id mauris vulputate elementum. Nullam varius. Nulla facilisi.", "details": "Proin interdum mauris non ligula pellentesque ultrices. Phasellus id sapien in sapien iaculis congue. Vivamus metus arcu, adipiscing molestie, hendrerit at, vulputate vitae, nisl.", "nature": "done"}, {"id": "dbID_6", "title": "Maecenas tristique, est et tempus semper, est quam pharetra magna, ac consequat metus sapien ut nunc. Vestibulum ante ipsum primis in faucib", "details": "Nulla justo. Aliquam quis turpis eget elit sodales scelerisque. Mauris sit amet eros. Suspendisse accumsan tortor quis turpis. Sed ante. Vivamus tortor. Duis mattis egestas metus. Aenean fermentum. Donec ut mauris eget massa tempor convallis. Nulla neque libero, convallis eget, eleifend luctus, ultricies eu, nibh.", "nature": "archived"}, {"id": "dbID_7", "title": "Duis bibendum, felis sed interdum venenatis, turpis enim blandit mi, in porttitor pede justo eu massa. Donec dapibus. Duis at velit eu est c", "details": "Proin interdum mauris non ligula pellentesque ultrices. Phasellus id sapien in sapien iaculis congue. Vivamus metus arcu, adipiscing molestie, hendrerit at, vulputate vitae, nisl. Aenean lectus. Pellentesque eget nunc. Donec quis orci eget orci vehicula condimentum. Curabitur in libero ut massa volutpat convallis.", "nature": "todo"}, {"id": "dbID_8", "title": "In hac habitasse platea dictumst. Aliquam augue quam, sollicitudin vitae, consectetuer eget, rutrum at, lorem. Integer tincidunt ante vel ip", "details": "Praesent id massa id nisl venenatis lacinia. Aenean sit amet justo.", "nature": "todo"}, {"id": "dbID_9", "title": "Nullam orci pede, venenatis non, sodales sed, tincidunt eu, felis. Fusce posuere felis sed lacus. Morbi sem mauris, laoreet ut, rhoncus aliq", "details": "Aenean auctor gravida sem. Praesent id massa id nisl venenatis lacinia. Aenean sit amet justo. Morbi ut odio. Cras mi pede, malesuada in, imperdiet et, commodo vulputate, justo. In blandit ultrices enim. Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Proin interdum mauris non ligula pellentesque ultrices.", "nature": "hibernating"}];
	return dataFromServer;
}

/**
 * creates a new task in database and return the created task
 * executes in a blocking fashion?
 * @param  {title: str}
 * @return {srvrAns: json}
 */
function nw_createTask(title) {}

/**
 * updates task and returns "update successful" if db update was successful
 * @param  {update: aTask}
 * @return {srvrAns: str}
 */
function nw_updateTask(update) {}

/* ---------------------------------- draw --------------------------------- */

/**
 * draw the task while making sure a duplicate id doesn't exist elsewhere
 * @param  {theTask: aTask}
 * @return {_: boolean}
 */
function draw_task(theTask) {
	if (theTask.id === undefined) {
		throw "given argument is not a valid task";
	}
	let already_exists = document.getElementById(theTask.id);
	if (already_exists) {
		// i.e. ONLY nature has changed
		// remember that app's ReST API will only say "updated successfully" on successful DB update so it is important to extract theTask's title
		let newNature = theTask.nature;	// backup new nature
		let oldTask = _makeObj(theTask.id);	// backup the already existing task and its details, ?just for safety
		erase_task(theTask.id);
		delete theTask;
		let theTask = oldTask;
		theTask.nature = newNature;
	}
	let base = _getTemplateFor(theTask.nature);
	let meat = MEAT.kv_fmt({
		title: theTask.title,
		details: theTask.details
	})
	let final = base.kv_fmt({
		db_id: theTask.id,
		the_meat: meat
	});
	let frag = str2htm(`<li>${final}</li>`);
	let target = document.querySelector(".todos")//??? dynamic, what about doings
	// TODO: u('ul li:nth-child(2)').after('<li>This is what I want to add</li>')
}

function erase_task(task_id) {
	let domRef = document.getElementById(task_id);
	domRef.parentNode.removeChild(domRef);
}

/* ---------------------------- button functions --------------------------- */

function create_todo(title) {
	/* from index.html of the app */
	try {
		draw_task(nw_createTask(title));
	} catch (err) {
		;
	}
}

function save_edited_todo(task_id) {
	/* editTodo__save, for btn_edit_todo */
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
	/* todo__edit */
	/* NOTE: the only function which doesn't make an API request */
	const TEMPLATE =
		'<div id="{{db_id}}" class="editTodo">' +
			'<input class="editTodo__title" value="{{oldTitle}}">' +
			'<ul class="editTodo__insertables">' +
				'<li>audio</li>	<li>video</li>	<li>image</li>	<li>link</li>' +
			'</ul>' +
			'<textarea class="editTodo__details">{{oldDetails}}</textarea>' +
			'<button type="button" class="editTodo__save">Save Changes</button>' +
		'</div>';
	let old = _makeObj(task_id);
	let editHTML = TEMPLATE.kv_fmt({
		db_id: task_id, /*is it needed, only one thing can be edited at once*/
		oldTitle: old.title,
		oldDetails: old.details
	});
	str2htm(editHTML);
	/* at this point a new pop up should appear which lets user edit and that popup makes a call to server when exiting if user clicks on "Save Changes" */
}

/* todo__delete */
function btn_delete_todo(task_id) {triggerNatureChange(task_id, "delete");}

/* todo__work */
function btn_workOn_todo(task_id) {triggerNatureChange(task_id, "doing");}

/* doing__markDone */
function btn_checkoff_doing(task_id) {triggerNatureChange(task_id, "done");}

/* doing__hibernate */
function btn_hibernate_doing(task_id) {triggerNatureChange(task_id, "hibernating");}

/*doing__cannotDo*/
function btn_cannotDo_doing(task_id) {triggerNatureChange(task_id, "todo");}

/* hibernating__work */
function btn_workOn_hibernated(task_id) {triggerNatureChange(task_id, "doing");}

/* hibernating__giveup */
function btn_delete_hibernated(task_id) {triggerNatureChange(task_id, "delete");}

/* hibernating__cannotDo */
function btn_cannotDo_hibernated(task_id) {triggerNatureChange(task_id, "todo");}

/* done__delete */
function btn_delete_done(task_id) {triggerNatureChange(task_id, "delete");}

/* done__archive */	
function btn_archive_done(task_id) {triggerNatureChange(task_id, "archived");}

/* done__undo */
function btn_undo_done(task_id) {triggerNatureChange(task_id, "todo");}

/* --------------------------- interaction logic --------------------------- */
