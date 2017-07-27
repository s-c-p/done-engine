import sys
import uuid
import json

import bottle
import pytest
import requests

from model import db

# ________________________ constants and data-structs ________________________

CODEC_PREFIX = "dbID_"

class TaskEncoder(json.JSONEncoder):
	""" take a aTask object and make it truly json """
	def default(self, theTask: db.aTask): # -> dict:
		if isinstance(theTask, db.aTask):
			# NOTE: following is the ONLY place where python specific
			# id gets converted to dom compatible id, any violations
			# are either not implementing this encoder or bad design
			return \
			{ "id": CODEC_PREFIX + str(theTask._id)
			, "title": theTask.title
			, "nature": theTask.nature
			, "details": theTask.details }
		# return json.JSONEncoder.default(self, obj)
		return super(TaskEncoder, self).default(theTask)


# ____________________________ session constants _____________________________

dbFile = str(uuid.uuid4()) + ".sqlite3"
if sys.argv[1]:
	dbFile = sys.argv[1]


# ________________________________ functions _________________________________

@bottle.route("/")
def index():
	# return bottle.template("app.htm", version_num="0.1")
	return "up and running"

@bottle.route("/populate")
def populate() -> str:
	# kv pairs not list, thanks to testing with postman
	# which revealed this kink,
	# also this is the place to ensure codec db_id <=> js_id
	reqstd = bottle.request.query
	todos = db.fetch_n(dbFile, "todo", reqstd.todos or "all")
	dones = db.fetch_n(dbFile, "done", reqstd.dones or "all")
	doings = db.fetch_n(dbFile, "doing", reqstd.doings or "all")
	ans = todos + dones + doings
	return json.dumps(ans, cls=TaskEncoder)

@bottle.route("/save_todo")
def save_todo() -> str:
	title = bottle.request.query.title
	try:
		_id = db.create_todo(dbFile, title)
	except ValueError:
		return "malformed request, title cannot be falsy"
	else:
		saved_todo = db.read_task(dbFile, _id)
		return json.dumps(saved_todo, cls=TaskEncoder)

@bottle.route("/update_task/<uid>/changes")
def update_task(uid: str) -> str:
	# First things first, the js is excepted & designed to send uid as int
	# the following is an edge case check
	try:
		# respecting seperation of concerns, and without getting too
		# pedantic, we make sure that db.update_task gets _id as an int
		_id = int(uid)
	except ValueError:
		if uid.startswith(CODEC_PREFIX):
			uid = uid.replace(CODEC_PREFIX, "")
			# NOTE: TODO: how do I get the current URL?? gotta move away from
			# bottle to a lib which provides an easy method of doing this,
			# what follows is a hack
			x = bottle.request.query
			redir = "/update_task/{}/changes?"
			params = dict(zip(x.keys(), x.values()))
			from urllib.parse import urlencode as enc
			bottle.redirect(redir.format(uid) + enc(params))
	else:
		# NOTE: @the time of this writing, following is the ONLY line where
		# json supplied by js(client) is being translated to py object, IF
		# however, in future there are more such places, then implement a correct
		# design pattern for the codec stuff
		chngd = bottle.request.query
		title = chngd.title
		nature = chngd.nature
		details = chngd.details
		success = db.update_task(dbFile, _id, nature, title, details)
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
	# TODO: don't setup if file exists and schema compilatnt
	try:
		db.setupDB(dbFile)
	except OSError:
		pass
	bottle.run(debug=True, reloader=True)
