package repository

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/nastylauf/Pact-project/internal/domain"
)

type CheckinRepository struct {
	pool *pgxpool.Pool
}

func NewCheckinRepository(pool *pgxpool.Pool) *CheckinRepository {
	return &CheckinRepository{pool: pool}
}

func scanCheckin(row pgx.Row) (domain.Checkin, error) {
	var checkin domain.Checkin
	err := row.Scan(
		&checkin.ID,
		&checkin.PactID,
		&checkin.UserID,
		&checkin.Date,
		&checkin.Note,
		&checkin.CreatedAt,
	)
	return checkin, err
}

func (r *CheckinRepository) Create(ctx context.Context, checkin *domain.Checkin) (*domain.Checkin, error) {
	if checkin == nil {
		return nil, domain.ErrInvalidInput
	}

	created, err := scanCheckin(r.pool.QueryRow(ctx, `
		INSERT INTO checkins (pact_id, user_id, date, note)
		VALUES ($1, $2, $3, $4)
		RETURNING id, pact_id, user_id, date, note, created_at
	`, checkin.PactID, checkin.UserID, checkin.Date, checkin.Note))
	if err != nil {
		return nil, fmt.Errorf("create check-in: %w", mapRepositoryError(err))
	}
	return &created, nil
}

func (r *CheckinRepository) GetByPactID(ctx context.Context, pactID string) ([]domain.Checkin, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT id, pact_id, user_id, date, note, created_at
		FROM checkins
		WHERE pact_id = $1
		ORDER BY date
	`, pactID)
	if err != nil {
		return nil, fmt.Errorf("get check-ins by pact ID: %w", err)
	}
	defer rows.Close()

	checkins := make([]domain.Checkin, 0)
	for rows.Next() {
		checkin, err := scanCheckin(rows)
		if err != nil {
			return nil, fmt.Errorf("scan check-in: %w", err)
		}
		checkins = append(checkins, checkin)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate check-ins: %w", err)
	}
	return checkins, nil
}
