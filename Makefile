DOCKER_COMPOSE = docker-compose
APP_SERVICE = tocco-app


start-dev:
	$(DOCKER_COMPOSE) up --build


migrate-dev:
	$ npm run migrate  && npm run start:dev


migration: ## migrate database schema after application is available.
	echo  "Applying database migrations..." 
	$(DOCKER_COMPOSE) exec $(APP_SERVICE) npx prisma migrate deploy
	echo "Database migrations applied successfully."


migrate-status:
	$(DOCKER_COMPOSE) exec $(APP_SERVICE) npx prisma migrate status
