package logs

import "testing"

func TestRedact(t *testing.T) {
	result := Redact("token=abc123 password:secret authorization: Bearer abc.def")
	if result != "token=[REDACTED] password:[REDACTED] authorization: Bearer [REDACTED]" {
		t.Fatalf("unexpected redaction: %s", result)
	}
}
