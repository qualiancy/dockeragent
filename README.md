# dockeragent

> Node.js adapter for [Docker](http://docker.io) services.

#### Installation

`dockeragent` is available on [npm](http://npmjs.org).

    npm install dockeragent

## Getting Started

#### Version Compatibility

Given docker is a young project and the API is constantly changing it
is not feasible to support multiple Remote API versions. Here are the current
recommended versions for the last npm release (`0.1.x`).

- Tested with Docker v0.6.x
- Docker Remote API v1.4 [[docs](http://docs.docker.io/en/latest/api/docker_remote_api_v1.4/)]

#### Usage Caveats

DockerAgent requires the API be accessible through an http address and not
the default config of a unix socket file. You can start the docker daemon 
using multiple `-H` flags to allow access from both DockerAgent and
docker's included cli tool. Alternatively, edit `/etc/init/dockerd.conf` with
this config if docker was installed as a service.

```sh
docker -d -H 127.0.0.1:4243 -H unix://var/run/docker.sock
```

### API Usage

> API Docs coming soon...

#### License

(The MIT License)

Copyright (c) 2013 Jake Luer <jake@qualiancy.com> (http://qualiancy.com)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
