docker -H $DOCKER_CONN ps -a | grep 'Exit' | awk '{print $1}' | xargs docker -H $DOCKER_CONN rm
