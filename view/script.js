const CODEC_CONST = "dbID_";

const todo = '\
<div id="{{db_id}}" class="todo">\
	<span class="title">{{title}}</span>\
	<div class="details">{{details}}</div>\
	<!-- hide test, show logo for buttons -->\
	<button type="button" class="todo__edit">Edit</button>\
	<button type="button" class="todo__delete">Delete</button>\
	<button type="button" class="todo__work">Start Working</button>\
</div>'

const doing = '\
<div id="{{db_id}}" class="doing">\
	<div class="pomodoro"></div>\
	<span class="title">{{title}}</span>\
	<div class="details">{{details}}</div>\
	<!-- hide test, show logo for buttons -->\
	<button type="button" class="doing__markDone">Mark Done</button>\
	<button type="button" class="doing__hibernate">Hibernate</button>\
	<button type="button" class="doing__cannotDo">Move back to ToDo\'s</button>\
</div>'

const hibernating = '\
<div id="{{db_id}}" class="hibernating">\
	<span class="title">{{title}}</span>\
	<div class="details">{{details}}</div>\
	<!-- hide test, show logo for buttons -->\
	<button type="button" class="hibernating__work">Start working</button>\
	<button type="button" class="hibernating__giveup">Give up and delete!</button>\
	<button type="button" class="hibernating__cannotDo">Move back to ToDo\'s</button>\
</div>'

const done = '\
<div id="{{db_id}}" class="done">\
	<span class="title">{{title}}</span>\
	<div class="details">{{details}}</div>\
	<!-- hide test, show logo for buttons -->\
	<button type="button" class="done__delete">Delete</button>\
	<button type="button" class="done__archive">Archive this task</button>\
	<button type="button" class="done__undo">Undone, move back to ToDo\'s</button>\
</div>'

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


let WIP_LIMIT = 2	// user configurab;e

/* -------------------------------- network -------------------------------- */

let dataFromServer = [{"id": "dbID_1", "title": "Praesent lectus. Vestibulum quam sapien, varius ut, blandit non, interdum in, ante. Vestibulum ante ipsum primis in faucibus orci luctus et ", "details": "Nullam molestie nibh in lectus. Pellentesque at nulla.", "nature": "done"}, {"id": "dbID_2", "title": "Phasellus in felis. Donec semper sapien a libero. Nam dui. Proin leo odio, porttitor id, consequat in, consequat ut, nulla. Sed accumsan fel", "details": "Donec vitae nisi. Nam ultrices, libero non mattis pulvinar, nulla pede ullamcorper augue, a suscipit nulla elit ac nulla. Sed vel enim sit amet nunc viverra dapibus. Nulla suscipit ligula in lacus. Curabitur at ipsum ac tellus semper interdum. Mauris ullamcorper purus sit amet nulla. Quisque arcu libero, rutrum ac, lobortis vel, dapibus at, diam.", "nature": "todo"}, {"id": "dbID_3", "title": "Praesent lectus. Vestibulum quam sapien, varius ut, blandit non, interdum in, ante. Vestibulum ante ipsum primis in faucibus orci luctus et ", "details": "Curabitur gravida nisi at nibh. In hac habitasse platea dictumst. Aliquam augue quam, sollicitudin vitae, consectetuer eget, rutrum at, lorem. Integer tincidunt ante vel ipsum. Praesent blandit lacinia erat. Vestibulum sed magna at nunc commodo placerat. Praesent blandit. Nam nulla.", "nature": "doing"}, {"id": "dbID_4", "title": "Duis bibendum, felis sed interdum venenatis, turpis enim blandit mi, in porttitor pede justo eu massa. Donec dapibus. Duis at velit eu est c", "details": "Pellentesque at nulla.", "nature": "hibernating"}, {"id": "dbID_5", "title": "Nulla ut erat id mauris vulputate elementum. Nullam varius. Nulla facilisi.", "details": "Proin interdum mauris non ligula pellentesque ultrices. Phasellus id sapien in sapien iaculis congue. Vivamus metus arcu, adipiscing molestie, hendrerit at, vulputate vitae, nisl.", "nature": "done"}, {"id": "dbID_6", "title": "Maecenas tristique, est et tempus semper, est quam pharetra magna, ac consequat metus sapien ut nunc. Vestibulum ante ipsum primis in faucib", "details": "Nulla justo. Aliquam quis turpis eget elit sodales scelerisque. Mauris sit amet eros. Suspendisse accumsan tortor quis turpis. Sed ante. Vivamus tortor. Duis mattis egestas metus. Aenean fermentum. Donec ut mauris eget massa tempor convallis. Nulla neque libero, convallis eget, eleifend luctus, ultricies eu, nibh.", "nature": "archived"}, {"id": "dbID_7", "title": "Duis bibendum, felis sed interdum venenatis, turpis enim blandit mi, in porttitor pede justo eu massa. Donec dapibus. Duis at velit eu est c", "details": "Proin interdum mauris non ligula pellentesque ultrices. Phasellus id sapien in sapien iaculis congue. Vivamus metus arcu, adipiscing molestie, hendrerit at, vulputate vitae, nisl. Aenean lectus. Pellentesque eget nunc. Donec quis orci eget orci vehicula condimentum. Curabitur in libero ut massa volutpat convallis.", "nature": "todo"}, {"id": "dbID_8", "title": "In hac habitasse platea dictumst. Aliquam augue quam, sollicitudin vitae, consectetuer eget, rutrum at, lorem. Integer tincidunt ante vel ip", "details": "Praesent id massa id nisl venenatis lacinia. Aenean sit amet justo.", "nature": "todo"}, {"id": "dbID_9", "title": "Nullam orci pede, venenatis non, sodales sed, tincidunt eu, felis. Fusce posuere felis sed lacus. Morbi sem mauris, laoreet ut, rhoncus aliq", "details": "Aenean auctor gravida sem. Praesent id massa id nisl venenatis lacinia. Aenean sit amet justo. Morbi ut odio. Cras mi pede, malesuada in, imperdiet et, commodo vulputate, justo. In blandit ultrices enim. Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Proin interdum mauris non ligula pellentesque ultrices.", "nature": "hibernating"}]

/* ---------------------------------- draw --------------------------------- */

function draw(aTask) {
	if (aTask.id === undefined) {
		// definately not a task, raise/log an error and quit silently
	}
	let search = aTask.id;
	let result = document.getElementById(search);
	if (result) {
		if (aTask.nature === result.nature) {
		// either title or details have changed, so just update aTask
			if (aTask.nature !== "todo") {
			// this will only happen if nature == todo, cuz other things can't be edited, so
				throw `fucky: how did the user manage to edit a ${aTask.nature}, only todo(s) should be editable`;
			} else {
				edit_todo(aTask.id);
			}
		} else {
		// nature has changed but task already exists on page, so delete old one AND THEN crete new one
		// why delete, why not just reassign a class
			create_task(aTask, isUpdate=true);
		}
	} else {
	// i.e. no element with aTask.id was found so we simply need to create new one
		create_task(aTask);
	}
	return
}

function create_task(theTask, isUpdate=false) {
	if (isUpdate) {
		// i.e. ONLY nature has changed
		// remember that app's ReST API will only say "updated successfully" on successful DB update so it is important to extract theTask's title
		delete_task(theTask.id);
	}
	let base = _getTemplateFor(theTask.nature);
	let final = base.kv_fmt({
		db_id: theTask.id,
		title: theTask.title,
		details: theTask.details
	});
	str2htm(final);
}

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
		default: throw "unknown nature of task found-- " + nature_of_task
	}
	return template;
}

function delete_task(task_id) {
	domRef = document.getElementById(task_id);
	domRef.parentNode.removeChild(domRef);
}

function edit_todo(task_id) {
	const TEMPLATE = '\
		<div id="..." class="editTodo">\
			<input class="editTodo__title" value="{{oldTitle}}">\
			<ul class="editTodo__insertables">\
				<li>audio</li>	<li>video</li>	<li>image</li>	<li>link</li>\
			</ul>\
			<textarea class="editTodo__details">{{oldDetails}}</textarea>\
			<button type="button" class="editTodo__saveBtn">Save Changes</button>\
		</div>'
	domRef = document.getElementById(task_id);
	let x = document.querySelector("#" + task_id + ".title");
	let y = document.querySelector("#" + task_id + ".details");
	let oldTitle = x.textContent.trim();
	let oldDetails = y.textContent.trim();
	let editHTML = TEMPLATE.kv_fmt({
		oldTitle: oldTitle,
		oldDetails: oldDetails
	});
	str2htm(editHTML);
}

/* --------------------------- interaction logic --------------------------- */
