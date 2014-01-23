TESTS = test/*.js
REPORTER = list

all: install test

install: node_modules

node_modules: package.json
	@npm install
	@touch $@

test: test-node

test-node:
	@NODE_ENV=test ./node_modules/goodwin/bin/goodwin

.PHONY: test lib-cov test-cov clean
