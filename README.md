# Redis Caching for Recipe API

Redis Caching for Recipe API is a project that demonstrates the implementation of Redis caching alongside asynchronous programming using async/await. This project builds upon the code from Lab 1 and introduces caching mechanisms to enhance the performance of the Recipe API.

![Redis Caching](link_to_project_image)

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [API Integration](#api-integration)
- [Middleware Functions](#middleware-functions)
- [Contributing](#contributing)
- [License](#license)

## Overview

Redis Caching for Recipe API leverages Redis as a caching solution to optimize data retrieval and enhance the API's responsiveness. The project combines the principles of async/await with Redis caching to deliver efficient and scalable data retrieval.

## Features

### Caching Mechanism

- Cached data in Redis for optimized data retrieval.
- Efficient handling of API requests through Redis caching.
- Utilization of sorted sets in Redis for tracking the most accessed recipes.

### RESTful API

The project includes the following RESTful API routes:

- **GET /recipes**: Retrieves a paginated list of recipes.
- **GET /recipes/:id**: Fetches a specific recipe by its ID.
- **POST /recipes**: Creates a new recipe (authentication required).
- **PATCH /recipes/:id**: Updates a recipe by its ID (authentication required).
- **POST /recipes/:id/comments**: Adds a comment to a recipe (authentication required).
- **DELETE /recipes/:recipeId/:commentId**: Deletes a comment on a recipe (authentication required).
- **POST /recipes/:id/likes**: Allows users to like/unlike a recipe (authentication required).
- **GET /mostaccessed**: Displays the top 10 most accessed recipes.

### User Authentication

- User authentication for creating, updating, commenting, and liking recipes.
- Secure password constraints and user session management.

## Installation

To run this project locally, follow these steps:

1. Clone the repository:

   ```bash
   git clone <repository_url>
   cd redis-caching-for-recipe-api
    ```
2. Start the server:
    ```bash
    npm start
    ```

3. Access the API at http://localhost:3000


### Usage
Redis Caching for Recipe API provides an efficient and secure platform for managing recipes and user interactions:

Explore recipes through the /recipes route.  

View detailed recipe information using the /recipes/:id route.  

Create new recipes via the /recipes route after logging in.  
Update existing recipes through the /recipes/:id route (requires authentication).  
Post comments on recipes using the /recipes/:id/comments route (requires authentication).  
Delete comments on recipes via the /recipes/:recipeId/:commentId route (requires authentication).  
Like or unlike recipes with the /recipes/:id/likes route (requires authentication).  
Discover the top 10 most accessed recipes through the /mostaccessed route.  
