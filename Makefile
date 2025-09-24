YARN_TARGETS := lint build start test
YARN_MODULES := $(shell find . -type d -name node_modules -prune -o -name 'package.json' -print | sed 's/package.json/node_modules/g')

help:
	@echo "Targets:"
	@echo "  $(YARN_TARGETS)"
	@echo "  psql"
	@echo "  up"

%/node_modules: %/package.json %/yarn.lock
	@yarn --silent --cwd $* install

dependencies: $(YARN_MODULES)

PHONY: $(YARN_TARGETS)
$(YARN_TARGETS): app/example/node_modules
	@yarn --silent --cwd app/example $@

.PHONY: psql
psql:
	docker-compose exec database psql -U user -d orders

.PHONY: up
up:
	docker-compose up
