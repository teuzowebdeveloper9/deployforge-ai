package api

import (
	"crypto/subtle"
	"encoding/json"
	"log/slog"
	"net/http"

	"deployforge-ai-runner/internal/config"
	"deployforge-ai-runner/internal/quality"
)

func RegisterRoutes(mux *http.ServeMux, service quality.Service, logger *slog.Logger, cfg config.Config) {
	mux.HandleFunc("GET /health", func(w http.ResponseWriter, r *http.Request) {
		writeJSON(w, http.StatusOK, map[string]string{"status": "ok", "service": "runner-service"})
	})

	mux.HandleFunc("GET /ready", func(w http.ResponseWriter, r *http.Request) {
		writeJSON(w, http.StatusOK, map[string]string{"status": "ready", "service": "runner-service"})
	})

	mux.HandleFunc("POST /run-quality-gate", func(w http.ResponseWriter, r *http.Request) {
		if !gatewayAuthorized(r, cfg.GatewayServiceToken) {
			writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "gateway_authentication_required"})
			return
		}
		r.Body = http.MaxBytesReader(w, r.Body, 1_000_000)
		var request quality.Request
		if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
			writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid_json"})
			return
		}
		logger.Info("running quality gate", "app_id", request.AppID, "version_id", request.VersionID, "build_id", request.BuildID)
		result := service.Run(r.Context(), request)
		writeJSON(w, http.StatusOK, result)
	})
}

func gatewayAuthorized(r *http.Request, expected string) bool {
	if expected == "" {
		return true
	}
	actual := r.Header.Get("X-Gateway-Token")
	if actual == "" || len(actual) != len(expected) {
		return false
	}
	return subtle.ConstantTimeCompare([]byte(actual), []byte(expected)) == 1
}

func writeJSON(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("X-Content-Type-Options", "nosniff")
	w.Header().Set("Cache-Control", "no-store")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}
