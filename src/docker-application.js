const Redis = require('ioredis')

const doAll = async () => {
  const redis = new Redis({
      showFriendlyErrorStack: true,
      sentinels: [
        // Sentinels are reachable using their docker hostnames and internal ports
        {host: 'redis-sentinel1', port: 26379},
        {host: 'redis-sentinel2', port: 26379},
        {host: 'redis-sentinel3', port: 26379},
      ],
      name: 'redismaster',
    }
  )

  // Wait few second to have the redis cluster initialized
  await new Promise(resolve => setTimeout(resolve, 7000));

  // Checking if redis is reachable
  const pong = await redis.ping()
  console.log(pong)

  // Setting and retrieving a value
  console.log("Setting 'docker-application' value for application")
  await redis.set('docker-application', 'docker')
  const response = await redis.get('docker-application')
  console.log(`Retrieved 'docker-application' value: ${response}`)
}

try {
  doAll()
} catch (exception) {
  console.error(exception)
}