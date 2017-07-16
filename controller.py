import json

import bottle

from model import db

CODEC_CONST = "dbID_"

class TaskEncoder(json.JSONEncoder):
	""" take a aTask collections.namedtuple object and make it truly json """
	def default(self, theTask):
		if isinstance(theTask, db.aTask):
			# NOTE: following is the ONLY place where py id
			# gets converted to dom compatible id, any violations
			# are either not implementing this encoder or bad desin
			return \
			{ "id": CODEC_CONST + str(theTask._id)
			, "title": theTask.title
			, "nature": theTask.nature
			, "details": theTask.details }
		# return json.JSONEncoder.default(self, obj)
		return super(TaskEncoder, self).default(theTask)

@bottle.route("/")
def index():
	return bottle.template("app.htm", version_num="0.1")

@bottle.route("/populate")
def populate():
	# kv pairs not list, thanks to testing with postman
	# which revealed this kink,
	# also this is the place to ensure codec db_id <=> js_id
	reqstd = bottle.request.query
	todos = db.fetch_n("todo", reqstd.todos)
	dones = db.fetch_n("done", reqstd.dones)
	doings = db.fetch_n("doing", reqstd.doings)
	ans = todos + dones + doings
	return json.dumps(ans, cls=TaskEncoder)

@bottle.route("/save_todo")
def save_todo():
	title = bottle.request.query.title
	try:
		_id = db.create_todo(title)
	except ValueError:
		return "malformed request, title cannot be falsy"
	else:
		saved_todo = db.read_task(_id)
		return json.dumps(saved_todo, cls=TaskEncoder)

@bottle.route("/update_task")
def update_task():
	chngd_task = bottle.request.query
	# NOTE: @the time of this writing, following is the ONLY line where
	# json supplied by js(client) is being translated to py object, IF
	# however, in future there are more such places, then implement a correct
	# design pattern for the codec stuff
	_id = chngd_task._id	# take a look at notes of db.update_task
	# NOTE: respecting seperation of concerns, a js2py-like function is not
	# implement above in THIS file, but in model.db, which does all the 
	# validation and cleaning work and also touches the edge case that
	# _id wasn't stripped of the leadinf dbID_
	title = chngd_task.title
	nature = chngd_task.nature
	details = chngd_task.details
	success = db.update_task(_id, nature, title, details)
	if success:
		return "updated successfully"
	return "something went wrong, didn't commit changes to db"

# static files, which will eventually be handled by nginx
@bottle.route("/view/script.js")
def _nginx1():
	return bottle.static("/view/script.js", root=".")
@bottle.route("/view/dom_lib.js")
def _nginx2():
	return bottle.static("/view/dom_lib.js", root=".")
@bottle.route("/view/style.css")
def _nginx3():
	return bottle.static("/view/style.css", root=".")



if __name__ == '__main__':
	bottle.run(debug=True, reloader=True)
