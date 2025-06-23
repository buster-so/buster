# Buster Business Intelligence API
This API runs the Buster Business Intelligence service.

## Get Started
1. Load the .env file in the root of the project.
2. In your terminal run `make dev`.
3. Service is now available at http://localhost:3001

## Repo Structure
All functional code is located in the `src` library.  The `main.rs` file is the entry point for the application.

The repo is organized like so:
- `routes/` contains the routes for the API.  Each route is contained in its own file with a handler function.
- `types/` this contains general types that will be used across the app such as database types.  **If you would define a type multiple times, it shoudl go here. However if a type is constrained to a specific function, it should not go here**
- `middleware/` this contains middleware for the app.
- `utils/` this contains clients and functions that would frequently be used across the app.  **If you would define a function multiple times, it should go here. However if a function is constrained to a specific route, it should not go here**
- `database/` this contains the database connection helpers, migrations, and database ORM system powered by Diesel.

### `routes/`
The `routes/` folder contains the routes for the API. The entrypoint to the routes is in the `mod.rs` file.

Routes are grouped into folders based on functionality. For example, a `/users` folder would contain all of my `POST`, `GET`, `PUT`, `DELETE` routes for the users resource.

Each route is defined in its own file with a handler function. This function receives user information through our middleware and uses types to define the input and output of each request.

Tests should be written directly in the route file and on the handler.

### `types/`
The `types/` folder contains general types that will be used across the app.  **If you would define a type multiple times, it should go here. However if a type is constrained to a specific route, it should not go here**

Types should be grouped into folders based on the resource they are related to.  For example, a `/config` folder would contain all of the types related to typed configurations throughout the app.

### `middleware/`
The `middleware/` folder contains middleware for the app.  Middleware is a function that runs before the route handler.  *We don't use that much middleware so there are just two files in this folder.*

### `utils/`
This folder contains the `clients/` folder and other groups of functions that would frequently be used across the app.  **If you would define a function multiple times, it should go here. However if a function is constrained to a specific route, it should not go here**

The `clients/` folder contains clients for the app.  A client represents a functional service like OpenAI, Supabase, etc.  These clients should always be defined as `struct`s with methods implemented on them.

### `database/`
This folder contains the database connection helpers, migrations, and database ORM system powered by Diesel.
