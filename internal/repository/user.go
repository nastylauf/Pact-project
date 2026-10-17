package repository

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/nastylauf/Pact-project/internal/domain"
)

type UserRepository struct {
	pool *pgxpool.Pool
}

func NewUserRepository(pool *pgxpool.Pool) *UserRepository {
	return &UserRepository{pool: pool}
}

func scanUser(row pgx.Row) (domain.User, error) {
	var user domain.User
	err := row.Scan(
		&user.ID,
		&user.Email,
		&user.PasswordHash,
		&user.Name,
		&user.CreatedAt,
		&user.UpdatedAt,
	)
	return user, err
}

func (r *UserRepository) Create(ctx context.Context, user *domain.User) (*domain.User, error) {
	if user == nil {
		return nil, domain.ErrInvalidInput
	}

	created, err := scanUser(r.pool.QueryRow(ctx, `
		INSERT INTO users (email, password_hash, name)
		VALUES ($1, $2, $3)
		RETURNING id, email, password_hash, name, created_at, updated_at
	`, user.Email, user.PasswordHash, user.Name))
	if err != nil {
		return nil, fmt.Errorf("create user: %w", mapRepositoryError(err))
	}
	return &created, nil
}

func (r *UserRepository) GetByID(ctx context.Context, id string) (*domain.User, error) {
	user, err := scanUser(r.pool.QueryRow(ctx, `
		SELECT id, email, password_hash, name, created_at, updated_at
		FROM users
		WHERE id = $1
	`, id))
	if err != nil {
		return nil, fmt.Errorf("get user by ID: %w", mapRepositoryError(err))
	}
	return &user, nil
}

func (r *UserRepository) GetByEmail(ctx context.Context, email string) (*domain.User, error) {
	user, err := scanUser(r.pool.QueryRow(ctx, `
		SELECT id, email, password_hash, name, created_at, updated_at
		FROM users
		WHERE email = $1
	`, email))
	if err != nil {
		return nil, fmt.Errorf("get user by email: %w", mapRepositoryError(err))
	}
	return &user, nil
}
