package handler

import (
	"net/http"

	"github.com/nastylauf/Pact-project/internal/auth"
	"github.com/nastylauf/Pact-project/internal/middleware"
	"github.com/nastylauf/Pact-project/internal/service"
)

func NewRouter(authService *service.AuthService, pactService *service.PactService, checkinService *service.CheckinService, tokens *auth.TokenManager) http.Handler {
	authHandler := NewAuthHandler(authService)
	pactHandler := NewPactHandler(pactService, checkinService)
	mux := http.NewServeMux()

	mux.HandleFunc("GET /healthz", func(w http.ResponseWriter, _ *http.Request) {
		writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
	})
	mux.HandleFunc("POST /api/v1/auth/register", authHandler.Register)
	mux.HandleFunc("POST /api/v1/auth/login", authHandler.Login)

	secure := middleware.Authenticate(tokens)
	mux.Handle("POST /api/v1/pacts", secure(http.HandlerFunc(pactHandler.Create)))
	mux.Handle("GET /api/v1/pacts", secure(http.HandlerFunc(pactHandler.List)))
	mux.Handle("GET /api/v1/pacts/{id}", secure(http.HandlerFunc(pactHandler.Get)))
	mux.Handle("POST /api/v1/pacts/{id}/checkins", secure(http.HandlerFunc(pactHandler.CreateCheckin)))
	mux.Handle("GET /api/v1/pacts/{id}/checkins", secure(http.HandlerFunc(pactHandler.ListCheckins)))

	return middleware.CORS(middleware.Logging(middleware.Recover(mux)))
}
