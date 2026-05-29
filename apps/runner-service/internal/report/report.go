package report

import "time"

type Check struct {
	Name       string `json:"name"`
	Command    string `json:"command"`
	Status     string `json:"status"`
	Output     string `json:"output"`
	DurationMS int64  `json:"duration_ms"`
}

type QualityReport struct {
	Status     string    `json:"status"`
	Score      int       `json:"score"`
	Stack      string    `json:"stack"`
	Checks     []Check   `json:"checks"`
	StartedAt  time.Time `json:"started_at"`
	FinishedAt time.Time `json:"finished_at"`
}
