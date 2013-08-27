docker ps | grep Up | awk '{print $1}' | xargs docker stop
