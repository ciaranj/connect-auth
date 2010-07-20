NODE = node
TEST = support/expresso/bin/expresso
TESTS ?= test/*.test.js

test:
	@CONNECT_ENV=test ./$(TEST) -I lib $(TEST_FLAGS) $(TESTS)

test-cov:
	@$(MAKE) test TEST_FLAGS="--cov"

app:
	@$(NODE) examples/app.js

.PHONY: test test-cov app
