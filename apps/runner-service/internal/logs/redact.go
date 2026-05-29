package logs

import "regexp"

var patterns = []*regexp.Regexp{
	regexp.MustCompile(`(?i)(authorization:\s*bearer\s+)[^\s]+`),
	regexp.MustCompile(`(?i)((api[_-]?key|token|password|secret)\s*[:=]\s*)[^\s"'` + "`" + `]+`),
}

func Redact(input string) string {
	output := input
	for _, pattern := range patterns {
		output = pattern.ReplaceAllString(output, "${1}[REDACTED]")
	}
	return output
}
