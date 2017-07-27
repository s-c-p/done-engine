import json

import pytest
import requests

CODEC_PREFIX = "dbID_"

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

def test_update_task():
	apiURL = "http://127.0.0.1:8080/update_task"
	dirty = "/dbID_458/changes?nature=archived"
	x = requests.get(apiURL+dirty, allow_redirects=False)
	assert x.status_code in range(300, 400)
	assert x.is_redirect
	x = requests.get(apiURL+dirty)
	assert x.status_code == 200
	assert x.text == 'updated successfully'
	assert x.url == apiURL+dirty.replace(CODEC_PREFIX, "")
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
