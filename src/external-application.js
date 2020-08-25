const Redis = require('ioredis')

// Specify here the address translations from docker containers' ips to
// local address. The containers' ips can be extracted from the docker logs or
// running the shell script ./get-containers-ips.sh
const natMap = {
  '192.168.224.2:6379': { // Docker IP of redis-primary
    host: '127.0.0.1', // Local IP
    port: 6379
  },
  '192.168.224.3:6379': { // Docker IP of redis-slave
    host: '127.0.0.1',
    port: 6380 // Exposed port in docker-compose
  },
  // Docker IP of Sentinel 1
  '192.168.224.4:26379': {
    host: '127.0.0.1',
    port: 26379 // Exposed port in docker-compose
  },
  // Docker IP of Sentinel 2
  '192.168.224.5:26379': {
    host: '127.0.0.1',
    port: 26380 // Exposed port in docker-compose
  },
  // Docker IP of Sentinel 3
  '192.168.224.6:26379': {
    host: '127.0.0.1',
    port: 26381 // Exposed port in docker-compose
  },
}

const doAll = async () => {
  const redis = new Redis({
      showFriendlyErrorStack: true,
      sentinels: [
        // Sentinels are reachable from localhost via the bound ports from  docker-compose
        {host: 'localhost', port: 26379},
        {host: 'localhost', port: 26380},
        {host: 'localhost', port: 26381},
      ],
      name: 'redismaster',
    }, {
      natMap
    }
  )

  // Checking if redis is reachable
  const pong = await redis.ping()
  console.log(pong)

  // Getting primary redis server info
  const info = await redis.info()
  console.log(info)

  // Setting and retrieving a value
  console.log("Setting 'external-application' value for application")
  await redis.set('external-application', 'external')
  const response = await redis.get('external-application')
  console.log(`Retrieved 'external-application' value: ${response}`)

  redis.call('sentinel', ['master', 'redismaster'],
    function (err, value) {
      if (err) throw err
      console.log(value.toString()) //-> 'OK'

    }
  )
}

try {
  doAll()
} catch (exception) {
  console.error(exception)
}