NODE = node

all: test

test:
	@$(NODE) spec/node.js all

app:
	@$(NODE) examples/app.js

.PHONY: test app
