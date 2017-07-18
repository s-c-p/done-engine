CREATE TABLE enum_stages
( _id INTEGER PRIMARY KEY AUTOINCREMENT
, stage TEXT NOT NULL
/*, CONSTRAINT unique_stage_names UNIQUE(stage)*/
);
INSERT INTO enum_stages (stage) VALUES
("todo"), ("done"), ("doing"),
("archived"), /*!!!only done things can be archived*/
("hibernating"); /*!!!only doing things can be hibernated*/


CREATE TABLE tasks
( _id INTEGER PRIMARY KEY AUTOINCREMENT
/*, tags array*/
, title TEXT(140) NOT NULL
, details TEXT
, FK_nature INTEGER
, FOREIGN KEY (FK_nature) REFERENCES enum_stages(_id)
);'
