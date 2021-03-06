import os
import sqlite3
import functools
from contextlib import contextmanager
from typing import Tuple, Optional, List

import pytest

# ________________________ constants and data-structs ________________________

DB_FILE = "database.sqlite3"	# is it needed anymore

class aTask():
	""" struct for storing state of a task """
	def __init__(self, _id: int, nature: str, title: str, details: str) -> None:
		self._id = _id
		self.nature = nature
		self.title = title
		self.details = details

	@staticmethod
	def _make(argTuple: Tuple[int, str, str, str]) -> 'aTask':
		" only and ONLY for py-izing data read from database "
		# look ma, no error handling
		w, x, y, z = argTuple
		return aTask(w, x, y, z)

# ________________________________ functions _________________________________

@contextmanager
def sqliteDB(filename):
	# TODO: 484, filename: os.path
	""" provides with...as... kind of functionality by yielding a functional
	database cursor and commit-ing and close-ing the connection before return
	NOTE: this function has side-effects, but only desirable
	"""
	conn = sqlite3.connect(filename)
	# NOTE: sqlite specific, other DB engines might need a different approach
	conn.execute("PRAGMA foreign_keys=ON;")
	cur = conn.cursor()
	yield cur
	conn.commit()
	conn.close()
	return "commited and closed successfully"

def _getStageID(item: str, dbFile: str) -> int:
	""" returns the corresponding _id for item according to enum_stages """
	# NOTE: most database engines (i.e. ones where you can define fn in SQL
	# or where enum type is supported) can handle this part internally.
	# NOTE: above note makes it clear that this function is sqlite3 specific,
	# a speedbreaker and other db engines may not need it
	query = 'SELECT _id FROM enum_stages WHERE stage=?'
	with sqliteDB(dbFile) as cur:
		x = cur.execute(query, [item])
		y = x.fetchall()
	if len(y) < 1:
		raise ValueError('"{}" is not a valid / pre-defined stage'.format(item))
	elif len(y) > 1:
		raise RuntimeError("db programming error: 1+ instances found")
	else:
		ans = int(y[0][0])
	return ans

def create_todo(dbFile: str, title: str) -> int:
	""" creates a "todo" and returns the newly created task's _id, it is a
	delibarate design choice not to accept details and nature. Why?
	1. to make downloading the brain faster, you write titles of things to do
		now and can add details later on
	2. if you, for some convoluted reason, want to show a task in done
		category on the very day you signed up, then you make a todo, add
		details if you want and then mark it doing and then mark it done.
	Hence, the API
	"""
	query = 'INSERT INTO tasks (title, details, FK_nature) VALUES (?,NULL,?);'
	# following if is an edge case, cuz UI would(should) not activate the
	# make-todo button until something is typed in respective box
	if not title:
		raise ValueError("can't create empty todo")
	if len(title) > 140:
		title = title[:140]
	with sqliteDB(dbFile) as cur:
		cur.execute(  query, [title, _getStageID("todo", dbFile)]  )
		# hardcode the return value of _getStageID("todo") in production
		# setup, the only benefit of calling the function and then getting FK
		# is that during development phase position of stages may change
		# cur.execute(  query, [title, <<_getStageID("todo")>>]  )
		uid = cur.lastrowid
	return uid

def read_task(dbFile: str, uid: int) -> aTask:
	""" query database for tasks with _id == uid and hopefully get exactly one
	matching value which is parsed to python object before returning
	"""
	query = " \
	SELECT	 	tasks._id, enum_stages.stage, tasks.title, tasks.details \
	FROM 		tasks \
	INNER JOIN 	enum_stages \
	ON 		tasks.FK_nature=enum_stages._id \
	WHERE 		tasks._id=?"
	with sqliteDB(dbFile) as cur:
		x = cur.execute(query, [uid]).fetchall()
	# DONE: resolved FK_nature, thanks to static typing, just writing the code
	# helped me discover this issue without even running anything
	y = list(  map(aTask._make, x)  )
	if len(y) > 1:
		raise RuntimeError("fucked: the database's got 1+ instances of \
			uid {}".format(uid))
	elif len(y) < 1:
		raise ValueError("no task with _id {} found".format(uid))
	else:
		theTask = y[0]
	return theTask

def fetch_n(dbFile: str, stage: str, n: Optional[str] = "all") -> List[aTask]:
	""" fetches n records from tasks table of nature ~= stage """
	query = "SELECT	_id FROM tasks WHERE FK_nature=?"
	nature_id = _getStageID(stage, dbFile)
	with sqliteDB(dbFile) as cur:
		try:
			limit = int(n)
		except ValueError:
			if n == "all":
				dbAns = cur.execute(query, [nature_id])
			else:
				errMsg = 'did not understand meaning of "{0}", unable to fetch tasks'.format(n)
				raise ValueError(errMsg) from None
		else:
			query = query + " LIMIT ?"
			dbAns = cur.execute(query, [nature_id, limit])
		dbAns = [_[0] for _ in dbAns.fetchall()]
	pf = functools.partial(read_task, dbFile)
	ans = list(  map(pf, dbAns)  )
	return ans

def update_task(dbFile: str
		, uid: int
		, nature: str
		, title: Optional[str] = None
		, details: Optional[str] = None) -> str:
	query = 'UPDATE tasks SET title=?, details=?, FK_nature=? WHERE _id=?'
	# ensure that task exists, and if it does store it in a var
	try:
		task = read_task(dbFile, uid)
	except ValueError:
		raise RuntimeError("It looks like user forged update request, because \
			no task with _id {} was found".format(uid)) from None
	# remember that only uid and nature arguments are mandatory, so...
	title = title if title else task.title
	details = details if details else task.details
	# and now the actual update query
	with sqliteDB(dbFile) as cur:
		fk = _getStageID(nature, dbFile)
		cur.execute(query, [title, details, fk, uid])
		proof = cur.rowcount
	# return some proof of actions done
	if proof == 1:
		return "update successful"
	else:
		raise RuntimeError("single update query affected {0} rows, \
			maybe duplicate _id(s) found".format(proof))

def setupDB(dbFile: str):
	# TODO: return some verification
	query = [
		'CREATE TABLE enum_stages( _id INTEGER PRIMARY KEY AUTOINCREMENT, stage TEXT NOT NULL/*, CONSTRAINT unique_stage_names UNIQUE(stage)*/);',
		'INSERT INTO enum_stages (stage) VALUES("todo"), ("done"), ("doing"),("archived"), /*!!!only done things can be archived*/("hibernating"); /*!!!only doing things can be hibernated*/',
		'CREATE TABLE tasks( _id INTEGER PRIMARY KEY AUTOINCREMENT/*, tags array*/, title TEXT(140) NOT NULL, details TEXT, FK_nature INTEGER, FOREIGN KEY (FK_nature) REFERENCES enum_stages(_id));'
	]
	if os.path.isfile(dbFile):
		raise OSError("WARNING! database file already exists")
	with sqliteDB(dbFile) as cur:
		cur.execute(query[0])	# creates enum_stages table
		cur.execute(query[1])	# fills necessary values in enum_stages
		cur.execute(query[2])	# creates tasks table
	return


# __________________________________ tests ___________________________________

@pytest.fixture(scope="function")
def table_checks():
	dbFile = "test_db.sqlite3"
	setupDB(dbFile)
	yield locals()
	os.remove(dbFile)
	return

def test_setup_for_sql(table_checks):
	dbFile = table_checks["dbFile"]
	with sqliteDB(dbFile) as cur:
		# should raise no errors
		cur.execute('INSERT INTO tasks (title, details, FK_nature) VALUES \
			("a", "bcd", 1);')
		with pytest.raises(sqlite3.IntegrityError) as excinfo:
			# should raise error because foreign key is rubbish
			cur.execute('INSERT INTO tasks (title, details, FK_nature) \
				VALUES ("e", "fgi", 11);')
		assert "FOREIGN KEY" in str(excinfo.value)
		with pytest.raises(sqlite3.IntegrityError) as excinfo:
			# should raise error because title is null
			cur.execute('INSERT INTO tasks (title, details, FK_nature) \
				VALUES (NULL, "zxx", 2);')
		assert "NOT NULL" in str(excinfo.value)
	return

def test_setup_for_fileCheck(monkeypatch):
	def fake(p):
		return True
	monkeypatch.setattr(os.path, "isfile", fake)
	with pytest.raises(OSError):
		setupDB("db.py")
	return

@pytest.fixture(scope="module")
def cru_checks():
	dbFile = "test_db.sqlite3"
	setupDB(dbFile)
	yield locals()
	os.remove(dbFile)
	return

def test__getStageID(cru_checks):
	dbFile = cru_checks["dbFile"]
	TRUTH = ["todo", "done", "doing", "archived", "hibernating"]
	for i, aStage in enumerate(TRUTH):
		assert _getStageID(aStage, dbFile) == (i+1)
	with pytest.raises(ValueError) as excinfo:
		_getStageID("sleeping", dbFile)
	assert 'is not a valid / pre-defined stage' in str(excinfo.value)
	return

def test_create_todo(cru_checks):
	dbFile = cru_checks["dbFile"]
	x = create_todo(dbFile, "a new todo")
	assert read_task(dbFile, x).title == "a new todo"
	with pytest.raises(ValueError) as excinfo:
		create_todo(dbFile, "")
	assert "can't create empty todo" == str(excinfo.value)
	return

def test_read_task(cru_checks):
	dbFile = cru_checks["dbFile"]
	with pytest.raises(ValueError) as excinfo:
		read_task(dbFile, 0.5)
	assert "no task with _id " in str(excinfo.value)
	assert " found" in str(excinfo.value)
	return

def test_update_task(cru_checks):
	dbFile = cru_checks["dbFile"]
	uid = create_todo(dbFile, "some useless todo")
	x = update_task(dbFile, uid
		, "done"
		, "this todo is now done"
		, "details are not important")
	assert x == "update successful"
	y = update_task(dbFile, uid
		, "done"
		, "this todo is now done"
		, "details are not important")
	# event though nothing has changed value-wise, an update is still an update
	assert y == "update successful"
	z = update_task(dbFile, uid, "archived")
	assert z == "update successful"
	return

@pytest.fixture(scope="function")
def fake_data():
	# NOTE: because scope of cru_data fixture is session, therefore
	# even though I don't supply cru_data as argument to fake_data
	# the following functions continue to act on the database setup
	# by cru_data fixture. Its strange though, that if I do pass in
	# cru_data to fake_data so that fake_data builds upon it, I get
	# error at time of deletion because the file is still in use
	dbFile = "test_db2.sqlite3"
	setupDB(dbFile)
	create_todo(dbFile, "aa")
	update_task(dbFile, create_todo(dbFile, "bb"), "doing")
	update_task(dbFile, create_todo(dbFile, "cc"), "hibernating")
	update_task(dbFile, create_todo(dbFile, "dd"), "done")
	update_task(dbFile, create_todo(dbFile, "ee"), "archived")
	yield locals()
	os.remove(dbFile)
	print("done")
	return

def test_fetch_n(fake_data):
	dbFile = fake_data["dbFile"]
	assert "aa" in [_.title for _ in fetch_n(dbFile, "todo")]
	assert "bb" in [_.title for _ in fetch_n(dbFile, "doing")]
	assert "cc" in [_.title for _ in fetch_n(dbFile, "hibernating")]
	assert "dd" in [_.title for _ in fetch_n(dbFile, "done")]
	assert "ee" in [_.title for _ in fetch_n(dbFile, "archived")]
	with pytest.raises(ValueError) as excinfo:
		fetch_n(dbFile, "done", "all instances")
	assert 'did not understand meaning of "' in str(excinfo.value)
	assert '", unable to fetch tasks' in str(excinfo.value)
	return
