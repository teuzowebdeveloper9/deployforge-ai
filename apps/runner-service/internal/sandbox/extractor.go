package sandbox

import (
	"archive/tar"
	"compress/gzip"
	"errors"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"
)

func ValidateSourcePath(storageRoot string, sourcePath string) (string, error) {
	root, err := filepath.Abs(storageRoot)
	if err != nil {
		return "", err
	}
	source, err := filepath.Abs(sourcePath)
	if err != nil {
		return "", err
	}
	relative, err := filepath.Rel(root, source)
	if err != nil {
		return "", err
	}
	if relative == "." || strings.HasPrefix(relative, ".."+string(filepath.Separator)) || relative == ".." {
		return "", errors.New("source path escapes storage root")
	}
	if strings.Contains(source, string(filepath.Separator)+".env") {
		return "", errors.New("source path references a forbidden env file")
	}
	return source, nil
}

func ExtractTarGz(sourcePath string, workspace string) error {
	file, err := os.Open(sourcePath)
	if err != nil {
		return err
	}
	defer file.Close()

	gzipReader, err := gzip.NewReader(file)
	if err != nil {
		return fmt.Errorf("source archive must be a tar.gz file: %w", err)
	}
	defer gzipReader.Close()

	reader := tar.NewReader(gzipReader)
	totalBytes := int64(0)
	for {
		header, err := reader.Next()
		if errors.Is(err, io.EOF) {
			return nil
		}
		if err != nil {
			return err
		}

		relative, err := safeArchivePath(header.Name)
		if err != nil {
			return err
		}
		if relative == "." {
			continue
		}

		target := filepath.Join(workspace, relative)
		if !pathInside(workspace, target) {
			return errors.New("archive entry escapes workspace")
		}

		switch header.Typeflag {
		case tar.TypeDir:
			if err := os.MkdirAll(target, 0o755); err != nil {
				return err
			}
		case tar.TypeReg:
			if header.Size > 1_000_000 {
				return fmt.Errorf("archive entry too large for %s", header.Name)
			}
			totalBytes += header.Size
			if totalBytes > 2_000_000 {
				return errors.New("archive is too large")
			}
			if err := os.MkdirAll(filepath.Dir(target), 0o755); err != nil {
				return err
			}
			out, err := os.OpenFile(target, os.O_CREATE|os.O_WRONLY|os.O_TRUNC, 0o600)
			if err != nil {
				return err
			}
			if _, err := io.Copy(out, reader); err != nil {
				_ = out.Close()
				return err
			}
			if err := out.Close(); err != nil {
				return err
			}
		default:
			return fmt.Errorf("unsupported archive entry type for %s", header.Name)
		}
	}
}

func safeArchivePath(name string) (string, error) {
	normalized := filepath.Clean(strings.TrimPrefix(name, "/"))
	if normalized == "." {
		return ".", nil
	}
	if normalized == ".." || strings.HasPrefix(normalized, ".."+string(filepath.Separator)) {
		return "", errors.New("archive contains path traversal")
	}
	blocked := map[string]struct{}{
		".git":         {},
		".next":        {},
		"build":        {},
		"dist":         {},
		"node_modules": {},
	}
	for _, part := range strings.Split(normalized, string(filepath.Separator)) {
		if strings.HasPrefix(part, ".env") {
			return "", errors.New("archive contains forbidden env file")
		}
		if _, isBlocked := blocked[part]; isBlocked {
			return "", errors.New("archive contains forbidden build artifact path")
		}
	}
	return normalized, nil
}

func pathInside(root string, target string) bool {
	relative, err := filepath.Rel(root, target)
	if err != nil {
		return false
	}
	return relative != ".." && !strings.HasPrefix(relative, ".."+string(filepath.Separator)) && !filepath.IsAbs(relative)
}
