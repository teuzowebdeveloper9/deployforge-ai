package executor

import (
	"context"
	"os"
	"os/exec"
	"strings"
	"time"

	"deployforge-ai-runner/internal/logs"
	"deployforge-ai-runner/internal/report"
)

type Command struct {
	Name string
	Args []string
}

func Run(ctx context.Context, workspace string, timeout time.Duration, command Command) report.Check {
	started := time.Now()
	cmdCtx, cancel := context.WithTimeout(ctx, timeout)
	defer cancel()

	cmd := exec.CommandContext(cmdCtx, command.Name, command.Args...)
	cmd.Dir = workspace
	cmd.Env = sanitizedEnv(os.Environ(), workspace)

	output, err := cmd.CombinedOutput()
	status := "passed"
	if err != nil {
		status = "failed"
	}
	if cmdCtx.Err() == context.DeadlineExceeded {
		status = "timeout"
	}

	return report.Check{
		Name:       strings.Join(append([]string{command.Name}, command.Args...), " "),
		Command:    strings.Join(append([]string{command.Name}, command.Args...), " "),
		Status:     status,
		Output:     logs.Redact(string(output)),
		DurationMS: time.Since(started).Milliseconds(),
	}
}

func sanitizedEnv(env []string, workspace string) []string {
	filtered := make([]string, 0, len(env)+2)
	for _, item := range env {
		key, _, ok := strings.Cut(strings.ToLower(item), "=")
		if ok && isSensitiveEnvKey(key) {
			continue
		}
		filtered = append(filtered, item)
	}
	filtered = append(filtered, "HOME="+workspace)
	return filtered
}

func isSensitiveEnvKey(key string) bool {
	return key == "authorization" ||
		key == "api_key" ||
		strings.HasSuffix(key, "_api_key") ||
		strings.Contains(key, "token") ||
		strings.Contains(key, "secret") ||
		strings.Contains(key, "password")
}
