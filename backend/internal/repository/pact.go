package repository

import (
	"context"
	"database/sql"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/nastylauf/Pact-project/internal/domain"
)

type PactRepository struct {
	pool *pgxpool.Pool
}

func NewPactRepository(pool *pgxpool.Pool) *PactRepository {
	return &PactRepository{pool: pool}
}

const pactColumns = `
	id, user_id, title, description, frequency, status,
	current_streak, longest_streak, start_date, end_date, created_at, updated_at
`

func scanPact(row pgx.Row) (domain.Pact, error) {
	var pact domain.Pact
	var endDate sql.NullTime

	err := row.Scan(
		&pact.ID,
		&pact.UserID,
		&pact.Title,
		&pact.Description,
		&pact.Frequency,
		&pact.Status,
		&pact.CurrentStreak,
		&pact.LongestStreak,
		&pact.StartDate,
		&endDate,
		&pact.CreatedAt,
		&pact.UpdatedAt,
	)
	if err != nil {
		return domain.Pact{}, err
	}
	if endDate.Valid {
		pact.EndDate = &endDate.Time
	}
	return pact, nil
}

func (r *PactRepository) Create(ctx context.Context, pact *domain.Pact) (*domain.Pact, error) {
	if pact == nil {
		return nil, domain.ErrInvalidInput
	}

	status := pact.Status
	if status == "" {
		status = domain.PactStatusActive
	}

	query := `
		INSERT INTO pacts (
			user_id, title, description, frequency, status,
			current_streak, longest_streak, start_date, end_date
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		RETURNING ` + pactColumns

	created, err := scanPact(r.pool.QueryRow(ctx, query,
		pact.UserID,
		pact.Title,
		pact.Description,
		pact.Frequency,
		status,
		pact.CurrentStreak,
		pact.LongestStreak,
		pact.StartDate,
		pact.EndDate,
	))
	if err != nil {
		return nil, fmt.Errorf("create pact: %w", mapRepositoryError(err))
	}
	return &created, nil
}

func (r *PactRepository) GetByID(ctx context.Context, id string) (*domain.Pact, error) {
	query := `SELECT ` + pactColumns + ` FROM pacts WHERE id = $1`
	pact, err := scanPact(r.pool.QueryRow(ctx, query, id))
	if err != nil {
		return nil, fmt.Errorf("get pact by ID: %w", mapRepositoryError(err))
	}
	return &pact, nil
}

func (r *PactRepository) GetByUserID(ctx context.Context, userID string) ([]domain.Pact, error) {
	query := `SELECT ` + pactColumns + ` FROM pacts WHERE user_id = $1 ORDER BY created_at DESC`
	rows, err := r.pool.Query(ctx, query, userID)
	if err != nil {
		return nil, fmt.Errorf("get pacts by user ID: %w", mapRepositoryError(err))
	}
	defer rows.Close()

	pacts := make([]domain.Pact, 0)
	for rows.Next() {
		pact, err := scanPact(rows)
		if err != nil {
			return nil, fmt.Errorf("scan pact: %w", mapRepositoryError(err))
		}
		pacts = append(pacts, pact)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate pacts: %w", mapRepositoryError(err))
	}
	return pacts, nil
}

func (r *PactRepository) UpdateProgress(
	ctx context.Context,
	id string,
	currentStreak int,
	longestStreak int,
	status domain.PactStatus,
) error {
	result, err := r.pool.Exec(ctx, `
		UPDATE pacts
		SET current_streak = $2,
			longest_streak = $3,
			status = $4,
			updated_at = now()
		WHERE id = $1
	`, id, currentStreak, longestStreak, status)
	if err != nil {
		return fmt.Errorf("update pact progress: %w", mapRepositoryError(err))
	}
	if result.RowsAffected() == 0 {
		return domain.ErrNotFound
	}
	return nil
}

func mapRepositoryError(err error) error {
	if errors.Is(err, pgx.ErrNoRows) {
		return domain.ErrNotFound
	}

	var postgresError *pgconn.PgError
	if errors.As(err, &postgresError) && postgresError.Code == "23505" {
		return domain.ErrAlreadyExists
	}
	return err
}
