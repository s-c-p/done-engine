import json

import pytest
import requests

CODEC_PREFIX = "dbID_"

# def get(url):
# 	x = requests.get(url)
# 	ans = \
# 	{ "url": x.url
# 	, "text": x.text
# 	, "content": x.content
# 	, "cookies": x.cookies
# 	, "elapsed": x.elapsed
# 	, "headers": x.headers
# 	, "history": x.history
# 	, "status_code": x.status_code}
# 	return ans


def test_index():
	return

def test_populate():
	apiURL = "http://127.0.0.1:8080/populate"
	req = {"todos": 2, "dones": 2, "doings": 2}
	x = requests.get(apiURL, params=req)
	assert x.status_code == 200
	assert x.url == "http://127.0.0.1:8080/populate?todos=2&dones=2&doings=2"
	y = json.loads(x.text)
	assert type(y) is list
	assert len(y) == 6
	return
def test_save_todo():
	apiURL = "http://127.0.0.1:8080/save_todo"
	req = {'title': 'himadri tung shring se'}
	x = requests.get(apiURL, params=req)
	assert x.status_code == 200
	assert x.url == 'http://127.0.0.1:8080/save_todo?title=himadri+tung+shring+se'
	y = json.loads(x.text)
	assert type(y) is dict
	assert y["id"].startswith(CODEC_PREFIX)
	return

def test_update_task(uid):
	from io import StringIO
	from contextlib import redirect_stdout
	f = StringIO()
	with redirect_stdout(f):
		x = requests.get("http://127.0.0.1:8080/update_task/dbID_458/changes?nature=archived")
		# won't work because stdout occours at server's computer'
		will logger work, will I be able to get a lock? Search pytest logger
	x = requests.get("http://127.0.0.1:8080/update_task/458/changes?nature=hibernating")
	assert x.status_code == 200
	return

"""
def test__nginx1():
	return

def test__nginx2():
	return

def test__nginx3():
	return
"""
