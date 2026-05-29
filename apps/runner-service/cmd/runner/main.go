package main

import (
	"log/slog"
	"net/http"
	"os"

	"deployforge-ai-runner/internal/api"
	"deployforge-ai-runner/internal/config"
	"deployforge-ai-runner/internal/quality"
)

func main() {
	cfg := config.Load()
	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))

	mux := http.NewServeMux()
	service := quality.NewService(cfg, logger)
	api.RegisterRoutes(mux, service, logger)

	logger.Info("starting runner-service", "port", cfg.Port)
	if err := http.ListenAndServe(":"+cfg.Port, mux); err != nil {
		logger.Error("runner-service stopped", "error", err)
		os.Exit(1)
	}
}
