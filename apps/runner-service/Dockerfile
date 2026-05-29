FROM golang:1.22-alpine
WORKDIR /src

RUN apk add --no-cache nodejs npm python3 py3-pip

COPY apps/runner-service/go.mod ./
RUN go mod download

COPY apps/runner-service ./
RUN go build -o /usr/local/bin/deployforge-runner ./cmd/runner

EXPOSE 8082
CMD ["deployforge-runner"]
