# Local Registry

The Compose stack includes a local Docker Registry on `localhost:5000`.

Example image names:

```txt
localhost:5000/deployforge-web
localhost:5000/deployforge-api
localhost:5000/deployforge-agent-service
localhost:5000/deployforge-runner-service
```

Use this for local image promotion tests before introducing a remote registry.
