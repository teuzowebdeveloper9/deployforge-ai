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
		if !strings.HasPrefix(target, workspace) {
			return errors.New("archive entry escapes workspace")
		}

		switch header.Typeflag {
		case tar.TypeDir:
			if err := os.MkdirAll(target, 0o755); err != nil {
				return err
			}
		case tar.TypeReg:
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
	if strings.HasPrefix(normalized, "..") {
		return "", errors.New("archive contains path traversal")
	}
	for _, part := range strings.Split(normalized, string(filepath.Separator)) {
		if strings.HasPrefix(part, ".env") {
			return "", errors.New("archive contains forbidden env file")
		}
	}
	return normalized, nil
}
