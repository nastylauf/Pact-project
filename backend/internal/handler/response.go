package handler

import (
	"encoding/json"
	"errors"
	"io"
	"log/slog"
	"net/http"

	"github.com/nastylauf/Pact-project/internal/domain"
)

type errorResponse struct {
	Error string `json:"error"`
}

func decodeJSON(w http.ResponseWriter, r *http.Request, destination any) error {
	r.Body = http.MaxBytesReader(w, r.Body, 1<<20)
	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(destination); err != nil {
		return err
	}
	if err := decoder.Decode(&struct{}{}); !errors.Is(err, io.EOF) {
		return domain.ErrInvalidInput
	}
	return nil
}

func writeJSON(w http.ResponseWriter, status int, value any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(value); err != nil {
		slog.Error("encode HTTP response", "error", err)
	}
}

func writeServiceError(w http.ResponseWriter, err error) {
	status := http.StatusInternalServerError
	message := "internal server error"
	switch {
	case errors.Is(err, domain.ErrInvalidInput), errors.Is(err, domain.ErrCheckInInFuture):
		status, message = http.StatusBadRequest, err.Error()
	case errors.Is(err, domain.ErrInvalidCredentials):
		status, message = http.StatusUnauthorized, err.Error()
	case errors.Is(err, domain.ErrForbidden):
		status, message = http.StatusForbidden, err.Error()
	case errors.Is(err, domain.ErrNotFound):
		status, message = http.StatusNotFound, err.Error()
	case errors.Is(err, domain.ErrAlreadyExists), errors.Is(err, domain.ErrAlreadyCheckedIn), errors.Is(err, domain.ErrPactNotActive):
		status, message = http.StatusConflict, err.Error()
	default:
		slog.Error("request failed", "error", err)
	}
	writeJSON(w, status, errorResponse{Error: message})
}
