.PHONY: help install dev build preview clean deploy lint check

help:  ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-12s\033[0m %s\n", $$1, $$2}'

install:  ## Install npm dependencies
	npm install

dev:  ## Start Vite dev server (opens browser, hot reload)
	npm run dev

build:  ## Build production bundle into dist/
	npm run build

preview: build  ## Build then serve the production bundle locally
	npm run preview

check:  ## Build to verify there are no syntax/import errors
	npm run build

clean:  ## Remove build artifacts and node_modules
	rm -rf dist node_modules

deploy: build  ## Build, then print drag-and-drop instructions for Netlify
	@echo ""
	@echo "✅ Built dist/ — drag the folder to https://app.netlify.com/drop"
	@echo "   Or run:  npx netlify-cli deploy --dir=dist --prod"
	@echo ""
