package handler

import (
	"net/http"

	"github.com/nastylauf/Pact-project/internal/domain"
	"github.com/nastylauf/Pact-project/internal/service"
)

type AuthHandler struct {
	service *service.AuthService
}

func NewAuthHandler(authService *service.AuthService) *AuthHandler {
	return &AuthHandler{service: authService}
}

type authRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
	Name     string `json:"name,omitempty"`
}

type userResponse struct {
	ID        string `json:"id"`
	Email     string `json:"email"`
	Name      string `json:"name"`
	CreatedAt string `json:"created_at"`
}

type authResponse struct {
	AccessToken string       `json:"access_token"`
	TokenType   string       `json:"token_type"`
	User        userResponse `json:"user"`
}

func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
	var request authRequest
	if err := decodeJSON(w, r, &request); err != nil {
		writeServiceError(w, domain.ErrInvalidInput)
		return
	}
	result, err := h.service.Register(r.Context(), request.Email, request.Password, request.Name)
	if err != nil {
		writeServiceError(w, err)
		return
	}
	writeJSON(w, http.StatusCreated, toAuthResponse(result))
}

func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var request authRequest
	if err := decodeJSON(w, r, &request); err != nil {
		writeServiceError(w, domain.ErrInvalidInput)
		return
	}
	result, err := h.service.Login(r.Context(), request.Email, request.Password)
	if err != nil {
		writeServiceError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, toAuthResponse(result))
}

func toAuthResponse(result *service.AuthResult) authResponse {
	return authResponse{
		AccessToken: result.Token,
		TokenType:   "Bearer",
		User: userResponse{
			ID:        result.User.ID,
			Email:     result.User.Email,
			Name:      result.User.Name,
			CreatedAt: result.User.CreatedAt.UTC().Format("2006-01-02T15:04:05Z07:00"),
		},
	}
}
