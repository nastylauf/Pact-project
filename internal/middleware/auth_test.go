package middleware

import (
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"
)

type testTokenParser struct{}

func (testTokenParser) Parse(token string) (string, error) {
	if token != "valid-token" {
		return "", errors.New("invalid token")
	}
	return "user-123", nil
}

func TestAuthenticateAddsUserIDToContext(t *testing.T) {
	next := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if got := UserID(r.Context()); got != "user-123" {
			t.Fatalf("UserID() = %q, want %q", got, "user-123")
		}
		w.WriteHeader(http.StatusNoContent)
	})
	handler := Authenticate(testTokenParser{})(next)
	request := httptest.NewRequest(http.MethodGet, "/private", nil)
	request.Header.Set("Authorization", "Bearer valid-token")
	response := httptest.NewRecorder()

	handler.ServeHTTP(response, request)
	if response.Code != http.StatusNoContent {
		t.Fatalf("status = %d, want %d", response.Code, http.StatusNoContent)
	}
}

func TestAuthenticateRejectsMissingOrInvalidToken(t *testing.T) {
	handler := Authenticate(testTokenParser{})(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		t.Fatal("protected handler was called without a valid token")
	}))

	for _, authorization := range []string{"", "Bearer invalid-token"} {
		request := httptest.NewRequest(http.MethodGet, "/private", nil)
		request.Header.Set("Authorization", authorization)
		response := httptest.NewRecorder()
		handler.ServeHTTP(response, request)
		if response.Code != http.StatusUnauthorized {
			t.Errorf("status for %q = %d, want %d", authorization, response.Code, http.StatusUnauthorized)
		}
	}
}

func TestCORSHandlesPreflight(t *testing.T) {
	handler := CORS(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		t.Fatal("preflight request should not reach the application handler")
	}))
	request := httptest.NewRequest(http.MethodOptions, "/api/v1/pacts", nil)
	response := httptest.NewRecorder()

	handler.ServeHTTP(response, request)
	if response.Code != http.StatusNoContent {
		t.Fatalf("status = %d, want %d", response.Code, http.StatusNoContent)
	}
	if got := response.Header().Get("Access-Control-Allow-Origin"); got != "*" {
		t.Fatalf("Access-Control-Allow-Origin = %q, want *", got)
	}
}
