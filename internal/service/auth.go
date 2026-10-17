package service

import (
	"context"
	"errors"
	"fmt"
	"net/mail"
	"strings"

	"github.com/nastylauf/Pact-project/internal/auth"
	"github.com/nastylauf/Pact-project/internal/domain"
)

type userStore interface {
	Create(context.Context, *domain.User) (*domain.User, error)
	GetByEmail(context.Context, string) (*domain.User, error)
}

type AuthResult struct {
	User  *domain.User
	Token string
}

type AuthService struct {
	users  userStore
	tokens *auth.TokenManager
}

func NewAuthService(users userStore, tokens *auth.TokenManager) *AuthService {
	return &AuthService{users: users, tokens: tokens}
}

func (s *AuthService) Register(ctx context.Context, email, password, name string) (*AuthResult, error) {
	email = strings.ToLower(strings.TrimSpace(email))
	name = strings.TrimSpace(name)
	parsedEmail, err := mail.ParseAddress(email)
	if err != nil || !strings.EqualFold(parsedEmail.Address, email) || name == "" || len(name) > 100 {
		return nil, domain.ErrInvalidInput
	}
	if len(password) < 8 || len(password) > 72 {
		return nil, domain.ErrInvalidInput
	}

	hash, err := auth.HashPassword(password)
	if err != nil {
		return nil, fmt.Errorf("hash password: %w", err)
	}
	user, err := s.users.Create(ctx, &domain.User{
		Email:        email,
		PasswordHash: hash,
		Name:         name,
	})
	if err != nil {
		return nil, fmt.Errorf("register user: %w", err)
	}
	token, err := s.tokens.Generate(user.ID)
	if err != nil {
		return nil, fmt.Errorf("create access token: %w", err)
	}
	return &AuthResult{User: user, Token: token}, nil
}

func (s *AuthService) Login(ctx context.Context, email, password string) (*AuthResult, error) {
	email = strings.ToLower(strings.TrimSpace(email))
	user, err := s.users.GetByEmail(ctx, email)
	if err != nil {
		if errors.Is(err, domain.ErrNotFound) {
			return nil, domain.ErrInvalidCredentials
		}
		return nil, fmt.Errorf("find user for login: %w", err)
	}
	if err := auth.ComparePassword(user.PasswordHash, password); err != nil {
		return nil, domain.ErrInvalidCredentials
	}
	token, err := s.tokens.Generate(user.ID)
	if err != nil {
		return nil, fmt.Errorf("create access token: %w", err)
	}
	return &AuthResult{User: user, Token: token}, nil
}
