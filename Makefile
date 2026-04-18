SHELL := /bin/sh

.DEFAULT_GOAL := help

NODE ?= node
NPM ?= npm
NVM_DIR ?= $(HOME)/.nvm
NVM_SH ?= $(NVM_DIR)/nvm.sh
HOST ?= 127.0.0.1
PORT ?= 4321
REQUIRED_NODE_MAJOR ?= 22
REQUIRED_NODE_MINOR ?= 12
PW_BROWSER ?= chromium
PW_DEVICE ?=
PW_COLOR_SCHEME ?=
PW_URL ?=
PW_PATH ?= /
PW_OUT ?= /tmp/playwright-shot.png
PW_WAIT_FOR_SELECTOR ?=
PW_WAIT_FOR_TIMEOUT ?= 0
PW_FULL_PAGE ?= 1

.PHONY: help doctor install prepare-static dev dev-lan build preview preview-lan check astro-check \
	verify test-unit test-acceptance test-integration test-e2e test-ui pw-install pw-shot pw-shot-local clean

USE_PROJECT_NODE = if [ -s "$(NVM_SH)" ] && [ -f ".nvmrc" ]; then . "$(NVM_SH)" >/dev/null 2>&1; nvm use >/dev/null; fi;
WITH_WORKTREE_LOCK = $(NODE) scripts/with-worktree-lock.mjs

help: ## Show available developer targets
	@printf "alnah.me developer commands\n\n"
	@awk 'BEGIN {FS = ":.*## "}; /^[a-zA-Z0-9_.-]+:.*## / {printf "  %-18s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

doctor: ## Check that local tooling matches the project baseline
	@$(USE_PROJECT_NODE) command -v $(NODE) >/dev/null || { echo "Node is not available."; exit 1; }
	@$(USE_PROJECT_NODE) $(NODE) -e 'const [major, minor] = process.versions.node.split(".").map(Number); if (major < $(REQUIRED_NODE_MAJOR) || (major === $(REQUIRED_NODE_MAJOR) && minor < $(REQUIRED_NODE_MINOR))) { console.error(`Node $${process.versions.node} is too old. Need >= $(REQUIRED_NODE_MAJOR).$(REQUIRED_NODE_MINOR).0.`); process.exit(1); }'
	@$(USE_PROJECT_NODE) $(NPM) --version >/dev/null
	@$(USE_PROJECT_NODE) printf "node=%s npm=%s\n" "$$($(NODE) --version)" "$$($(NPM) --version)"

install: doctor ## Install dependencies reproducibly
	@$(USE_PROJECT_NODE) $(NPM) ci

prepare-static: doctor ## Generate redirects, raw markdown, and license artifacts
	@$(USE_PROJECT_NODE) $(NPM) run prepare:static

dev: doctor ## Start the Astro dev server on localhost
	@$(USE_PROJECT_NODE) $(NPM) run dev -- --host $(HOST) --port $(PORT)

dev-lan: doctor ## Start the Astro dev server on the LAN
	@$(USE_PROJECT_NODE) $(NPM) run dev -- --host 0.0.0.0 --port $(PORT)

build: doctor ## Build the production site into dist/
	@$(USE_PROJECT_NODE) $(WITH_WORKTREE_LOCK) $(NPM) run build

preview: doctor ## Preview the built site on localhost
	@$(USE_PROJECT_NODE) $(WITH_WORKTREE_LOCK) $(NPM) run preview -- --host $(HOST) --port $(PORT)

preview-lan: doctor ## Preview the built site on the LAN
	@$(USE_PROJECT_NODE) $(WITH_WORKTREE_LOCK) $(NPM) run preview -- --host 0.0.0.0 --port $(PORT)

check: verify ## Run the current green quality gate

astro-check: doctor ## Run Astro's stricter diagnostics (may expose known type debt)
	@$(USE_PROJECT_NODE) $(NPM) exec astro check

verify: doctor ## Run the full build + verification suite
	@$(USE_PROJECT_NODE) $(WITH_WORKTREE_LOCK) $(NPM) run verify

test-unit: doctor ## Run pure helper checks without rebuilding the site
	@$(USE_PROJECT_NODE) $(NPM) run test:unit

test-acceptance: doctor ## Run acceptance checks against a fresh build
	@$(USE_PROJECT_NODE) $(WITH_WORKTREE_LOCK) $(NPM) run test:acceptance

test-integration: doctor ## Run integration checks against a fresh build
	@$(USE_PROJECT_NODE) $(WITH_WORKTREE_LOCK) $(NPM) run test:integration

test-e2e: doctor ## Run the local end-to-end smoke checks against a fresh build
	@$(USE_PROJECT_NODE) $(WITH_WORKTREE_LOCK) $(NPM) run test:e2e

test-ui: doctor ## Run the minimal Playwright UI smoke checks against a fresh build
	@$(USE_PROJECT_NODE) $(WITH_WORKTREE_LOCK) $(NPM) run test:ui

pw-install: doctor ## Install the Playwright browser set used by pw-* targets (default: chromium)
	@$(USE_PROJECT_NODE) command -v playwright >/dev/null || { echo "playwright CLI is not available in the current Node environment."; exit 1; }
	@$(USE_PROJECT_NODE) playwright install $(PW_BROWSER)

pw-shot: doctor ## Capture a screenshot with Playwright (set PW_URL and optionally PW_DEVICE/PW_OUT)
	@$(USE_PROJECT_NODE) command -v playwright >/dev/null || { echo "playwright CLI is not available in the current Node environment."; exit 1; }
	@[ -n "$(PW_URL)" ] || { echo "Set PW_URL, e.g. make pw-shot PW_URL=http://127.0.0.1:4321/ PW_OUT=/tmp/home.png"; exit 1; }
	@args="--browser=$(PW_BROWSER)"; \
	if [ "$(PW_FULL_PAGE)" = "1" ]; then args="$$args --full-page"; fi; \
	if [ -n "$(PW_DEVICE)" ]; then args="$$args --device=\"$(PW_DEVICE)\""; fi; \
	if [ -n "$(PW_COLOR_SCHEME)" ]; then args="$$args --color-scheme=$(PW_COLOR_SCHEME)"; fi; \
	if [ -n "$(PW_WAIT_FOR_SELECTOR)" ]; then args="$$args --wait-for-selector=\"$(PW_WAIT_FOR_SELECTOR)\""; fi; \
	if [ "$(PW_WAIT_FOR_TIMEOUT)" != "0" ]; then args="$$args --wait-for-timeout=$(PW_WAIT_FOR_TIMEOUT)"; fi; \
	eval "$(USE_PROJECT_NODE) playwright screenshot $$args \"$(PW_URL)\" \"$(PW_OUT)\""

pw-shot-local: doctor ## Capture a local screenshot (set PW_PATH and optionally PORT/PW_DEVICE/PW_OUT)
	@$(MAKE) --no-print-directory pw-shot PW_URL=http://$(HOST):$(PORT)$(PW_PATH) PW_OUT="$(PW_OUT)" PW_DEVICE="$(PW_DEVICE)" PW_BROWSER="$(PW_BROWSER)" PW_COLOR_SCHEME="$(PW_COLOR_SCHEME)" PW_WAIT_FOR_SELECTOR="$(PW_WAIT_FOR_SELECTOR)" PW_WAIT_FOR_TIMEOUT="$(PW_WAIT_FOR_TIMEOUT)" PW_FULL_PAGE="$(PW_FULL_PAGE)"

clean: ## Remove generated build artifacts
	@rm -rf dist .astro node_modules/.astro public/LICENSE public/LICENSES public/raw
