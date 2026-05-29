package config

import (
	"os"
	"strconv"
	"time"
)

type Config struct {
	Port          string
	StorageRoot   string
	QualityTimeout time.Duration
}

func Load() Config {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8082"
	}

	storageRoot := os.Getenv("STORAGE_ROOT")
	if storageRoot == "" {
		storageRoot = "./storage"
	}

	timeoutSeconds := 120
	if raw := os.Getenv("QUALITY_TIMEOUT_SECONDS"); raw != "" {
		if parsed, err := strconv.Atoi(raw); err == nil && parsed > 0 {
			timeoutSeconds = parsed
		}
	}

	return Config{
		Port:          port,
		StorageRoot:   storageRoot,
		QualityTimeout: time.Duration(timeoutSeconds) * time.Second,
	}
}
