docker ps -a | grep 'Exit' | awk '{print $1}' | xargs docker rm
