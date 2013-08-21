docker -H $DOCKER_CONN ps | grep Up | awk '{print $1}' | xargs docker -H $DOCKER_CONN stop
