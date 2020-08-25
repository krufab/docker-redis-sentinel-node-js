#!/usr/bin/env bash

set -o errexit
set -o errtrace
set -o nounset
set -o pipefail

declare network_name="docker-redis-sentinel-node-js_application"
declare network_id

# Extract the network id
network_id="$(docker network ls --filter name="${network_name}" --quiet)"

# Check that the network id is not empty
if [[ -z "${network_id}" ]]; then
  echo "Error: cannot find network ${network_name}" >&2
  echo "Run 'docker-compose up --build' in another shell" >&2
  exit 1
fi

cat <<EOF

These are the containers' names and ips for ${network_name}

EOF

# Extract the list of containers for the network and print their name and ip
docker network inspect \
  --format '{{json .Containers}}' "${network_id}" \
  | jq -c -r '.[] | .Name + " => " + .IPv4Address | split ("/") | .[0]' \
  | sort
