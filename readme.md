# Navarrotech Express Utility
This NPM package provides a solution for setting up Express applications with enhanced features like CORS handling, session management, custom middleware, rate limiting, and more.

The idea is that creating a new project can be tedious, and this package can simplify the creation process.

## Features
- **CORS Configuration**: Enable or customize CORS settings.
- **Session Management**: Support for PostgreSQL, Redis, and in-memory session stores.
- **Custom Middleware Integration**: Easily integrate your custom middleware.
- **Rate Limiting**: Protect your application with configurable rate limits.
- **Helmet Security**: Use Helmet to set security-related HTTP headers.
- **Advanced Route Handling**: Define routes with validation and custom handling.
- **Static File Serving**: Serve static files with optional path customization.

## Installation
- To install the package, run the following command in your project directory:

```
npm install navarrotech-express
```

## Usage
Here's a basic example to create an Express application with the package:

```
import createApplication, { type CreateOptions } from 'navarrotech-express';

const options: CreateOptions = {
  cors: true, // Enable CORS
  // ... other options
};

const app = createApplication(options);

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
```

## Options
The `CreateOptions` object accepts the following properties:

- **cors: boolean | string** - Enable CORS with true or specify a string for custom settings.
- **routes: Route[]** - Array of route objects to define application endpoints.
- **store: 'redis' | 'postgres' | 'memory' | Store** - Specify the session store type.
- **customMiddleware: any[]** - Array of custom middleware functions.
- **dontTrustProxy: boolean** - Set to true to disable trusting the proxy.
- **helmetOptions: Partial<HelmetOptions>** - Customize Helmet configuration.
- **rateLimitOptions: Partial<RateLimitOptions>** - Configure rate limiting.
- **sessionSecret: string** - Secret for signing the session ID.
- **sessionSettings: Partial<SessionOptions>** - Additional session configuration.
- **publicFolderPath: string** - Path to the folder for serving static files.
- **storeSettings: Partial<RedisStoreOptions> | Partial<PGStoreOptions>** - Configuration for the chosen session store.

## Advanced Route Configuration
Define routes with the following structure:

```
const routes = [
  {
    path: '/example',
    method: 'get',
    validator: yourYupValidator,
    fn: (req, res) => {
      // Route logic
    },
  },
  // ... more routes
];
```

The idea being that you can have one route per file, something like:
```
function route(request, response){
    response.status(200).send("Hello world!")
}

const schema = yup.object({}).shape({
  name: yup
    .string()
    .typeError("Name must be a string")
    .max(64, "Name is too long")
    .required(),
})

export default route = {
    path: "/example",
    method: "post",
    validator: schema,
    fn: route
}
```

So then you can barrel export them to cleanly validate and use your routes as:
```
import exampleRoute from './example'
export const routes = [
    exampleRoute,
]
```

## Defaults
- Comes with a /ping route automatically, that returns status 200 and the text "pong"
- Will auto implement express helmet, cookie parser, json body parsing, and rate limiting as middleware.
- So much easier to use a static "public" folder
- If an "index.html" file exists in the specified public folder, all 404 GET requests will serve the index.html file.
- Will trust proxy by default (allowing an API server to serve the "public folder" much smoother)
- All request types will automatically have the "request.session" type added onto it.
- You can use the types "Request" and "Response" exported from this package for an easier session-typed flow.

## License
This project is licensed under the MIT license.