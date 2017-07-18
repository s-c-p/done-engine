# thanks to mockaroo.com

import os
import csv
import random
import sqlite3

setup = [
	'CREATE TABLE enum_stages( _id INTEGER PRIMARY KEY AUTOINCREMENT, stage TEXT NOT NULL/*, CONSTRAINT unique_stage_names UNIQUE(stage)*/);',
	'INSERT INTO enum_stages (stage) VALUES("todo"), ("done"), ("doing"),("archived"), /*!!!only done things can be archived*/("hibernating"); /*!!!only doing things can be hibernated*/',
	'CREATE TABLE tasks( _id INTEGER PRIMARY KEY AUTOINCREMENT/*, tags array*/, title TEXT(140) NOT NULL, details TEXT, FK_nature INTEGER, FOREIGN KEY (FK_nature) REFERENCES enum_stages(_id));'
]

query = "INSERT INTO tasks (_id, title, details, FK_nature) VALUES (?,?,?,?);"

if os.path.isfile("sample_db.sqlite3"):
	print("sample_db.sqlite3 already exist, take a look in it and delete it manually")
	exit()

random.seed(os.urandom(128))

with sqlite3.connect("sample_db.sqlite3") as conn:
	cur = conn.cursor()
	list(map(cur.execute, setup))
	with open("MOCK_DATA.csv", mode="rt") as csvFP:
		dialect = csv.Sniffer().sniff(csvFP.read(1024))
		csvFP.seek(0)
		reader = csv.reader(csvFP, dialect)
		for aSet in reader:
			if len(aSet[1]) > 140:
				title = aSet[1]
				title = title[:random.randint(60,129)]
				aSet[1] = title
			cur.execute(query, aSet)
	conn.commit()
