package quality

import (
	"context"
	"encoding/json"
	"log/slog"
	"os"
	"path/filepath"
	"strings"
	"time"

	"deployforge-ai-runner/internal/config"
	"deployforge-ai-runner/internal/executor"
	"deployforge-ai-runner/internal/logs"
	"deployforge-ai-runner/internal/report"
	"deployforge-ai-runner/internal/sandbox"
)

type Request struct {
	AppID      string `json:"app_id"`
	VersionID  string `json:"version_id"`
	BuildID    string `json:"build_id"`
	SourcePath string `json:"source_path"`
}

type Response struct {
	Status       string               `json:"status"`
	QualityScore int                 `json:"quality_score"`
	Logs         string              `json:"logs"`
	Report       report.QualityReport `json:"report"`
}

type Service struct {
	cfg    config.Config
	logger *slog.Logger
}

func NewService(cfg config.Config, logger *slog.Logger) Service {
	return Service{cfg: cfg, logger: logger}
}

func (s Service) Run(ctx context.Context, request Request) Response {
	started := time.Now()
	sourcePath, err := sandbox.ValidateSourcePath(s.cfg.StorageRoot, request.SourcePath)
	if err != nil {
		return failedReport(started, "validation", err.Error())
	}

	workspace, err := os.MkdirTemp("", "deployforge-quality-*")
	if err != nil {
		return failedReport(started, "workspace", err.Error())
	}
	defer os.RemoveAll(workspace)

	if err := sandbox.ExtractTarGz(sourcePath, workspace); err != nil {
		return failedReport(started, "extract", err.Error())
	}

	stack := detectStack(workspace)
	commands := commandsForStack(workspace, stack)
	if len(commands) == 0 {
		report := report.QualityReport{
			Status:     "passed",
			Score:      60,
			Stack:      "unknown",
			Checks:     []report.Check{},
			StartedAt:  started,
			FinishedAt: time.Now(),
		}
		return Response{
			Status:       "passed",
			QualityScore: 60,
			Logs:         "No supported stack detected; snapshot extraction succeeded.",
			Report:       report,
		}
	}

	checks := make([]report.Check, 0, len(commands))
	var builder strings.Builder
	failures := 0
	for _, command := range commands {
		check := executor.Run(ctx, workspace, s.cfg.QualityTimeout, command)
		checks = append(checks, check)
		builder.WriteString("== ")
		builder.WriteString(check.Command)
		builder.WriteString(" ==\n")
		builder.WriteString(check.Output)
		builder.WriteString("\n")
		if check.Status != "passed" {
			failures++
		}
	}

	score := 100 - (failures * 25)
	if score < 0 {
		score = 0
	}
	status := "passed"
	if failures > 0 {
		status = "failed"
	}
	qualityReport := report.QualityReport{
		Status:     status,
		Score:      score,
		Stack:      stack,
		Checks:     checks,
		StartedAt:  started,
		FinishedAt: time.Now(),
	}

	return Response{
		Status:       status,
		QualityScore: score,
		Logs:         logs.Redact(builder.String()),
		Report:       qualityReport,
	}
}

func failedReport(started time.Time, stage string, message string) Response {
	qualityReport := report.QualityReport{
		Status:     "failed",
		Score:      0,
		Stack:      stage,
		Checks:     []report.Check{},
		StartedAt:  started,
		FinishedAt: time.Now(),
	}
	return Response{
		Status:       "failed",
		QualityScore: 0,
		Logs:         logs.Redact(message),
		Report:       qualityReport,
	}
}

func detectStack(workspace string) string {
	parts := []string{}
	if exists(filepath.Join(workspace, "package.json")) {
		parts = append(parts, "js-ts")
	}
	if exists(filepath.Join(workspace, "requirements.txt")) || exists(filepath.Join(workspace, "pyproject.toml")) {
		parts = append(parts, "python")
	}
	if exists(filepath.Join(workspace, "go.mod")) {
		parts = append(parts, "go")
	}
	if len(parts) == 0 {
		return "unknown"
	}
	return strings.Join(parts, "+")
}

func commandsForStack(workspace string, stack string) []executor.Command {
	commands := []executor.Command{}
	if strings.Contains(stack, "js-ts") {
		commands = append(commands, executor.Command{Name: "npm", Args: []string{"install"}})
		for _, script := range []string{"lint", "typecheck", "test", "build"} {
			if packageHasScript(workspace, script) {
				commands = append(commands, executor.Command{Name: "npm", Args: []string{"run", script}})
			}
		}
	}
	if strings.Contains(stack, "python") {
		if exists(filepath.Join(workspace, "requirements.txt")) {
			commands = append(commands, executor.Command{Name: "python3", Args: []string{"-m", "pip", "install", "-r", "requirements.txt"}})
		}
		commands = append(commands, executor.Command{Name: "ruff", Args: []string{"check", "."}})
		commands = append(commands, executor.Command{Name: "pytest", Args: []string{"."}})
	}
	if strings.Contains(stack, "go") {
		commands = append(commands, executor.Command{Name: "go", Args: []string{"test", "./..."}})
		commands = append(commands, executor.Command{Name: "go", Args: []string{"vet", "./..."}})
		commands = append(commands, executor.Command{Name: "go", Args: []string{"build", "./..."}})
	}
	return commands
}

func packageHasScript(workspace string, script string) bool {
	raw, err := os.ReadFile(filepath.Join(workspace, "package.json"))
	if err != nil {
		return false
	}
	var packageJSON struct {
		Scripts map[string]string `json:"scripts"`
	}
	if err := json.Unmarshal(raw, &packageJSON); err != nil {
		return false
	}
	_, ok := packageJSON.Scripts[script]
	return ok
}

func exists(path string) bool {
	_, err := os.Stat(path)
	return err == nil
}
