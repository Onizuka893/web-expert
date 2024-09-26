TS_COMPILER = tsc
NODE = node
TS_FILES = index.ts
CONFIG_FILE = ./db.json
TEST_CONFIG_FILE = ./test.json

.PHONY: all build run clean

all: build run

test : build test

build:
	$(TS_COMPILER)

run:
	$(NODE) dist/index.js --jsonFile=$(CONFIG_FILE) --test false

test:
	$(NODE) dist/index.js --jsonFile=$(TEST_CONFIG_FILE) --test true

clean:
	rm -rf dist