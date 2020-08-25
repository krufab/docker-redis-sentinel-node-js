# docker-redis-sentinel-node-js
Example of Node JS application using Redis Sentinel running in Docker.

## Rationale
I could not find a clear example to set up a Node JS application using Redis in high availability (HA) configuration
running on Docker.

## Description
This repository shows how to configure Redis in HA using Redis Sentinel and Docker to run:
- an external application (applications running directly on the server)
- an application running in Docker  

## External application
This would be the configuration to be used when it is necessary to develop and test an application locally while it connects to a
Redis servers (primary and replicas) running on Docker.

The Redis servers running in Docker need to be bound to external ports so that the application can connect to them. However,
the servers will communicate their internal IP addresses, which are normally unreachable by an external application.

Therefore, information about the correspondence between internal and external address has to be provided to the Redis
connection, so that the addresses will be transparently translated.

In order to do so, these steps have to be followed:
1. Start the Redis servers: `docker-compose up --build` and wait for all hosts to be up
1. Extract the IP addresses of the servers:
    ```bash
    ./get-containers-ips.sh
    # Output example

    These are the containers' names and ips for docker-redis-sentinel-node-js_application
    
    docker-redis-sentinel-node-js_docker-application_1 => 192.168.224.6
    docker-redis-sentinel-node-js_redis-primary_1 => 192.168.224.7
    docker-redis-sentinel-node-js_redis-replica_1 => 192.168.224.2
    docker-redis-sentinel-node-js_redis-sentinel1_1 => 192.168.224.3
    docker-redis-sentinel-node-js_redis-sentinel2_1 => 192.168.224.5
    docker-redis-sentinel-node-js_redis-sentinel3_1 => 192.168.224.4 
    ```
1. Update the `src/external-application.js` source code, setting the ip value of the redis-* containers. In this case
    ```javascript 1.6
    // In src/external-application.js
    const natMap = {
      '192.168.224.7:6379': { // Docker IP and internal port of redis-primary
        host: '127.0.0.1', // Local IP
        port: 6379 // Exposed port in docker-compose
      },
      '192.168.224.2:6379': { // Docker IP and internal port of redis-replica
        host: '127.0.0.1',
        port: 6380 // Exposed port in docker-compose
      },
      // Docker IP of Sentinel 1
      '192.168.224.3:26379': {
        host: '127.0.0.1',
        port: 26379 // Exposed port in docker-compose
      },
      // Docker IP of Sentinel 2
      '192.168.224.5:26379': {
        host: '127.0.0.1',
        port: 26380 // Exposed port in docker-compose
      },
      // Docker IP of Sentinel 3
      '192.168.224.4:26379': {
        host: '127.0.0.1',
        port: 26381 // Exposed port in docker-compose
      },
    }
    ```
    Also, the Redis Sentinel port values have to match the ones bound in the docker-compose file:
    ```javascript 1.6
    // In src/external-application.js
    sentinels: [
      // Sentinels are reachable from localhost via the bound ports from  docker-compose
      {host: 'localhost', port: 26379},
      {host: 'localhost', port: 26380},
      {host: 'localhost', port: 26381},
    ],
     ```
    **Note**: Unless you change the `docker-compose.yml` file, the internal and external ports in the example should
    already be set correctly.
1. Run the application: `node src/external-application.js`. It will:
  1. Connect to the Redis primary server and Sentinels
  1. Test the connection to the primary server: `const pong = await redis.ping()`
  1. Request information about the primary server: `const pong = await redis.info()`
  1. Set a value: `await redis.set('external-application', 'external')`
  1. Retrieve a value: `const response = await redis.get('external-application')`
  

## Docker application
This would be the configuration to be used when the Node JS application and the Redis server are all running as Docker
containers. As they would be connected to the same Docker network, all hosts would be directly reachable and no
network address translation is necessary.

In this case, the Redis Sentinels' host values should match the Docker containers' names:
```javascript 1.6
// In src/docker-application.js
sentinels: [
  // Sentinels are reachable using their docker hostnames and internal ports
  {host: 'redis-sentinel1', port: 26379},
  {host: 'redis-sentinel2', port: 26379},
  {host: 'redis-sentinel3', port: 26379},
],
```

To run this example:
1. Start the Redis servers and application: `docker-compose up --build`
1. The `src/docker-application.js` will be executed. It will:
  1. Connect to the Redis primary server and Sentinels
  1. Test the connection to the primary server: `const pong = await redis.ping()`
  1. Set a value: `await redis.set('docker-application', 'docker')`
  1. Retrieve a value: `const response = await redis.get('docker-application')`

## Troubleshooting
This example should work out of the box (after configuring the containers' IPs), provided that the used ports
(6379, 6380, 26379, 26380, 26381) are all free.

In case the internal or external applications report an error message like this:
```javascript 1.6
[ioredis] Unhandled error event: Error: All sentinels are unreachable. Retrying from scratch after 190ms. Last error: Connection is closed.
    at /home/node/app/node_modules/ioredis/built/connectors/SentinelConnector/index.js:55:31
    at new Promise (<anonymous>)
    at connectToNext (/home/node/app/node_modules/ioredis/built/connectors/SentinelConnector/index.js:41:37)
    at /home/node/app/node_modules/ioredis/built/connectors/SentinelConnector/index.js:100:29
    at /home/node/app/node_modules/ioredis/built/connectors/SentinelConnector/index.js:139:24
    at tryCatcher (/home/node/app/node_modules/standard-as-callback/built/utils.js:11:23)
    at /home/node/app/node_modules/standard-as-callback/built/index.js:30:51
    at processTicksAndRejections (internal/process/task_queues.js:93:5)
```
very likely the addresses or the ports passed to the Redis client are not correct. Check:
- the output from the `docker-compose` command, to see if all containers are up
- the containers' bound ports with `docker ls`
- the containers' addresses with `./get-containers-ips.sh`

## For more information
- [Redis Sentiel](https://redis.io/topics/sentinel) documentation
- [ioredis](https://www.npmjs.com/package/ioredis) documentation
- [ioredis Sentinel](https://github.com/luin/ioredis#sentinel) documentation
- [ioredis Nat mapping](https://github.com/luin/ioredis#nat-mapping) documentation
