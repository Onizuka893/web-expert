TS_COMPILER = tsc
NODE = node
TS_FILES = index.ts
CONFIG_FILE = ./db.json

.PHONY: all build run clean

all: build run

build:
	$(TS_COMPILER)

run:
	$(NODE) dist/index.js --jsonFile=$(CONFIG_FILE)

clean:
	rm -rf dist